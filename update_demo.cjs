const fs = require('fs')
const path = require('path')

const basePath = __dirname // 当前运行脚本所在的目录 (agile-admin)

// 1. 替换 main.js（注释掉动态权限入口）
const mainJsPath = path.join(basePath, 'src/main.js')
if (fs.existsSync(mainJsPath)) {
  let mainJs = fs.readFileSync(mainJsPath, 'utf8')
  mainJs = mainJs.replace(
    /import\s+['"]@\/permission(\/index\.js)?['"]/g,
    "// import '@/permission'",
  )
  fs.writeFileSync(mainJsPath, mainJs, 'utf8')
  console.log('✅ 成功更新: src/main.js (已移除动态权限拦截)')
}

// 2. 彻底替换登录页 login/index.vue
const loginPath = path.join(basePath, 'src/views/constants/login/index.vue')
const loginContent = `<template>
  <div class="login-container">
    <el-card class="w-500 login-box-card" shadow="always">
      <div class="mb-20 text-center">
        <div class="system-logo-badge">WMS</div>
        <div class="title">智能设备库管系统</div>
        <div class="sub-title">纯前端演示版本</div>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="onSubmit" size="large">
        <el-form-item prop="account">
          <el-input v-model="form.account" placeholder="请输入登录账号 (如: admin)" clearable />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" placeholder="请输入密码" show-password clearable />
        </el-form-item>

        <el-button :loading="loading" class="mt-15 w-f" type="primary" size="large" @click="onSubmit" style="width: 100%;">
          立 即 登 录
        </el-button>
      </el-form>

      <div class="quick-accounts mt-20" style="padding-top: 20px;">
        <div style="font-size: 13px; color: #666; margin-bottom: 10px;">快捷角色体验：</div>
        <el-button size="small" type="primary" plain @click="fillAccount('admin')">库管员</el-button>
        <el-button size="small" type="success" plain @click="fillAccount('borrower')">申请人</el-button>
        <el-button size="small" type="warning" plain @click="fillAccount('leader')">审批领导</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const formRef = ref(null)

const form = reactive({
  account: 'admin',
  password: '123456',
})

const rules = {
  account: [{ required: true, message: '账号不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '密码不能为空', trigger: 'blur' }],
}

const fillAccount = (acc) => {
  form.account = acc
  ElMessage.info(\`已切换至【\${acc}】演示账号\`)
}

const onSubmit = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    loading.value = true
    try {
      await authStore.login(form)
      ElMessage.success('登录成功')
      router.push({ path: '/' })
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at 10% 20%, rgb(239, 246, 255) 0%, rgb(219, 228, 255) 90%);
}
.login-box-card {
  border-radius: 12px;
}
.system-logo-badge {
  display: inline-block;
  width: 52px;
  height: 52px;
  line-height: 52px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 12px;
}
.title { font-size: 24px; font-weight: 700; color: #1f2937; }
.sub-title { font-size: 13px; color: #6b7280; margin-top: 6px; }
</style>`
if (fs.existsSync(loginPath)) {
  fs.writeFileSync(loginPath, loginContent, 'utf8')
  console.log('✅ 成功更新: src/views/constants/login/index.vue')
}

// 3. 彻底替换 auth store
const authStorePath = path.join(basePath, 'src/stores/modules/auth/index.js')
const authStoreContent = `import { defineStore } from 'pinia'
import { clearJson } from '@/common/utils'
import router from '@/router/route'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    currentRole: 'admin',
    currentUser: {}
  }),
  actions: {
    async login(params) {
      this.token = 'DEMO_TOKEN_' + Date.now()
      this.currentRole = params.account
      this.currentUser = {
        username: params.account,
        nickname: params.account === 'admin' ? '系统库管员' : '测试用户',
      }
      return { code: 0, message: '登录成功' }
    },
    async logout() {
      this.clear()
      router.push('/login')
    },
    clear() {
      clearJson(this.$state)
      this.token = ''
    }
  }
})`
if (fs.existsSync(authStorePath)) {
  fs.writeFileSync(authStorePath, authStoreContent, 'utf8')
  console.log('✅ 成功更新: src/stores/modules/auth/index.js')
}

console.log('🎉 替换完成！现在您可以直接重新运行 npm run dev 测试效果。')
