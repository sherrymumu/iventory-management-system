<template>
  <el-dropdown trigger="click" @command="onCommand">
    <el-avatar :src="avatar" class="c-pointer">
      {{ name }}
    </el-avatar>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="personal">个人中心</el-dropdown-item>
        <el-dropdown-item command="logout">退出登录</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { useAdminerStore, useRootStore, useAuthStore } from '@/stores'
import { useNamespace } from '@/hooks'

const n = useNamespace('user')

const router = useRouter()
const adminerStore = useAdminerStore()
const authStore = useAuthStore()
const { nickname, username, avatar } = storeToRefs(adminerStore)
const { logout } = useRootStore()

const name = computed(() => {
  const currentNick = authStore.currentUser?.nickname
  const currentAcc = authStore.currentUser?.username
  const name = nickname.value || username.value || currentNick || currentAcc || '管理员'
  return name ? name.substring(0, 1) : '管'
})

const onCommand = async (command) => {
  if (command === 'personal') {
    // 【后端接口预留位置】：个人中心
    ElMessage.info('个人中心（联调接口预留）')
  } else if (command === 'logout') {
    // 【后端接口预留位置】：退出登录
    try {
      await logout()
    } catch {
      authStore.clear()
    }
    router.push({ name: 'login' })
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/sass/bem.scss' as *;
@include b(user) {}
</style>
