<template>
  <Container>
    <el-card shadow="never">
      <div class="filter-row">
        <span class="filter-label">统计时间段：</span>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :clearable="false"
          style="width: 280px"
        />
        <span class="filter-tip">统计实际出库与预定设备，预定设备与借用时间重合时仅统计一次</span>
      </div>

      <el-table :data="trendStats" v-loading="loading" stripe border>
        <el-table-column prop="name" label="设备类型" min-width="180" />
        <el-table-column prop="out" label="实际出库（台）" width="140" align="center" />
        <el-table-column prop="reserve" label="预定出库（去重）" width="150" align="center" />
        <el-table-column prop="totalOut" label="出库合计（台）" width="140" align="center">
          <template #default="{ row }">
            <span class="font-bold">{{ row.totalOut }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="inbound" label="入库归还（台）" width="140" align="center" />
        <el-table-column label="出入库趋势" width="160" align="center">
          <template #default="{ row }">
            <el-tag :type="row.trend > 0 ? 'warning' : row.trend < 0 ? 'success' : 'info'">
              {{ row.trend > 0 ? `净出库 ${row.trend} 台` : row.trend < 0 ? `净入库 ${-row.trend} 台` : '收支平衡' }}
            </el-tag>
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

const { loading, dateRange, trendStats, loadData } = useStatistics()

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.filter-label {
  font-size: 14px;
  color: #475569;
}
.filter-tip {
  font-size: 12px;
  color: #94a3b8;
}
</style>
