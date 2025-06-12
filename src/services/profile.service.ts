import apiClient from '@/api/axios'
import type {
  UserProfile,
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserActivity,
  UserStats,
  UserNotification,
  ActiveSession,
  DepartmentInfo,
} from '@/types/profile'

export const profileService = {
  // Obtener perfil del usuario
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get('/auth/profile')
    return response.data.data
  },

  // Actualizar perfil del usuario
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await apiClient.put('/auth/profile', data)
    return response.data
  },

  // Cambiar contraseña
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.put('/auth/change-password', data)
  },

  // Obtener actividad del usuario
  async getUserActivity(userId: number): Promise<UserActivity[]> {
    const response = await apiClient.get(`/audit/user/${userId}`)
    return response.data
  },

  // Obtener estadísticas del usuario según su rol
  async getUserStats(userId: number, role: string): Promise<UserStats> {
    let endpoint = ''
    const params: Record<string, any> = {}

    switch (role) {
      case 'juez':
        endpoint = '/expedientes'
        params.userId = userId
        params.status = 'draft,pending_approval,approved,rejected'
        break
      case 'presidente_audiencia':
        endpoint = '/expedientes'
        params.departmentId = 'myDeptId' // Se debe obtener del contexto del usuario
        params.status = 'pending_approval'
        break
      case 'director_prensa':
      case 'tecnico_prensa':
        endpoint = '/news'
        params.authorId = userId
        break
      case 'secretario_adjunto':
        endpoint = '/contact'
        params.assignedTo = userId
        break
      default:
        throw new Error('Rol no soportado para estadísticas')
    }

    const response = await apiClient.get(endpoint, { params })
    return this.processStatsData(response.data, role)
  },

  // Procesar datos de estadísticas según el rol
  processStatsData(data: any[], role: string): UserStats {
    const stats: UserStats = {}

    switch (role) {
      case 'juez':
        stats.juez = {
          totalExpedientes: data.length,
          expedientesBorrador: data.filter((item) => item.status === 'draft').length,
          expedientesPendientes: data.filter((item) => item.status === 'pending_approval').length,
          expedientesAprobados: data.filter((item) => item.status === 'approved').length,
          expedientesRechazados: data.filter((item) => item.status === 'rejected').length,
        }
        break
      case 'presidente_audiencia':
        const currentMonth = new Date().getMonth()
        const approvedThisMonth = data.filter(
          (item) =>
            item.status === 'approved' && new Date(item.approvedAt).getMonth() === currentMonth,
        )
        stats.presidenteAudiencia = {
          expedientesPendientes: data.filter((item) => item.status === 'pending_approval').length,
          expedientesAprobadosMes: approvedThisMonth.length,
          tiempoPromedioAprobacion: this.calculateAverageApprovalTime(approvedThisMonth),
        }
        break
      case 'director_prensa':
      case 'tecnico_prensa':
        stats.directorPrensa = {
          noticiasPublicadas: data.filter((item) => item.status === 'published').length,
          noticiasBorrador: data.filter((item) => item.status === 'draft').length,
          noticiasPendientes: data.filter((item) => item.status === 'pending_approval').length,
        }
        break
      case 'secretario_adjunto':
        const respondidos = data.filter((item) => item.status === 'responded')
        stats.secretarioAdjunto = {
          mensajesAsignados: data.length,
          mensajesRespondidos: respondidos.length,
          tiempoPromedioRespuesta: this.calculateAverageResponseTime(respondidos),
        }
        break
    }

    return stats
  },

  // Calcular tiempo promedio de aprobación
  calculateAverageApprovalTime(items: any[]): number {
    if (items.length === 0) return 0
    const totalHours = items.reduce((sum, item) => {
      const created = new Date(item.createdAt)
      const approved = new Date(item.approvedAt)
      return sum + (approved.getTime() - created.getTime()) / (1000 * 60 * 60)
    }, 0)
    return Math.round(totalHours / items.length)
  },

  // Calcular tiempo promedio de respuesta
  calculateAverageResponseTime(items: any[]): number {
    if (items.length === 0) return 0
    const totalHours = items.reduce((sum, item) => {
      const created = new Date(item.createdAt)
      const responded = new Date(item.respondedAt)
      return sum + (responded.getTime() - created.getTime()) / (1000 * 60 * 60)
    }, 0)
    return Math.round(totalHours / items.length)
  },

  // Obtener notificaciones no leídas
  async getUnreadNotifications(): Promise<UserNotification[]> {
    const response = await apiClient.get('/notifications?status=unread')
    return response.data
  },

  // Marcar notificación como leída
  async markNotificationAsRead(notificationId: number): Promise<void> {
    await apiClient.put(`/notifications/${notificationId}/read`)
  },

  // Obtener sesiones activas desde el perfil
  async getActiveSessions(): Promise<ActiveSession[]> {
    const response = await apiClient.get('/auth/profile')
    return response.data.data?.activeSessions || []
  },

  // Cerrar sesión remota
  async closeRemoteSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/auth/sessions/${sessionId}`)
  },

  // Obtener información del departamento
  async getDepartmentInfo(departmentId: number): Promise<DepartmentInfo> {
    const response = await apiClient.get(`/departments/${departmentId}`)
    return response.data
  },
}
