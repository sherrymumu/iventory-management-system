<template>
  <Container>
    <el-card shadow="never">
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="以下设备类型在库数量低于预警阈值，需关注归还与补库安排"
        class="mb-15"
      />
      <el-table :data="lowStockStats" v-loading="loading" stripe border>
        <el-table-column prop="name" label="设备类型" min-width="180" />
        <el-table-column prop="inStock" label="当前在库" width="110" align="center">
          <template #default="{ row }">
            <el-tag type="danger">{{ row.inStock }} 台</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="minStock" label="预警阈值" width="110" align="center">
          <template #default="{ row }">≤ {{ row.minStock }} 台</template>
        </el-table-column>
        <el-table-column prop="gap" label="库存缺口" width="110" align="center">
          <template #default="{ row }">
            <span class="font-bold">{{ row.gap }} 台</span>
          </template>
        </el-table-column>
        <el-table-column prop="borrowCount" label="借用数量" width="110" align="center" />
        <el-table-column prop="borrowers" label="借用人" min-width="120" show-overflow-tooltip />
        <el-table-column prop="borrowDepts" label="借用部门" min-width="120" show-overflow-tooltip />
        <el-table-column prop="borrowTimes" label="借用时间" min-width="180" show-overflow-tooltip />
      </el-table>
    </el-card>
  </Container>
</template>

<script setup>
import { Container } from '@/components'
import { onMounted } from 'vue'
import { useStatistics } from '../useStatistics'

const { loading, lowStockStats, loadData } = useStatistics()

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.mb-15 {
  margin-bottom: 15px;
}
</style>
