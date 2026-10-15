<template>
  <div class="search-toolbar">
    <div
      ref="formWrapRef"
      class="search-toolbar__form"
      :class="{ 'is-collapsed': canCollapse && collapsed }"
    >
      <el-form :model="model" inline @submit.prevent>
        <slot />
      </el-form>
    </div>

    <div class="search-toolbar__actions">
      <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
      <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      <slot name="actions" />
      <el-button
        v-if="canCollapse"
        class="search-toolbar__toggle"
        link
        type="primary"
        :icon="collapsed ? ArrowDown : ArrowUp"
        @click="collapsed = !collapsed"
      >
        {{ collapsed ? '展开' : '收起' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Search, Refresh, ArrowDown, ArrowUp } from '@element-plus/icons-vue'

const props = defineProps({
  // 查询表单对象（v-model 绑定的 queryForm）
  model: {
    type: Object,
    default: () => ({})
  },
  // 超过一行时默认是否折叠（仅当内容真正溢出一行才会折叠）
  collapsible: {
    type: Boolean,
    default: true
  }
})

const emits = defineEmits(['search', 'reset'])

const formWrapRef = ref(null)
const canCollapse = ref(false)
const collapsed = ref(false)

// 单行高度阈值：超过该高度说明搜索条件已换行（>1 行）
const ROW_HEIGHT = 60
// 折叠时仅展示第一行的高度
const COLLAPSED_HEIGHT = 52

const measure = () => {
  const el = formWrapRef.value
  if (!el) return
  // scrollHeight 始终为完整内容高度（不受 max-height 裁剪影响）
  const overflow = el.scrollHeight > ROW_HEIGHT
  canCollapse.value = props.collapsible && overflow
  if (canCollapse.value) {
    collapsed.value = true
  }
}

let observer = null
onMounted(async () => {
  await nextTick()
  measure()
  if (typeof ResizeObserver !== 'undefined' && formWrapRef.value) {
    observer = new ResizeObserver(() => measure())
    observer.observe(formWrapRef.value)
  }
})
onBeforeUnmount(() => {
  if (observer && formWrapRef.value) observer.unobserve(formWrapRef.value)
  observer = null
})

const handleSearch = () => emits('search')
const handleReset = () => emits('reset')
</script>

<style scoped>
.search-toolbar {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 15px;
}
.search-toolbar__form {
  flex: 1 1 auto;
  min-width: 0;
  transition: max-height 0.2s ease;
}
.search-toolbar__form.is-collapsed {
  max-height: 52px;
  overflow: hidden;
}
.search-toolbar__actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
/* 统一按钮样式：宽度随文字自适应，文字居中 */
.search-toolbar .el-button {
  width: auto;
  text-align: center;
  justify-content: center;
}
</style>
