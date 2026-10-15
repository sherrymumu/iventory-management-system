<template>
  <Container>
    <el-card shadow="never" class="mb-15">
      <SearchToolbar :model="queryForm" @search="handleSearch" @reset="resetQuery">
        <el-form-item label="类型名称">
          <el-input v-model="queryForm.keyword" placeholder="请输入类型名称" clearable @keyup.enter="handleSearch" style="width: 200px" />
        </el-form-item>
        <template #actions>
          <el-button type="primary" icon="Plus" @click="openAddTypeModal">新增设备类型</el-button>
        </template>
      </SearchToolbar>
    </el-card>

    <el-card shadow="never">
      <el-table :data="pagedData" v-loading="loading" stripe border>
        <el-table-column prop="name" label="类型名称" min-width="180">
          <template #default="{ row }">
            <span class="font-bold text-primary">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total" label="数量" width="120" align="center">
          <template #default="{ row }">
            <span class="font-bold">{{ row.total ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="inStock" label="在库数量" width="130" align="center">
          <template #default="{ row }">
            <el-tag type="success">{{ row.inStock ?? 0 }} 台</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lent" label="借出数量" width="130" align="center">
          <template #default="{ row }">
            <el-tag type="warning">{{ row.lent ?? 0 }} 台</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reserved" label="预约数量" width="130" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.reserved ?? 0 }} 台</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="minStock" label="低阈值预警" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="Number(row.inStock ?? 0) < Number(row.minStock ?? 10) ? 'danger' : 'success'">
              ≤ {{ row.minStock ?? 10 }} 台
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" icon="Edit" @click="openEditModal(row)">修改</el-button>
            <el-popconfirm
              title="确定要删除此设备类型吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button type="danger" link size="small" icon="Delete">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-15 flex-end">
        <Pagination v-model:current="page.current" v-model:size="page.size" :total="tableData.length" :disabled="loading" />
      </div>
    </el-card>

    <!-- 新增 / 编辑设备类型弹窗 -->
    <el-dialog
      v-model="modalVisible"
      :title="form.id ? '修改设备类型' : '新增设备类型'"
      width="520px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="类型名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入类型名称，如：4K超清摄像机" clearable />
        </el-form-item>
        <el-form-item label="数量" prop="total">
          <el-input-number v-model="form.total" :min="0" :max="99999" class="w-full" controls-position="right" />
        </el-form-item>
        <el-form-item label="在库数量" prop="inStock">
          <el-input-number v-model="form.inStock" :min="0" :max="99999" class="w-full" controls-position="right" />
        </el-form-item>
        <el-form-item label="借出数量" prop="lent">
          <el-input-number v-model="form.lent" :min="0" :max="99999" class="w-full" controls-position="right" />
        </el-form-item>
        <el-form-item label="预约数量" prop="reserved">
          <el-input-number v-model="form.reserved" :min="0" :max="99999" class="w-full" controls-position="right" />
        </el-form-item>
        <el-form-item label="低阈值预警" prop="minStock">
          <el-input-number v-model="form.minStock" :min="0" :max="99999" class="w-full" controls-position="right" placeholder="默认 10" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注说明（选填）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modalVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </Container>
</template>

<script setup>
import { Container, Pagination, SearchToolbar } from '@/components'
import { getDeviceTypeListApi, saveDeviceTypeApi, deleteDeviceTypeApi } from '@/apis/wms'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const saving = ref(false)
const allData = ref([])
const tableData = ref([])

const queryForm = reactive({
  keyword: ''
})

const page = reactive({
  current: 1,
  size: 10
})

const pagedData = computed(() => {
  const start = (page.current - 1) * page.size
  return tableData.value.slice(start, start + page.size)
})

const formRef = useTemplateRef('formRef')
const modalVisible = ref(false)
const form = reactive({
  id: null,
  name: '',
  total: 0,
  inStock: 0,
  lent: 0,
  reserved: 0,
  minStock: 10,
  remark: ''
})

const rules = {
  name: [{ required: true, message: '类型名称为必填项', trigger: 'blur' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getDeviceTypeListApi()
    if (res && res.data) {
      allData.value = res.data.list
      applyFilter()
    }
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  const keyword = queryForm.keyword.trim()
  tableData.value = keyword
    ? allData.value.filter(item => item.name && item.name.includes(keyword))
    : allData.value
  page.current = 1
}

const handleSearch = () => {
  applyFilter()
}

const resetQuery = () => {
  queryForm.keyword = ''
  applyFilter()
}

const openAddTypeModal = () => {
  form.id = null
  form.name = ''
  form.total = 0
  form.inStock = 0
  form.lent = 0
  form.reserved = 0
  form.minStock = 10
  form.remark = ''
  modalVisible.value = true
}

const openEditModal = (row) => {
  form.id = row.id
  form.name = row.name || ''
  form.total = Number(row.total) || 0
  form.inStock = Number(row.inStock) || 0
  form.lent = Number(row.lent) || 0
  form.reserved = Number(row.reserved) || 0
  form.minStock = row.minStock !== undefined && row.minStock !== null ? Number(row.minStock) : 10
  form.remark = row.remark || ''
  modalVisible.value = true
}

const submitForm = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    saving.value = true
    try {
      const res = await saveDeviceTypeApi(form)
      if (res && res.code === 0) {
        ElMessage.success(form.id ? '修改成功' : '新增成功')
        modalVisible.value = false
        fetchData()
      }
    } finally {
      saving.value = false
    }
  })
}

const handleDelete = async (row) => {
  try {
    const res = await deleteDeviceTypeApi(row.id)
    if (res && res.code === 0) {
      ElMessage.success('删除成功')
      fetchData()
    }
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.w-full {
  width: 100%;
}
</style>
