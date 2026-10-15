import NProgress from 'nprogress'
import dayjs from 'dayjs'
import { useAuthStore, usePermissionStore, useAdminerStore, useDictStore } from '@/stores'
import { getPermissionData, findFirstRoutePermission, findRoutes } from '@/permission'
import { print } from '@/common/utils'
import { constants, layout } from './route'
/**
 * 校验token是否有效
 * @returns
 */
const validateToken = () => {
  const { token, expiredAt } = useAuthStore()
  if (!token) return false
  return dayjs().isBefore(dayjs(expiredAt))
}

/**
 * 布局路由 beforeEnter 钩子
 * @param {*} to
 * @param {*} from
 * @param {*} next
 */
const handleLayoutBeforeEnter = async (to, _from, next) => {
  if (!validateToken()) {
    return next({ name: 'login', replace: true })
  }
  if (to.name === 'redirect') {
    const { permissions } = usePermissionStore()
    const menu = findFirstRoutePermission(permissions)
    if (menu) {
      const { name } = menu.route
      return next({ name: name, replace: true })
    }
  }
  await useAdminerStore().getAdminer()
  next()
}

/**
 * 注册路由
 * @param {*} routes
 * @param {*} router
 */
const handleRegisterRoute = (routes, router) => {
  layout.children.push(...routes)
  layout.beforeEnter = handleLayoutBeforeEnter
  router.addRoute(layout)
  print('Register routes', layout)
}

/**
 * 处理动态路由
 * @param {*} to
 * @param {*} _from
 * @param {*} next
 * @param {*} router
 * @returns
 */
let isRegistered = false // 是否注册过路由
const handleDynamic = async (to, _from, next, router) => {
  const { loaded } = usePermissionStore()
  if (loaded && isRegistered) return next()

  if (!loaded) {
    const r = await getPermissionData()
    if (!r) return next({ name: 'login', replace: true })
  }

  const { permissions } = usePermissionStore()
  const routes = findRoutes(permissions)

  handleRegisterRoute(routes, router)
  isRegistered = true

  next({ ...to, replace: true })
}

let isFirstVisit = true // 是否首次访问
export const beforeEachHandler = async (to, from, next, router) => {
  NProgress.start()
  document.title = `${to.meta.label || document.title}`
  // 纯静态路由模式直接放行（支持快速离线演示与静态页面跳转）
  next()

  /*
  // 【后端动态路由与字典联调预留位置】
  const { loaded, getDict } = useDictStore()
  if (!loaded) await getDict()
  await handleDynamic(to, from, next, router)
  */
}

export const afterEachHandler = (to, _from, _failure, _router) => {
  if (to.name !== 'redirect') {
    NProgress.done()
  }
}
