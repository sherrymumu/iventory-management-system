<template>
  <Container>
    <el-card shadow="never" class="mb-15">
      <SearchToolbar :model="queryForm" @search="handleSearch" @reset="resetQuery">
        <el-form-item label="入库单号">
          <el-input v-model="queryForm.keyword" placeholder="单号 / 关联出库单号" clearable style="width: 220px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="归还方式">
          <el-select v-model="queryForm.returnType" placeholder="全部方式" clearable style="width: 140px">
            <el-option label="全部归还" value="全部归还" />
            <el-option label="分批多次归还" value="分批多次归还" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备状态">
          <el-select v-model="queryForm.deviceCondition" placeholder="全部状态" clearable style="width: 130px">
            <el-option label="正常" value="正常" />
            <el-option label="损坏" value="损坏" />
            <el-option label="丢失" value="丢失" />
          </el-select>
        </el-form-item>
        <template #actions>
          <el-button icon="Refresh" @click="fetchData">刷新单据</el-button>
        </template>
      </SearchToolbar>
    </el-card>

    <el-card shadow="never">
      <el-table :data="pagedData" v-loading="loading" stripe border>
        <el-table-column prop="inNo" label="入库单号" width="180">
          <template #default="{ row }">
            <span class="font-bold text-success">{{ row.inNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="outNo" label="关联出库单" width="180" />
        <el-table-column prop="activityName" label="活动名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="signer" label="归还经手人" width="120" />
        <el-table-column prop="operator" label="库管接收人" width="120" />
        <el-table-column prop="returnType" label="归还方式" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.returnType === '全部归还' ? 'success' : 'warning'">
              {{ row.returnType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deviceCondition" label="设备状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.deviceCondition === '正常' ? 'success' : 'danger'">
              {{ row.deviceCondition }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inTime" label="入库生效时间" width="160" />
        <el-table-column label="入库设备明细" min-width="200">
          <template #default="{ row }">
            <div v-for="(d, i) in row.devices" :key="i" class="device-cell">
              <span>{{ d.name }} ({{ d.sn }})</span>
              <span v-if="d.lifeCode" class="life-code">终身码: {{ d.lifeCode }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-15 flex-end">
        <Pagination v-model:current="page.current" v-model:size="page.size" :total="tableData.length" :disabled="loading" />
      </div>
    </el-card>
  </Container>
</template>

<script setup>
import { Container, Pagination, SearchToolbar } from '@/components'
import { getInboundListApi } from '@/apis/wms'

const loading = ref(false)
const allData = ref([])
const tableData = ref([])

const queryForm = reactive({
  keyword: '',
  returnType: '',
  deviceCondition: ''
})

const page = reactive({
  current: 1,
  size: 10
})

const pagedData = computed(() => {
  const start = (page.current - 1) * page.size
  return tableData.value.slice(start, start + page.size)
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getInboundListApi()
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
  const returnType = queryForm.returnType
  const deviceCondition = queryForm.deviceCondition
  tableData.value = allData.value.filter(item => {
    const matchKeyword = !keyword ||
      (item.inNo && item.inNo.toLowerCase().includes(keyword)) ||
      (item.outNo && item.outNo.toLowerCase().includes(keyword))
    const matchReturnType = !returnType || item.returnType === returnType
    const matchCondition = !deviceCondition || item.deviceCondition === deviceCondition
    return matchKeyword && matchReturnType && matchCondition
  })
  page.current = 1
}

const handleSearch = () => {
  applyFilter()
}

const resetQuery = () => {
  queryForm.keyword = ''
  queryForm.returnType = ''
  queryForm.deviceCondition = ''
  applyFilter()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.device-cell {
  font-size: 13px;
  margin-bottom: 4px;
}
.life-code {
  font-size: 11px;
  color: #10b981;
  background: #f0fdf4;
  padding: 1px 4px;
  border-radius: 4px;
  margin-left: 6px;
}
</style>
