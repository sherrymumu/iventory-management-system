import { clearJson } from '@/common/utils'
import { loginInfoApi } from '@/apis/auth'
import { useAuthStore } from '../auth'

export const useAdminerStore = defineStore('adminer', {
  state: () => ({
    id: '10001',
    username: 'admin',
    nickname: '系统库管员',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    mobile: '13800000000',
    email: 'admin@broadcast.tv',
    sex: 1,
    sex_dict: '男',
    roles: 'admin',
    posts: '设备保障部负责人',
    dept: '技术运维保障中心',
    tenant: {
      name: '智能设备库管系统',
      logo: ''
    },
    token: '',
    expireAt: ''
  }),
  actions: {
    /**
     * 获取当前用户信息
     * @returns
     */
    async getAdminer() {
      const authStore = useAuthStore()
      if (authStore.currentUser && authStore.currentUser.username) {
        // 演示模式直接使用登录角色数据
        this.username = authStore.currentUser.username
        this.nickname = authStore.currentUser.nickname
        this.dept = authStore.currentUser.dept
        this.roles = authStore.currentRole
        this.tenant = {
          name: '智能设备库管系统',
          logo: ''
        }
        return this.$state
      }

      // 【后端接口预留位置】：对接真实后端 GET /api/auth/info
      try {
        const r = await loginInfoApi()
        if (r && r.data) {
          this.$state = r.data
        }
        return r ? r.data : null
      } catch (e) {
        return this.$state
      }
    },
    /**
     * 清除登录用户信息
     */
    clear() {
      clearJson(this.$state)
    }
  }
})

