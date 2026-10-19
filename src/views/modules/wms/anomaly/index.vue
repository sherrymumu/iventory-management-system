<template>
  <Container>
    <!-- 异常工单列表 -->
    <el-card shadow="never">
      <SearchToolbar :model="queryForm" @search="handleSearch" @reset="resetQuery">
        <el-form-item label="异常单号/设备">
          <el-input v-model="queryForm.keyword" placeholder="单号 / 设备名称 / SN" clearable style="width: 240px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="大类">
          <el-select v-model="queryForm.category" placeholder="全部大类" clearable style="width: 120px">
            <el-option label="丢失" value="丢失" />
            <el-option label="损坏" value="损坏" />
          </el-select>
        </el-form-item>
        <el-form-item label="闭环状态">
          <el-select v-model="queryForm.currentStep" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="待领导签字" value="待领导签字" />
            <el-option label="处置中" value="处置中" />
            <el-option label="待更新终身码" value="待更新终身码" />
            <el-option label="已完成" value="已完成" />
          </el-select>
        </el-form-item>
        <template #actions>
          <el-button icon="Refresh" @click="fetchData">刷新工单</el-button>
        </template>
      </SearchToolbar>

      <el-table :data="pagedData" v-loading="loading" stripe border>
        <el-table-column prop="anomalyNo" label="异常单号" width="180">
          <template #default="{ row }">
            <span class="font-bold text-danger">{{ row.anomalyNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="大类" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.category === '丢失' ? 'danger' : 'warning'">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="subCategory" label="细分类别" width="140">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.subCategory }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceName" label="设备名称" width="150" />
        <el-table-column prop="deviceSn" label="设备SN" width="170" />
        <el-table-column prop="responsiblePerson" label="责任人" width="100" />
        <el-table-column prop="dept" label="责任部门" width="120" />
        <el-table-column prop="leaderSignStatus" label="领导签字状态" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getLeaderSignTag(row.leaderSignStatus)">{{ row.leaderSignStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handleSolution" label="最终方案" width="130">
          <template #default="{ row }">
            <span>{{ row.handleSolution || '待决议' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="终身码变更跟踪" min-width="190">
          <template #default="{ row }">
            <div v-if="row.newLifeCode" class="fs-12">
              <span class="text-muted">原码: {{ row.oldLifeCode }}</span> ➜ 
              <span class="text-success font-bold">新码: {{ row.newLifeCode }}</span>
            </div>
            <div v-else-if="row.handleSolution === '不赔偿'" class="fs-12 text-danger">
              不赔偿(终身码废弃，标记丢失)
            </div>
            <span v-else class="text-muted fs-12">待处置后生成更新</span>
          </template>
        </el-table-column>
        <el-table-column prop="currentStep" label="闭环状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStepTag(row.currentStep)">{{ row.currentStep }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="流程操作" width="200" fixed="right">
          <template #default="{ row }">
            <!-- 领导签字按钮 -->
            <el-button
              v-if="row.leaderSignStatus === '待领导签字'"
              type="warning"
              size="small"
              @click="openLeaderSignModal(row)"
            >
              领导签字核实
            </el-button>
            <!-- 方案处置按钮 -->
            <el-button
              v-else-if="row.currentStep === '处置中' || row.currentStep === '待更新终身码'"
              type="primary"
              size="small"
              @click="openResolveModal(row)"
            >
              处置与更新终身码
            </el-button>
            <el-button
              v-else
              type="info"
              plain
              size="small"
              @click="viewRecordDetail(row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-15 flex-end">
        <Pagination v-model:current="page.current" v-model:size="page.size" :total="tableData.length" :disabled="loading" />
      </div>
    </el-card>

    <!-- 领导签字核实弹窗 -->
    <el-dialog v-model="leaderSignVisible" title="部门分管领导核实情况与签署意见" width="560px">
      <div v-if="selectedRow">
        <el-alert
          title="根据系统规则：主体丢失或损坏，须双方领导审核签字核实情况后，方可推进后续赔偿或维修流程"
          type="warning"
          :closable="false"
          show-icon
          class="mb-15"
        />
        <el-descriptions :column="1" border class="mb-15">
          <el-descriptions-item label="异常工单">{{ selectedRow.anomalyNo }}</el-descriptions-item>
          <el-descriptions-item label="设备信息">{{ selectedRow.deviceName }} (SN: {{ selectedRow.deviceSn }})</el-descriptions-item>
          <el-descriptions-item label="责任人 / 部门">{{ selectedRow.responsiblePerson }} ({{ selectedRow.dept }})</el-descriptions-item>
          <el-descriptions-item label="异常事实陈述">{{ selectedRow.detail || '现场拍摄受损' }}</el-descriptions-item>
        </el-descriptions>

        <el-form label-width="110px">
          <el-form-item label="领导核实姓名">
            <el-input v-model="leaderNameInput" placeholder="例如：台办公室-张主任 / 技术中心-李总监" />
          </el-form-item>
          <el-form-item label="核实审核批语">
            <el-input v-model="leaderNoteInput" type="textarea" :rows="2" placeholder="同意情况核实属实，按规定办理交接处置" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="leaderSignVisible = false">取消</el-button>
        <el-button type="primary" :loading="operating" @click="submitLeaderSign">确认领导签字核实</el-button>
      </template>
    </el-dialog>

    <!-- 处置方案决议与更新终身码弹窗 -->
    <el-dialog v-model="resolveVisible" title="异常处置闭环方案决议与更新终身码" width="660px">
      <div v-if="selectedRow">
        <el-descriptions :column="2" border class="mb-15">
          <el-descriptions-item label="异常设备">{{ selectedRow.deviceName }}</el-descriptions-item>
          <el-descriptions-item label="细分类别">{{ selectedRow.subCategory }}</el-descriptions-item>
          <el-descriptions-item label="原设备终身码">{{ selectedRow.oldLifeCode || '无' }}</el-descriptions-item>
          <el-descriptions-item label="领导签字记录">{{ selectedRow.leaderSignName || '配件免签字' }}</el-descriptions-item>
        </el-descriptions>

        <el-form label-width="130px">
          <el-form-item label="选择处置方案">
            <el-radio-group v-model="resolveForm.solution" @change="onSolutionChange">
              <!-- 丢失分支选项 -->
              <template v-if="selectedRow.category === '丢失'">
                <template v-if="selectedRow.subCategory === '配件丢失'">
                  <el-radio value="节目组购买归还">节目组购买归还 (更新终身码后签字入库)</el-radio>
                </template>
                <template v-else>
                  <el-radio value="赔偿">赔偿损失 (更新设备终身码后签字入库)</el-radio>
                  <el-radio value="节目组购买归还">节目组购买新机归还 (更新设备终身码后签字入库)</el-radio>
                  <el-radio value="不赔偿">不赔偿 (修改设备丢失状态，结束不入库)</el-radio>
                </template>
              </template>
              <!-- 损坏分支选项 -->
              <template v-else>
                <template v-if="selectedRow.subCategory === '配件损坏'">
                  <el-radio value="节目组购买归还">节目组购买原厂配件归还 (签字入库)</el-radio>
                </template>
                <template v-else>
                  <el-radio value="节目组购买归还">节目组购买新机归还 (更新终身码，签字入库)</el-radio>
                  <el-radio value="自行维修">库房送厂自行维修 (更新终身码，设备入库)</el-radio>
                </template>
              </template>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="resolveForm.solution === '赔偿'" label="赔偿核定金额(元)">
            <el-input-number v-model="resolveForm.compensationAmount" :min="0" :step="100" />
          </el-form-item>

          <el-form-item v-if="resolveForm.solution !== '不赔偿'" label="更新设备终身码">
            <div class="flex-between w-f">
              <el-input v-model="resolveForm.newLifeCode" placeholder="系统自动生成或手动录入新终身码" style="width: 340px" />
              <el-button type="primary" plain size="small" @click="generateNewLifeCode">重新生成终身码</el-button>
            </div>
            <div class="fs-12 text-muted mt-5">
              终身码机制：设备归还、补购、自行维修后更新终身码（旧终身码保留在历史单据中方便核对）。
            </div>
          </el-form-item>

          <div v-else class="text-danger p-10 fs-13">
            ⚠ 选择【不赔偿】：系统将把该设备在台账中的状态永久标记为【丢失】，并结束流程，不产生入库操作。
          </div>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="resolveVisible = false">取消</el-button>
        <el-button type="success" :loading="operating" @click="submitResolveAction">
          {{ resolveForm.solution === '不赔偿' ? '确认核销并结束流程' : '确认处置方案并更新终身码入库' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="异常处置工单全生命周期追踪" width="600px">
      <el-descriptions v-if="selectedRow" :column="2" border>
        <el-descriptions-item label="异常单号">{{ selectedRow.anomalyNo }}</el-descriptions-item>
        <el-descriptions-item label="出库来源单">{{ selectedRow.outNo }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ selectedRow.deviceName }}</el-descriptions-item>
        <el-descriptions-item label="设备SN">{{ selectedRow.deviceSn }}</el-descriptions-item>
        <el-descriptions-item label="责任人">{{ selectedRow.responsiblePerson }}</el-descriptions-item>
        <el-descriptions-item label="责任部门">{{ selectedRow.dept }}</el-descriptions-item>
        <el-descriptions-item label="异常类型">{{ selectedRow.subCategory }}</el-descriptions-item>
        <el-descriptions-item label="领导签字">{{ selectedRow.leaderSignName || '免签' }}</el-descriptions-item>
        <el-descriptions-item label="处置方案" :span="2">{{ selectedRow.handleSolution || '进行中' }}</el-descriptions-item>
        <el-descriptions-item label="原终身码">{{ selectedRow.oldLifeCode || '无' }}</el-descriptions-item>
        <el-descriptions-item label="新终身码">{{ selectedRow.newLifeCode || '无' }}</el-descriptions-item>
        <el-descriptions-item label="情况描述" :span="2">{{ selectedRow.detail || '无详细备注' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关 闭</el-button>
      </template>
    </el-dialog>
  </Container>
</template>

<script setup>
import { Container, Pagination, SearchToolbar } from '@/components'
import { getAnomalyListApi, signAnomalyLeaderApi, resolveAnomalyActionApi } from '@/apis/wms'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const operating = ref(false)
const allData = ref([])
const tableData = ref([])

const queryForm = reactive({
  keyword: '',
  category: '',
  currentStep: ''
})

const page = reactive({
  current: 1,
  size: 10
})

const pagedData = computed(() => {
  const start = (page.current - 1) * page.size
  return tableData.value.slice(start, start + page.size)
})

const leaderSignVisible = ref(false)
const resolveVisible = ref(false)
const detailVisible = ref(false)
const selectedRow = ref(null)

const leaderNameInput = ref('影视中心-李总监')
const leaderNoteInput = ref('情况属实，请按资产管理处置制度执行方案')

const resolveForm = reactive({
  solution: '节目组购买归还',
  compensationAmount: 0,
  newLifeCode: ''
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getAnomalyListApi()
    if (res && res.data) {
      allData.value = res.data.list
      applyFilter()
    }
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  const keyword = queryForm.keyword.trim().toLowerCase()
  const category = queryForm.category
  const currentStep = queryForm.currentStep
  tableData.value = allData.value.filter(item => {
    const matchKeyword = !keyword ||
      (item.anomalyNo && item.anomalyNo.toLowerCase().includes(keyword)) ||
      (item.deviceName && item.deviceName.toLowerCase().includes(keyword)) ||
      (item.deviceSn && item.deviceSn.toLowerCase().includes(keyword))
    const matchCategory = !category || item.category === category
    const matchStep = !currentStep || item.currentStep === currentStep
    return matchKeyword && matchCategory && matchStep
  })
  page.current = 1
}

const handleSearch = () => {
  applyFilter()
}

const resetQuery = () => {
  queryForm.keyword = ''
  queryForm.category = ''
  queryForm.currentStep = ''
  applyFilter()
}

const openLeaderSignModal = (row) => {
  selectedRow.value = row
  leaderNameInput.value = '技术保障中心-陈主任'
  leaderNoteInput.value = '现场核查属实，责任界定清晰，同意进入方案决议阶段'
  leaderSignVisible.value = true
}

const submitLeaderSign = async () => {
  operating.value = true
  try {
    const res = await signAnomalyLeaderApi({
      anomalyNo: selectedRow.value.anomalyNo,
      leaderName: leaderNameInput.value,
      note: leaderNoteInput.value
    })
    if (res && res.code === 0) {
      ElMessage.success('领导签字核验成功，工单已进入方案处置流程！')
      leaderSignVisible.value = false
      fetchData()
    }
  } finally {
    operating.value = false
  }
}

const openResolveModal = (row) => {
  selectedRow.value = row
  resolveForm.solution = row.category === '丢失' ? '赔偿' : '自行维修'
  resolveForm.compensationAmount = row.category === '丢失' ? 8500 : 0
  generateNewLifeCode()
  resolveVisible.value = true
}

const generateNewLifeCode = () => {
  const prefix = selectedRow.value?.deviceSn?.substring(0, 7) || 'LC'
  const timeStr = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  resolveForm.newLifeCode = `LC-${prefix}-${timeStr}-R${Math.floor(Math.random() * 89 + 10)}`
}

const onSolutionChange = (val) => {
  if (val === '不赔偿') {
    resolveForm.newLifeCode = ''
  } else if (!resolveForm.newLifeCode) {
    generateNewLifeCode()
  }
}

const submitResolveAction = async () => {
  operating.value = true
  try {
    const res = await resolveAnomalyActionApi({
      anomalyNo: selectedRow.value.anomalyNo,
      id: selectedRow.value.id,
      solution: resolveForm.solution,
      newLifeCode: resolveForm.newLifeCode,
      compensationAmount: resolveForm.compensationAmount
    })
    if (res && res.code === 0) {
      ElMessage.success('异常处置闭环执行完毕，设备台账与终身码已同步更新！')
      resolveVisible.value = false
      fetchData()
    }
  } finally {
    operating.value = false
  }
}

const viewRecordDetail = (row) => {
  selectedRow.value = row
  detailVisible.value = true
}

const getLeaderSignTag = (status) => {
  if (status === '已签字') return 'success'
  if (status === '待领导签字') return 'danger'
  return 'info'
}

const getStepTag = (step) => {
  if (step === '已入库完成') return 'success'
  if (step === '结束(不入库)') return 'info'
  if (step === '待领导签字') return 'danger'
  return 'warning'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
</style>
