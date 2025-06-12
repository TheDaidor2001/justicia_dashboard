import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { profileService } from '@/services/profile.service'
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

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<UserProfile | null>(null)
  const userActivity = ref<UserActivity[]>([])
  const userStats = ref<UserStats>({})
  const notifications = ref<UserNotification[]>([])
  const activeSessions = ref<ActiveSession[]>([])
  const departmentInfo = ref<DepartmentInfo | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const unreadNotificationsCount = computed(() =>
    Array.isArray(notifications.value) ? notifications.value.filter((n) => !n.read).length : 0,
  )

  const userRole = computed(() => profile.value?.role || '')

  const isActive = computed(() => profile.value?.isActive || false)

  // Actions
  async function fetchProfile() {
    try {
      loading.value = true
      error.value = null
      profile.value = await profileService.getProfile()
    } catch (err: any) {
      error.value = err.message || 'Error al cargar el perfil'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(data: UpdateProfileRequest) {
    try {
      loading.value = true
      error.value = null
      profile.value = await profileService.updateProfile(data)
      return true
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar el perfil'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function changePassword(data: ChangePasswordRequest) {
    try {
      loading.value = true
      error.value = null
      await profileService.changePassword(data)
      return true
    } catch (err: any) {
      error.value = err.message || 'Error al cambiar la contraseña'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchUserActivity() {
    if (!profile.value) return

    try {
      loading.value = true
      error.value = null
      userActivity.value = await profileService.getUserActivity(profile.value.id)
    } catch (err: any) {
      error.value = err.message || 'Error al cargar la actividad'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchUserStats() {
    if (!profile.value) return

    try {
      loading.value = true
      error.value = null
      userStats.value = await profileService.getUserStats(profile.value.id, profile.value.role)
    } catch (err: any) {
      error.value = err.message || 'Error al cargar las estadísticas'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchNotifications() {
    try {
      loading.value = true
      error.value = null
      const result = await profileService.getUnreadNotifications()
      notifications.value = Array.isArray(result) ? result : []
    } catch (err: any) {
      error.value = err.message || 'Error al cargar las notificaciones'
      notifications.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  async function markNotificationAsRead(notificationId: number) {
    try {
      await profileService.markNotificationAsRead(notificationId)
      const notification = notifications.value.find((n) => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
    } catch (err: any) {
      error.value = err.message || 'Error al marcar la notificación como leída'
      throw err
    }
  }

  async function fetchActiveSessions() {
    try {
      loading.value = true
      error.value = null
      const result = await profileService.getActiveSessions()
      activeSessions.value = Array.isArray(result) ? result : []
    } catch (err: any) {
      error.value = err.message || 'Error al cargar las sesiones activas'
      activeSessions.value = []
      throw err
    } finally {
      loading.value = false
    }
  }

  async function closeRemoteSession(sessionId: string) {
    try {
      await profileService.closeRemoteSession(sessionId)
      activeSessions.value = activeSessions.value.filter((s) => s.id !== sessionId)
    } catch (err: any) {
      error.value = err.message || 'Error al cerrar la sesión'
      throw err
    }
  }

  async function fetchDepartmentInfo(departmentId: number) {
    try {
      loading.value = true
      error.value = null
      departmentInfo.value = await profileService.getDepartmentInfo(departmentId)
    } catch (err: any) {
      error.value = err.message || 'Error al cargar la información del departamento'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  function reset() {
    profile.value = null
    userActivity.value = []
    userStats.value = {}
    notifications.value = []
    activeSessions.value = []
    departmentInfo.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    profile,
    userActivity,
    userStats,
    notifications,
    activeSessions,
    departmentInfo,
    loading,
    error,

    // Computed
    unreadNotificationsCount,
    userRole,
    isActive,

    // Actions
    fetchProfile,
    updateProfile,
    changePassword,
    fetchUserActivity,
    fetchUserStats,
    fetchNotifications,
    markNotificationAsRead,
    fetchActiveSessions,
    closeRemoteSession,
    fetchDepartmentInfo,
    clearError,
    reset,
  }
})
