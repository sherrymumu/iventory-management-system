<template>
  <Container>
    <!-- 搜索筛选 -->
    <el-card shadow="never" class="mb-15">
      <SearchToolbar :model="queryForm" @search="fetchData" @reset="resetQuery">
        <el-form-item label="单号/活动/申请人">
          <el-input v-model="queryForm.keyword" placeholder="关键词搜索" clearable style="width: 200px" @keyup.enter="fetchData" />
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
            <el-option label="已逾期" value="已逾期" />
            <el-option label="逾期未领" value="逾期未领" />
          </el-select>
        </el-form-item>
        <template #actions>
          <el-button type="primary" icon="Plus" @click="openCreateDialog">发起借用预约</el-button>
        </template>
      </SearchToolbar>
    </el-card>

    <!-- 预约列表 -->
    <el-card shadow="never">
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="applyNo" label="预约申请单号" width="190">
          <template #default="{ row }">
            <span class="font-bold text-primary">{{ row.applyNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="预约来源" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getSourceTag(row.source)">{{ row.source }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="activityName" label="活动名称/事由" min-width="160" show-overflow-tooltip />
        <el-table-column prop="dept" label="借用部门" width="120" />
        <el-table-column prop="borrower" label="借用人" width="100" />
        <el-table-column label="预约借用时段" width="280">
          <template #default="{ row }">
            <div class="time-range">
              <span>借：{{ row.planBorrowTime }}</span>
              <span>还：{{ row.planReturnTime }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="借用设备(已锁库存)" min-width="200">
          <template #default="{ row }">
            <div v-for="(it, idx) in row.items" :key="idx" class="device-tag-item">
              <span class="name">{{ it.typeName }}</span>
              <el-tag size="small" type="warning">× {{ it.count }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewDetail(row)">查看详情</el-button>
            <el-button
              v-if="row.status === '待核对'"
              link
              type="success"
              size="small"
              @click="goToOutboundCheck(row)"
            >
              库管核对
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 发起预约弹窗 -->
    <el-dialog v-model="dialogVisible" title="新建借用预约申请单（自动锁库存）" width="680px" destroy-on-close>
      <el-form ref="applyFormRef" :model="applyForm" :rules="rules" label-width="110px">
        <el-row :gutter="15">
          <el-col :span="12">
            <el-form-item label="预约来源" prop="source">
              <el-select v-model="applyForm.source" placeholder="请选择来源" class="w-f">
                <el-option label="TRM (第三方系统对接)" value="TRM" />
                <el-option label="公文 (第三方系统)" value="公文" />
                <el-option label="协调会纪要" value="协调会" />
                <el-option label="其他内部申请" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动名称" prop="activityName">
              <el-input v-model="applyForm.activityName" placeholder="例如：2026金秋大型晚会直播" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="15">
          <el-col :span="12">
            <el-form-item label="借用部门" prop="dept">
              <el-input v-model="applyForm.dept" placeholder="如：新闻部 / 转播部" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="借用人" prop="borrower">
              <el-input v-model="applyForm.borrower" placeholder="借用申请责任人" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="15">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contact">
              <el-input v-model="applyForm.contact" placeholder="手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划借用时间" prop="planBorrowTime">
              <el-date-picker v-model="applyForm.planBorrowTime" type="datetime" placeholder="选择借出时间" value-format="YYYY-MM-DD HH:mm" class="w-f" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="计划归还时间" prop="planReturnTime">
          <el-date-picker v-model="applyForm.planReturnTime" type="datetime" placeholder="选择归还时间" value-format="YYYY-MM-DD HH:mm" class="w-f" />
        </el-form-item>

        <el-divider content-position="left">选择借用设备（系统执行实时锁库存）</el-divider>

        <div v-for="(item, index) in applyForm.items" :key="index" class="device-select-row mb-10">
          <el-select v-model="item.typeId" placeholder="选择设备类型" style="width: 260px" @change="onDeviceTypeChange(item)">
            <el-option
              v-for="opt in typeOptions"
              :key="opt.id"
              :label="`${opt.name} (当前在库:${opt.inStock})`"
              :value="opt.id"
            />
          </el-select>
          <span class="ml-10 mr-5">数量:</span>
          <el-input-number v-model="item.count" :min="1" :max="20" size="default" />
          <el-button v-if="applyForm.items.length > 1" type="danger" icon="Delete" circle size="small" class="ml-10" @click="removeItem(index)" />
        </div>

        <el-button type="primary" plain icon="Plus" size="small" @click="addItem">追加借用设备</el-button>

        <el-divider content-position="left">第三方信息补充 / 备注</el-divider>
        <el-form-item label="备注说明" prop="remark">
          <el-input v-model="applyForm.remark" type="textarea" :rows="2" placeholder="可录入第三方公文编号、TRM对应单号，或上传3张照片补充" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitApply">确认发起并锁定库存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="借用预约单详细信息" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="预约单号">{{ currentDetail.applyNo }}</el-descriptions-item>
        <el-descriptions-item label="预约来源">{{ currentDetail.source }}</el-descriptions-item>
        <el-descriptions-item label="活动名称" :span="2">{{ currentDetail.activityName }}</el-descriptions-item>
        <el-descriptions-item label="借用人">{{ currentDetail.borrower }}</el-descriptions-item>
        <el-descriptions-item label="借用部门">{{ currentDetail.dept }}</el-descriptions-item>
        <el-descriptions-item label="计划借用">{{ currentDetail.planBorrowTime }}</el-descriptions-item>
        <el-descriptions-item label="计划归还">{{ currentDetail.planReturnTime }}</el-descriptions-item>
        <el-descriptions-item label="锁库存状态">
          <el-tag type="success">已锁定库存（防止超借）</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="当前流程状态">{{ currentDetail.status }}</el-descriptions-item>
        <el-descriptions-item label="设备清单" :span="2">
          <ul>
            <li v-for="(it, i) in currentDetail.items" :key="i">
              <b>{{ it.typeName }}</b> × {{ it.count }} 台 
              <span v-if="it.lockedSnList && it.lockedSnList.length" class="text-muted ml-5">
                (已预配锁定SN: {{ it.lockedSnList.join(', ') }})
              </span>
            </li>
          </ul>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentDetail.remark || '无' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关 闭</el-button>
      </template>
    </el-dialog>
  </Container>
</template>

<script setup>
import { Container, SearchToolbar } from '@/components'
import { getApplyOrderListApi, createApplyOrderApi, getDeviceTypeListApi, getDeviceListApi } from '@/apis/wms'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const typeOptions = ref([])
const allDeviceStock = ref([])

const queryForm = reactive({
  keyword: '',
  source: '',
  status: ''
})

const dialogVisible = ref(false)
const detailVisible = ref(false)
const currentDetail = ref({})
const applyFormRef = useTemplateRef('applyFormRef')

const applyForm = reactive({
  source: 'TRM',
  activityName: '',
  borrower: '',
  dept: '',
  contact: '',
  planBorrowTime: '',
  planReturnTime: '',
  items: [
    { typeId: 1, typeName: '4K超清摄像机', count: 1 }
  ],
  remark: ''
})

const rules = {
  source: [{ required: true, message: '请选择来源', trigger: 'change' }],
  activityName: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  borrower: [{ required: true, message: '请输入借用人', trigger: 'blur' }],
  dept: [{ required: true, message: '请输入借用部门', trigger: 'blur' }],
  planBorrowTime: [{ required: true, message: '请选择计划借用时间', trigger: 'change' }],
  planReturnTime: [{ required: true, message: '请选择计划归还时间', trigger: 'change' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const r = await getApplyOrderListApi(queryForm)
    if (r && r.data) {
      tableData.value = r.data.list
    }
  } finally {
    loading.value = false
  }
}

const fetchOptions = async () => {
  const r1 = await getDeviceTypeListApi()
  if (r1 && r1.data) {
    typeOptions.value = r1.data.list
  }
  const r2 = await getDeviceListApi({ status: '在库' })
  if (r2 && r2.data) {
    allDeviceStock.value = r2.data.list
  }
}

const resetQuery = () => {
  queryForm.keyword = ''
  queryForm.source = ''
  queryForm.status = ''
  fetchData()
}

const openCreateDialog = () => {
  applyForm.activityName = ''
  applyForm.borrower = ''
  applyForm.dept = ''
  applyForm.contact = ''
  applyForm.planBorrowTime = ''
  applyForm.planReturnTime = ''
  applyForm.items = [{ typeId: 1, typeName: '4K超清摄像机', count: 1 }]
  applyForm.remark = ''
  dialogVisible.value = true
}

const addItem = () => {
  applyForm.items.push({ typeId: typeOptions.value[0]?.id || 1, typeName: typeOptions.value[0]?.name || '', count: 1 })
}

const removeItem = (idx) => {
  applyForm.items.splice(idx, 1)
}

const onDeviceTypeChange = (item) => {
  const target = typeOptions.value.find(t => t.id === item.typeId)
  if (target) {
    item.typeName = target.name
  }
}

const submitApply = () => {
  applyFormRef.value.validate(async valid => {
    if (!valid) return
    submitting.value = true
    try {
      // 预配并锁定在库SN
      const processedItems = applyForm.items.map(it => {
        const availableSns = allDeviceStock.value.filter(d => d.typeId === it.typeId).map(d => d.sn)
        const locked = availableSns.slice(0, it.count)
        return {
          ...it,
          lockedSnList: locked
        }
      })

      const res = await createApplyOrderApi({
        ...applyForm,
        items: processedItems
      })
      if (res && res.code === 0) {
        ElMessage.success('预约单已创建，并成功锁定对应库存')
        dialogVisible.value = false
        fetchData()
      }
    } finally {
      submitting.value = false
    }
  })
}

const viewDetail = (row) => {
  currentDetail.value = row
  detailVisible.value = true
}

const goToOutboundCheck = (row) => {
  router.push({
    name: 'wms-outbound-check',
    query: { orderId: row.id }
  })
}

const getSourceTag = (source) => {
  const map = {
    TRM: 'primary',
    公文: 'success',
    协调会: 'warning',
    其他: 'info'
  }
  return map[source] || 'info'
}

const getStatusTag = (status) => {
  const map = {
    待核对: 'warning',
    核对通过: 'primary',
    已生成出库单: 'success',
    已出库: '',
    已逾期: 'danger',
    逾期未领: 'danger'
  }
  return map[status] || 'info'
}

onMounted(() => {
  fetchData()
  fetchOptions()
})
</script>

<style scoped>
.device-tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.time-range {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #4b5563;
}
.device-select-row {
  display: flex;
  align-items: center;
}
</style>
