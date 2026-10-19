/**
 * 库管系统前端本地Mock数据源与持久化存储
 * 支持在无后端接口时纯前端流畅体验，同时预留对接真实后端API的无缝切换结构
 */

const STORAGE_KEY_PREFIX = 'WMS_DEMO_DATA_'

const getLocal = (key, defaultVal) => {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key)
    return item ? JSON.parse(item) : defaultVal
  } catch (e) {
    return defaultVal
  }
}

const setLocal = (key, val) => {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(val))
  } catch (e) {
    console.error(e)
  }
}

// 1. 设备类型定义（层级结构：大类 pid=0，子类挂到对应大类下）
export const initialDeviceTypes = [
  // 大类（parent）
  { id: 101, name: '摄像录制设备', pid: 0, total: 43, inStock: 23, lent: 16, reserved: 4, minStock: 10, remark: '摄像机与航拍设备' },
  { id: 102, name: '镜头与光学器材', pid: 0, total: 85, inStock: 44, lent: 35, reserved: 6, minStock: 10, remark: '镜头、监视器、灯光' },
  { id: 103, name: '音频采集设备', pid: 0, total: 50, inStock: 28, lent: 18, reserved: 4, minStock: 10, remark: '无线领夹麦等' },
  { id: 104, name: '导播与传输设备', pid: 0, total: 28, inStock: 4, lent: 22, reserved: 2, minStock: 10, remark: '导播台与移动图传' },
  { id: 105, name: '网络与连接设备', pid: 0, total: 40, inStock: 25, lent: 15, reserved: 0, minStock: 10, remark: '上网卡等' },
  // 子类（leaf，设备 typeId 直接引用这些 id）
  { id: 1, name: '4K超清摄像机', pid: 101, total: 28, inStock: 15, lent: 10, reserved: 3, minStock: 10, remark: '高画质现场转播主摄' },
  { id: 4, name: '航拍无人机套装', pid: 101, total: 15, inStock: 8, lent: 6, reserved: 1, minStock: 10, remark: '含备用电池及控制器' },
  { id: 2, name: '专业影视镜头组', pid: 102, total: 35, inStock: 20, lent: 13, reserved: 2, minStock: 10, remark: '大光圈定焦/变焦镜头组' },
  { id: 7, name: '便携监视器', pid: 102, total: 20, inStock: 9, lent: 9, reserved: 2, minStock: 10, remark: '7寸高亮监看屏' },
  { id: 8, name: '影视级补光灯组', pid: 102, total: 30, inStock: 15, lent: 13, reserved: 2, minStock: 10, remark: '双色温LED柔光灯组' },
  { id: 5, name: '无线高保真领夹麦', pid: 103, total: 50, inStock: 28, lent: 18, reserved: 4, minStock: 10, remark: '一拖二双通道' },
  { id: 3, name: '便携式导播台', pid: 104, total: 12, inStock: 3, lent: 8, reserved: 1, minStock: 10, remark: '多通道切换输出' },
  { id: 6, name: '4G/5G传输背包', pid: 104, total: 16, inStock: 1, lent: 14, reserved: 1, minStock: 10, remark: '低延时高聚合移动图传' },
  { id: 9, name: '上网卡(移动数据包)', pid: 105, total: 40, inStock: 25, lent: 15, reserved: 0, minStock: 10, remark: '单独管理，不使用二维码出库' },
]

// 2. 设备台账（包含SN、终身码、状态、存放位置等）
export const initialDevices = [
  { id: 101, sn: 'CAM-4K-2026-001', lifeCode: 'LC-2026-A101', name: '4K超清摄像机', typeId: 1, typeName: '4K超清摄像机', brand: 'Sony', model: 'Sony FX6', location: '对外借出', status: '在库', dept: '', borrower: '', cardNo: 'C001-9921', createTime: '2026-01-10' },
  { id: 102, sn: 'CAM-4K-2026-002', lifeCode: 'LC-2026-A102', name: '4K超清摄像机', typeId: 1, typeName: '4K超清摄像机', brand: 'Sony', model: 'Sony FX6', location: '对外借出', status: '借出', dept: '新闻部', borrower: '张伟', cardNo: 'C001-9922', createTime: '2026-01-10' },
  { id: 103, sn: 'CAM-4K-2026-003', lifeCode: 'LC-2026-A103', name: '4K超清摄像机', typeId: 1, typeName: '4K超清摄像机', brand: 'Sony', model: 'Sony FX6', location: '技术支持', status: '已预约', dept: '专题部', borrower: '李娜', cardNo: 'C001-9923', createTime: '2026-01-10' },
  { id: 104, sn: 'CAM-4K-2026-004', lifeCode: 'LC-2026-A104', name: '4K超清摄像机', typeId: 1, typeName: '4K超清摄像机', brand: 'Sony', model: 'Sony FX9', location: '技术支持', status: '损坏', dept: '技术支持部', borrower: '', cardNo: 'C001-9924', createTime: '2026-01-12' },
  { id: 105, sn: 'CAM-4K-2026-005', lifeCode: 'LC-2026-A105', name: '4K超清摄像机', typeId: 1, typeName: '4K超清摄像机', brand: 'Sony', model: 'Sony FX9', location: '对外借出', status: '丢失', dept: '影视中心', borrower: '', cardNo: 'C001-9925', createTime: '2026-01-12' },

  { id: 106, sn: 'LENS-GM-2026-01', lifeCode: 'LC-2026-L01', name: '专业影视镜头组', typeId: 2, typeName: '专业影视镜头组', brand: 'Sony', model: 'FE 24-70mm F2.8 GM II', location: '对外借出', status: '在库', dept: '', borrower: '', cardNo: 'L001-8811', createTime: '2026-02-01' },
  { id: 107, sn: 'LENS-GM-2026-02', lifeCode: 'LC-2026-L02', name: '专业影视镜头组', typeId: 2, typeName: '专业影视镜头组', brand: 'Sony', model: 'FE 70-200mm F2.8 GM OSS II', location: '对外借出', status: '借出', dept: '影视中心', borrower: '王强', cardNo: 'L001-8812', createTime: '2026-02-01' },

  { id: 108, sn: 'BAG-5G-2026-001', lifeCode: 'LC-2026-B01', name: '4G/5G传输背包', typeId: 6, typeName: '4G/5G传输背包', brand: 'TVU', model: 'TVU One 4K', location: '对外借出', status: '在库', dept: '', borrower: '', cardNo: 'B001-7701', createTime: '2026-03-05' },
  { id: 109, sn: 'BAG-5G-2026-002', lifeCode: 'LC-2026-B02', name: '4G/5G传输背包', typeId: 6, typeName: '4G/5G传输背包', brand: 'LiveU', model: 'LiveU LU600', location: '对外借出', status: '在库', dept: '', borrower: '', cardNo: 'B001-7702', createTime: '2026-03-05' },
  { id: 110, sn: 'BAG-5G-2026-003', lifeCode: 'LC-2026-B03', name: '4G/5G传输背包', typeId: 6, typeName: '4G/5G传输背包', brand: 'LiveU', model: 'LiveU LU600', location: '技术支持', status: '借出', dept: '突发新闻部', borrower: '周杰', cardNo: 'B001-7703', createTime: '2026-03-05' },

  { id: 111, sn: 'SWITCH-2026-01', lifeCode: 'LC-2026-S01', name: '便携式导播台', typeId: 3, typeName: '便携式导播台', brand: 'Blackmagic', model: 'Blackmagic ATEM Mini Pro', location: '技术支持', status: '在库', dept: '', borrower: '', cardNo: 'S001-6601', createTime: '2026-02-15' },
  { id: 112, sn: 'DRONE-2026-01', lifeCode: 'LC-2026-D01', name: '航拍无人机套装', typeId: 4, typeName: '航拍无人机套装', brand: 'DJI', model: 'DJI Mavic 3 Pro Cine', location: '对外借出', status: '在库', dept: '', borrower: '', cardNo: 'D001-5501', createTime: '2026-02-18' },
  { id: 113, sn: 'MIC-2026-01', lifeCode: 'LC-2026-M01', name: '无线高保真领夹麦', typeId: 5, typeName: '无线高保真领夹麦', brand: 'Sennheiser', model: 'Sennheiser EW-DP', location: '对外借出', status: '在库', dept: '', borrower: '', cardNo: 'M001-4401', createTime: '2026-02-20' },

  // 上网卡（单独管理，不使用二维码出库）
  { id: 201, sn: 'SIM-CM-202601', lifeCode: '', name: '中国移动5G企业数据卡', typeId: 9, typeName: '上网卡(移动数据包)', brand: '中国移动', model: '5G全网通-不限流', location: '技术支持', status: '借出', dept: '突发新闻部', borrower: '黄磊', cardNo: 'SIM89860401', operator: '中国移动', isSimCard: true, createTime: '2026-01-05' },
  { id: 202, sn: 'SIM-CU-202602', lifeCode: '', name: '中国联通5G专线卡', typeId: 9, typeName: '上网卡(移动数据包)', brand: '中国联通', model: '5G工业级物联网卡', location: '技术支持', status: '在库', dept: '', borrower: '', cardNo: 'SIM89860602', operator: '中国联通', isSimCard: true, createTime: '2026-01-05' },
  { id: 203, sn: 'SIM-CT-202603', lifeCode: '', name: '中国电信5G高速卡', typeId: 9, typeName: '上网卡(移动数据包)', brand: '中国电信', model: '天翼5G应急保障卡', location: '对外借出', status: '在库', dept: '', borrower: '', cardNo: 'SIM89860303', operator: '中国电信', isSimCard: true, createTime: '2026-01-05' },
]

// 3. 预约单与出库单列表
export const initialOrders = [
  {
    id: 'APPLY-20261015-001',
    applyNo: 'APPLY-20261015-001',
    source: 'TRM', // TRM, 公文, 协调会, 其他
    activityName: '2026金秋大型晚会直播',
    borrower: '张伟',
    dept: '新闻部',
    contact: '13800138001',
    applyTime: '2026-10-14 09:30',
    planBorrowTime: '2026-10-15 14:00',
    planReturnTime: '2026-10-18 20:00',
    items: [
      { typeId: 1, typeName: '4K超清摄像机', count: 2, lockedSnList: ['CAM-4K-2026-001', 'CAM-4K-2026-002'] },
      { typeId: 6, typeName: '4G/5G传输背包', count: 1, lockedSnList: ['BAG-5G-2026-001'] }
    ],
    status: '待核对', // 待核对, 核对通过, 已生成出库单, 已出库, 部分归还, 已完成, 已逾期, 已取消
    lockStatus: true,
    checkResult: null, // 核对结果
    outMethod: '单次出库', // 单次出库, 多次出库
    remark: 'TRM系统对接推送，活动前需全部到位测试',
    photos: []
  },
  {
    id: 'APPLY-20261015-002',
    applyNo: 'APPLY-20261015-002',
    source: '公文',
    activityName: '科技创新专题纪录片摄制',
    borrower: '李娜',
    dept: '专题部',
    contact: '13900139002',
    applyTime: '2026-10-15 10:00',
    planBorrowTime: '2026-10-16 08:30',
    planReturnTime: '2026-10-25 18:00',
    items: [
      { typeId: 1, typeName: '4K超清摄像机', count: 1, lockedSnList: ['CAM-4K-2026-003'] },
      { typeId: 2, typeName: '专业影视镜头组', count: 1, lockedSnList: ['LENS-GM-2026-01'] }
    ],
    status: '已生成出库单',
    lockStatus: true,
    checkResult: { passed: true, note: '库存充足且设备检修合格' },
    outMethod: '单次出库',
    outNo: 'OUT-20261015-002',
    remark: '局发公文[2026]88号',
    photos: []
  },
  {
    id: 'APPLY-20261010-003',
    applyNo: 'APPLY-20261010-003',
    source: '协调会',
    activityName: '城市马拉松现场直播',
    borrower: '周杰',
    dept: '突发新闻部',
    contact: '13700137003',
    applyTime: '2026-10-08 14:00',
    planBorrowTime: '2026-10-10 07:00',
    planReturnTime: '2026-10-14 18:00', // 逾期未还
    items: [
      { typeId: 6, typeName: '4G/5G传输背包', count: 1, lockedSnList: ['BAG-5G-2026-003'] }
    ],
    status: '已逾期',
    lockStatus: true,
    checkResult: { passed: true },
    outMethod: '单次出库',
    outNo: 'OUT-20261010-003',
    remark: '协调会纪要第3条',
    photos: []
  },
  {
    id: 'APPLY-20261008-004',
    applyNo: 'APPLY-20261008-004',
    source: 'TRM',
    activityName: '文旅微短剧第一季',
    borrower: '赵敏',
    dept: '影视中心',
    contact: '13600136004',
    applyTime: '2026-10-05 11:20',
    planBorrowTime: '2026-10-08 09:00',
    planReturnTime: '2026-10-13 18:00', // 逾期未领
    items: [
      { typeId: 2, typeName: '专业影视镜头组', count: 1, lockedSnList: ['LENS-GM-2026-02'] }
    ],
    status: '逾期未领',
    lockStatus: true,
    checkResult: { passed: true },
    outMethod: '单次出库',
    remark: 'TRM申请单号TRM-88219，活动计划推迟中',
    photos: []
  }
]

// 4. 出库单 (出库单提前一周自动生成 / 双方扫码签字)
export const initialOutboundBills = [
  {
    id: 'OUT-20261015-002',
    outNo: 'OUT-20261015-002',
    applyNo: 'APPLY-20261015-002',
    activityName: '科技创新专题纪录片摄制',
    borrower: '李娜',
    dept: '专题部',
    contact: '13900139002',
    outMethod: '单次出库',
    autoGenerated: true, // 提前一周自动生成
    createTime: '2026-10-15 11:00',
    devices: [
      { sn: 'CAM-4K-2026-003', name: '4K超清摄像机', model: 'Sony FX9', lifeCode: 'LC-2026-A103', scanned: true, scanTime: '2026-10-15 11:10' },
      { sn: 'LENS-GM-2026-01', name: '专业影视镜头组', model: 'FE 24-70mm F2.8 GM II', lifeCode: 'LC-2026-L01', scanned: true, scanTime: '2026-10-15 11:12' }
    ],
    operator: '库管管理员',
    signer: '李娜 (手写签名已录入)',
    signatureImage: '',
    status: '已签字出库', // 待扫码核对, 待签字, 已签字出库
    outTime: '2026-10-15 11:20'
  },
  {
    id: 'OUT-20261010-003',
    outNo: 'OUT-20261010-003',
    applyNo: 'APPLY-20261010-003',
    activityName: '城市马拉松现场直播',
    borrower: '周杰',
    dept: '突发新闻部',
    contact: '13700137003',
    outMethod: '单次出库',
    autoGenerated: true,
    createTime: '2026-10-09 10:00',
    devices: [
      { sn: 'BAG-5G-2026-003', name: '4G/5G传输背包', model: 'LiveU LU600', lifeCode: 'LC-2026-B03', scanned: true, scanTime: '2026-10-10 07:15' }
    ],
    operator: '库管管理员',
    signer: '周杰',
    signatureImage: '',
    status: '已签字出库',
    outTime: '2026-10-10 07:20'
  }
]

// 5. 入库单与异常处置单据 (入库单通过出库单提前一周自动生成，或归还时生成)
export const initialInboundBills = [
  {
    id: 'IN-20261014-001',
    inNo: 'IN-20261014-001',
    outNo: 'OUT-20261010-003',
    applyNo: 'APPLY-20261010-003',
    activityName: '城市马拉松现场直播',
    returner: '周杰',
    dept: '突发新闻部',
    returnType: '分批归还', // 全部归还, 分批归还
    deviceCondition: '正常', // 正常, 异常
    devices: [
      { sn: 'BAG-5G-2026-003', name: '4G/5G传输背包', status: '正常', lifeCode: 'LC-2026-B03', updatedLifeCode: 'LC-2026-B03' }
    ],
    operator: '库管管理员',
    signer: '周杰',
    status: '已入库',
    inTime: '2026-10-14 17:30',
    remark: '首批附件正常入库'
  }
]

// 6. 异常处置单据（包含丢失、损坏的完整流程记录）
export const initialAnomalyRecords = [
  {
    id: 'ANO-20261012-001',
    anomalyNo: 'ANO-20261012-001',
    outNo: 'OUT-20261005-001',
    deviceSn: 'CAM-4K-2026-004',
    deviceName: '4K超清摄像机',
    dept: '影视中心',
    responsiblePerson: '王强',
    category: '损坏', // 丢失, 损坏
    subCategory: '主体损坏', // 配件丢失, 主体丢失, 配件损坏, 主体损坏
    detail: '外景拍摄摔裂机身LCD屏与遮光罩',
    evidencePhotos: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400'],
    leaderSignStatus: '已签字',
    leaderSignName: '影视中心-陈总监',
    leaderSignTime: '2026-10-13 14:20',
    handleSolution: '自行维修', // 节目组购买归还, 自行维修, 赔偿, 不赔偿(修改丢失状态不入库)
    compensationAmount: 0,
    oldLifeCode: 'LC-2026-A104',
    newLifeCode: 'LC-2026-A104-M01', // 更新设备终身码
    currentStep: '已入库完成', // 待领导签字, 处置中, 待更新终身码, 待签字入库, 已入库完成, 结束(不入库)
    createTime: '2026-10-12 16:00'
  },
  {
    id: 'ANO-20261013-002',
    anomalyNo: 'ANO-20261013-002',
    outNo: 'OUT-20261002-003',
    deviceSn: 'CAM-4K-2026-005',
    deviceName: '4K超清摄像机',
    dept: '影视中心',
    responsiblePerson: '赵敏',
    category: '丢失',
    subCategory: '主体丢失',
    detail: '外拍转场途中小货车尾门脱扣遗失',
    evidencePhotos: [],
    leaderSignStatus: '已签字',
    leaderSignName: '台办公室-张主任',
    leaderSignTime: '2026-10-14 09:10',
    handleSolution: '不赔偿', // 责任认定免责，修改设备丢失状态
    compensationAmount: 0,
    oldLifeCode: 'LC-2026-A105',
    newLifeCode: '',
    currentStep: '结束(不入库)',
    createTime: '2026-10-13 10:30'
  }
]

// 7. 逾期催办跟进记录
export const initialOverdueFollows = [
  {
    id: 'OV-1',
    type: '逾期未领', // 逾期未领, 逾期未归还
    applyNo: 'APPLY-20261008-004',
    borrower: '赵敏',
    dept: '影视中心',
    contact: '13600136004',
    deviceName: '专业影视镜头组',
    activityPostponed: '是', // 活动是否改期/延期
    actionResult: '收回TRM，重新确认领取时间为10月20日',
    followUser: '库管管理员',
    status: '已改期收回',
    followTime: '2026-10-14 15:30'
  },
  {
    id: 'OV-2',
    type: '逾期未归还',
    applyNo: 'APPLY-20261010-003',
    borrower: '周杰',
    dept: '突发新闻部',
    contact: '13700137003',
    deviceName: '4G/5G传输背包',
    activityPostponed: '否',
    actionResult: '活动未延期，催办归还中；约定10月16日前送回库房',
    followUser: '库管管理员',
    status: '催办跟进中',
    followTime: '2026-10-15 09:20'
  }
]

// 数据管理 Store 辅助对象
export const WmsStore = {
  getDeviceTypes() {
    const list = getLocal('DEVICE_TYPES', initialDeviceTypes)
    return list.map(item => ({
      ...item,
      minStock: item.minStock !== undefined && item.minStock !== null ? Number(item.minStock) : 10
    }))
  },
  saveDeviceTypes(list) {
    setLocal('DEVICE_TYPES', list)
  },

  getDevices() {
    return getLocal('DEVICES', initialDevices)
  },
  saveDevices(list) {
    setLocal('DEVICES', list)
  },

  getOrders() {
    return getLocal('ORDERS', initialOrders)
  },
  saveOrders(list) {
    setLocal('ORDERS', list)
  },

  getOutbounds() {
    return getLocal('OUTBOUNDS', initialOutboundBills)
  },
  saveOutbounds(list) {
    setLocal('OUTBOUNDS', list)
  },

  getInbounds() {
    return getLocal('INBOUNDS', initialInboundBills)
  },
  saveInbounds(list) {
    setLocal('INBOUNDS', list)
  },

  getAnomalies() {
    return getLocal('ANOMALIES', initialAnomalyRecords)
  },
  saveAnomalies(list) {
    setLocal('ANOMALIES', list)
  },

  getOverdues() {
    return getLocal('OVERDUES', initialOverdueFollows)
  },
  saveOverdues(list) {
    setLocal('OVERDUES', list)
  },

  // 重置为初始演示数据
  resetAll() {
    this.saveDeviceTypes(initialDeviceTypes)
    this.saveDevices(initialDevices)
    this.saveOrders(initialOrders)
    this.saveOutbounds(initialOutboundBills)
    this.saveInbounds(initialInboundBills)
    this.saveAnomalies(initialAnomalyRecords)
    this.saveOverdues(initialOverdueFollows)
  }
}
