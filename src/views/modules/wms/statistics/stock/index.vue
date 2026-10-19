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
        <span class="filter-tip">展示在库数量、时间段内可归还数量、预定数量及借用 / 预定明细</span>
      </div>

      <el-table :data="stockStats" v-loading="loading" stripe border>
        <el-table-column prop="name" label="设备类型" min-width="160" fixed="left" />
        <el-table-column prop="inStock" label="在库数量" width="100" align="center" />
        <el-table-column prop="returnable" label="时间段内可归还" width="130" align="center" />
        <el-table-column prop="reserve" label="预定数量" width="100" align="center" />
        <el-table-column prop="borrowers" label="借用人" min-width="120" show-overflow-tooltip />
        <el-table-column prop="borrowDepts" label="借用部门" min-width="120" show-overflow-tooltip />
        <el-table-column prop="reservers" label="预定人" min-width="110" show-overflow-tooltip />
        <el-table-column prop="reserveDepts" label="预定部门" min-width="120" show-overflow-tooltip />
        <el-table-column prop="reserveActivities" label="预定活动" min-width="180" show-overflow-tooltip />
      </el-table>
    </el-card>
  </Container>
</template>

<script setup>
import { Container } from '@/components'
import { onMounted } from 'vue'
import { useStatistics } from '../useStatistics'

const { loading, dateRange, stockStats, loadData } = useStatistics()

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
