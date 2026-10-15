import router from '@/router'

// todo: ITab value 格式：{a}&{b}&{c}&{d}
// todo: a: 路由name b: 菜单value c: 路由query字符串 d: 路由params字符串
// todo: c、d 支持多开的时候需要
const defaultTabs = [{
  value: 'home&home&{}&{}',
  label: '首页',
  name: 'home',
  path: '/home',
  query: {}, // 路由参数
  params: {}, // 路由参数
  closable: false, // true：可以关闭
  menuValue: 'home'
}]

export const useTabStore = defineStore('tab', {
  state: () => ({
    active: '',
    tabs: []
  }),
  getters: {
    activeTab: (state) => {
      const exists = state.tabs.filter(tab => tab.value === state.active)
      return exists.length ? exists[0] : {}
    }
  },
  actions: {
    /**
     * 路由变化事件 设置当前选中、添加标签
     * @param {*} route
     */
    handleChange(route) {
      const meta = route.meta || {}
      let val = `${route.name}&${meta.value || route.name}`
      const isTab = meta.tab !== undefined ? meta.tab : true
      if (isTab && route.name) {
        if (meta.multiple) {
          // 增加 fallback 防止 query 或 params 为 undefined
          const queryStr = JSON.stringify(route.query || {})
          const paramsStr = JSON.stringify(route.params || {})
          val += `&${queryStr}&${paramsStr}`
        } else {
          val += `&{}&{}`
        }
        // 如果不存在则添加
        if (this.tabs.every(item => item.value !== val)) {
          // 自定义标题
          const title = meta.label || meta.title || route.name
          // 使用可选链 (?.) 防止 route.query 为 undefined 时报错
          const label = title + (route.query?.custom ? `-${route.query.custom}` : '')
          const tab = {
            value: val,
            menuValue: meta.value || route.name,
            label: label,
            name: route.name,
            path: route.path,
            query: route.query || {},
            params: route.params || {}
          }
          this.tabs.push(tab)
        }
      }
      this.active = val
    },

    /**
     * 删除tabs
     * @param {*} values
     */
    handleRemove(values) {
      // 过滤出不用删除的标签页
      let tabs = this.tabs.filter(item => {
        return values.indexOf(item.value) === -1
      })
      // 至少保留一个标签页
      if (tabs.length === 0) {
        tabs = [this.tabs[0]]
      }
      this.tabs = tabs
      // 若删除的包含当前页则跳转其他页
      if (tabs.every(item => item.value !== this.active)) {
        const last = tabs[tabs.length - 1]
        if (last.name) {
          router.push({ name: last.name, query: last.query, params: last.params })
        } else if (last.path) {
          router.push(last.path)
        }
      }
    },
    /**
     * 清除标签页
     */
    clear() {
      this.active = ''
      this.tabs = []
    }
  }
})
