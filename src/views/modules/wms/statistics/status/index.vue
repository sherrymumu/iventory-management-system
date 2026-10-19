<template>
  <Container>
    <el-card shadow="never">
      <div class="status-cards">
        <div class="stat-card" v-for="s in statusSummary" :key="s.status" :style="{ borderTopColor: STATUS_COLOR[s.status] }">
          <div class="stat-value" :style="{ color: STATUS_COLOR[s.status] }">{{ s.count }}</div>
          <div class="stat-label">{{ s.status }}</div>
          <div class="stat-percent">占比 {{ s.percent }}</div>
        </div>
      </div>

      <!-- <el-table :data="statusSummary" stripe border>
        <el-table-column label="设备状态" width="160" align="center">
          <template #default="{ row }">
            <span class="status-pill" :style="{ color: STATUS_COLOR[row.status], background: STATUS_COLOR[row.status] + '1a' }">{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="count" label="数量（台）" width="160" align="center">
          <template #default="{ row }">
            <span class="font-bold" :style="{ color: STATUS_COLOR[row.status] }">{{ row.count }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="percent" label="占比" width="160" align="center" />
        <el-table-column prop="desc" label="状态说明" min-width="300" />
      </el-table> -->

      <div class="section-title">各设备类型状态分布（大类 / 子类）</div>
      <el-table :data="typeStatusTree" row-key="id" :tree-props="{ children: 'children' }" stripe border>
        <el-table-column prop="name" label="设备类型（大类 / 子类）" min-width="220" />
        <el-table-column v-for="s in statusList" :key="s" :label="s" align="center">
          <template #default="{ row }">
            <span :style="{ color: STATUS_COLOR[s], fontWeight: 600 }">{{ row[s] }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total" label="合计" width="100" align="center">
          <template #default="{ row }">
            <span class="font-bold">{{ row.total }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </Container>
</template>

<script setup>
import { Container } from '@/components'
import { onMounted } from 'vue'
import { useStatistics } from '../useStatistics'

const { statusSummary, statusList, typeStatusTree, loadData } = useStatistics()

// 状态配色：在库绿、借出蓝、预约黄、损坏/丢失为深浅不同的红
const STATUS_COLOR = {
  '在库': '#00b96b',
  '借出': '#1677ff',
  '已预约': '#faad14',
  '损坏': '#ff7875',
  '丢失': '#cf1322'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.status-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 15px;
}
.stat-card {
  flex: 1 1 0;
  min-width: 0;
  padding: 14px;
  text-align: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-top: 3px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.2s, transform 0.2s;
}
.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.status-pill {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 13px;
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #1e293b;
}
.stat-label {
  margin-top: 4px;
  font-size: 13px;
  color: #475569;
}
.stat-percent {
  margin-top: 2px;
  font-size: 12px;
  color: #94a3b8;
}
.section-title {
  margin: 18px 0 10px;
  font-weight: 600;
}
</style>
