<template>
  <Container>
    <el-card shadow="never" class="mb-15">
      <SearchToolbar :model="queryForm" @search="applyFilter" @reset="resetQuery">
        <el-form-item label="关键词">
          <el-input v-model="queryForm.keyword" placeholder="账号 / 姓名 / 部门" clearable style="width: 240px" @keyup.enter="applyFilter" />
        </el-form-item>
        <el-form-item label="系统角色">
          <el-select v-model="queryForm.role" placeholder="全部角色" clearable style="width: 150px">
            <el-option label="库管管理员" value="admin" />
            <el-option label="借用申请人" value="borrower" />
            <el-option label="分管领导" value="leader" />
          </el-select>
        </el-form-item>
        <template #actions>
          <el-button type="primary" icon="Plus" @click="openAddUser">新增系统用户</el-button>
        </template>
      </SearchToolbar>
    </el-card>

    <el-row :gutter="15">
      <!-- 角色隔离与权限配置看板 -->
      <el-col :span="10">
        <el-card shadow="never" class="mb-15">
          <template #header>
            <div class="card-head"><b>角色权限隔离矩阵</b></div>
          </template>

          <el-collapse v-model="activeCollapse" accordion>
            <el-collapse-item name="admin">
              <template #title>
                <div class="role-collapse-title">
                  <el-tag type="primary">库管管理员 (admin)</el-tag>
                  <span class="ml-10 desc">全面负责出入库、扫码核对、设备台账与库存预警</span>
                </div>
              </template>
              <div class="perm-list">
                <el-check-tag checked class="mr-5 mb-5">设备预约核对与分支调度</el-check-tag>
                <el-check-tag checked class="mr-5 mb-5">现场设备扫码核验</el-check-tag>
                <el-check-tag checked class="mr-5 mb-5">出库单/入库单创建与签字确认</el-check-tag>
                <el-check-tag checked class="mr-5 mb-5">设备台账录入与Excel盘点导入</el-check-tag>
                <el-check-tag checked class="mr-5 mb-5">设备专属二维码生成与打印</el-check-tag>
                <el-check-tag checked class="mr-5 mb-5">逾期催办联系记录录入</el-check-tag>
              </div>
            </el-collapse-item>

            <el-collapse-item name="borrower">
              <template #title>
                <div class="role-collapse-title">
                  <el-tag type="success">借用申请人 (borrower)</el-tag>
                  <span class="ml-10 desc">各节目组记者/编导/摄像，发起预约与归还</span>
                </div>
              </template>
              <div class="perm-list">
                <el-check-tag checked class="mr-5 mb-5">发起借用预约单 (自动锁库存)</el-check-tag>
                <el-check-tag checked class="mr-5 mb-5">查看个人申请单状态</el-check-tag>
                <el-check-tag checked class="mr-5 mb-5">出库手写签名领取</el-check-tag>
                <el-check-tag checked class="mr-5 mb-5">发起设备正常或分批归还申请</el-check-tag>
              </div>
            </el-collapse-item>

            <el-collapse-item name="leader">
              <template #title>
                <div class="role-collapse-title">
                  <el-tag type="warning">分管领导 (leader)</el-tag>
                  <span class="ml-10 desc">部门主任/分管台长，负责主体异常审批与处置批复</span>
                </div>
              </template>
              <div class="perm-list">
                <el-check-tag checked class="mr-5 mb-5">设备主体丢失核实与审批签字</el-check-tag>
                <el-check-tag checked class="mr-5 mb-5">设备主体损坏核实与审批签字</el-check-tag>
                <el-check-tag checked class="mr-5 mb-5">批复赔偿 / 补购 / 自修 / 免赔核销方案</el-check-tag>
                <el-check-tag checked class="mr-5 mb-5">查阅库存运行态势大屏</el-check-tag>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </el-col>

      <!-- 用户列表表格 -->
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <div class="card-head"><b>用户列表 (支持切换不同角色快速体验系统权限隔离)</b></div>
          </template>

          <el-table :data="pagedData" border stripe size="small">
            <el-table-column prop="username" label="登录账号" width="110">
              <template #default="{ row }">
                <span class="font-bold">{{ row.username }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="nickname" label="姓名" width="120" />
            <el-table-column prop="dept" label="所属部门" min-width="130" />
            <el-table-column prop="roleName" label="系统角色" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getRoleTag(row.role)">{{ row.roleName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default>
                <el-tag type="success" size="small">启用</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="快捷切换体验" width="130" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="switchRoleExperience(row)">
                  以此角色体验
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="mt-15 flex-end">
            <Pagination v-model:current="page.current" v-model:size="page.size" :total="userList.length" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </Container>
</template>

<script setup>
import { Container, Pagination, SearchToolbar } from '@/components'
import { useAuthStore } from '@/stores'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const activeCollapse = ref('admin')

const queryForm = reactive({
  keyword: '',
  role: ''
})

const page = reactive({
  current: 1,
  size: 10
})

const allUsers = ref([
  { id: 1, username: 'admin', nickname: '王建国 (库管主管)', dept: '设备保障中心', role: 'admin', roleName: '库管管理员' },
  { id: 2, username: 'borrower', nickname: '张伟 (首席记者)', dept: '新闻部', role: 'borrower', roleName: '借用申请人' },
  { id: 3, username: 'leader', nickname: '李建军 (副台长)', dept: '台领导办公室', role: 'leader', roleName: '分管领导' },
  { id: 4, username: 'borrower2', nickname: '李娜 (专题编导)', dept: '专题部', role: 'borrower', roleName: '借用申请人' },
  { id: 5, username: 'leader2', nickname: '陈总监 (影视中心主任)', dept: '影视中心', role: 'leader', roleName: '分管领导' }
])

const userList = ref([])

const pagedData = computed(() => {
  const start = (page.current - 1) * page.size
  return userList.value.slice(start, start + page.size)
})

const applyFilter = () => {
  const keyword = queryForm.keyword.trim().toLowerCase()
  const role = queryForm.role
  userList.value = allUsers.value.filter(item => {
    const matchKeyword = !keyword ||
      (item.username && item.username.toLowerCase().includes(keyword)) ||
      (item.nickname && item.nickname.toLowerCase().includes(keyword)) ||
      (item.dept && item.dept.toLowerCase().includes(keyword))
    const matchRole = !role || item.role === role
    return matchKeyword && matchRole
  })
  page.current = 1
}

const resetQuery = () => {
  queryForm.keyword = ''
  queryForm.role = ''
  applyFilter()
}

const openAddUser = () => {
  ElMessage.info('新增系统用户功能已预留后端 POST /api/user/save 接口')
}

const switchRoleExperience = (user) => {
  authStore.currentRole = user.role
  authStore.currentUser = {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    dept: user.dept,
    roles: [user.role]
  }
  ElMessage.success(`已切换为当前登录身份：【${user.roleName} - ${user.nickname}】`)
}

const getRoleTag = (role) => {
  if (role === 'admin') return 'primary'
  if (role === 'borrower') return 'success'
  if (role === 'leader') return 'warning'
  return 'info'
}

applyFilter()
</script>

<style scoped>
.role-collapse-title {
  display: flex;
  align-items: center;
}
.role-collapse-title .desc {
  font-size: 12px;
  color: #64748b;
}
.perm-list {
  padding: 10px 0;
}
</style>
