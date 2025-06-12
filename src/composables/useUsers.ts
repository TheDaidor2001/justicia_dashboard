import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/users'
import { useAuth } from '@/composables/useAuth'
import type { User, UserRoleType, UserFilters } from '@/types/user'

export const useUsers = () => {
  const userStore = useUserStore()
  const { user, userRole } = useAuth()

  // Estado del store con reactividad preservada
  const {
    users,
    currentUser,
    assignableUsers,
    departments,
    filters,
    pagination,
    loading,
    error,
    activeUsers,
    adminUsers,
    filteredUsers,
  } = storeToRefs(userStore)

  // Permisos - Solo admins pueden gestionar usuarios según los endpoints especificados
  const canViewUsers = computed(() => {
    return userRole.value === 'admin'
  })

  const canEditUsers = computed(() => {
    return userRole.value === 'admin'
  })

  const canCreateUsers = computed(() => {
    return userRole.value === 'admin'
  })

  const canDeleteUsers = computed(() => {
    return userRole.value === 'admin'
  })

  const canManagePermissions = computed(() => {
    return userRole.value === 'admin'
  })

  const canViewUserDetail = computed(() => (targetUser: User) => {
    // Solo admins pueden ver detalles de usuarios
    return userRole.value === 'admin'
  })

  const canEditUser = computed(() => (targetUser: User) => {
    // Solo admins pueden editar usuarios
    return userRole.value === 'admin'
  })

  const canToggleUserStatus = computed(() => (targetUser: User) => {
    // Solo admins pueden cambiar estado de usuarios
    if (userRole.value !== 'admin') return false

    // No puede desactivarse a sí mismo
    if (user.value?.id === targetUser.id) return false

    return true
  })

  // Validaciones
  const validateUserDeactivation = async (userId: string) => {
    try {
      // Usar el servicio directamente en lugar del store
      const { userService } = await import('@/services/user.service')
      const constraints = await userService.checkUserConstraints(userId)

      if (!constraints?.can_deactivate) {
        const warnings = constraints?.warnings || []
        throw new Error(warnings.join('. '))
      }

      return constraints
    } catch (error) {
      throw error
    }
  }

  const validateUserData = (userData: Partial<User>) => {
    const errors: Record<string, string> = {}

    if (!userData.nombre?.trim()) {
      errors.nombre = 'El nombre es requerido'
    }

    if (!userData.email?.trim()) {
      errors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.email = 'El email no tiene un formato válido'
    }

    if (!userData.dni?.trim()) {
      errors.dni = 'El DNI es requerido'
    } else if (!/^\d{8}$/.test(userData.dni)) {
      errors.dni = 'El DNI debe tener 8 dígitos'
    }

    if (!userData.rol) {
      errors.rol = 'El rol es requerido'
    }

    if (!userData.departamento_id) {
      errors.departamento_id = 'El departamento es requerido'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  // Utilidades
  const getUserByRole = (role: UserRoleType) => {
    return users.value.filter((user: User) => user.rol === role)
  }

  const getUsersByDepartment = (departmentId: string) => {
    return users.value.filter((user: User) => user.departamento_id === departmentId)
  }

  const isUserAssignable = (user: User, forModule?: string) => {
    if (user.estado !== 'activo') return false
    if (!user.es_asignable) return false

    // Validar carga de trabajo
    if (user.carga_trabajo && user.carga_trabajo >= 100) return false

    // Validaciones específicas por módulo
    if (forModule === 'contactos') {
      return ['secretario_general', 'admin'].includes(user.rol)
    }

    if (forModule === 'expedientes') {
      return ['juez', 'presidente_audiencia', 'admin'].includes(user.rol)
    }

    if (forModule === 'noticias') {
      return ['director_prensa', 'tecnico_prensa', 'admin'].includes(user.rol)
    }

    return true
  }

  const formatUserFullName = (user: User) => {
    return user.nombre
  }

  const getUserRoleLabel = (role: UserRoleType) => {
    const labels: Record<UserRoleType, string> = {
      admin: 'Administrador',
      presidente_cspj: 'Presidente CSPJ',
      vicepresidente_cspj: 'Vicepresidente CSPJ',
      secretario_general: 'Secretario General',
      secretario_adjunto: 'Secretario Adjunto',
      juez: 'Juez',
      presidente_audiencia: 'Presidente de Audiencia',
      director_prensa: 'Director de Prensa',
      tecnico_prensa: 'Técnico de Prensa',
    }
    return labels[role] || role
  }

  const getUserRoleColor = (role: UserRoleType) => {
    const colors: Record<UserRoleType, string> = {
      admin: 'danger',
      presidente_cspj: 'warn',
      vicepresidente_cspj: 'warn',
      secretario_general: 'info',
      secretario_adjunto: 'info',
      juez: 'success',
      presidente_audiencia: 'secondary',
      director_prensa: 'primary',
      tecnico_prensa: 'contrast',
    }
    return colors[role] || 'secondary'
  }

  // Búsqueda con debounce
  const searchUsers = async (query: string, searchFilters?: Partial<UserFilters>) => {
    if (query.length < 2) return []

    try {
      const { userService } = await import('@/services/user.service')
      const results = await userService.searchUsers(query, searchFilters)
      return results || []
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  }

  // Removed watcher - filtering is handled by manual calls to fetchUsers

  // Métodos de acción del store (las funciones se obtienen directamente del store)
  const {
    fetchUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    fetchAssignableUsers,
    fetchDepartments,
    resetPassword,
    exportUsers,
    setFilters,
    resetFilters,
    setPage,
    setPagination,
    clearError,
    clearCurrentUser,
  } = userStore

  // Métodos para filtros con paginación del servidor
  const setSearchFilter = (search: string) => {
    setFilters({ search, page: 1 })
    fetchUsers()
  }

  const setRoleFilter = (rol: UserRoleType | undefined) => {
    setFilters({ rol, page: 1 })
    fetchUsers()
  }

  const setStatusFilter = (estado: 'activo' | 'inactivo' | undefined) => {
    setFilters({ estado, page: 1 })
    fetchUsers()
  }

  const setDepartmentFilter = (departamento_id: string | undefined) => {
    setFilters({ departamento_id, page: 1 })
    fetchUsers()
  }

  const setPageFilter = (page: number) => {
    setPage(page)
    fetchUsers()
  }

  const refreshUsers = () => {
    fetchUsers()
  }

  return {
    // Estado
    users,
    currentUser,
    assignableUsers,
    departments,
    filters,
    pagination,
    loading,
    error,
    activeUsers,
    adminUsers,
    filteredUsers,

    // Permisos
    canViewUsers,
    canEditUsers,
    canCreateUsers,
    canDeleteUsers,
    canManagePermissions,
    canViewUserDetail,
    canEditUser,
    canToggleUserStatus,

    // Validaciones
    validateUserDeactivation,
    validateUserData,

    // Utilidades
    getUserByRole,
    getUsersByDepartment,
    isUserAssignable,
    formatUserFullName,
    getUserRoleLabel,
    getUserRoleColor,
    searchUsers,

    // Acciones
    fetchUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    fetchAssignableUsers,
    fetchDepartments,
    resetPassword,
    exportUsers,
    setFilters,
    resetFilters,
    setPagination,
    clearError,
    clearCurrentUser,

    // Métodos de filtrado con paginación del servidor
    setSearchFilter,
    setRoleFilter,
    setStatusFilter,
    setDepartmentFilter,
    setPageFilter,
    refreshUsers,
  }
}
