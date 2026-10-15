<template>
  <Container>
    <!-- 入库流程逻辑图指引 -->
    <el-card shadow="never" class="mb-15 return-logic-card">
      <div class="logic-header">
        <span class="badge">设备归还入库决策流</span>
        <span class="title">设备检查 ➜ 正常归还(单次/多次入库) / 异常归还(丢失/损坏处置闭环)</span>
      </div>
      <div class="logic-branches">
        <div class="branch-col normal-branch">
          <div class="branch-title">✅ 设备正常分支</div>
          <div class="branch-desc">全部归还(单次入库) 或 分批归还(多次入库) ➜ 生成入库单 ➜ 出库单签字入库</div>
        </div>
        <div class="branch-col error-branch">
          <div class="branch-title">❌ 设备异常分支</div>
          <div class="branch-desc">
            <b>丢失：</b>配件丢失(节目组购买归还 ➜ 更新终身码 ➜ 入库)；主体丢失(领导签字 ➜ 赔偿/购买归还 ➜ 更新终身码 / 不赔偿 ➜ 标记丢失不入库)<br />
            <b>损坏：</b>配件损坏(节目组购买归还 ➜ 入库)；主体损坏(领导签字 ➜ 节目组购买归还 / 自行维修 ➜ 更新终身码 ➜ 入库)
          </div>
        </div>
      </div>
    </el-card>

    <!-- 可归还设备与出库单列表 -->
    <el-card shadow="never" class="mb-15">
      <SearchToolbar :model="queryForm" @search="handleSearch" @reset="resetQuery">
        <el-form-item label="出库单号/活动">
          <el-input v-model="queryForm.keyword" placeholder="单号 / 活动名称" clearable style="width: 220px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="借用部门">
          <el-input v-model="queryForm.dept" placeholder="部门名称" clearable style="width: 150px" />
        </el-form-item>
        <template #actions>
          <el-button icon="Refresh" @click="fetchData">刷新</el-button>
        </template>
      </SearchToolbar>

      <el-table :data="pagedData" v-loading="loading" stripe border>
        <el-table-column prop="outNo" label="出库单号" width="180">
          <template #default="{ row }">
            <span class="font-bold text-primary">{{ row.outNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="activityName" label="活动名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="borrower" label="借用责任人" width="100" />
        <el-table-column prop="dept" label="借用部门" width="120" />
        <el-table-column prop="outTime" label="出库生效时间" width="160" />
        <el-table-column label="出库借出设备明细" min-width="220">
          <template #default="{ row }">
            <el-tag
              v-for="(d, i) in row.devices"
              :key="i"
              class="mr-5 mb-5"
              size="small"
            >
              {{ d.name }} ({{ d.sn }})
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="归还办理" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openReturnModal(row)">
              办理归还检查
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-15 flex-end">
        <Pagination v-model:current="page.current" v-model:size="page.size" :total="borrowedList.length" :disabled="loading" />
      </div>
    </el-card>

    <!-- 归还检查与处置弹窗 -->
    <el-dialog
      v-model="returnModalVisible"
      title="设备现场归还检查与入库处理"
      width="820px"
      destroy-on-close
    >
      <div v-if="currentOut" class="return-modal-content">
        <el-descriptions :column="2" border class="mb-15">
          <el-descriptions-item label="关联出库单">{{ currentOut.outNo }}</el-descriptions-item>
          <el-descriptions-item label="活动名称">{{ currentOut.activityName }}</el-descriptions-item>
          <el-descriptions-item label="借出责任人">{{ currentOut.borrower }}</el-descriptions-item>
          <el-descriptions-item label="所属部门">{{ currentOut.dept }}</el-descriptions-item>
        </el-descriptions>

        <el-form label-width="120px">
          <el-form-item label="设备实物检查">
            <el-radio-group v-model="checkStatus">
              <el-radio value="正常">
                <span class="font-bold text-success">设备正常 (外观及功能完好，支持全部/分批入库)</span>
              </el-radio>
              <el-radio value="异常">
                <span class="font-bold text-danger">设备异常 (发生丢失或损坏，需走异常闭环流程)</span>
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 正常归还分支交互 -->
          <div v-if="checkStatus === '正常'" class="normal-flow-box">
            <el-form-item label="归还方式">
              <el-radio-group v-model="normalForm.returnType">
                <el-radio value="全部归还">全部归还 (走【单次入库】，生成入库单并完结)</el-radio>
                <el-radio value="分批归还">分批归还 (走【多次入库】，剩余设备后续归还)</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="勾选归还设备">
              <el-checkbox-group v-model="normalForm.selectedSns">
                <el-checkbox
                  v-for="d in currentOut.devices"
                  :key="d.sn"
                  :value="d.sn"
                  :label="d.sn"
                >
                  {{ d.name }} - {{ d.sn }} (终身码: {{ d.lifeCode || '无' }})
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="归还人签字">
              <el-input v-model="normalForm.signer" placeholder="请输入归还签字人姓名" style="width: 260px" />
            </el-form-item>

            <el-form-item label="归还检查备注">
              <el-input v-model="normalForm.remark" placeholder="如：镜头无划痕，传感器清洁，正常归还" />
            </el-form-item>
          </div>

          <!-- 异常处置分支交互 (丢失/损坏) -->
          <div v-else class="anomaly-flow-box">
            <el-alert
              title="设备异常处置规则：丢失或损坏必须经过责任认定、领导签字与方案审批（购买归还/赔偿/自修）并按需更新终身码后方可入库或核销"
              type="error"
              :closable="false"
              show-icon
              class="mb-15"
            />

            <el-form-item label="异常设备SN">
              <el-select v-model="anomalyForm.deviceSn" placeholder="请选择出现异常的具体设备" class="w-f">
                <el-option
                  v-for="d in currentOut.devices"
                  :key="d.sn"
                  :label="`${d.name} (${d.sn})`"
                  :value="d.sn"
                />
              </el-select>
            </el-form-item>

            <el-row :gutter="15">
              <el-col :span="12">
                <el-form-item label="异常主类别">
                  <el-select v-model="anomalyForm.category" placeholder="选择类别" class="w-f">
                    <el-option label="丢失" value="丢失" />
                    <el-option label="损坏" value="损坏" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="细分子类型">
                  <el-select v-model="anomalyForm.subCategory" placeholder="细分子类别" class="w-f">
                    <template v-if="anomalyForm.category === '丢失'">
                      <el-option label="配件丢失 (免领导签字，节目组购买归还)" value="配件丢失" />
                      <el-option label="主体丢失 (需领导签字，赔偿/不赔偿)" value="主体丢失" />
                    </template>
                    <template v-else>
                      <el-option label="配件损坏 (免领导签字，节目组购买归还)" value="配件损坏" />
                      <el-option label="主体损坏 (需领导签字，购买归还/自行维修)" value="主体损坏" />
                    </template>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="情况说明详情">
              <el-input
                v-model="anomalyForm.detail"
                type="textarea"
                :rows="2"
                placeholder="详细说明设备损坏程度或丢失经过情况"
              />
            </el-form-item>
          </div>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="returnModalVisible = false">取消</el-button>
          <el-button
            v-if="checkStatus === '正常'"
            type="success"
            :loading="submitting"
            @click="submitNormalReturn"
          >
            确认正常归还生成入库单
          </el-button>
          <el-button
            v-else
            type="danger"
            :loading="submitting"
            @click="submitAnomalyRecord"
          >
            发起异常登记并转入闭环处置
          </el-button>
        </span>
      </template>
    </el-dialog>
  </Container>
</template>

<script setup>
import { Container, Pagination, SearchToolbar } from '@/components'
import { getOutboundListApi, returnNormalDevicesApi, createAnomalyRecordApi } from '@/apis/wms'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const allBorrowed = ref([])
const borrowedList = ref([])

const queryForm = reactive({
  keyword: '',
  dept: ''
})

const page = reactive({
  current: 1,
  size: 10
})

const pagedData = computed(() => {
  const start = (page.current - 1) * page.size
  return borrowedList.value.slice(start, start + page.size)
})

const returnModalVisible = ref(false)
const currentOut = ref(null)
const checkStatus = ref('正常')

const normalForm = reactive({
  returnType: '全部归还',
  selectedSns: [],
  signer: '',
  remark: ''
})

const anomalyForm = reactive({
  deviceSn: '',
  category: '损坏',
  subCategory: '主体损坏',
  detail: ''
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getOutboundListApi({ status: '已签字出库' })
    if (res && res.data) {
      allBorrowed.value = res.data.list
      applyFilter()
    }
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  const keyword = queryForm.keyword.trim().toLowerCase()
  const dept = queryForm.dept.trim().toLowerCase()
  borrowedList.value = allBorrowed.value.filter(item => {
    const matchKeyword = !keyword ||
      (item.outNo && item.outNo.toLowerCase().includes(keyword)) ||
      (item.activityName && item.activityName.toLowerCase().includes(keyword))
    const matchDept = !dept || (item.dept && item.dept.toLowerCase().includes(dept))
    return matchKeyword && matchDept
  })
  page.current = 1
}

const handleSearch = () => {
  applyFilter()
}

const resetQuery = () => {
  queryForm.keyword = ''
  queryForm.dept = ''
  applyFilter()
}

const openReturnModal = (row) => {
  currentOut.value = row
  checkStatus.value = '正常'
  normalForm.returnType = '全部归还'
  normalForm.selectedSns = row.devices.map(d => d.sn)
  normalForm.signer = row.borrower
  normalForm.remark = '设备外观完好，功能测试正常'

  anomalyForm.deviceSn = row.devices[0]?.sn || ''
  anomalyForm.category = '损坏'
  anomalyForm.subCategory = '主体损坏'
  anomalyForm.detail = ''

  returnModalVisible.value = true
}

const submitNormalReturn = async () => {
  if (!normalForm.selectedSns.length) {
    ElMessage.warning('请勾选本次要归还入库的设备')
    return
  }
  submitting.value = true
  try {
    const returnDevices = currentOut.value.devices.filter(d => normalForm.selectedSns.includes(d.sn))
    const res = await returnNormalDevicesApi({
      outNo: currentOut.value.outNo,
      returnType: normalForm.returnType,
      devices: returnDevices,
      signer: normalForm.signer,
      remark: normalForm.remark
    })
    if (res && res.code === 0) {
      ElMessage.success('正常入库单生成成功，出库单已签字入库！')
      returnModalVisible.value = false
      router.push({ name: 'wms-inbound-bills' })
    }
  } finally {
    submitting.value = false
  }
}

const submitAnomalyRecord = async () => {
  if (!anomalyForm.deviceSn) {
    ElMessage.warning('请选择发生异常的具体设备')
    return
  }
  submitting.value = true
  try {
    const dev = currentOut.value.devices.find(d => d.sn === anomalyForm.deviceSn)
    const res = await createAnomalyRecordApi({
      outNo: currentOut.value.outNo,
      deviceSn: anomalyForm.deviceSn,
      deviceName: dev?.name || '未知设备',
      dept: currentOut.value.dept,
      responsiblePerson: currentOut.value.borrower,
      category: anomalyForm.category,
      subCategory: anomalyForm.subCategory,
      detail: anomalyForm.detail,
      oldLifeCode: dev?.lifeCode || 'LC-SN-OLD'
    })
    if (res && res.code === 0) {
      ElMessage.success('异常工单已建档，请前往异常处置闭环完成领导审批或终身码更新！')
      returnModalVisible.value = false
      router.push({ name: 'wms-anomaly' })
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.return-logic-card {
  background: #f8fafc;
  border-left: 4px solid #10b981;
}
.logic-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.logic-header .badge {
  background: #10b981;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
.logic-header .title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}
.logic-branches {
  display: flex;
  gap: 15px;
}
.branch-col {
  flex: 1;
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px dashed #cbd5e1;
}
.normal-branch {
  background: #f0fdf4;
  border-color: #86efac;
}
.normal-branch .branch-title {
  font-weight: bold;
  color: #166534;
  margin-bottom: 4px;
}
.error-branch {
  background: #fff7ed;
  border-color: #fdba74;
}
.error-branch .branch-title {
  font-weight: bold;
  color: #c2410c;
  margin-bottom: 4px;
}
.branch-desc {
  font-size: 12px;
  line-height: 1.5;
  color: #4b5563;
}
.card-title {
  font-size: 15px;
  font-weight: bold;
}
.normal-flow-box {
  background: #f0fdf4;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #dcfce7;
}
.anomaly-flow-box {
  background: #fef2f2;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #fee2e2;
}
</style>
