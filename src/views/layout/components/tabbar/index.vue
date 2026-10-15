<template>
  <div :class="n.b()">
    <el-tabs class="mb-1" type="card" v-model="active" @tab-click="onClick" @tab-remove="onRemove">
      <el-tab-pane v-for="tab in tabs" :key="tab.value" :label="tab.label" :name="tab.value" :closable="tabs.length > 1" />
    </el-tabs>
  </div>
</template>

<script setup>
import { useTabStore } from '@/stores'
import { useNamespace } from '@/hooks'
import { onBeforeMount, watch } from 'vue'

const n = useNamespace('tabbar')

const router = useRouter()
const route = useRoute()

const tabStore = useTabStore()
const { active, tabs } = storeToRefs(tabStore)

const onClick = ({ index }) => {
  const currentTab = tabs.value[+index]
  if (currentTab) {
    if (currentTab.name) {
      router.push({ name: currentTab.name, query: currentTab.query, params: currentTab.params })
    } else if (currentTab.path) {
      router.push(currentTab.path)
    }
  }
}

const onRemove = (value) => {
  tabStore.handleRemove([value])
}

watch(() => route.fullPath, () => {
  tabStore.handleChange(route)
}, { immediate: true })
</script>

<style lang="scss" scoped>
@use '@/assets/sass/bem.scss' as *;
$prefix: tabbar#{$element-separator};
@include b(tabbar) {
  padding: 0 10px;
  height: var(--headbar-height);
  background-color: var(--headbar-background-color);
  box-shadow: var(--el-box-shadow-light);
  display: flex;
  align-items: flex-end;

  ::v-deep(.el-tabs) {
    width: 100%;
    .el-tabs__header {
      margin: 0;
      border: none;
    }
  }
}
</style>
