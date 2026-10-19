import { PERMISSION_TYPE_ENUM } from '@/common/enums'

/**
 * 库管系统完整菜单与路由权限配置
 * 覆盖：
 * 1. 概览与预警大屏 (统计看板、逾期未领/未还催办)
 * 2. 设备台账管理 (设备列表、手动录入/Excel导入、二维码生成、设备类型管理、上网卡管理)
 * 3. 预约与出库流程 (预约申请、库存核对、分支调度、扫码核对、出库单生成、签字领取)
 * 4. 归还与入库流程 (正常归还、分批归还、入库单生成、出库单签字入库)
 * 5. 异常处置与终身码闭环 (配件丢失/主体丢失、配件损坏/主体损坏、领导签字、赔偿/补购/自修、终身码更新)
 * 6. 系统与权限划分 (用户管理、角色权限隔离)
 */

export default [
  // 1. 库管概览与监控大屏
  {
    label: '数据大屏',
    value: 1001,
    icon: 'chart',
    permission: 'wms:dashboard',
    keepalive: true,
    tab: true,
    multiple: false,
    show: true,
    type: PERMISSION_TYPE_ENUM.MENU,
    route: {
      path: '/wms/dashboard',
      name: 'wms-dashboard',
      component: '/wms/dashboard/index'
    }
  },

  // 2. 资产管理 (二级菜单：设备类型、设备台账)
  {
    label: '资产管理',
    value: 1005,
    icon: 'app',
    permission: 'wms:asset',
    keepalive: true,
    tab: true,
    multiple: false,
    show: true,
    type: PERMISSION_TYPE_ENUM.CATALOG,
    children: [
      {
        label: '设备类型',
        value: 1006,
        icon: 'menu',
        permission: 'wms:device:type',
        keepalive: true,
        tab: true,
        multiple: false,
        show: true,
        type: PERMISSION_TYPE_ENUM.MENU,
        route: {
          path: '/wms/device-types',
          name: 'wms-device-types',
          component: '/wms/device-types/index'
        }
      },
      {
        label: '设备台账',
        value: 1007,
        icon: 'list',
        permission: 'wms:device:list',
        keepalive: true,
        tab: true,
        multiple: false,
        show: true,
        type: PERMISSION_TYPE_ENUM.MENU,
        route: {
          path: '/wms/device-list',
          name: 'wms-device-list',
          component: '/wms/device-list/index'
        }
      }
    ]
  },

  // 2.5 统计台账（一级菜单，与资产管理同级；下设 5 个二级统计页面）
  {
    label: '统计台账',
    value: 1009,
    icon: 'chart',
    permission: 'wms:asset:statistics',
    keepalive: true,
    tab: true,
    multiple: false,
    show: true,
    type: PERMISSION_TYPE_ENUM.CATALOG,
    children: [
      {
        label: '设备状态统计台账',
        value: 10091,
        icon: 'menu',
        permission: 'wms:asset:statistics:status',
        keepalive: true,
        tab: true,
        multiple: false,
        show: true,
        type: PERMISSION_TYPE_ENUM.MENU,
        route: { path: '/wms/statistics/status', name: 'wms-statistics-status', component: '/wms/statistics/status/index' }
      },
      {
        label: '出入库趋势统计',
        value: 10092,
        icon: 'menu',
        permission: 'wms:asset:statistics:trend',
        keepalive: true,
        tab: true,
        multiple: false,
        show: true,
        type: PERMISSION_TYPE_ENUM.MENU,
        route: { path: '/wms/statistics/trend', name: 'wms-statistics-trend', component: '/wms/statistics/trend/index' }
      },
      {
        label: '设备库存统计',
        value: 10093,
        icon: 'menu',
        permission: 'wms:asset:statistics:stock',
        keepalive: true,
        tab: true,
        multiple: false,
        show: true,
        type: PERMISSION_TYPE_ENUM.MENU,
        route: { path: '/wms/statistics/stock', name: 'wms-statistics-stock', component: '/wms/statistics/stock/index' }
      },
      {
        label: '低库存设备台账',
        value: 10094,
        icon: 'menu',
        permission: 'wms:asset:statistics:low',
        keepalive: true,
        tab: true,
        multiple: false,
        show: true,
        type: PERMISSION_TYPE_ENUM.MENU,
        route: { path: '/wms/statistics/low', name: 'wms-statistics-low', component: '/wms/statistics/low/index' }
      },
      {
        label: '逾期设备台账',
        value: 10095,
        icon: 'time',
        permission: 'wms:asset:statistics:overdue',
        keepalive: true,
        tab: true,
        multiple: false,
        show: true,
        type: PERMISSION_TYPE_ENUM.MENU,
        route: { path: '/wms/statistics/overdue', name: 'wms-statistics-overdue', component: '/wms/overdue/index' }
      }
    ]
  },

  // 3. 预约申请与出库管理
  {
    label: '出库管理',
    value: 1010,
    icon: 'export',
    permission: 'wms:outbound',
    keepalive: true,
    tab: true,
    multiple: false,
    show: true,
    type: PERMISSION_TYPE_ENUM.CATALOG,
    children: [
      {
        label: '借用预约申请',
        value: 1011,
        icon: 'document',
        permission: 'wms:apply:list',
        keepalive: true,
        tab: true,
        multiple: false,
        show: true,
        type: PERMISSION_TYPE_ENUM.MENU,
        route: {
          path: '/wms/apply',
          name: 'wms-apply',
          component: '/wms/apply/index'
        }
      },
      {
        label: '库管核对与出库',
        value: 1012,
        icon: 'check',
        permission: 'wms:outbound:check',
        keepalive: true,
        tab: true,
        multiple: false,
        show: true,
        type: PERMISSION_TYPE_ENUM.MENU,
        route: {
          path: '/wms/outbound-check',
          name: 'wms-outbound-check',
          component: '/wms/outbound-check/index'
        }
      },
      {
        label: '出库单据中心',
        value: 1013,
        icon: 'file',
        permission: 'wms:outbound:bill',
        keepalive: true,
        tab: true,
        multiple: false,
        show: true,
        type: PERMISSION_TYPE_ENUM.MENU,
        route: {
          path: '/wms/outbound-bills',
          name: 'wms-outbound-bills',
          component: '/wms/outbound-bills/index'
        }
      }
    ]
  },

  // 3. 设备归还与入库管理
  {
    label: '入库管理',
    value: 1020,
    icon: 'import',
    permission: 'wms:inbound',
    keepalive: true,
    tab: true,
    multiple: false,
    show: true,
    type: PERMISSION_TYPE_ENUM.CATALOG,
    children: [
      {
        label: '设备归还与检查',
        value: 1021,
        icon: 'return',
        permission: 'wms:return:check',
        keepalive: true,
        tab: true,
        multiple: false,
        show: true,
        type: PERMISSION_TYPE_ENUM.MENU,
        route: {
          path: '/wms/return-check',
          name: 'wms-return-check',
          component: '/wms/return-check/index'
        }
      },
      {
        label: '入库单据中心',
        value: 1022,
        icon: 'file-text',
        permission: 'wms:inbound:bill',
        keepalive: true,
        tab: true,
        multiple: false,
        show: true,
        type: PERMISSION_TYPE_ENUM.MENU,
        route: {
          path: '/wms/inbound-bills',
          name: 'wms-inbound-bills',
          component: '/wms/inbound-bills/index'
        }
      }
    ]
  },

  // 4. 异常处置与终身码追踪
  {
    label: '异常处置闭环',
    value: 1030,
    icon: 'warn',
    permission: 'wms:anomaly',
    keepalive: true,
    tab: true,
    multiple: false,
    show: true,
    type: PERMISSION_TYPE_ENUM.MENU,
    route: {
      path: '/wms/anomaly',
      name: 'wms-anomaly',
      component: '/wms/anomaly/index'
    }
  },

  // 5. 上网卡单独管理
  {
    label: '上网卡单独管理',
    value: 1043,
    icon: 'card',
    permission: 'wms:device:sim',
    keepalive: true,
    tab: true,
    multiple: false,
    show: true,
    type: PERMISSION_TYPE_ENUM.MENU,
    route: {
      path: '/wms/sim-cards',
      name: 'wms-sim-cards',
      component: '/wms/sim-cards/index'
    }
  },

  // 6. 逾期台账
  {
    label: '逾期台账',
    value: 1050,
    icon: 'time',
    permission: 'wms:overdue',
    keepalive: true,
    tab: true,
    multiple: false,
    show: true,
    type: PERMISSION_TYPE_ENUM.MENU,
    route: {
      path: '/wms/overdue',
      name: 'wms-overdue',
      component: '/wms/overdue/index'
    }
  },

  // 7. 用户权限划分
  {
    label: '用户与权限划分',
    value: 1060,
    icon: 'user',
    permission: 'wms:permission',
    keepalive: true,
    tab: true,
    multiple: false,
    show: true,
    type: PERMISSION_TYPE_ENUM.MENU,
    route: {
      path: '/wms/users-roles',
      name: 'wms-users-roles',
      component: '/wms/users-roles/index'
    }
  }
]
