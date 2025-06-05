import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { LoginCredentials } from '@/types/auth'

export const useAuth = () => {
  const authStore = useAuthStore()
  const router = useRouter()

  // Inicializar auth al montar
  onMounted(() => {
    authStore.initializeAuth()
  })

  // Login
  const login = async (credentials: LoginCredentials) => {
    const result = await authStore.login(credentials)

    if (result.success) {
      // Redirigir según el rol
      const role = result.user?.role
      await router.push('/dashboard')
    }

    return result
  }

  // Logout
  const logout = async () => {
    await authStore.logout()
    await router.push('/login')
  }

  // Verificar permisos
  const hasPermission = (requiredRoles: string | string[]): boolean => {
    const userRole = authStore.userRole

    if (!userRole) return false

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

    return roles.includes(userRole)
  }

  // Verificar si puede aprobar expedientes
  const canApproveExpedientes = computed(() => {
    return hasPermission(['presidente_audiencia', 'secretario_general', 'admin'])
  })

  // Verificar si puede crear expedientes
  const canCreateExpedientes = computed(() => {
    return hasPermission(['juez', 'admin'])
  })

  // Verificar si puede gestionar noticias
  const canManageNews = computed(() => {
    return hasPermission(['director_prensa', 'tecnico_prensa', 'presidente_cspj', 'admin'])
  })

  // Verificar si puede aprobar noticias como presidente
  const canApproveNewsAsPresident = computed(() => {
    return hasPermission(['presidente_cspj', 'admin'])
  })

  // Verificar si puede gestionar contactos
  const canManageContacts = computed(() => {
    return hasPermission([
      'secretario_adjunto',
      'secretario_general',
      'presidente_cspj',
      'vicepresidente_cspj',
      'admin',
    ])
  })

  // Verificar si puede ver auditorías
  const canViewAudits = computed(() => {
    return hasPermission(['admin', 'presidente_cspj', 'secretario_general'])
  })

  // Verificar si puede gestionar departamentos
  const canManageDepartments = computed(() => {
    return hasPermission(['admin', 'presidente_cspj'])
  })

  return {
    // Estado
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    loading: computed(() => authStore.loading),
    error: computed(() => authStore.error),

    // Información del usuario
    userName: computed(() => authStore.userName),
    userRole: computed(() => authStore.userRole),

    // Roles específicos
    isAdmin: computed(() => authStore.isAdmin),
    isJuez: computed(() => authStore.isJuez),
    isPresidenteAudiencia: computed(() => authStore.isPresidenteAudiencia),
    isSecretarioGeneral: computed(() => authStore.isSecretarioGeneral),

    // Permisos
    hasPermission,
    canApproveExpedientes,
    canCreateExpedientes,
    canManageNews,
    canApproveNewsAsPresident,
    canManageContacts,
    canViewAudits,
    canManageDepartments,

    // Acciones
    login,
    logout,
    updateProfile: authStore.updateProfile,
    changePassword: authStore.changePassword,
    initializeAuth: authStore.initializeAuth,
  }
}
