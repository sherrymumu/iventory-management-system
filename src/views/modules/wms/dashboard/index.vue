<template>
  <div class="screen-container">
    <!-- 顶部标题与副标题 -->
    <div class="header-section">
      <div class="title-row">
        <h2 class="page-title">数据大屏</h2>
      </div>
      <div class="subtitle-text">库存总览 · 预警与逾期提醒 · 出入库趋势</div>
    </div>

    <!-- 顶部核心指标 5 列卡片 -->
    <el-row :gutter="16" class="metrics-row">
      <!-- 1. 设备总数 -->
      <el-col :xs="24" :sm="12" :md="12" :lg="4" :xl="4" class="col-metric-item">
        <div class="metric-card clickable" @click="goDeviceList">
          <div class="metric-label">设备总数</div>
          <div class="metric-value font-bold text-main">1,286</div>
          <div class="metric-footer text-muted">
            <span class="compare-up">▲ 较上月 +24</span>
          </div>
        </div>
      </el-col>

      <!-- 2. 在库数量 -->
      <el-col :xs="24" :sm="12" :md="12" :lg="5" :xl="5" class="col-metric-item">
        <div class="metric-card clickable" @click="goDeviceList">
          <div class="metric-label">在库数量</div>
          <div class="metric-value font-bold text-success">954</div>
          <div class="metric-footer text-muted">
            在库率 74.2%
          </div>
        </div>
      </el-col>

      <!-- 3. 借出数量 -->
      <el-col :xs="24" :sm="12" :md="12" :lg="5" :xl="5" class="col-metric-item">
        <div class="metric-card clickable" @click="goDeviceList">
          <div class="metric-label">借出数量</div>
          <div class="metric-value font-bold text-primary">288</div>
          <div class="metric-footer text-muted">
            其中逾期 6 台
          </div>
        </div>
      </el-col>

      <!-- 4. 异常设备 -->
      <el-col :xs="24" :sm="12" :md="12" :lg="5" :xl="5" class="col-metric-item">
        <div class="metric-card clickable" @click="goDeviceList">
          <div class="metric-label">异常设备</div>
          <div class="metric-value font-bold text-danger">44</div>
          <div class="metric-footer text-muted">
            丢失 12 · 损坏 32
          </div>
        </div>
      </el-col>

      <!-- 5. 本月借还次数 -->
      <el-col :xs="24" :sm="12" :md="12" :lg="5" :xl="5" class="col-metric-item">
        <div class="metric-card clickable" @click="goDeviceList">
          <div class="metric-label">本月借还次数</div>
          <div class="metric-value font-bold text-main">156</div>
          <div class="metric-footer text-muted">
            出库 39 · 入库 67
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 筛选过滤与提示条 -->
    <div class="filter-strip">
      <div class="time-tabs">
        <span
          class="tab-btn"
          :class="{ active: timeRange === 'week' }"
          @click="timeRange = 'week'"
        >近一周</span>
        <span
          class="tab-btn"
          :class="{ active: timeRange === 'month' }"
          @click="timeRange = 'month'"
        >近一月</span>
        <span
          class="tab-btn"
          :class="{ active: timeRange === 'year' }"
          @click="timeRange = 'year'"
        >近一年</span>
      </div>
      <div class="threshold-tip">
        低库存预警规则：在库数量 &lt; 低阈值预警数量（默认阈值 10 台）
      </div>
    </div>

    <!-- 图表区域（调整至中间行） -->
    <el-row :gutter="16" class="charts-row">
      <!-- 1. 设备分类统计 (左侧环形图) -->
      <el-col :xs="24" :lg="6" class="chart-col">
        <div class="section-card chart-card clickable" @click="goStatus" title="点击查看设备状态统计台账">
          <div class="chart-header">
            <span class="title-txt">设备分类统计</span>
          </div>
          <div class="donut-chart-container">
            <div ref="pieRef" class="chart-box-pie"></div>
            <div class="pie-custom-legend">
              <div v-for="(item, i) in categoryLegend" :key="i" class="legend-row">
                <span class="legend-bullet" :style="{ backgroundColor: item.color }"></span>
                <span class="legend-label">{{ item.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 2. 设备库存 & 时段可归还数量对比 -->
      <el-col :xs="24" :lg="9" class="chart-col">
        <div class="section-card chart-card clickable" @click="goStock" title="点击查看设备库存统计">
          <div class="chart-header-combined">
            <div class="header-split-left" style="width: 100%;">
              <span class="title-txt">设备库存</span>
              <el-date-picker
                v-model="compareDateRange"
                type="daterange"
                size="small"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                clearable
                class="compare-date-picker"
                @change="handleCompareDateChange"
                @click.stop
              />
            </div>
          </div>

          <div class="charts-combined-body">
            <div class="sub-chart-left" style="flex: 1;">
              <div ref="compareBarRef" class="chart-instance"></div>
              <div class="compare-chart-legend">
                <span class="legend-chip">
                  <i class="color-sq sq-blue"></i> 当前库存数量
                </span>
                <span class="legend-chip">
                  <i class="color-sq sq-green"></i> 时段可归还数量
                </span>
                <span class="legend-chip">
                  <i class="color-sq sq-total"></i> 总数量（当前库存+时段可归还）
                </span>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 3. 出入库趋势 -->
      <el-col :xs="24" :lg="9" class="chart-col">
        <div class="section-card chart-card clickable" @click="goTrend" title="点击查看出入库趋势统计">
          <div class="chart-header-combined">
            <div class="header-split-left" style="width: 100%;">
              <span class="title-txt">出入库趋势 ({{ timeRangeLabel }})</span>
              <div class="trend-legend">
                <span class="legend-chip">
                  <i class="color-sq sq-light-blue"></i> 预定库存
                </span>
                <span class="legend-chip">
                  <i class="color-sq sq-dark-blue"></i> 实际取用
                </span>
              </div>
            </div>
          </div>

          <div class="charts-combined-body">
            <div class="sub-chart-right" style="flex: 1;">
              <div ref="trendBarRef" class="chart-instance"></div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 底部三列预警/状态表格（紧凑排版） -->
    <el-row :gutter="16" class="status-tables-row">
      <!-- 1. 低库存预警 -->
      <el-col :xs="24" :lg="8" class="status-col">
        <div class="section-card clickable" @click="goLow" title="点击查看低库存设备台账">
          <div class="card-title-bar">
            <div class="title-left">
              <span class="dot dot-red"></span>
              <span class="title-txt">低库存预警</span>
            </div>
            <span class="badge-tag badge-red">{{ lowStockList.length }} 项需补货</span>
          </div>

          <div class="custom-table-wrap">
            <table class="custom-table">
              <thead>
                <tr>
                  <th style="width: 40%;">设备类型</th>
                  <th style="width: 30%; text-align: center;">在库/预警值</th>
                  <th style="width: 30%; text-align: right;">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="lowStockList.length === 0">
                  <td colspan="3" style="text-align: center; color: #94a3b8; padding: 20px 0;">
                    暂无低库存预警设备
                  </td>
                </tr>
                <tr v-for="(item, idx) in lowStockList" :key="idx">
                  <td class="name-cell">{{ item.name }}</td>
                  <td class="count-cell text-danger text-center">{{ item.stock }} / {{ item.minStock }} 台</td>
                  <td class="status-cell text-right">
                    <span :class="item.statusType === 'danger' ? 'pill-danger' : 'pill-warning'">
                      {{ item.statusText }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </el-col>

      <!-- 2. 待核对预约 -->
      <el-col :xs="24" :lg="8" class="status-col">
        <div class="section-card">
          <div class="card-title-bar">
            <div class="title-left">
              <span class="dot dot-blue"></span>
              <span class="title-txt">待核对预约</span>
            </div>
            <span class="badge-tag badge-blue">3 单</span>
          </div>

          <div class="custom-table-wrap">
            <table class="custom-table">
              <thead>
                <tr>
                  <th style="width: 44%;">预约单号</th>
                  <th style="width: 28%; text-align: center;">来源</th>
                  <th style="width: 28%; text-align: right;">时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in pendingApplyList" :key="idx">
                  <td class="code-cell">{{ item.no }}</td>
                  <td class="source-cell text-center">
                    <span class="source-pill">{{ item.source }}</span>
                  </td>
                  <td class="time-cell text-right">{{ item.time }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </el-col>

      <!-- 3. 逾期单据 -->
      <el-col :xs="24" :lg="8" class="status-col">
        <div class="section-card clickable" @click="goOverdue" title="点击查看逾期设备台账">
          <div class="card-title-bar">
            <div class="title-left">
              <span class="dot dot-yellow"></span>
              <span class="title-txt">逾期单据</span>
            </div>
            <span class="badge-tag badge-yellow">8 单待跟进</span>
          </div>

          <div class="custom-table-wrap">
            <table class="custom-table">
              <thead>
                <tr>
                  <th style="width: 30%;">类型</th>
                  <th style="width: 44%; text-align: center;">单号</th>
                  <th style="width: 26%; text-align: right;">逾期</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in overdueList" :key="idx">
                  <td class="type-cell">{{ item.type }}</td>
                  <td class="code-cell text-center">{{ item.no }}</td>
                  <td class="overdue-cell text-right">{{ item.days }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'
import { getDeviceTypeListApi } from '@/apis/wms'

const router = useRouter()
const goStatus = () => router.push('/wms/statistics/status')
const goStock = () => router.push('/wms/statistics/stock')
const goDeviceList = () => router.push('/wms/device-list')
const goTrend = () => router.push('/wms/statistics/trend')
const goLow = () => router.push('/wms/statistics/low')
const goOverdue = () => router.push('/wms/statistics/overdue')

const timeRange = ref('year')
const timeRangeLabel = computed(() => {
  if (timeRange.value === 'week') return '近一周'
  if (timeRange.value === 'month') return '近一月'
  return '近一年'
})

// 设备库存&时段可归还数量对比的时间段选择（默认为空）
const compareDateRange = ref(null)

// 对比柱状图的数据状态
const compareChartData = ref({
  categories: ['采集类', '上网卡', '传输背包'],
  stock: [540, 310, 120],
  returnable: [126, 88, 42]
})

// 时间段改变时，根据所选跨度动态更新“时段可归还数量”
const handleCompareDateChange = (val) => {
  if (!val || val.length !== 2) {
    // 恢复默认基准数据
    compareChartData.value.returnable = [126, 88, 42]
  } else {
    const [start, end] = val
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    const diffDays = Math.max(1, Math.round((endTime - startTime) / (1000 * 3600 * 24)))

    // 根据选择的时间天数模拟不同时段的可归还数量
    const ratio = Math.min(2.5, Math.max(0.2, (diffDays / 30)))
    compareChartData.value.returnable = [
      Math.min(compareChartData.value.stock[0], Math.round(75 * ratio)),
      Math.min(compareChartData.value.stock[1], Math.round(50 * ratio)),
      Math.min(compareChartData.value.stock[2], Math.round(28 * ratio))
    ]
  }
  updateCompareChart()
}

// 低库存预警数据
const lowStockList = ref([])

// 加载设备类型的低阈值预警数据
const fetchLowStockData = async () => {
  try {
    const res = await getDeviceTypeListApi()
    if (res && res.data && res.data.list) {
      // 筛选在库数量低于低阈值预警的设备类型
      const filtered = res.data.list.filter(item => {
        const threshold = item.minStock !== undefined && item.minStock !== null ? Number(item.minStock) : 10
        const inStock = Number(item.inStock) || 0
        return inStock < threshold
      }).map(item => {
        const threshold = item.minStock !== undefined && item.minStock !== null ? Number(item.minStock) : 10
        const inStock = Number(item.inStock) || 0
        const isExtremelyLow = inStock <= Math.floor(threshold / 2)
        return {
          id: item.id,
          name: item.name,
          stock: inStock,
          minStock: threshold,
          statusText: isExtremelyLow ? '紧急缺货' : '低于阈值',
          statusType: isExtremelyLow ? 'danger' : 'warning'
        }
      })
      lowStockList.value = filtered
    }
  } catch (e) {
    console.error('加载低库存预警数据失败:', e)
  }
}

// 待核对预约列表
const pendingApplyList = ref([
  { no: 'YY-2026-1023', source: 'TRM', time: '10-23' },
  { no: 'YY-2026-1026', source: '协调会', time: '10-26' },
  { no: 'YY-2026-1030', source: '公文', time: '10-30' }
])

// 逾期单据列表
const overdueList = ref([
  { type: '未归还', no: 'CK-2026-0981', days: '+5天' },
  { type: '未归还', no: 'CK-2026-1002', days: '+3天' },
  { type: '未领取', no: 'YY-2026-1015', days: '+2天' },
  { type: '未归还', no: 'CK-2026-1018', days: '+2天' },
  { type: '未归还', no: 'CK-2026-1021', days: '+1天' },
  { type: '未领取', no: 'YY-2026-1024', days: '+1天' },
  { type: '未归还', no: 'CK-2026-1028', days: '+1天' },
  { type: '未归还', no: 'CK-2026-1031', days: '+1天' }
])

// 分类图例与占比
const categoryLegend = [
  { label: '采集类 42% · 540 台', color: '#1677ff' },
  { label: '制作类 26% · 334 台', color: '#4096ff' },
  { label: '传输背包 18% · 232 台', color: '#36cfc9' },
  { label: '其他 14% · 180 台', color: '#ff7a45' }
]

const pieRef = useTemplateRef('pieRef')
const compareBarRef = useTemplateRef('compareBarRef')
const trendBarRef = useTemplateRef('trendBarRef')

let pieChart = null
let compareChart = null
let trendChart = null

// 初始化环形图
const initPieChart = () => {
  if (!pieRef.value) return
  if (!pieChart) pieChart = echarts.init(pieRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}台 ({d}%)'
    },
    series: [
      {
        name: '设备分类',
        type: 'pie',
        radius: ['52%', '80%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        itemStyle: {
          borderWidth: 2,
          borderColor: '#ffffff'
        },
        data: [
          { value: 540, name: '采集类', itemStyle: { color: '#1677ff' } },
          { value: 334, name: '制作类', itemStyle: { color: '#4096ff' } },
          { value: 232, name: '传输背包', itemStyle: { color: '#36cfc9' } },
          { value: 180, name: '其他', itemStyle: { color: '#ff7a45' } }
        ]
      }
    ]
  }
  pieChart.setOption(option)
}

// 更新库存与可归还对比柱状图数据
const updateCompareChart = () => {
  if (!compareChart) return
  compareChart.setOption({
    series: [
      {
        name: '当前库存数量',
        data: compareChartData.value.stock
      },
      {
        name: '时段可归还数量',
        data: compareChartData.value.returnable
      },
      {
        name: '总数量',
        data: compareChartData.value.stock.map((v, i) => v + compareChartData.value.returnable[i])
      }
    ]
  })
}

// 初始化库存与可归还对比柱状图
const initCompareChart = () => {
  if (!compareBarRef.value) return
  if (!compareChart) compareChart = echarts.init(compareBarRef.value)

  const option = {
    grid: {
      top: 36,
      left: 30,
      right: 20,
      bottom: 24,
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    xAxis: {
      type: 'category',
      data: compareChartData.value.categories,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#475569', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 }
    },
    series: [
      {
        name: '当前库存数量',
        type: 'bar',
        stack: 'Total',
        barWidth: '36%',
        itemStyle: { color: '#2b7fff' },
        data: compareChartData.value.stock
      },
      {
        name: '时段可归还数量',
        type: 'bar',
        stack: 'Total',
        itemStyle: { color: '#67c23a' },
        label: {
          show: true,
          position: 'top',
          color: '#64748b',
          fontWeight: 'normal',
          fontSize: 10,
          formatter: (params) => {
            const idx = params.dataIndex
            return (compareChartData.value.stock[idx] || 0) + (compareChartData.value.returnable[idx] || 0)
          }
        },
        data: compareChartData.value.returnable
      },
      {
        name: '总数量',
        type: 'line',
        symbol: 'none',
        lineStyle: { opacity: 0 },
        data: compareChartData.value.stock.map((v, i) => v + compareChartData.value.returnable[i])
      }
    ]
  }
  compareChart.setOption(option)
}

// 初始化出入库趋势柱状图（各类设备重叠柱状图：浅色为预定库存数量，深色为实际取用数量）
const initTrendChart = () => {
  if (!trendBarRef.value) return
  if (!trendChart) trendChart = echarts.init(trendBarRef.value)

  // 根据当前时间维度动态调整数据
  const multiplier = timeRange.value === 'week' ? 0.3 : (timeRange.value === 'month' ? 0.6 : 1.0)

  const rawData = [
    { name: '4K摄像机', planned: Math.round(98 * multiplier), actual: Math.round(76 * multiplier) },
    { name: '镜头组', planned: Math.round(85 * multiplier), actual: Math.round(68 * multiplier) },
    { name: '导播台', planned: Math.round(46 * multiplier), actual: Math.round(32 * multiplier) },
    { name: '无人机', planned: Math.round(52 * multiplier), actual: Math.round(41 * multiplier) },
    { name: '无线麦', planned: Math.round(112 * multiplier), actual: Math.round(95 * multiplier) },
    { name: '传输背包', planned: Math.round(72 * multiplier), actual: Math.round(54 * multiplier) },
    { name: '补光灯组', planned: Math.round(64 * multiplier), actual: Math.round(48 * multiplier) }
  ]

  const categories = rawData.map(d => d.name)
  const plannedData = rawData.map(d => d.planned)
  const actualData = rawData.map(d => d.actual)

  const option = {
    grid: {
      top: 36,
      left: 10,
      right: 15,
      bottom: 20,
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const item = rawData[params[0].dataIndex]
        return `<b>${item.name}</b><br/>
          <span style="color:#a0cfff;">●</span> 预定库存数量: ${item.planned} 台<br/>
          <span style="color:#1677ff;">●</span> 实际取用数量: ${item.actual} 台`
      }
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#475569',
        fontSize: 11,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '数量(台)',
      nameTextStyle: { color: '#94a3b8', fontSize: 11, padding: [0, 0, 0, -10] },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 }
    },
    series: [
      {
        name: '预定库存数量',
        type: 'bar',
        barWidth: 26,
        data: plannedData,
        itemStyle: {
          color: '#d0e2ff',
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          color: '#64748b',
          fontSize: 10
        },
        z: 1
      },
      {
        name: '实际取用数量',
        type: 'bar',
        barWidth: 26,
        barGap: '-100%', // 重叠柱状图关键配置
        data: actualData,
        itemStyle: {
          color: '#2b7fff',
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'insideTop',
          color: '#ffffff',
          fontSize: 10
        },
        z: 2
      }
    ]
  }
  trendChart.setOption(option)
}

const handleResize = () => {
  pieChart?.resize()
  compareChart?.resize()
  trendChart?.resize()
}

watch(timeRange, () => {
  initTrendChart()
})

onMounted(() => {
  fetchLowStockData()
  nextTick(() => {
    initPieChart()
    initCompareChart()
    initTrendChart()
    // 延时再次触发 resize 避免容器 flex 渲染初期高度为 0
    setTimeout(() => {
      handleResize()
    }, 100)
  })
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  pieChart?.dispose()
  compareChart?.dispose()
  trendChart?.dispose()
})
</script>

<style scoped>
.screen-container {
  padding: 12px 16px;
  background-color: #f2f5f9;
  min-height: calc(100vh - 84px);
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  overflow: hidden;
}

/* 顶部标题区 */
.header-section {
  margin-bottom: 10px;
}
.title-row {
  display: flex;
  align-items: center;
}
.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}
.subtitle-text {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

/* 指标卡片行 */
.metrics-row {
  margin-bottom: 10px;
}
.metric-card {
  background: #ffffff;
  border-radius: 6px;
  padding: 10px 14px;
  height: 100%;
  box-sizing: border-box;
  border: 1px solid #eef2f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.metric-card.clickable {
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}
.metric-card.clickable:hover {
  box-shadow: 0 2px 10px rgba(22, 119, 255, 0.15);
  transform: translateY(-1px);
}
.metric-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}
.metric-value {
  font-size: 24px;
  line-height: 1.1;
  margin: 4px 0;
  font-family: "DIN Alternate", "Roboto", "Helvetica Neue", Arial, sans-serif;
}
.metric-footer {
  font-size: 11px;
  color: #94a3b8;
}
.compare-up {
  color: #64748b;
}

.text-main { color: #0f172a; }
.text-success { color: #00b96b; }
.text-primary { color: #1677ff; }
.text-danger { color: #f5222d; }

/* 筛选条 */
.filter-strip {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 12px;
}
.time-tabs {
  display: inline-flex;
  background: #ffffff;
  padding: 2px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}
.tab-btn {
  padding: 2px 12px;
  font-size: 12px;
  color: #475569;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}
.tab-btn:hover {
  color: #1677ff;
}
.tab-btn.active {
  background-color: #f1f5f9;
  color: #1677ff;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.threshold-tip {
  font-size: 12px;
  color: #64748b;
  background: #ffffff;
  padding: 2px 10px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

/* 共通板块卡片 */
.section-card {
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #eef2f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  padding: 10px 14px;
  box-sizing: border-box;
}
.section-card.clickable {
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
}
.section-card.clickable:hover {
  box-shadow: 0 4px 16px rgba(22, 119, 255, 0.18);
  transform: translateY(-2px);
  border-color: #bcd4ff;
}

/* 状态表格 */
.status-tables-row {
  margin-bottom: 0;
}
.status-col {
  margin-bottom: 10px;
  display: flex;
}
/* 底部三个模块统一高度，卡片内部纵向排布，表格区域超出可滚动 */
.status-tables-row .section-card {
  flex: 1;
  height: 268px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.card-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  flex-shrink: 0;
}
.title-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}
.dot-red { background-color: #f5222d; }
.dot-blue { background-color: #1677ff; }
.dot-yellow { background-color: #faad14; }

.title-txt {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.badge-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 500;
}
.badge-red {
  background: #fff1f0;
  color: #cf1322;
}
.badge-blue {
  background: #e6f4ff;
  color: #0958d9;
}
.badge-yellow {
  background: #fffbe6;
  color: #d46b08;
}

.custom-table-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}
.custom-table-wrap::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-table-wrap::-webkit-scrollbar-track {
  background: transparent;
}
.custom-table-wrap::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
.custom-table-wrap::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
.custom-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  font-size: 12px;
}
.custom-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: #f0f5ff;
  color: #475569;
  font-weight: 600;
  padding: 7px 8px;
  white-space: nowrap;
  box-shadow: inset 0 -1px 0 #dbe7ff;
}
.custom-table td {
  padding: 7px 8px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.custom-table tbody tr:hover td {
  background-color: #f8fafc;
}
.custom-table tr:last-child td {
  border-bottom: none;
}
.name-cell {
  font-weight: 500;
  color: #1e293b;
}
.count-cell {
  font-weight: 600;
  text-align: center;
}
.pill-danger {
  background: #fff1f0;
  color: #f5222d;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
}
.pill-warning {
  background: #fffbe6;
  color: #faad14;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
}
.source-pill {
  background: #f0f7ff;
  color: #1677ff;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
}
.code-cell {
  color: #475569;
  font-family: monospace;
}
.time-cell {
  color: #64748b;
}
.type-cell {
  color: #334155;
}
.overdue-cell {
  color: #0f172a;
  font-weight: 600;
}

/* 图表区域 */
.charts-row {
  margin-bottom: 10px;
}
.chart-col {
  margin-bottom: 10px;
}
.chart-card {
  height: 250px;
  display: flex;
  flex-direction: column;
}
.chart-card.clickable {
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}
.chart-card.clickable:hover {
  box-shadow: 0 4px 16px rgba(22, 119, 255, 0.18);
  transform: translateY(-2px);
}
.chart-header {
  margin-bottom: 6px;
}
.donut-chart-container {
  display: flex;
  align-items: center;
  height: calc(100% - 24px);
}
.chart-box-pie {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}
.pie-custom-legend {
  flex: 1;
  margin-left: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.legend-bullet {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.legend-label {
  font-size: 11px;
  color: #334155;
  white-space: nowrap;
}

/* 右侧复合图表 */
.chart-header-combined {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 6px;
}
.header-split-left {
  width: 48%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 12px;
  box-sizing: border-box;
}
.compare-date-picker {
  max-width: 200px;
}
.header-split-right {
  width: 48%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.trend-legend {
  font-size: 11px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 10px;
}
.sq-light-blue { background-color: #d0e2ff; }
.sq-dark-blue { background-color: #2b7fff; }

.charts-combined-body {
  display: flex;
  flex: 1;
  height: calc(100% - 36px);
  position: relative;
}
.sub-chart-left {
  flex: 5;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
}
.charts-divider {
  width: 1px;
  background-color: #f1f5f9;
  margin: 0 10px;
  align-self: stretch;
}
.sub-chart-right {
  flex: 5;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
}
.chart-instance {
  width: 100%;
  height: 100%;
  min-height: 160px;
  flex: 1;
}

.compare-chart-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 2px;
  font-size: 11px;
  color: #64748b;
}
.legend-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.color-sq {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  display: inline-block;
}
.sq-blue { background-color: #2b7fff; }
.sq-green { background-color: #67c23a; }
.sq-total { background-color: #fa541c; }

.text-right { text-align: right; }
.text-center { text-align: center; }
.font-bold { font-weight: 700; }
</style>
