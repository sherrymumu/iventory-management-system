<template>
  <Container>
    <!-- 搜索筛选区 -->
    <el-card shadow="never" class="mb-15">
      <SearchToolbar :model="queryForm" @search="fetchData" @reset="resetQuery">
        <el-form-item label="关键词检索">
          <el-input v-model="queryForm.keyword" placeholder="SN号 / 设备名称 / 卡号" clearable style="width: 220px" @keyup.enter="fetchData" />
        </el-form-item>
        <el-form-item label="设备状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable style="width: 130px">
            <el-option label="在库 (默认)" value="在库" />
            <el-option label="借出" value="借出" />
            <el-option label="已预约" value="已预约" />
            <el-option label="损坏" value="损坏" />
            <el-option label="丢失" value="丢失" />
          </el-select>
        </el-form-item>
        <el-form-item label="存放位置">
          <el-select v-model="queryForm.location" placeholder="全部位置" clearable style="width: 140px">
            <el-option label="对外借出" value="对外借出" />
            <el-option label="技术支持" value="技术支持" />
          </el-select>
        </el-form-item>
        <template #actions>
          <el-button type="success" icon="Upload" @click="openImportModal">Excel 批量导入设备</el-button>
          <el-button type="primary" icon="Plus" @click="openCreateModal">新增设备录入</el-button>
        </template>
      </SearchToolbar>
    </el-card>

    <!-- 设备台账表格 -->
    <el-card shadow="never">
      <el-table :data="pagedData" v-loading="loading" stripe border>
        <el-table-column prop="sn" label="设备SN号" width="180">
          <template #default="{ row }">
            <span class="font-bold text-primary">{{ row.sn }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="设备名称" min-width="150" />
        <el-table-column prop="typeName" label="设备类型" width="140" />
        <el-table-column prop="model" label="设备型号" width="150" />
        <el-table-column prop="location" label="存放位置分类" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="row.location === '对外借出' ? 'primary' : 'warning'">
              {{ row.location }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cardNo" label="唯一卡号" width="130" />
        <el-table-column prop="status" label="当前状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设备终身码" width="180">
          <template #default="{ row }">
            <span v-if="row.lifeCode" class="life-code-badge">{{ row.lifeCode }}</span>
            <span v-else class="text-muted fs-12">无(上网卡独立管理)</span>
          </template>
        </el-table-column>
        <el-table-column label="当前借用情况" width="160">
          <template #default="{ row }">
            <span v-if="row.borrower">{{ row.borrower }} ({{ row.dept }})</span>
            <span v-else class="text-muted">未借出</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.isSimCard"
              type="primary"
              link
              size="small"
              @click="openQrCodeModal(row)"
            >
              生成二维码
            </el-button>
            <el-button
              type="primary"
              link
              size="small"
              @click="openEditModal(row)"
            >
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-15 flex-end">
        <Pagination v-model:current="page.current" v-model:size="page.size" :total="tableData.length" :disabled="loading" />
      </div>
    </el-card>

    <!-- 设备二维码展示与打印弹窗 -->
    <el-dialog v-model="qrVisible" title="设备专属二维码（扫码溯源）" width="460px" center>
      <div v-if="currentDevice" class="qr-box text-center">
        <div class="qr-canvas-wrapper mb-15">
          <!-- 纯前端动态绘制带唯一卡号、部门及用户信息的二维码样式 -->
          <canvas ref="qrCanvasRef" width="220" height="220" class="qr-canvas" />
        </div>
        <div class="qr-info-block">
          <div class="item"><b>设备名称：</b>{{ currentDevice.name }}</div>
          <div class="item"><b>设备SN：</b>{{ currentDevice.sn }}</div>
          <div class="item"><b>卡号 (唯一)：</b>{{ currentDevice.cardNo }}</div>
          <div class="item"><b>终身码：</b>{{ currentDevice.lifeCode }}</div>
          <div class="item"><b>借出部门：</b>{{ currentDevice.dept || '暂未借出' }}</div>
          <div class="item"><b>借出用户：</b>{{ currentDevice.borrower || '暂未借出' }}</div>
          <div class="item"><b>存放位置：</b>{{ currentDevice.location }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="qrVisible = false">关 闭</el-button>
        <el-button type="primary" icon="Printer" @click="mockPrintQr">打印二维码标签</el-button>
      </template>
    </el-dialog>

    <!-- 新增 / 编辑设备弹窗 -->
    <el-dialog v-model="editVisible" :title="editForm.id ? '编辑设备信息' : '手动录入新设备'" width="600px">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="110px">
        <el-form-item label="设备SN" prop="sn">
          <el-input v-model="editForm.sn" placeholder="如：CAM-4K-2026-088" />
        </el-form-item>
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="editForm.name" placeholder="如：4K超清摄像机" />
        </el-form-item>
        <el-form-item label="设备类型" prop="typeId">
          <el-select v-model="editForm.typeId" placeholder="选择设备类型" class="w-f" @change="onTypeSelect">
            <el-option v-for="t in typeList" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备型号" prop="model">
          <el-input v-model="editForm.model" placeholder="如：Sony FX6" />
        </el-form-item>
        <el-form-item label="存放位置分类" prop="location">
          <el-select v-model="editForm.location" placeholder="选择固定分类" class="w-f">
            <el-option label="对外借出" value="对外借出" />
            <el-option label="技术支持" value="技术支持" />
          </el-select>
        </el-form-item>
        <el-form-item label="唯一卡号" prop="cardNo">
          <el-input v-model="editForm.cardNo" placeholder="如：C001-9988" />
        </el-form-item>
        <el-form-item label="设备终身码" prop="lifeCode">
          <el-input v-model="editForm.lifeCode" placeholder="自动生成或手动录入终身码" />
        </el-form-item>
        <el-form-item label="设备状态" prop="status">
          <el-select v-model="editForm.status" placeholder="选择状态" class="w-f">
            <el-option label="在库 (默认)" value="在库" />
            <el-option label="借出" value="借出" />
            <el-option label="已预约" value="已预约" />
            <el-option label="损坏" value="损坏" />
            <el-option label="丢失" value="丢失" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitEditForm">保存设备</el-button>
      </template>
    </el-dialog>

    <!-- Excel 批量导入弹窗 -->
    <el-dialog v-model="importVisible" title="已有设备 Excel 批量导入" width="580px">
      <div class="excel-import-content">
        <el-alert
          title="系统支持已有设备Excel盘库批量导入，将自动校验SN唯一性并写入台账"
          type="info"
          :closable="false"
          show-icon
          class="mb-15"
        />
        <div class="upload-drop-zone">
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-text">将已有设备 Excel 模板文件拖到此处，或 <em>点击上传导入</em></div>
          <div class="upload-tip">支持 .xlsx, .xls 格式盘点表</div>
        </div>

        <div class="mock-batch-preview mt-15">
          <div class="preview-title mb-5"><b>待导入演示批次示例 (5台设备)：</b></div>
          <el-tag size="small" class="mr-5">CAM-4K-EXP-01 (Sony FX9)</el-tag>
          <el-tag size="small" class="mr-5">LENS-70200-EXP (GM II)</el-tag>
          <el-tag size="small" class="mr-5">BAG-5G-EXP-02 (LiveU)</el-tag>
          <el-tag size="small" class="mr-5">DRONE-DJI-EXP (Mavic 3)</el-tag>
          <el-tag size="small" class="mr-5">MIC-SENN-EXP (EW-DP)</el-tag>
        </div>
      </div>
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="success" :loading="importing" @click="executeMockImport">立即执行批量导入</el-button>
      </template>
    </el-dialog>
  </Container>
</template>

<script setup>
import { Container, Pagination, SearchToolbar } from '@/components'
import { getDeviceListApi, saveDeviceApi, importDevicesBatchApi, getDeviceTypeListApi } from '@/apis/wms'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const saving = ref(false)
const importing = ref(false)
const tableData = ref([])
const typeList = ref([])

const page = reactive({
  current: 1,
  size: 10
})

const pagedData = computed(() => {
  const start = (page.current - 1) * page.size
  return tableData.value.slice(start, start + page.size)
})

const queryForm = reactive({
  keyword: '',
  status: '',
  location: ''
})

const qrVisible = ref(false)
const currentDevice = ref(null)
const qrCanvasRef = useTemplateRef('qrCanvasRef')

const editVisible = ref(false)
const editFormRef = useTemplateRef('editFormRef')
const editForm = reactive({
  id: null,
  sn: '',
  name: '',
  typeId: null,
  typeName: '',
  model: '',
  location: '对外借出',
  cardNo: '',
  lifeCode: '',
  status: '在库'
})

const editRules = {
  sn: [{ required: true, message: '请输入SN', trigger: 'blur' }],
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  typeId: [{ required: true, message: '请选择类型', trigger: 'change' }]
}

const importVisible = ref(false)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getDeviceListApi(queryForm)
    if (res && res.data) {
      tableData.value = res.data.list
    }
  } finally {
    loading.value = false
  }
}

const fetchTypes = async () => {
  const r = await getDeviceTypeListApi()
  if (r && r.data) {
    typeList.value = r.data.list
  }
}

const resetQuery = () => {
  queryForm.keyword = ''
  queryForm.status = ''
  queryForm.location = ''
  page.current = 1
  fetchData()
}

const openCreateModal = () => {
  editForm.id = null
  editForm.sn = `DEV-${Date.now().toString().slice(-6)}`
  editForm.name = ''
  editForm.typeId = typeList.value[0]?.id || 1
  editForm.typeName = typeList.value[0]?.name || ''
  editForm.model = ''
  editForm.location = '对外借出'
  editForm.cardNo = `C-${Math.floor(Math.random() * 8999 + 1000)}`
  editForm.lifeCode = `LC-2026-${Math.floor(Math.random() * 899 + 100)}`
  editForm.status = '在库'
  editVisible.value = true
}

const openEditModal = (row) => {
  editForm.id = row.id
  editForm.sn = row.sn
  editForm.name = row.name
  editForm.typeId = row.typeId
  editForm.typeName = row.typeName
  editForm.model = row.model
  editForm.location = row.location
  editForm.cardNo = row.cardNo
  editForm.lifeCode = row.lifeCode
  editForm.status = row.status
  editVisible.value = true
}

const onTypeSelect = (id) => {
  const t = typeList.value.find(i => i.id === id)
  if (t) editForm.typeName = t.name
}

const submitEditForm = () => {
  editFormRef.value.validate(async valid => {
    if (!valid) return
    saving.value = true
    try {
      const res = await saveDeviceApi(editForm)
      if (res && res.code === 0) {
        ElMessage.success('设备台账已保存成功')
        editVisible.value = false
        fetchData()
      }
    } finally {
      saving.value = false
    }
  })
}

// 绘制设备二维码（纯前端Canvas绘制带定位角点的仿真标准二维码）
const openQrCodeModal = (row) => {
  currentDevice.value = row
  qrVisible.value = true
  nextTick(() => {
    drawQrCanvas(row)
  })
}

const drawQrCanvas = (dev) => {
  const canvas = qrCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, 220, 220)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 220, 220)

  // 绘制二维码外框与定位符
  ctx.fillStyle = '#0f172a'
  const drawFinder = (x, y) => {
    ctx.fillRect(x, y, 40, 40)
    ctx.clearRect(x + 6, y + 6, 28, 28)
    ctx.fillRect(x + 12, y + 12, 16, 16)
  }
  drawFinder(20, 20)
  drawFinder(160, 20)
  drawFinder(20, 160)

  // 矩阵仿真点
  const seed = (dev.sn || 'SN').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  for (let r = 0; r < 20; r++) {
    for (let c = 0; c < 20; c++) {
      if ((r < 7 && c < 7) || (r < 7 && c > 12) || (r > 12 && c < 7)) continue
      if ((r * c + seed + r + c) % 3 === 0) {
        ctx.fillRect(20 + c * 9, 20 + r * 9, 7, 7)
      }
    }
  }

  // 居中LOGO标识
  ctx.fillStyle = '#1890ff'
  ctx.fillRect(90, 90, 40, 40)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('WMS', 110, 110)
}

const mockPrintQr = () => {
  ElMessage.success('已发送至标签打印机，正在输出设备专属二维码贴纸...')
}

const openImportModal = () => {
  importVisible.value = true
}

const executeMockImport = async () => {
  importing.value = true
  try {
    const mockList = [
      { id: Date.now() + 1, sn: 'CAM-4K-EXP-01', name: '4K超清摄像机', typeId: 1, typeName: '4K超清摄像机', model: 'Sony FX9', location: '对外借出', status: '在库', cardNo: 'C9901', lifeCode: 'LC-EXP-001', createTime: '2026-10-15' },
      { id: Date.now() + 2, sn: 'LENS-70200-EXP', name: '专业影视镜头组', typeId: 2, typeName: '专业影视镜头组', model: 'FE 70-200mm GM II', location: '技术支持', status: '在库', cardNo: 'L9902', lifeCode: 'LC-EXP-002', createTime: '2026-10-15' },
      { id: Date.now() + 3, sn: 'BAG-5G-EXP-02', name: '4G/5G传输背包', typeId: 6, typeName: '4G/5G传输背包', model: 'LiveU LU600', location: '对外借出', status: '在库', cardNo: 'B9903', lifeCode: 'LC-EXP-003', createTime: '2026-10-15' },
      { id: Date.now() + 4, sn: 'DRONE-DJI-EXP', name: '航拍无人机套装', typeId: 4, typeName: '航拍无人机套装', model: 'DJI Mavic 3 Pro', location: '技术支持', status: '在库', cardNo: 'D9904', lifeCode: 'LC-EXP-004', createTime: '2026-10-15' },
      { id: Date.now() + 5, sn: 'MIC-SENN-EXP', name: '无线高保真领夹麦', typeId: 5, typeName: '无线高保真领夹麦', model: 'EW-DP', location: '对外借出', status: '在库', cardNo: 'M9905', lifeCode: 'LC-EXP-005', createTime: '2026-10-15' }
    ]
    const res = await importDevicesBatchApi(mockList)
    if (res && res.code === 0) {
      ElMessage.success(res.message)
      importVisible.value = false
      fetchData()
    }
  } finally {
    importing.value = false
  }
}

const getStatusTag = (status) => {
  const map = {
    在库: 'success',
    借出: 'primary',
    已预约: 'warning',
    损坏: 'danger',
    丢失: 'info'
  }
  return map[status] || 'info'
}

onMounted(() => {
  fetchData()
  fetchTypes()
})
</script>

<style scoped>
.life-code-badge {
  font-size: 12px;
  font-weight: bold;
  color: #2563eb;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 4px;
}
.qr-canvas {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
.qr-info-block {
  text-align: left;
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.8;
}
.upload-drop-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  background: #f8fafc;
}
.upload-icon {
  font-size: 40px;
  color: #94a3b8;
  margin-bottom: 10px;
}
.upload-text em {
  color: #1890ff;
  font-style: normal;
  cursor: pointer;
}
.upload-tip {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 6px;
}
</style>
