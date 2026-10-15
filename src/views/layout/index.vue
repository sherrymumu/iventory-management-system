<template>
  <div :class="n.b()">
    <Frame :mode="mode">
      <template #headbar>
        <Headbar :class="n.e('headbar')">
          <template #left>
            <MenuCollapse></MenuCollapse>
          </template>
          <Crumb class="ml-10"></Crumb>
        </Headbar>
      </template>
      <template #sidebar>
        <Sidebar :class="n.e('sidebar')">
          <template #top>
            <Brand :collapse="collapse"></Brand>
          </template>
          <Menu :data="displayMenus" :active="active" :collapse="collapse"></Menu>
        </Sidebar>
      </template>
      <Tabbar :class="n.e('tabbar')"></Tabbar>
      <View v-if="!refresh" transition="left-in-right-out"></View>
    </Frame>
    <!-- 后期联调预留组件：Websocket与Identify验证 -->
    <!-- <Websocket></Websocket> -->
    <!-- <Identify></Identify> -->
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { View } from '@/components'
import { Frame, Headbar, Sidebar, Tabbar, Brand, Crumb, Menu, MenuCollapse } from './components'
import { useMenuStore, useSystemStore } from '@/stores'
import { useNamespace } from '@/hooks'
import { constantRoutes } from '@/router/route'

const n = useNamespace('layout')

const route = useRoute()

const menuStore = useMenuStore()
const { menus, active, collapse } = storeToRefs(menuStore)
const systemStore = useSystemStore()
const { refresh } = storeToRefs(systemStore)

// 菜单数据计算：优先使用动态权限接口菜单；接口未联调时自动读取 constantRoutes 静态路由
const displayMenus = computed(() => {
  if (menus.value && menus.value.length > 0) {
    return menus.value
  }
  const rootRoute = constantRoutes.find(r => r.path === '/')
  if (rootRoute && rootRoute.children) {
    return rootRoute.children.filter(item => item.meta && item.meta.show !== false)
  }
  return []
})

watchEffect(() => {
  active.value = route.path + ''
})

const mode = ref('horizontal')
</script>

<style lang="scss" scoped>
@use '@/assets/sass/bem.scss' as *;
@include b(layout) {
  height: 100%;
  overflow: hidden;
  @include e(headbar) {
    z-index: 3;
  }
  @include e(sidebar) {
    z-index: 4;
  }
  @include e(tabbar) {
    z-index: 2;
    flex-shrink: 0;
  }

  .el-menu:not(.el-menu--collapse) {
    width: var(--sidebar-menu-width);
  }
}
</style>
