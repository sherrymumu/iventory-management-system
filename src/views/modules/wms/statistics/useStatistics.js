import { ref, computed } from 'vue'
import {
  getDeviceListApi,
  getDeviceTypeListApi,
  getApplyOrderListApi,
  getOutboundListApi,
  getInboundListApi,
  getOverdueListApi
} from '@/apis/wms'

/**
 * 统计台账共享数据层：拉取设备 / 类型 / 预约单 / 出库单 / 入库单 / 逾期单，
 * 并派生出各类台账所需的统计结果。各二级页面按需取用。
 */
export function useStatistics() {
  const loading = ref(false)
  const devices = ref([])
  const types = ref([])
  const orders = ref([])
  const outbounds = ref([])
  const inbounds = ref([])
  const overdues = ref([])

  const statusList = ['在库', '借出', '已预约', '损坏', '丢失']
  const STATUS_DESC = {
    在库: '设备在库房中，可正常预约借用',
    借出: '设备已被借用出库，尚未归还',
    已预约: '设备已被预定锁定，等待出库领取',
    损坏: '设备损坏，正在异常处置闭环中',
    丢失: '设备丢失，已核销或赔偿处理'
  }

  // 统计时间段（默认当月至今）
  const now = new Date()
  const fmtDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const dateRange = ref([fmtDate(new Date(now.getFullYear(), now.getMonth(), 1)), fmtDate(now)])

  const dateInRange = (dateStr) => {
    if (!dateStr) return false
    const d = String(dateStr).slice(0, 10)
    return d >= dateRange.value[0] && d <= dateRange.value[1]
  }

  // 叶子类型（无子节点的类型，设备 typeId 直接引用）
  const leafTypes = computed(() => {
    const list = types.value
    return list.filter(t => !list.some(x => x.pid === t.id))
  })

  // SN -> 预约单映射
  const snOrderMap = computed(() => {
    const map = {}
    orders.value.forEach(o => {
      ;(o.items || []).forEach(it => {
        ;(it.lockedSnList || []).forEach(sn => { map[sn] = o })
      })
    })
    return map
  })

  /* ========== 1. 设备状态统计台账 ========== */
  const statusSummary = computed(() => {
    const total = devices.value.length || 1
    return statusList.map(s => {
      const count = devices.value.filter(d => d.status === s).length
      return {
        status: s,
        count,
        percent: `${((count / total) * 100).toFixed(1)}%`,
        desc: STATUS_DESC[s]
      }
    })
  })

  const typeStatusMatrix = computed(() => {
    return leafTypes.value.map(t => {
      const devs = devices.value.filter(d => d.typeId === t.id)
      const row = { name: t.name, total: devs.length }
      statusList.forEach(s => { row[s] = devs.filter(d => d.status === s).length })
      return row
    })
  })

  // 各设备类型状态分布（大类 -> 子类 树形）
  const typeStatusTree = computed(() => {
    const list = types.value
    const childMap = {}
    list.forEach(t => { if (t.pid) (childMap[t.pid] ||= []).push(t) })

    const descendantLeafIds = (id) => {
      const kids = childMap[id] || []
      if (!kids.length) return [id]
      return kids.flatMap(k => descendantLeafIds(k.id))
    }

    const buildNode = (t) => {
      const leafIds = descendantLeafIds(t.id)
      const devs = devices.value.filter(d => leafIds.includes(d.typeId))
      const node = { id: t.id, name: t.name, total: devs.length }
      statusList.forEach(s => { node[s] = devs.filter(d => d.status === s).length })
      const kids = childMap[t.id] || []
      if (kids.length) node.children = kids.map(buildNode)
      return node
    }

    return list.filter(t => !t.pid).map(buildNode)
  })

  /* ========== 2. 出入库趋势统计 ========== */
  const trendStats = computed(() => {
    // 实际出库
    const outMap = {}
    const outSnSet = new Set()
    outbounds.value.forEach(o => {
      if (!dateInRange(o.outTime)) return
      ;(o.devices || []).forEach(d => {
        outMap[d.name] = (outMap[d.name] || 0) + 1
        outSnSet.add(d.sn)
      })
    })
    // 入库归还
    const inMap = {}
    inbounds.value.forEach(i => {
      if (!dateInRange(i.inTime)) return
      ;(i.devices || []).forEach(d => {
        inMap[d.name] = (inMap[d.name] || 0) + 1
      })
    })
    // 预定设备（预定时间与借用时间重合只统计一次）
    const reserveMap = {}
    orders.value.forEach(o => {
      if (!dateInRange(o.planBorrowTime)) return
      if (o.status === '已出库') return
      ;(o.items || []).forEach(it => {
        const overlap = (it.lockedSnList || []).filter(sn => outSnSet.has(sn)).length
        const effective = Math.max((it.count || 0) - overlap, 0)
        if (effective > 0) reserveMap[it.typeName] = (reserveMap[it.typeName] || 0) + effective
      })
    })
    return leafTypes.value.map(t => {
      const out = outMap[t.name] || 0
      const reserve = reserveMap[t.name] || 0
      const inbound = inMap[t.name] || 0
      return { name: t.name, out, reserve, totalOut: out + reserve, inbound, trend: out + reserve - inbound }
    })
  })

  /* ========== 3. 设备库存统计 ========== */
  const stockStats = computed(() => {
    return leafTypes.value.map(t => {
      const typeDevices = devices.value.filter(d => d.typeId === t.id)
      const borrowed = typeDevices.filter(d => d.status === '借出')
      const returnable = borrowed.filter(d => {
        const o = snOrderMap.value[d.sn]
        return o && dateInRange(o.planReturnTime)
      })
      const inRangeOrders = orders.value.filter(o =>
        dateInRange(o.planBorrowTime) && (o.items || []).some(it => it.typeId === t.id)
      )
      const reserve = inRangeOrders.reduce((acc, o) => {
        return acc + (o.items || []).filter(it => it.typeId === t.id).reduce((a, it) => a + (it.count || 0), 0)
      }, 0)
      const uniq = arr => [...new Set(arr.filter(Boolean))].join('、') || '—'
      return {
        name: t.name,
        inStock: typeDevices.filter(d => d.status === '在库').length,
        returnable: returnable.length,
        reserve,
        borrowers: uniq(borrowed.map(d => d.borrower)),
        borrowDepts: uniq(borrowed.map(d => d.dept)),
        reservers: uniq(inRangeOrders.map(o => o.borrower)),
        reserveDepts: uniq(inRangeOrders.map(o => o.dept)),
        reserveActivities: uniq(inRangeOrders.map(o => o.activityName))
      }
    })
  })

  /* ========== 4. 低库存设备台账 ========== */
  const lowStockStats = computed(() => {
    return leafTypes.value
      .map(t => {
        const typeDevices = devices.value.filter(d => d.typeId === t.id)
        const inStock = typeDevices.filter(d => d.status === '在库').length
        const minStock = Number(t.minStock ?? 10)
        const borrowed = typeDevices.filter(d => d.status === '借出')
        const times = [...new Set(borrowed.map(d => snOrderMap.value[d.sn]?.planBorrowTime).filter(Boolean))]
        const uniq = arr => [...new Set(arr.filter(Boolean))].join('、') || '—'
        return {
          id: t.id,
          name: t.name,
          inStock,
          minStock,
          gap: Math.max(minStock - inStock, 0),
          borrowCount: borrowed.length,
          borrowers: uniq(borrowed.map(d => d.borrower)),
          borrowDepts: uniq(borrowed.map(d => d.dept)),
          borrowTimes: times.join('、') || '—'
        }
      })
      .filter(row => row.inStock < row.minStock)
  })

  /* ========== 5. 逾期设备台账 ========== */
  const overdueNotTaken = computed(() => overdues.value.filter(i => i.type === '逾期未领').length)
  const overdueNotReturned = computed(() => overdues.value.filter(i => i.type === '逾期未归还').length)

  const loadData = async () => {
    loading.value = true
    try {
      const [dRes, tRes, oRes, outRes, inRes, ovRes] = await Promise.all([
        getDeviceListApi(),
        getDeviceTypeListApi(),
        getApplyOrderListApi(),
        getOutboundListApi(),
        getInboundListApi(),
        getOverdueListApi()
      ])
      devices.value = dRes?.data?.list || []
      types.value = tRes?.data?.list || []
      orders.value = oRes?.data?.list || []
      outbounds.value = outRes?.data?.list || []
      inbounds.value = inRes?.data?.list || []
      overdues.value = ovRes?.data?.list || []
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    devices,
    types,
    orders,
    outbounds,
    inbounds,
    overdues,
    statusList,
    dateRange,
    dateInRange,
    leafTypes,
    snOrderMap,
    statusSummary,
    typeStatusMatrix,
    typeStatusTree,
    trendStats,
    stockStats,
    lowStockStats,
    overdueNotTaken,
    overdueNotReturned,
    loadData
  }
}
