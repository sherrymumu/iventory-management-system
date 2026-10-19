import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '@/views/layout/index.vue'

// 纯静态路由表配置
export const constantRoutes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/constants/login/index.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/',
    component: Layout,
    redirect: '/wms/dashboard',
    name: 'Root',
    meta: { title: '首页' },
    children: [
      {
        path: '/wms/dashboard',
        name: 'WmsDashboard',
        component: () => import('@/views/modules/wms/dashboard/index.vue'),
        meta: { title: '数据大屏', icon: 'data-line', show: true },
      },
      {
        path: '/wms/asset',
        name: 'WmsAsset',
        meta: { title: '资产管理', icon: 'box', show: true },
        children: [
          {
            path: '/wms/device-types',
            name: 'WmsDeviceTypes',
            component: () => import('@/views/modules/wms/device-types/index.vue'),
            meta: { title: '设备类型', icon: 'collection', show: true },
          },
          {
            path: '/wms/device-list',
            name: 'WmsDeviceList',
            component: () => import('@/views/modules/wms/device-list/index.vue'),
            meta: { title: '设备台账', icon: 'tickets', show: true },
          },
        ],
      },
      {
        path: '/wms/statistics',
        name: 'WmsStatistics',
        meta: { title: '统计台账', icon: 'data-analysis', show: true },
        children: [
          {
            path: '/wms/statistics/status',
            name: 'WmsStatisticsStatus',
            component: () => import('@/views/modules/wms/statistics/status/index.vue'),
            meta: { title: '设备状态统计台账', show: true },
          },
          {
            path: '/wms/statistics/trend',
            name: 'WmsStatisticsTrend',
            component: () => import('@/views/modules/wms/statistics/trend/index.vue'),
            meta: { title: '出入库趋势统计', show: true },
          },
          {
            path: '/wms/statistics/stock',
            name: 'WmsStatisticsStock',
            component: () => import('@/views/modules/wms/statistics/stock/index.vue'),
            meta: { title: '设备库存统计', show: true },
          },
          {
            path: '/wms/statistics/low',
            name: 'WmsStatisticsLow',
            component: () => import('@/views/modules/wms/statistics/low/index.vue'),
            meta: { title: '低库存设备台账', show: true },
          },
          {
            path: '/wms/statistics/overdue',
            name: 'WmsStatisticsOverdue',
            component: () => import('@/views/modules/wms/overdue/index.vue'),
            meta: { title: '逾期设备台账', show: true },
          },
        ],
      },
      // {
      //   path: '/wms/apply',
      //   name: 'WmsApply',
      //   component: () => import('@/views/modules/wms/apply/index.vue'),
      //   meta: { title: '预约申请', icon: 'document', show: true },
      // },
      // {
      //   path: '/wms/outbound-check',
      //   name: 'WmsOutboundCheck',
      //   component: () => import('@/views/modules/wms/outbound-check/index.vue'),
      //   meta: { title: '出库核对', icon: 'finished', show: true },
      // },
      // {
      //   path: '/wms/outbound-bills',
      //   name: 'WmsOutboundBills',
      //   component: () => import('@/views/modules/wms/outbound-bills/index.vue'),
      //   meta: { title: '出库单据', icon: 'files', show: true },
      // },
      // {
      //   path: '/wms/return-check',
      //   name: 'WmsReturnCheck',
      //   component: () => import('@/views/modules/wms/return-check/index.vue'),
      //   meta: { title: '归还核对', icon: 'refresh', show: true },
      // },
      // {
      //   path: '/wms/inbound-bills',
      //   name: 'WmsInboundBills',
      //   component: () => import('@/views/modules/wms/inbound-bills/index.vue'),
      //   meta: { title: '入库单据', icon: 'folder-checked', show: true },
      // },
      // {
      //   path: '/wms/anomaly',
      //   name: 'WmsAnomaly',
      //   component: () => import('@/views/modules/wms/anomaly/index.vue'),
      //   meta: { title: '异常处置', icon: 'warning', show: true },
      // },
      // {
      //   path: '/wms/sim-cards',
      //   name: 'WmsSimCards',
      //   component: () => import('@/views/modules/wms/sim-cards/index.vue'),
      //   meta: { title: '物联卡管理', icon: 'postcard', show: true },
      // },
      {
        path: '/wms/users-roles',
        name: 'WmsUsersRoles',
        component: () => import('@/views/modules/wms/users-roles/index.vue'),
        meta: { title: '人员角色', icon: 'user', show: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/constants/404/index.vue'),
    meta: { title: '404' },
  },
]

// 兼容旧架构引用的导出（后期联调动态路由时可直接接入）
export const constants = constantRoutes.filter(item => item.path !== '/')
export const layout = constantRoutes.find(item => item.path === '/') || {
  path: '/',
  component: Layout,
  children: [],
}

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
})

// 默认导出路由实例
export default router
