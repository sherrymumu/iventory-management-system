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
        <el-table-column label="催办操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openFollowModal(row)">
              联系节目 / 登记处置
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-15 flex-end">
        <Pagination v-model:current="page.current" v-model:size="page.size" :total="tableData.length" :disabled="loading" />
      </div>
    </el-card>

    <!-- 联系节目跟进与处置弹窗 -->
    <el-dialog v-model="followVisible" title="联系节目组与逾期处置决议" width="620px">
      <div v-if="selectedRow">
        <el-descriptions :column="2" border class="mb-15">
          <el-descriptions-item label="单据号">{{ selectedRow.applyNo }}</el-descriptions-item>
          <el-descriptions-item label="逾期类型">{{ selectedRow.type }}</el-descriptions-item>
          <el-descriptions-item label="借用人">{{ selectedRow.borrower }} ({{ selectedRow.dept }})</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ selectedRow.contact }}</el-descriptions-item>
        </el-descriptions>

        <el-form label-width="130px">
          <!-- 逾期未领分支 -->
          <template v-if="selectedRow.type === '逾期未领'">
            <el-form-item label="活动是否改期">
              <el-radio-group v-model="followForm.postponed">
                <el-radio value="是"><b>改期：</b>收回TRM，重新确认领取时间</el-radio>
                <el-radio value="否"><b>不改期：</b>确认是否重新预约，再次联系</el-radio>
              </el-radio-group>
            </el-form-item>
          </template>

          <!-- 逾期未归还分支 -->
          <template v-else>
            <el-form-item label="活动是否延期">
              <el-radio-group v-model="followForm.postponed">
                <el-radio value="是"><b>延期：</b>确认新活动截止时间，顺延借用申请</el-radio>
                <el-radio value="否"><b>未延期：</b>督促进度，约定即日归还库房</el-radio>
              </el-radio-group>
            </el-form-item>
          </template>

          <el-form-item label="处置措施记录">
            <el-input
              v-model="followForm.actionResult"
              type="textarea"
              :rows="3"
              placeholder="请输入沟通电话记录及最终决议安排"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="followVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitFollow">保存跟进结果</el-button>
      </template>
    </el-dialog>
  </Container>
</template>

<script setup>
import { Container, Pagination, SearchToolbar } from '@/components'
import { getOverdueListApi, submitOverdueFollowApi } from '@/apis/wms'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const submitting = ref(false)
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

const followVisible = ref(false)
const selectedRow = ref(null)
const followForm = reactive({
  postponed: '是',
  actionResult: ''
})

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

const openFollowModal = (row) => {
  selectedRow.value = row
  followForm.postponed = '是'
  followForm.actionResult = row.type === '逾期未领'
    ? '已联系节目负责人，确认改期至下周二，已在TRM系统收回单据并重设时间'
    : '已联系借用人，活动因天气延期一天，约定明晚前全部送检归还'
  followVisible.value = true
}

const submitFollow = async () => {
  submitting.value = true
  try {
    const res = await submitOverdueFollowApi({
      type: selectedRow.value.type,
      applyNo: selectedRow.value.applyNo,
      borrower: selectedRow.value.borrower,
      dept: selectedRow.value.dept,
      contact: selectedRow.value.contact,
      deviceName: selectedRow.value.deviceName,
      activityPostponed: followForm.postponed,
      actionResult: followForm.actionResult
    })
    if (res && res.code === 0) {
      ElMessage.success('逾期跟进处置记录已更新！')
      followVisible.value = false
      fetchData()
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
</style>
