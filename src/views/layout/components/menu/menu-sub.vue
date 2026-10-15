<template>
  <el-menu-item-group :title="data.label || (data.meta && data.meta.title)" v-if="data.type === PERMISSION_TYPE_ENUM.GROUP" :index="(data.value || data.path || data.name) + ''">
    <template #title>
      <Icon v-if="data.icon || (data.meta && data.meta.icon)" :name="data.icon || (data.meta && data.meta.icon)" class="pr-5" />
      <span>{{ data.label || (data.meta && data.meta.title) }}</span>
    </template>
    <MenuSub v-for="item in data.children" :key="item.value || item.path || item.name" :data="item" />
  </el-menu-item-group>
  <el-sub-menu v-else-if="data.children && data.children.length > 0" :index="(data.path || data.name || data.value || '') + ''">
    <template #title>
      <Icon v-if="data.icon || (data.meta && data.meta.icon)" :name="data.icon || (data.meta && data.meta.icon)" class="pr-5" />
      <span>{{ data.label || (data.meta && data.meta.title) }}</span>
    </template>
    <MenuSub v-for="item in data.children" :key="item.value || item.path || item.name" :data="item" />
  </el-sub-menu>
  <el-menu-item v-else :index="data.path || data.name || (data.route && data.route.name) || (data.value + '')" @click="onClick">
    <Icon v-if="data.icon || (data.meta && data.meta.icon)" :name="data.icon || (data.meta && data.meta.icon)" class="pr-5" />
    <template #title>
      <span>{{ (data.meta && data.meta.title) || data.label }}</span>
    </template>
  </el-menu-item>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Icon } from '@/components'
import MenuSub from './menu-sub.vue'
import { PERMISSION_TYPE_ENUM } from '@/common/enums'
import { useNamespace } from '@/hooks'

const n = useNamespace('menu-sub')

const { data } = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const onClick = () => {
  // 静态路由优先按 path 或 name 导航
  if (data.path) {
    router.push(data.path)
    return
  }
  if (data.name) {
    router.push({ name: data.name })
    return
  }
  const { type, route, url } = data
  if (type === PERMISSION_TYPE_ENUM.MENU || type === PERMISSION_TYPE_ENUM.ROUTER || type === PERMISSION_TYPE_ENUM.IFRAME) {
    if (route && route.path) {
      router.push(route.path)
    } else if (route && route.name) {
      router.push({ name: route.name })
    }
  } else if (type === PERMISSION_TYPE_ENUM.URL) {
    window.open(url)
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/sass/bem.scss' as *;
@include b(menu-sub) {}
</style>
