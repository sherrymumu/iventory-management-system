import { createRouter, createWebHashHistory } from 'vue-router'
import { constantRoutes } from './route'
import { beforeEachHandler, afterEachHandler } from './interceptor'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL || '/'),
  routes: constantRoutes
})

router.beforeEach((to, from, next) => beforeEachHandler(to, from, next, router))
router.afterEach((to, from, failure) => afterEachHandler(to, from, failure, router))

export default router
