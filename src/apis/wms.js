/**
 * 库管系统 API 模块
 * 规范化封装前端调用逻辑，当前接入前端本地 Mock Store 保证离线演示，
 * 同时预留统一的 axios 请求方法和真实后端 API 路径，对接时切换开关或替换请求即可。
 */

import { WmsStore } from '@/common/wmsMockData'

// 后端联调开关：设置为 true 时走真实后端接口（通过 axios）
export const USE_REAL_API = false

// 模拟异步请求延迟
const mockDelay = (ms = 120) => new Promise(resolve => setTimeout(resolve, ms))

/* ================= 1. 设备类型与台账 API ================= */
export const getDeviceTypeListApi = async (params = {}) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：GET /api/wms/device-type/list
    // return http.get('/api/wms/device-type/list', { params })
  }
  await mockDelay()
  let list = WmsStore.getDeviceTypes()
  if (params.name) {
    list = list.filter(item => item.name.includes(params.name))
  }
  if (params.category) {
    list = list.filter(item => item.category === params.category)
  }
  return { code: 0, message: 'success', data: { list, total: list.length } }
}

export const saveDeviceTypeApi = async (data) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：POST /api/wms/device-type/save
    // return http.post('/api/wms/device-type/save', data)
  }
  await mockDelay()
  const list = WmsStore.getDeviceTypes()
  const payload = {
    ...data,
    total: Number(data.total) || 0,
    inStock: Number(data.inStock) || 0,
    lent: Number(data.lent) || 0,
    reserved: Number(data.reserved) || 0,
    minStock: data.minStock !== undefined && data.minStock !== null && data.minStock !== '' ? Number(data.minStock) : 10,
  }
  if (payload.id) {
    const idx = list.findIndex(i => i.id === payload.id)
    if (idx !== -1) list[idx] = { ...list[idx], ...payload }
  } else {
    payload.id = Date.now()
    list.unshift(payload)
  }
  WmsStore.saveDeviceTypes(list)
  return { code: 0, message: '保存成功', data: payload }
}

export const deleteDeviceTypeApi = async (id) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：DELETE /api/wms/device-type/delete
    // return http.delete(`/api/wms/device-type/delete/${id}`)
  }
  await mockDelay()
  const list = WmsStore.getDeviceTypes()
  const nextList = list.filter(item => item.id !== id)
  WmsStore.saveDeviceTypes(nextList)
  return { code: 0, message: '删除成功' }
}

export const getDeviceListApi = async (params = {}) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：GET /api/wms/device/list
    // return http.get('/api/wms/device/list', { params })
  }
  await mockDelay()
  let list = WmsStore.getDevices()
  if (params.sn) {
    const kw = params.sn.toLowerCase()
    list = list.filter(i => i.sn && i.sn.toLowerCase().includes(kw))
  }
  if (params.name) {
    const kw = params.name.toLowerCase()
    list = list.filter(i => i.name && i.name.toLowerCase().includes(kw))
  }
  if (params.typeId) {
    list = list.filter(i => i.typeId === params.typeId)
  }
  if (params.location) {
    const kw = params.location.toLowerCase()
    list = list.filter(i => i.location && i.location.toLowerCase().includes(kw))
  }
  if (params.brand) {
    list = list.filter(i => i.brand === params.brand)
  }
  if (params.model) {
    const kw = params.model.toLowerCase()
    list = list.filter(i => i.model && i.model.toLowerCase().includes(kw))
  }
  if (params.status) {
    list = list.filter(i => i.status === params.status)
  }
  return { code: 0, message: 'success', data: { list, total: list.length } }
}

export const saveDeviceApi = async (data) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：POST /api/wms/device/save
    // return http.post('/api/wms/device/save', data)
  }
  await mockDelay()
  const list = WmsStore.getDevices()
  if (data.id) {
    const idx = list.findIndex(i => i.id === data.id)
    if (idx !== -1) list[idx] = { ...list[idx], ...data }
  } else {
    data.id = Date.now()
    data.status = data.status || '在库'
    data.createTime = new Date().toISOString().split('T')[0]
    list.unshift(data)
  }
  WmsStore.saveDevices(list)
  return { code: 0, message: '设备保存成功', data }
}

export const importDevicesBatchApi = async (deviceList) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：POST /api/wms/device/import-excel
    // return http.post('/api/wms/device/import-excel', { list: deviceList })
  }
  await mockDelay(200)
  const current = WmsStore.getDevices()
  const merged = [...deviceList, ...current]
  WmsStore.saveDevices(merged)
  return { code: 0, message: `成功导入 ${deviceList.length} 台设备`, data: { count: deviceList.length } }
}

/* ================= 2. 预约与出库流程 API ================= */
export const getApplyOrderListApi = async (params = {}) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：GET /api/wms/apply-order/list
    // return http.get('/api/wms/apply-order/list', { params })
  }
  await mockDelay()
  let list = WmsStore.getOrders()
  if (params.status) list = list.filter(i => i.status === params.status)
  if (params.source) list = list.filter(i => i.source === params.source)
  if (params.keyword) {
    const kw = params.keyword
    list = list.filter(i => i.applyNo.includes(kw) || i.activityName.includes(kw) || i.borrower.includes(kw))
  }
  return { code: 0, message: 'success', data: { list, total: list.length } }
}

export const createApplyOrderApi = async (orderData) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：POST /api/wms/apply-order/create
    // return http.post('/api/wms/apply-order/create', orderData)
  }
  await mockDelay()
  const list = WmsStore.getOrders()
  const newOrder = {
    ...orderData,
    id: `APPLY-${Date.now()}`,
    applyNo: `APPLY-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*900+100)}`,
    status: '待核对',
    lockStatus: true,
    applyTime: new Date().toLocaleString()
  }
  list.unshift(newOrder)
  WmsStore.saveOrders(list)
  return { code: 0, message: '借用预约单提交成功，库存已锁定', data: newOrder }
}

// 库管核对分支判断
export const checkOutboundOrderApi = async ({ orderId, passed, lackHandling, note }) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：POST /api/wms/apply-order/check
    // return http.post('/api/wms/apply-order/check', { orderId, passed, lackHandling, note })
  }
  await mockDelay()
  const list = WmsStore.getOrders()
  const order = list.find(i => i.id === orderId)
  if (!order) return { code: 1, message: '未找到预约单' }

  order.checkResult = { passed, note, checkTime: new Date().toLocaleString() }
  if (passed) {
    order.status = '核对通过'
    order.outMethod = '单次出库'
  } else {
    // 核对有误：按分支方案
    if (lackHandling === 'stockSufficientSingle') {
      order.status = '核对通过'
      order.outMethod = '单次出库'
    } else if (lackHandling === 'stockSufficientMulti') {
      order.status = '核对通过'
      order.outMethod = '多次出库'
    } else if (lackHandling === 'stockLackManualAdd') {
      order.status = '核对通过'
      order.outMethod = '单次出库(临时加设备)'
    }
  }

  // 驱动生成出库单（提前生成/准备扫码签字）
  const outbounds = WmsStore.getOutbounds()
  const outNo = `OUT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*900+100)}`
  order.outNo = outNo

  const devicesForOut = []
  order.items.forEach(it => {
    (it.lockedSnList || []).forEach(sn => {
      devicesForOut.push({
        sn,
        name: it.typeName,
        scanned: false,
        scanTime: ''
      })
    })
  })

  const newOutbound = {
    id: outNo,
    outNo,
    applyNo: order.applyNo,
    activityName: order.activityName,
    borrower: order.borrower,
    dept: order.dept,
    contact: order.contact,
    outMethod: order.outMethod,
    autoGenerated: true,
    createTime: new Date().toLocaleString(),
    devices: devicesForOut,
    operator: '库管管理员',
    signer: '',
    status: '待扫码核对'
  }
  outbounds.unshift(newOutbound)
  WmsStore.saveOutbounds(outbounds)
  WmsStore.saveOrders(list)

  return { code: 0, message: '核对完成，出库单已就绪', data: { order, outbound: newOutbound } }
}

// 扫码核对设备
export const scanDeviceOutboundApi = async ({ outNo, sn }) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：POST /api/wms/outbound/scan-device
    // return http.post('/api/wms/outbound/scan-device', { outNo, sn })
  }
  await mockDelay()
  const outbounds = WmsStore.getOutbounds()
  const out = outbounds.find(i => i.outNo === outNo)
  if (!out) return { code: 1, message: '出库单不存在' }
  const dev = out.devices.find(d => d.sn === sn)
  if (!dev) return { code: 1, message: '该SN不在本出库单列表中' }

  dev.scanned = true
  dev.scanTime = new Date().toLocaleTimeString()
  const allScanned = out.devices.every(d => d.scanned)
  if (allScanned) {
    out.status = '待签字'
  }
  WmsStore.saveOutbounds(outbounds)
  return { code: 0, message: `设备 ${sn} 扫码核对通过`, data: { allScanned, out } }
}

// 签字领取出库
export const signAndFinishOutboundApi = async ({ outNo, signer, signatureImage }) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：POST /api/wms/outbound/sign
    // return http.post('/api/wms/outbound/sign', { outNo, signer, signatureImage })
  }
  await mockDelay()
  const outbounds = WmsStore.getOutbounds()
  const out = outbounds.find(i => i.outNo === outNo)
  if (!out) return { code: 1, message: '出库单不存在' }

  out.signer = signer
  out.signatureImage = signatureImage
  out.status = '已签字出库'
  out.outTime = new Date().toLocaleString()
  WmsStore.saveOutbounds(outbounds)

  // 更新关联设备状态为借出
  const devices = WmsStore.getDevices()
  out.devices.forEach(d => {
    const dev = devices.find(x => x.sn === d.sn)
    if (dev) {
      dev.status = '借出'
      dev.borrower = out.borrower
      dev.dept = out.dept
    }
  })
  WmsStore.saveDevices(devices)

  // 更新订单状态
  const orders = WmsStore.getOrders()
  const order = orders.find(o => o.outNo === outNo || o.applyNo === out.applyNo)
  if (order) {
    order.status = '已出库'
    WmsStore.saveOrders(orders)
  }

  return { code: 0, message: '双方核对签字成功，设备已完成出库', data: out }
}

export const getOutboundListApi = async (params = {}) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：GET /api/wms/outbound/list
    // return http.get('/api/wms/outbound/list', { params })
  }
  await mockDelay()
  let list = WmsStore.getOutbounds()
  if (params.status) list = list.filter(i => i.status === params.status)
  if (params.keyword) {
    const kw = params.keyword
    list = list.filter(i => i.outNo.includes(kw) || i.activityName.includes(kw) || i.borrower.includes(kw))
  }
  return { code: 0, message: 'success', data: { list, total: list.length } }
}

/* ================= 3. 归还入库流程 API ================= */
export const getInboundListApi = async (params = {}) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：GET /api/wms/inbound/list
    // return http.get('/api/wms/inbound/list', { params })
  }
  await mockDelay()
  let list = WmsStore.getInbounds()
  return { code: 0, message: 'success', data: { list, total: list.length } }
}

// 正常归还入库（全部归还 / 分批归还）
export const returnNormalDevicesApi = async ({ outNo, returnType, devices, signer, remark }) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：POST /api/wms/inbound/return-normal
    // return http.post('/api/wms/inbound/return-normal', { outNo, returnType, devices, signer, remark })
  }
  await mockDelay()
  const inbounds = WmsStore.getInbounds()
  const inNo = `IN-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*900+100)}`
  const newInbound = {
    id: inNo,
    inNo,
    outNo,
    returnType, // 全部归还, 分批归还
    deviceCondition: '正常',
    devices: devices.map(d => ({ ...d, status: '正常' })),
    operator: '库管管理员',
    signer: signer || '归还人签字',
    status: '已入库',
    inTime: new Date().toLocaleString(),
    remark: remark || (returnType === '全部归还' ? '设备全数检查完好，签字单次入库' : '部分设备先行完好归还，多次入库')
  }
  inbounds.unshift(newInbound)
  WmsStore.saveInbounds(inbounds)

  // 更新设备台账状态为在库
  const allDevices = WmsStore.getDevices()
  devices.forEach(d => {
    const dev = allDevices.find(x => x.sn === d.sn)
    if (dev) {
      dev.status = '在库'
      dev.borrower = ''
      dev.dept = ''
    }
  })
  WmsStore.saveDevices(allDevices)

  return { code: 0, message: '入库单生成成功，出库单已签字入库完结', data: newInbound }
}

/* ================= 4. 异常处置与终身码 API ================= */
export const getAnomalyListApi = async (params = {}) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：GET /api/wms/anomaly/list
    // return http.get('/api/wms/anomaly/list', { params })
  }
  await mockDelay()
  let list = WmsStore.getAnomalies()
  if (params.category) list = list.filter(i => i.category === params.category)
  if (params.currentStep) list = list.filter(i => i.currentStep === params.currentStep)
  return { code: 0, message: 'success', data: { list, total: list.length } }
}

// 发起异常登记
export const createAnomalyRecordApi = async (data) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：POST /api/wms/anomaly/create
    // return http.post('/api/wms/anomaly/create', data)
  }
  await mockDelay()
  const list = WmsStore.getAnomalies()
  const anomalyNo = `ANO-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*900+100)}`
  const record = {
    ...data,
    id: anomalyNo,
    anomalyNo,
    leaderSignStatus: data.subCategory.includes('配件') ? '免领导签字(配件)' : '待领导签字',
    currentStep: data.subCategory.includes('配件') ? '处置中' : '待领导签字',
    createTime: new Date().toLocaleString()
  }
  list.unshift(record)
  WmsStore.saveAnomalies(list)

  // 同步台账设备状态为丢失或损坏
  const devices = WmsStore.getDevices()
  const dev = devices.find(x => x.sn === data.deviceSn)
  if (dev) {
    dev.status = data.category // '丢失' 或 '损坏'
    WmsStore.saveDevices(devices)
  }

  return { code: 0, message: '异常登记成功，已进入异常处置闭环', data: record }
}

// 领导审核签字
export const signAnomalyLeaderApi = async ({ anomalyNo, leaderName, note }) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：POST /api/wms/anomaly/leader-sign
    // return http.post('/api/wms/anomaly/leader-sign', { anomalyNo, leaderName, note })
  }
  await mockDelay()
  const list = WmsStore.getAnomalies()
  const item = list.find(i => i.anomalyNo === anomalyNo)
  if (!item) return { code: 1, message: '工单不存在' }

  item.leaderSignStatus = '已签字'
  item.leaderSignName = leaderName || '部门分管领导'
  item.leaderSignTime = new Date().toLocaleString()
  item.currentStep = '处置中'
  WmsStore.saveAnomalies(list)
  return { code: 0, message: '领导签字核实成功', data: item }
}

// 确定处置方案并更新终身码/入库
export const resolveAnomalyActionApi = async ({ anomalyNo, solution, newLifeCode, compensationAmount }) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：POST /api/wms/anomaly/resolve
    // return http.post('/api/wms/anomaly/resolve', { anomalyNo, solution, newLifeCode, compensationAmount })
  }
  await mockDelay()
  const list = WmsStore.getAnomalies()
  const item = list.find(i => i.anomalyNo === anomalyNo)
  if (!item) return { code: 1, message: '工单不存在' }

  item.handleSolution = solution
  item.newLifeCode = newLifeCode || ''
  item.compensationAmount = compensationAmount || 0

  const devices = WmsStore.getDevices()
  const dev = devices.find(x => x.sn === item.deviceSn)

  if (solution === '不赔偿') {
    // 主体丢失 - 不赔偿：修改设备丢失状态，结束（不入库）
    item.currentStep = '结束(不入库)'
    if (dev) {
      dev.status = '丢失'
      dev.remark = '主体丢失认定免赔，已核销出库不入库'
    }
  } else {
    // 配件或主体补购、赔偿、自行维修等：更新设备终身码 -> 签字入库
    item.currentStep = '已入库完成'
    if (dev) {
      dev.status = '在库'
      dev.borrower = ''
      dev.dept = ''
      if (newLifeCode) {
        dev.lifeCode = newLifeCode
      }
    }
  }

  WmsStore.saveDevices(devices)
  WmsStore.saveAnomalies(list)
  return { code: 0, message: '处置闭环执行成功', data: item }
}

/* ================= 5. 逾期管理与催办 API ================= */
export const getOverdueListApi = async () => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：GET /api/wms/overdue/list
    // return http.get('/api/wms/overdue/list')
  }
  await mockDelay()
  const list = WmsStore.getOverdues()
  return { code: 0, message: 'success', data: { list } }
}

export const submitOverdueFollowApi = async (followData) => {
  if (USE_REAL_API) {
    // 【后端接口预留位置】：POST /api/wms/overdue/follow
    // return http.post('/api/wms/overdue/follow', followData)
  }
  await mockDelay()
  const list = WmsStore.getOverdues()
  const newItem = {
    ...followData,
    id: `OV-${Date.now()}`,
    followTime: new Date().toLocaleString(),
    followUser: '库管管理员'
  }
  list.unshift(newItem)
  WmsStore.saveOverdues(list)
  return { code: 0, message: '逾期催办跟进记录已保存', data: newItem }
}
