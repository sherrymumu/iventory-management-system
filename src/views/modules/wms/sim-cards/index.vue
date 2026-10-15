<template>
  <Container>
    <el-card shadow="never" class="mb-15">
      <SearchToolbar :model="queryForm" @search="handleSearch" @reset="resetQuery">
        <el-form-item label="关键词">
          <el-input v-model="queryForm.keyword" placeholder="卡号 / SN / 名称" clearable @keyup.enter="handleSearch" style="width: 200px" />
        </el-form-item>
        <el-form-item label="运营商">
          <el-select v-model="queryForm.operator" placeholder="全部运营商" clearable style="width: 150px">
            <el-option label="中国移动" value="中国移动" />
            <el-option label="中国联通" value="中国联通" />
            <el-option label="中国电信" value="中国电信" />
            <el-option label="中国广电" value="中国广电" />
          </el-select>
        </el-form-item>
        <template #actions>
          <el-button type="primary" icon="Plus" @click="openAddCardModal">登记新上网卡</el-button>
        </template>
      </SearchToolbar>
    </el-card>

    <el-card shadow="never">
      <el-table :data="pagedData" v-loading="loading" stripe border>
        <el-table-column prop="operator" label="运营商" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getOperatorTag(row.operator)">{{ row.operator }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cardNo" label="卡号 (唯一)" width="180">
          <template #default="{ row }">
            <span class="font-bold text-primary">{{ row.cardNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sn" label="SIM卡SN" width="180" />
        <el-table-column prop="name" label="套餐类型说明" min-width="180" />
        <el-table-column prop="status" label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '在库' ? 'success' : 'warning'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dept" label="借出部门" width="140">
          <template #default="{ row }">
            <span>{{ row.dept || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="borrower" label="借出用户" width="130">
          <template #default="{ row }">
            <span>{{ row.borrower || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出库规则提示" width="180">
          <template #default>
            <el-tag type="info" size="small">单独人工核销(无二维码)</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-15 flex-end">
        <Pagination v-model:current="page.current" v-model:size="page.size" :total="tableData.length" :disabled="loading" />
      </div>
    </el-card>

    <!-- 登记上网卡弹窗 -->
    <el-dialog v-model="modalVisible" title="登记新上网卡" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="电信运营商" prop="operator">
          <el-select v-model="form.operator" class="w-f">
            <el-option label="中国移动" value="中国移动" />
            <el-option label="中国联通" value="中国联通" />
            <el-option label="中国电信" value="中国电信" />
            <el-option label="中国广电" value="中国广电" />
          </el-select>
        </el-form-item>
        <el-form-item label="唯一卡号" prop="cardNo">
          <el-input v-model="form.cardNo" placeholder="如：SIM89860408" />
        </el-form-item>
        <el-form-item label="卡SN" prop="sn">
          <el-input v-model="form.sn" placeholder="如：SIM-CM-202688" />
        </el-form-item>
        <el-form-item label="卡名称说明" prop="name">
          <el-input v-model="form.name" placeholder="如：5G全网通应急图传保障卡" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modalVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitCard">确认登记</el-button>
      </template>
    </el-dialog>
  </Container>
</template>

<script setup>
import { Container, Pagination, SearchToolbar } from '@/components'
import { getDeviceListApi, saveDeviceApi } from '@/apis/wms'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const saving = ref(false)
const allData = ref([])
const tableData = ref([])

const queryForm = reactive({
  keyword: '',
  operator: ''
})

const page = reactive({
  current: 1,
  size: 10
})

const pagedData = computed(() => {
  const start = (page.current - 1) * page.size
  return tableData.value.slice(start, start + page.size)
})

const modalVisible = ref(false)
const formRef = useTemplateRef('formRef')
const form = reactive({
  operator: '中国移动',
  cardNo: '',
  sn: '',
  name: ''
})

const rules = {
  cardNo: [{ required: true, message: '请输入唯一卡号', trigger: 'blur' }],
  sn: [{ required: true, message: '请输入SN', trigger: 'blur' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getDeviceListApi()
    if (res && res.data) {
      allData.value = res.data.list.filter(i => i.isSimCard)
      applyFilter()
    }
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  const keyword = queryForm.keyword.trim().toLowerCase()
  const operator = queryForm.operator
  tableData.value = allData.value.filter(item => {
    const matchKeyword = !keyword ||
      (item.cardNo && item.cardNo.toLowerCase().includes(keyword)) ||
      (item.sn && item.sn.toLowerCase().includes(keyword)) ||
      (item.name && item.name.toLowerCase().includes(keyword))
    const matchOperator = !operator || item.operator === operator
    return matchKeyword && matchOperator
  })
  page.current = 1
}

const handleSearch = () => {
  applyFilter()
}

const resetQuery = () => {
  queryForm.keyword = ''
  queryForm.operator = ''
  applyFilter()
}

const openAddCardModal = () => {
  form.operator = '中国移动'
  form.cardNo = `SIM${Math.floor(Math.random() * 899999 + 100000)}`
  form.sn = `SIM-CM-${Date.now().toString().slice(-4)}`
  form.name = '5G全网通高清传输专用卡'
  modalVisible.value = true
}

const submitCard = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    saving.value = true
    try {
      const res = await saveDeviceApi({
        ...form,
        typeId: 9,
        typeName: '上网卡(移动数据包)',
        location: '技术支持',
        status: '在库',
        isSimCard: true
      })
      if (res && res.code === 0) {
        ElMessage.success('上网卡登记成功')
        modalVisible.value = false
        fetchData()
      }
    } finally {
      saving.value = false
    }
  })
}

const getOperatorTag = (op) => {
  const map = {
    中国移动: 'primary',
    中国联通: 'warning',
    中国电信: 'success'
  }
  return map[op] || 'info'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
</style>
