// src/stores/dashboard.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dashboardService } from '@/services/dashboard.service'
import type {
  DashboardSummary,
  PendingTask,
  DashboardStats,
  DashboardFilters,
} from '@/types/dashboard'

export const useDashboardStore = defineStore('dashboard', () => {
  // State
  const summary = ref<DashboardSummary | null>(null)
  const pendingTasks = ref<PendingTask[]>([])
  const stats = ref<DashboardStats[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<DashboardFilters>({
    period: 'week',
  })

  // Getters
  const totalPendingTasks = computed(() => pendingTasks.value.length)

  const highPriorityTasks = computed(() =>
    pendingTasks.value.filter((task) => task.priority === 'alta'),
  )

  const expedienteStats = computed(() => {
    if (!summary.value?.expedientes) return null
    return summary.value.expedientes
  })

  const hasData = computed(() => !!summary.value)

  // Actions
  const fetchDashboardData = async () => {
    loading.value = true
    error.value = null

    try {
      // Cargar resumen
      const summaryResponse = await dashboardService.getSummary(filters.value.period)
      if (summaryResponse.success && summaryResponse.data) {
        summary.value = summaryResponse.data
      }

      // Cargar tareas pendientes
      const tasksResponse = await dashboardService.getPendingTasks()
      if (tasksResponse.success && tasksResponse.data) {
        pendingTasks.value = tasksResponse.data
      }

      // Cargar estadísticas por rol
      const statsResponse = await dashboardService.getStatsByRole()
      if (statsResponse.success && statsResponse.data) {
        stats.value = statsResponse.data
      }

      return { success: true }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar el dashboard'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const setFilters = (newFilters: Partial<DashboardFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
    // Recargar datos cuando cambian los filtros
    fetchDashboardData()
  }

  const refreshDashboard = () => {
    fetchDashboardData()
  }

  return {
    // State
    summary,
    pendingTasks,
    stats,
    loading,
    error,
    filters,

    // Getters
    totalPendingTasks,
    highPriorityTasks,
    expedienteStats,
    hasData,

    // Actions
    fetchDashboardData,
    setFilters,
    refreshDashboard,
  }
})
