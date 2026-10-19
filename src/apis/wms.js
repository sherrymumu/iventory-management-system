/**
 * 库管系统 API 模块
 *
 * 两种数据源：
 * 1. USE_REAL_API = true  -> 走真实后端 /api/wms/**（由 vite 代理到 inventory-ms:8151），
 *    后端为适配层统一返回 { code, message, data }，code === 0 表示成功。
 * 2. USE_REAL_API = false -> 走前端本地 Mock Store，用于无后端环境下的离线演示。
 *
 * 开关通过环境变量 VITE_WMS_REAL_API 控制，未配置时默认 true（对接真实后端）。
 */

import axios from 'axios'
import { ElMessage } from 'element-plus'
import { WmsStore } from '@/common/wmsMockData'

// 后端联调开关：设置为 true 时走真实后端接口（通过 axios）
export const USE_REAL_API = String(import.meta.env.VITE_WMS_REAL_API ?? 'true') === 'true'

const WMS_BASE_URL = '/api/wms'

// 库管接口走独立实例：后端使用 admin 会话 Cookie 鉴权，必须携带凭证
const http = axios.create({
  baseURL: WMS_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 30000
})

/** 拆包：把后端 { code, message, data } 还原为前端约定的返回体，失败时提示并返回 null */
const unwrap = (response) => {
  const body = response && response.data
  if (!body) {
    return null
  }
  if (body.code !== 0 && body.code !== 200) {
    ElMessage.error({ message: body.message || '服务器开小差，稍后再试~', grouping: true })
    return null
  }
  return body
}

const get = async (url, params) => unwrap(await http.get(url, { params }))
const post = async (url, data) => unwrap(await http.post(url, data))

// 模拟异步请求延迟
const mockDelay = (ms = 120) => new Promise(resolve => setTimeout(resolve, ms))

/* ================= 0. 登录态 ================= */

export const loginApi = (data) => post('/auth/login', data)
export const logoutApi = () => post('/auth/logout')
export const currentUserApi = () => get('/auth/current')

/* ================= 1. 设备类型与台账 API ================= */
export const getDeviceTypeListApi = async (params = {}) => {
  if (USE_REAL_API) {
    return get('/device-type/list', params)
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
    return post('/device-type/save', data)
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
    return post('/device-type/delete', { id })
  }
  await mockDelay()
  const list = WmsStore.getDeviceTypes()
  const nextList = list.filter(item => item.id !== id)
  WmsStore.saveDeviceTypes(nextList)
  return { code: 0, message: '删除成功' }
}

export const getDeviceListApi = async (params = {}) => {
  if (USE_REAL_API) {
    return get('/device/list', params)
  }
  await mockDelay()
  let list = WmsStore.getDevices()
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    list = list.filter(i => (i.sn && i.sn.toLowerCase().includes(kw)) || (i.name && i.name.toLowerCase().includes(kw)) || (i.cardNo && i.cardNo.toLowerCase().includes(kw)))
  }
  if (params.status) {
    list = list.filter(i => i.status === params.status)
  }
  if (params.location) {
    list = list.filter(i => i.location === params.location)
  }
  if (params.typeId) {
    list = list.filter(i => i.typeId === params.typeId)
  }
  return { code: 0, message: 'success', data: { list, total: list.length } }
}

export const saveDeviceApi = async (data) => {
  if (USE_REAL_API) {
    return post('/device/save', data)
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

export const deleteDeviceApi = async (id, extra = {}) => {
  if (USE_REAL_API) {
    return post('/device/delete', { id, ...extra })
  }
  await mockDelay()
  const list = WmsStore.getDevices()
  WmsStore.saveDevices(list.filter(i => i.id !== id))
  return { code: 0, message: '删除成功' }
}

export const importDevicesBatchApi = async (deviceList) => {
  if (USE_REAL_API) {
    return post('/device/import-excel', { list: deviceList })
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
    return get('/apply-order/list', params)
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
    return post('/apply-order/create', orderData)
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
export const checkOutboundOrderApi = async (payload) => {
  if (USE_REAL_API) {
    return post('/apply-order/check', payload)
  }
  const { orderId, passed, lackHandling, note } = payload
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
export const scanDeviceOutboundApi = async (payload) => {
  if (USE_REAL_API) {
    return post('/outbound/scan-device', payload)
  }
  const { outNo, sn } = payload
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
export const signAndFinishOutboundApi = async (payload) => {
  if (USE_REAL_API) {
    return post('/outbound/sign', payload)
  }
  const { outNo, signer, signatureImage } = payload
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
    return get('/outbound/list', params)
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
    return get('/inbound/list', params)
  }
  await mockDelay()
  let list = WmsStore.getInbounds()
  return { code: 0, message: 'success', data: { list, total: list.length } }
}

// 正常归还入库（全部归还 / 分批归还）
export const returnNormalDevicesApi = async (payload) => {
  if (USE_REAL_API) {
    return post('/inbound/return-normal', payload)
  }
  const { outNo, returnType, devices, signer, remark } = payload
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
    return get('/anomaly/list', params)
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
    return post('/anomaly/create', data)
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
export const signAnomalyLeaderApi = async (payload) => {
  if (USE_REAL_API) {
    return post('/anomaly/leader-sign', payload)
  }
  const { anomalyNo, leaderName, note } = payload
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
export const resolveAnomalyActionApi = async (payload) => {
  if (USE_REAL_API) {
    return post('/anomaly/resolve', payload)
  }
  const { anomalyNo, solution, newLifeCode, compensationAmount } = payload
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
    return get('/overdue/list')
  }
  await mockDelay()
  const list = WmsStore.getOverdues()
  return { code: 0, message: 'success', data: { list } }
}

export const submitOverdueFollowApi = async (followData) => {
  if (USE_REAL_API) {
    return post('/overdue/follow', followData)
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
