import { defineStore } from 'pinia'
import { clearJson } from '@/common/utils'
import router from '@/router/route'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    expiredAt: null,
    currentRole: 'admin',
    currentUser: {}
  }),
  actions: {
    async login(params) {
      // 【后端接口预留位置】：POST /api/auth/login
      // const res = await http.post('/api/auth/login', params)
      // this.token = res.data.token
      // this.expiredAt = res.data.expiredAt
      this.token = 'DEMO_TOKEN_' + Date.now()
      this.expiredAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
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
})