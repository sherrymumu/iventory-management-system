import { defineStore } from 'pinia'
import { clearJson } from '@/common/utils'
import router from '@/router/route'
import { loginApi } from '@/apis/wms'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '',
    expiredAt: null,
    currentRole: 'admin',
    currentUser: {}
  }),
  actions: {
    async login(params) {
      const username = params.username || params.account
      const password = params.password
      const res = await loginApi({ username, password })
      if (!res || res.code !== 0) {
        return { code: res && res.code ? res.code : -1, message: (res && res.message) || '登录失败' }
      }
      const data = res.data || {}
      this.token = 'WMS_' + (data.userId || '0') + '_' + Date.now()
      this.expiredAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
      this.currentRole = username
      this.currentUser = {
        userId: data.userId,
        username: data.username || username,
        nickname: data.name || username,
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