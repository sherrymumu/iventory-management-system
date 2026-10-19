<template>
  <Container>
    <el-card shadow="never" class="mb-15">
      <SearchToolbar :model="queryForm" @search="handleSearch" @reset="resetQuery">
        <el-form-item label="出库单号">
          <el-input v-model="queryForm.keyword" placeholder="单号 / 关联预约单号" clearable style="width: 220px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="出库类型">
          <el-select v-model="queryForm.outMethod" placeholder="全部类型" clearable style="width: 130px">
            <el-option label="单次出库" value="单次出库" />
            <el-option label="多次出库" value="多次出库" />
          </el-select>
        </el-form-item>
        <el-form-item label="单据状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="待扫码核对" value="待扫码核对" />
            <el-option label="待签字领取" value="待签字领取" />
            <el-option label="已签字出库" value="已签字出库" />
            <el-option label="已逾期" value="已逾期" />
          </el-select>
        </el-form-item>
        <template #actions>
          <el-button icon="Refresh" @click="fetchData">刷新单据</el-button>
        </template>
      </SearchToolbar>
    </el-card>

    <el-card shadow="never">
      <el-table :data="pagedData" v-loading="loading" stripe border>
        <el-table-column prop="outNo" label="出库单号" width="180">
          <template #default="{ row }">
            <span class="font-bold text-primary">{{ row.outNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="applyNo" label="关联预约单号" width="180" />
        <el-table-column prop="activityName" label="活动名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="borrower" label="领用人" width="100" />
        <el-table-column prop="dept" label="领用部门" width="120" />
        <el-table-column prop="outMethod" label="出库类型" width="130">
          <template #default="{ row }">
            <el-tag :type="row.outMethod === '多次出库' ? 'warning' : 'success'">{{ row.outMethod }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="扫码核对进度" width="150" align="center">
          <template #default="{ row }">
            <span>{{ countScanned(row.devices) }} / {{ row.devices.length }} 台</span>
            <el-progress
              :percentage="Math.round((countScanned(row.devices) / (row.devices.length || 1)) * 100)"
              :status="countScanned(row.devices) === row.devices.length ? 'success' : ''"
              :stroke-width="6"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="单据状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== '已签字出库'"
              type="primary"
              size="small"
              @click="openScanAndSignModal(row)"
            >
              双方扫码 / 签字
            </el-button>
            <el-button
              v-else
              type="success"
              plain
              size="small"
              @click="openScanAndSignModal(row)"
            >
              查看签字凭证
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-15 flex-end">
        <Pagination v-model:current="page.current" v-model:size="page.size" :total="tableData.length" :disabled="loading" />
      </div>
    </el-card>

    <!-- 双方核对扫码与签字领取抽屉/弹窗 -->
    <el-dialog
      v-model="scanDialogVisible"
      title="双方现场核对设备、扫码与手写签字领取"
      width="780px"
      destroy-on-close
    >
      <div v-if="currentOutbound" class="scan-modal-body">
        <el-alert
          title="系统交互规则：出库环节双方核对设备并扫码；全部核对通过后签字领取设备，系统生成出库记录"
          type="info"
          :closable="false"
          show-icon
          class="mb-15"
        />

        <el-descriptions :column="2" border class="mb-15">
          <el-descriptions-item label="出库单号">{{ currentOutbound.outNo }}</el-descriptions-item>
          <el-descriptions-item label="关联预约单">{{ currentOutbound.applyNo }}</el-descriptions-item>
          <el-descriptions-item label="活动事由" :span="2">{{ currentOutbound.activityName }}</el-descriptions-item>
          <el-descriptions-item label="领用人">{{ currentOutbound.borrower }} ({{ currentOutbound.contact }})</el-descriptions-item>
          <el-descriptions-item label="借用部门">{{ currentOutbound.dept }}</el-descriptions-item>
        </el-descriptions>

        <!-- 现场扫码核对交互区 -->
        <div class="scan-action-box mb-15">
          <div class="title mb-10"><b>【第一步】双方核对设备并模拟扫码核对：</b></div>
          <div class="flex-gap">
            <el-input
              v-model="scanSnInput"
              placeholder="在此扫描枪录入或输入设备SN号（如：CAM-4K-2026-003）"
              clearable
              style="width: 380px"
              @keyup.enter="handleScan"
            />
            <el-button type="primary" icon="Aim" @click="handleScan">模拟扫码核对</el-button>
            <el-button type="warning" plain @click="simulateScanAll">一键核对全部</el-button>
          </div>
        </div>

        <!-- 设备扫码核对清单 -->
        <el-table :data="currentOutbound.devices" border size="small" class="mb-15">
          <el-table-column prop="sn" label="设备SN号" width="180">
            <template #default="{ row }">
              <span class="font-bold">{{ row.sn }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="设备名称" />
          <el-table-column prop="model" label="型号" />
          <el-table-column label="扫码核对状态" width="130" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.scanned" type="success" size="small">
                ✓ 已核验 ({{ row.scanTime || '已扫码' }})
              </el-tag>
              <el-tag v-else type="danger" size="small">未扫码</el-tag>
            </template>
          </el-table-column>
        </el-table>

        <!-- 签字领取交互区 -->
        <div class="sign-section">
          <div class="title mb-10"><b>【第二步】签字领取设备（需台内有工作证人员）：</b></div>
          
          <div v-if="currentOutbound.status === '已签字出库'" class="signed-box">
            <div class="text-success font-bold mb-5">
              ✔ 双方签字已完成！出库生效时间：{{ currentOutbound.outTime }}
            </div>
            <div>领用责任人签字：<b>{{ currentOutbound.signer }}</b></div>
            <div v-if="currentOutbound.signatureImage" class="mt-10">
              <img :src="currentOutbound.signatureImage" class="sig-preview" alt="签名" />
            </div>
          </div>

          <div v-else>
            <el-form :inline="true" class="mb-10">
              <el-form-item label="领用人签字姓名">
                <el-input v-model="signerName" placeholder="例如：李娜 (台工号: 8812)" style="width: 260px" />
              </el-form-item>
            </el-form>

            <div class="signature-pad-container">
              <div class="pad-header flex-between mb-5">
                <span class="fs-12 text-muted">手写电子签名板 (请在下方使用鼠标或触控板手写签署)：</span>
                <el-button size="small" text @click="clearSignature">清空重签</el-button>
              </div>
              <canvas
                ref="canvasRef"
                width="680"
                height="150"
                class="sign-canvas"
                @mousedown="startDrawing"
                @mousemove="draw"
                @mouseup="stopDrawing"
                @mouseleave="stopDrawing"
              />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="scanDialogVisible = false">关 闭</el-button>
          <el-button
            v-if="currentOutbound && currentOutbound.status !== '已签字出库'"
            type="primary"
            :loading="signing"
            @click="submitSignAndOutbound"
          >
            确认签字并正式出库
          </el-button>
        </span>
      </template>
    </el-dialog>
  </Container>
</template>

<script setup>
import { Container, Pagination, SearchToolbar } from '@/components'
import { getOutboundListApi, scanDeviceOutboundApi, signAndFinishOutboundApi } from '@/apis/wms'
import { ElMessage } from 'element-plus'

const route = useRoute()
const loading = ref(false)
const signing = ref(false)
const allData = ref([])
const tableData = ref([])

const queryForm = reactive({
  keyword: '',
  outMethod: '',
  status: ''
})

const page = reactive({
  current: 1,
  size: 10
})

const pagedData = computed(() => {
  const start = (page.current - 1) * page.size
  return tableData.value.slice(start, start + page.size)
})

const scanDialogVisible = ref(false)
const currentOutbound = ref(null)
const scanSnInput = ref('')
const signerName = ref('')

// 签名板 Canvas
const canvasRef = useTemplateRef('canvasRef')
const isDrawing = ref(false)
let ctx = null

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getOutboundListApi()
    if (res && res.data) {
      allData.value = res.data.list
      applyFilter()
      if (route.query.outNo) {
        const target = allData.value.find(i => i.outNo === route.query.outNo)
        if (target) {
          openScanAndSignModal(target)
        }
      }
    }
  } finally {
    loading.value = false
  }
}

const countScanned = (devices = []) => {
  return devices.filter(d => d.scanned).length
}

const applyFilter = () => {
  const keyword = queryForm.keyword.trim().toLowerCase()
  const outMethod = queryForm.outMethod
  const status = queryForm.status
  tableData.value = allData.value.filter(item => {
    const matchKeyword = !keyword ||
      (item.outNo && item.outNo.toLowerCase().includes(keyword)) ||
      (item.applyNo && item.applyNo.toLowerCase().includes(keyword))
    const matchMethod = !outMethod || item.outMethod === outMethod
    const matchStatus = !status || item.status === status
    return matchKeyword && matchMethod && matchStatus
  })
  page.current = 1
}

const handleSearch = () => {
  applyFilter()
}

const resetQuery = () => {
  queryForm.keyword = ''
  queryForm.outMethod = ''
  queryForm.status = ''
  applyFilter()
}

const openScanAndSignModal = (row) => {
  currentOutbound.value = row
  signerName.value = row.borrower || '李娜 (工作证: ZB-8801)'
  scanDialogVisible.value = true
  scanSnInput.value = ''
  nextTick(() => {
    initCanvas()
  })
}

const initCanvas = () => {
  if (!canvasRef.value) return
  ctx = canvasRef.value.getContext('2d')
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  clearSignature()
}

const startDrawing = (e) => {
  if (!ctx) return
  isDrawing.value = true
  const rect = canvasRef.value.getBoundingClientRect()
  ctx.beginPath()
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
}

const draw = (e) => {
  if (!isDrawing.value || !ctx) return
  const rect = canvasRef.value.getBoundingClientRect()
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
  ctx.stroke()
}

const stopDrawing = () => {
  isDrawing.value = false
}

const clearSignature = () => {
  if (!ctx || !canvasRef.value) return
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
}

const handleScan = async () => {
  if (!scanSnInput.value.trim()) {
    ElMessage.warning('请输入扫描的SN设备号')
    return
  }
  const res = await scanDeviceOutboundApi({
    outboundId: currentOutbound.value.id,
    outNo: currentOutbound.value.outNo,
    sn: scanSnInput.value.trim()
  })
  if (res && res.code === 0) {
    ElMessage.success(res.message)
    scanSnInput.value = ''
    fetchData()
  } else {
    ElMessage.error(res?.message || '扫码核对失败')
  }
}

const simulateScanAll = async () => {
  if (!currentOutbound.value) return
  for (const d of currentOutbound.value.devices) {
    await scanDeviceOutboundApi({
      outboundId: currentOutbound.value.id,
      outNo: currentOutbound.value.outNo,
      sn: d.sn
    })
  }
  ElMessage.success('已模拟完成全部设备的现场扫码核对！')
  fetchData()
}

const submitSignAndOutbound = async () => {
  const unscanned = currentOutbound.value.devices.filter(d => !d.scanned)
  if (unscanned.length > 0) {
    ElMessage.warning(`尚有 ${unscanned.length} 台设备未完成现场扫码核对，无法出库！`)
    return
  }
  if (!signerName.value.trim()) {
    ElMessage.warning('请填写领用签字人姓名及工作证信息')
    return
  }

  signing.value = true
  try {
    const signatureDataUrl = canvasRef.value ? canvasRef.value.toDataURL() : ''
    const res = await signAndFinishOutboundApi({
      outboundId: currentOutbound.value.id,
      outNo: currentOutbound.value.outNo,
      signer: signerName.value.trim(),
      signatureImage: signatureDataUrl
    })
    if (res && res.code === 0) {
      ElMessage.success('出库完成！设备已转为借出状态并绑定责任人')
      scanDialogVisible.value = false
      fetchData()
    }
  } finally {
    signing.value = false
  }
}

const getStatusTag = (status) => {
  const map = {
    待扫码核对: 'warning',
    待签字: 'primary',
    已签字出库: 'success'
  }
  return map[status] || 'info'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.scan-action-box {
  background: #f1f5f9;
  padding: 12px 16px;
  border-radius: 8px;
}
.flex-gap {
  display: flex;
  gap: 10px;
  align-items: center;
}
.sign-canvas {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  cursor: crosshair;
}
.signed-box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 14px;
  border-radius: 6px;
}
.sig-preview {
  max-height: 80px;
  border: 1px solid #e2e8f0;
  background: #fff;
}
</style>
