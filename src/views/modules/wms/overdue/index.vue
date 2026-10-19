<template>
  <Container>
    <!-- 逾期待办与单据统计看板 -->
    <el-card shadow="never" class="mb-15">
      <SearchToolbar :model="queryForm" @search="handleSearch" @reset="resetQuery">
        <el-form-item label="关键词">
          <el-input v-model="queryForm.keyword" placeholder="单号 / 责任人 / 设备" clearable style="width: 220px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="逾期类型">
          <el-select v-model="queryForm.type" placeholder="全部类型" clearable style="width: 150px">
            <el-option label="逾期未领" value="逾期未领" />
            <el-option label="逾期未归还" value="逾期未归还" />
          </el-select>
        </el-form-item>
        <template #actions>
          <el-button icon="Refresh" @click="fetchData">刷新单据</el-button>
        </template>
      </SearchToolbar>

      <el-table :data="pagedData" v-loading="loading" stripe border>
        <el-table-column prop="type" label="逾期类型" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === '逾期未领' ? 'warning' : 'danger'" effect="dark">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applyNo" label="关联单号" width="190">
          <template #default="{ row }">
            <span class="font-bold text-primary">{{ row.applyNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="borrower" label="借用责任人" width="120" />
        <el-table-column prop="dept" label="责任部门" width="130" />
        <el-table-column prop="contact" label="联系电话" width="130" />
        <el-table-column prop="deviceName" label="涉及设备" min-width="160" />
        <el-table-column prop="activityPostponed" label="活动是否改期/延期" width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="row.activityPostponed === '是' ? 'success' : 'info'">
              {{ row.activityPostponed }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="actionResult" label="最新跟进与处置措施" min-width="260" show-overflow-tooltip />
        <el-table-column prop="followTime" label="最后催办时间" width="160" />
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDetailModal(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-15 flex-end">
        <Pagination v-model:current="page.current" v-model:size="page.size" :total="tableData.length" :disabled="loading" />
      </div>
    </el-card>

    <!-- 逾期台账详情弹窗（只读） -->
    <el-dialog v-model="detailVisible" title="逾期台账详情" width="620px">
      <el-descriptions v-if="selectedRow" :column="2" border>
        <el-descriptions-item label="逾期类型">
          <el-tag :type="selectedRow.type === '逾期未领' ? 'warning' : 'danger'" effect="dark">
            {{ selectedRow.type }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="关联单号">{{ selectedRow.applyNo }}</el-descriptions-item>
        <el-descriptions-item label="借用人">{{ selectedRow.borrower }}</el-descriptions-item>
        <el-descriptions-item label="责任部门">{{ selectedRow.dept }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ selectedRow.contact }}</el-descriptions-item>
        <el-descriptions-item label="涉及设备">{{ selectedRow.deviceName }}</el-descriptions-item>
        <el-descriptions-item label="活动是否改期/延期">{{ selectedRow.activityPostponed }}</el-descriptions-item>
        <el-descriptions-item label="最后催办时间">{{ selectedRow.followTime }}</el-descriptions-item>
        <el-descriptions-item label="最新跟进与处置措施" :span="2">{{ selectedRow.actionResult }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </Container>
</template>

<script setup>
import { Container, Pagination, SearchToolbar } from '@/components'
import { getOverdueListApi } from '@/apis/wms'

const loading = ref(false)
const allData = ref([])
const tableData = ref([])

const queryForm = reactive({
  keyword: '',
  type: ''
})

const page = reactive({
  current: 1,
  size: 10
})

const pagedData = computed(() => {
  const start = (page.current - 1) * page.size
  return tableData.value.slice(start, start + page.size)
})

const detailVisible = ref(false)
const selectedRow = ref(null)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getOverdueListApi()
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
  const type = queryForm.type
  tableData.value = allData.value.filter(item => {
    const matchKeyword = !keyword ||
      (item.applyNo && item.applyNo.toLowerCase().includes(keyword)) ||
      (item.borrower && item.borrower.toLowerCase().includes(keyword)) ||
      (item.deviceName && item.deviceName.toLowerCase().includes(keyword))
    const matchType = !type || item.type === type
    return matchKeyword && matchType
  })
  page.current = 1
}

const handleSearch = () => {
  applyFilter()
}

const resetQuery = () => {
  queryForm.keyword = ''
  queryForm.type = ''
  applyFilter()
}

const openDetailModal = (row) => {
  selectedRow.value = row
  detailVisible.value = true
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
</style>
