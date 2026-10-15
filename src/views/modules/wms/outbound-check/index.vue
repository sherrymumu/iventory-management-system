<template>
  <Container>
    <!-- 业务分支逻辑指引卡片 -->
    <el-card shadow="never" class="mb-15 logic-flow-card">
      <div class="logic-header">
        <span class="badge">出库核心决策流</span>
        <span class="title">库管核对分支判断与出库单生成规则</span>
      </div>
      <div class="logic-steps">
        <div class="step-box">1. 预约借用单发起 (锁定库存)</div>
        <div class="arrow">➜</div>
        <div class="step-box highlight">2. 库管核对</div>
        <div class="arrow">➜</div>
        <div class="step-branch">
          <div class="branch-item branch-success">
            <b>核对无误</b> ➜ 【单次出库】
          </div>
          <div class="branch-item branch-warn">
            <b>核对有误 & 库存充足</b> ➜ 【按库存调度-单次出库】 或 【待归还设备活动前借出-多次出库】
          </div>
          <div class="branch-item branch-danger">
            <b>核对有误 & 库存不足</b> ➜ 【临时加设备：手动修改】
          </div>
        </div>
        <div class="arrow">➜</div>
        <div class="step-box">3. 双方核对设备并扫码 (生成出库单)</div>
        <div class="arrow">➜</div>
        <div class="step-box">4. 签字领取出库</div>
      </div>
    </el-card>

    <!-- 待核对预约申请单列表 -->
    <el-card shadow="never" class="mb-15">
      <SearchToolbar :model="queryForm" @search="handleSearch" @reset="resetQuery">
        <el-form-item label="单号/活动/申请人">
          <el-input v-model="queryForm.keyword" placeholder="关键词搜索" clearable style="width: 200px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="预约来源">
          <el-select v-model="queryForm.source" placeholder="全部来源" clearable style="width: 140px">
            <el-option label="TRM (第三方)" value="TRM" />
            <el-option label="公文 (第三方)" value="公文" />
            <el-option label="协调会" value="协调会" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="单据状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="待核对" value="待核对" />
            <el-option label="核对通过" value="核对通过" />
            <el-option label="已生成出库单" value="已生成出库单" />
            <el-option label="已出库" value="已出库" />
          </el-select>
        </el-form-item>
        <template #actions>
          <el-button icon="Refresh" @click="fetchData">刷新单据</el-button>
        </template>
      </SearchToolbar>

      <el-table :data="pagedData" v-loading="loading" stripe border>
        <el-table-column prop="applyNo" label="预约单号" width="180">
          <template #default="{ row }">
            <span class="font-bold">{{ row.applyNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.source }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="activityName" label="活动名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="dept" label="借用部门" width="110" />
        <el-table-column prop="borrower" label="借用人" width="100" />
        <el-table-column prop="planBorrowTime" label="借用时间" width="150" />
        <el-table-column label="锁定设备明细" min-width="200">
          <template #default="{ row }">
            <div v-for="(it, i) in row.items" :key="i">
              {{ it.typeName }} × {{ it.count }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '待核对' ? 'warning' : 'success'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="核对操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :disabled="row.status !== '待核对'"
              @click="openCheckDialog(row)"
            >
              {{ row.status === '待核对' ? '开始核对' : '已核对' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-15 flex-end">
        <Pagination v-model:current="page.current" v-model:size="page.size" :total="orderList.length" :disabled="loading" />
      </div>
    </el-card>

    <!-- 库管核对分支决策弹窗 -->
    <el-dialog
      v-model="checkDialogVisible"
      title="库管现场核对与分支处理决策"
      width="720px"
      destroy-on-close
    >
      <div v-if="currentOrder" class="check-dialog-body">
        <el-descriptions :column="2" border class="mb-15">
          <el-descriptions-item label="预约申请单号">{{ currentOrder.applyNo }}</el-descriptions-item>
          <el-descriptions-item label="预约来源">{{ currentOrder.source }}</el-descriptions-item>
          <el-descriptions-item label="活动名称" :span="2">{{ currentOrder.activityName }}</el-descriptions-item>
          <el-descriptions-item label="借用人 / 部门">{{ currentOrder.borrower }} ({{ currentOrder.dept }})</el-descriptions-item>
          <el-descriptions-item label="计划借用时间">{{ currentOrder.planBorrowTime }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">预约设备与当前库房实物核验</el-divider>
        <el-table :data="currentOrder.items" border size="small" class="mb-15">
          <el-table-column prop="typeName" label="申请设备类型" />
          <el-table-column prop="count" label="申请台数" width="100" align="center" />
          <el-table-column label="锁定分配的设备SN号" min-width="200">
            <template #default="{ row }">
              <span v-if="row.lockedSnList && row.lockedSnList.length" class="text-success font-bold">
                {{ row.lockedSnList.join(', ') }}
              </span>
              <span v-else class="text-danger">未分配具体SN</span>
            </template>
          </el-table-column>
        </el-table>

        <el-form label-width="120px" class="branch-decision-form">
          <el-form-item label="库管核对结果">
            <el-radio-group v-model="decisionForm.passed">
              <el-radio :value="true">
                <span class="font-bold text-success">核对无误 (设备完好、参数齐全、可立即出库)</span>
              </el-radio>
              <el-radio :value="false">
                <span class="font-bold text-danger">核对有误 (库存变动 / 实物冲突 / 需特别调度)</span>
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 核对有误时的分支选项 -->
          <div v-if="!decisionForm.passed" class="error-branch-panel">
            <el-form-item label="异常分支方案">
              <el-radio-group v-model="decisionForm.lackHandling">
                <el-radio value="stockSufficientSingle">
                  <b>库存充足方案一：</b> 按库存调度设备，走【单次出库】
                </el-radio>
                <el-radio value="stockSufficientMulti">
                  <b>库存充足方案二：</b> 待归还设备活动前借出，走【多次出库】
                </el-radio>
                <el-radio value="stockLackManualAdd">
                  <b>库存不足方案：</b> 启用备用机架临时加设备，支持【手动修改】
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </div>

          <el-form-item label="核对备注说明">
            <el-input
              v-model="decisionForm.note"
              type="textarea"
              :rows="2"
              placeholder="请输入库管核对说明或调剂方案备注"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="checkDialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="checking" @click="submitCheck">
            确认核对并通过，驱动生成出库单
          </el-button>
        </span>
      </template>
    </el-dialog>
  </Container>
</template>

<script setup>
import { Container, Pagination, SearchToolbar } from '@/components'
import { getApplyOrderListApi, checkOutboundOrderApi } from '@/apis/wms'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const checking = ref(false)
const allOrders = ref([])
const orderList = ref([])

const queryForm = reactive({
  keyword: '',
  source: '',
  status: ''
})

const page = reactive({
  current: 1,
  size: 10
})

const pagedData = computed(() => {
  const start = (page.current - 1) * page.size
  return orderList.value.slice(start, start + page.size)
})

const checkDialogVisible = ref(false)
const currentOrder = ref(null)

const decisionForm = reactive({
  passed: true,
  lackHandling: 'stockSufficientSingle',
  note: ''
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getApplyOrderListApi()
    if (res && res.data) {
      allOrders.value = res.data.list
      applyFilter()
      // 若携带 query 则直接打开该预约单核对
      if (route.query.orderId) {
        const target = allOrders.value.find(i => i.id === route.query.orderId)
        if (target && target.status === '待核对') {
          openCheckDialog(target)
        }
      }
    }
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  const keyword = queryForm.keyword.trim().toLowerCase()
  const source = queryForm.source
  const status = queryForm.status
  orderList.value = allOrders.value.filter(item => {
    const matchKeyword = !keyword ||
      (item.applyNo && item.applyNo.toLowerCase().includes(keyword)) ||
      (item.activityName && item.activityName.toLowerCase().includes(keyword)) ||
      (item.borrower && item.borrower.toLowerCase().includes(keyword)) ||
      (item.dept && item.dept.toLowerCase().includes(keyword))
    const matchSource = !source || item.source === source
    const matchStatus = !status || item.status === status
    return matchKeyword && matchSource && matchStatus
  })
  page.current = 1
}

const handleSearch = () => {
  applyFilter()
}

const resetQuery = () => {
  queryForm.keyword = ''
  queryForm.source = ''
  queryForm.status = ''
  applyFilter()
}

const openCheckDialog = (row) => {
  currentOrder.value = row
  decisionForm.passed = true
  decisionForm.lackHandling = 'stockSufficientSingle'
  decisionForm.note = '实物核查无误，性能完好，准予出库'
  checkDialogVisible.value = true
}

const submitCheck = async () => {
  checking.value = true
  try {
    const res = await checkOutboundOrderApi({
      orderId: currentOrder.value.id,
      passed: decisionForm.passed,
      lackHandling: decisionForm.lackHandling,
      note: decisionForm.note
    })
    if (res && res.code === 0) {
      ElMessage.success('核对完毕！已自动生成出库单，正在跳转至出库扫码签字中心...')
      checkDialogVisible.value = false
      router.push({
        name: 'wms-outbound-bills',
        query: { outNo: res.data.outbound.outNo }
      })
    }
  } finally {
    checking.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.logic-flow-card {
  background: #f8fafc;
  border-left: 4px solid #1890ff;
}
.logic-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.logic-header .badge {
  background: #1890ff;
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
.logic-steps {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.step-box {
  background: #ffffff;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  color: #334155;
}
.step-box.highlight {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: bold;
}
.arrow {
  color: #94a3b8;
  font-weight: bold;
}
.step-branch {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px dashed #cbd5e1;
  padding: 6px 10px;
  border-radius: 6px;
  background: #fff;
}
.branch-item {
  font-size: 12px;
}
.branch-success { color: #16a34a; }
.branch-warn { color: #d97706; }
.branch-danger { color: #dc2626; }

.error-branch-panel {
  background: #fffbeb;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #fde68a;
  margin-bottom: 15px;
}
.card-title {
  font-size: 15px;
  font-weight: bold;
}
</style>
