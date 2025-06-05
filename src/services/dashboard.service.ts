// src/services/dashboard.service.ts

import axiosInstance from '@/api/axios'
import { API_ENDPOINTS } from '@/api/config'
import type { DashboardSummary, PendingTask, DashboardStats } from '@/types/dashboard'
import type { ApiResponse } from '@/types/auth'

export const dashboardService = {
  async getSummary(period: string = 'week'): Promise<ApiResponse<DashboardSummary>> {
    const { data } = await axiosInstance.get<ApiResponse<DashboardSummary>>(
      `${API_ENDPOINTS.DASHBOARD_SUMMARY}?period=${period}`,
    )
    return data
  },

  async getPendingTasks(): Promise<ApiResponse<PendingTask[]>> {
    const { data } = await axiosInstance.get<ApiResponse<PendingTask[]>>(
      API_ENDPOINTS.DASHBOARD_PENDING_TASKS,
    )
    return data
  },

  async getStatsByRole(): Promise<ApiResponse<DashboardStats[]>> {
    const { data } = await axiosInstance.get<ApiResponse<DashboardStats[]>>(
      API_ENDPOINTS.DASHBOARD_STATS_BY_ROLE,
    )
    return data
  },

  // Obtener estadísticas de expedientes directamente
  async getExpedientesStats(): Promise<ApiResponse<any>> {
    const { data } = await axiosInstance.get<ApiResponse<any>>(API_ENDPOINTS.EXPEDIENTES_STATS)
    return data
  },
}
