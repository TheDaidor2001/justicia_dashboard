import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  User,
  UserFilters,
  Pagination,
  UserListResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ExportOptions,
  Department,
} from '@/types/user'
import { userService } from '@/services/user.service'

export const useUserStore = defineStore('users', () => {
  // Estado
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const assignableUsers = ref<User[]>([])
  const departments = ref<Department[]>([])

  const filters = ref<UserFilters>({
    search: '',
    departamento_id: '',
    rol: undefined,
    estado: undefined,
    es_asignable: undefined,
  })

  const pagination = ref<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeUsers = computed(() => users.value.filter((user) => user.estado === 'activo'))

  const adminUsers = computed(() => users.value.filter((user) => user.rol === 'admin'))

  const filteredUsers = computed(() => {
    let filtered = users.value

    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          (user.nombre || '').toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          user.dni.includes(search),
      )
    }

    if (filters.value.departamento_id) {
      filtered = filtered.filter((user) => user.departamento_id === filters.value.departamento_id)
    }

    if (filters.value.rol) {
      filtered = filtered.filter((user) => user.rol === filters.value.rol)
    }

    if (filters.value.estado) {
      filtered = filtered.filter((user) => user.estado === filters.value.estado)
    }

    if (filters.value.es_asignable !== undefined) {
      filtered = filtered.filter((user) => user.es_asignable === filters.value.es_asignable)
    }

    return filtered
  })

  // Acciones
  const fetchUsers = async (
    customFilters?: UserFilters,
    customPagination?: Partial<Pagination>,
  ) => {
    try {
      loading.value = true
      error.value = null

      const requestFilters = { ...filters.value, ...customFilters }
      const requestPagination = { ...pagination.value, ...customPagination }

      const response: UserListResponse = await userService.getUsers(
        requestFilters,
        requestPagination,
      )

      // La API devuelve {success: true, data: Array} en lugar de {users: Array}
      const responseData = response.data || response.users || []
      users.value = Array.isArray(responseData) ? responseData : []

      // Si no viene paginación, calcular basándose en los datos
      pagination.value = {
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || users.value.length,
        total_pages:
          response.total_pages ||
          Math.ceil((response.total || users.value.length) / (response.limit || 10)),
      }
    } catch (err: any) {
      users.value = [] // Asegurar que users sea un array vacío en caso de error
      error.value = err.message || 'Error al cargar usuarios'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createUser = async (userData: CreateUserRequest) => {
    try {
      loading.value = true
      error.value = null

      const newUser = await userService.createUser(userData)
      users.value.unshift(newUser)

      return newUser
    } catch (err: any) {
      error.value = err.message || 'Error al crear usuario'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateUser = async (id: string, userData: UpdateUserRequest) => {
    try {
      loading.value = true
      error.value = null

      const updatedUser = await userService.updateUser(id, userData)

      const index = users.value.findIndex((user) => user.id === id)
      if (index !== -1) {
        users.value[index] = updatedUser
      }

      if (currentUser.value?.id === id) {
        currentUser.value = updatedUser
      }

      return updatedUser
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar usuario'
      throw err
    } finally {
      loading.value = false
    }
  }

  const toggleUserStatus = async (id: string) => {
    try {
      loading.value = true
      error.value = null

      const user = users.value.find((u) => u.id === id)
      if (!user) throw new Error('Usuario no encontrado')

      // Determinar el estado actual
      const currentStatus = user.estado === 'activo' || user.isActive === true

      // Validaciones antes de desactivar
      if (currentStatus) {
        // Verificar que no sea el único admin
        if (user.rol === 'admin' || user.role === 'admin') {
          const activeAdmins = adminUsers.value.filter(
            (u) => (u.estado === 'activo' || u.isActive === true) && u.id !== id,
          )
          if (activeAdmins.length === 0) {
            throw new Error('No se puede desactivar el último administrador del sistema')
          }
        }

        // Verificar tareas pendientes
        if (user.tareas_pendientes && user.tareas_pendientes > 0) {
          throw new Error(
            `El usuario tiene ${user.tareas_pendientes} tareas pendientes. Debe reasignarlas antes de desactivarlo.`,
          )
        }
      }

      const updatedUser = await userService.toggleUserStatus(id, currentStatus)

      const index = users.value.findIndex((u) => u.id === id)
      if (index !== -1) {
        users.value[index] = updatedUser
      }

      return updatedUser
    } catch (err: any) {
      error.value = err.message || 'Error al cambiar estado del usuario'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteUser = async (id: string) => {
    try {
      loading.value = true
      error.value = null

      const user = users.value.find((u) => u.id === id)
      if (!user) throw new Error('Usuario no encontrado')

      // Desactivar el usuario directamente
      await userService.updateUser(id, { isActive: false })

      // Actualizar en el store
      const index = users.value.findIndex((u) => u.id === id)
      if (index !== -1) {
        users.value[index] = { ...users.value[index], isActive: false, estado: 'inactivo' }
      }

      return users.value[index]
    } catch (err: any) {
      error.value = err.message || 'Error al desactivar usuario'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchAssignableUsers = async (forModule?: string) => {
    try {
      loading.value = true
      error.value = null

      const users = await userService.getAssignableUsers(forModule)
      assignableUsers.value = users

      return users
    } catch (err: any) {
      error.value = err.message || 'Error al cargar usuarios asignables'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchDepartments = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await userService.getDepartments()

      // Intentar diferentes estructuras de respuesta
      let departmentData = response
      if (response?.success && response?.data) {
        departmentData = response.data
      } else if (response?.data) {
        departmentData = response.data
      } else if (response?.departments) {
        departmentData = response.departments
      } else if (Array.isArray(response)) {
        departmentData = response
      }

      departments.value = Array.isArray(departmentData) ? departmentData : []

      return departments.value
    } catch (err: any) {
      departments.value = []
      error.value = err.message || 'Error al cargar departamentos'
      throw err
    } finally {
      loading.value = false
    }
  }

  const resetPassword = async (userId: string) => {
    try {
      loading.value = true
      error.value = null

      await userService.resetPassword(userId)
    } catch (err: any) {
      error.value = err.message || 'Error al restablecer contraseña'
      throw err
    } finally {
      loading.value = false
    }
  }

  const checkUserConstraints = async (userId: string) => {
    try {
      return await userService.checkUserConstraints(userId)
    } catch (err: any) {
      error.value = err.message || 'Error al verificar restricciones'
      throw err
    }
  }

  const searchUsers = async (query: string, searchFilters?: Partial<UserFilters>) => {
    try {
      return await userService.searchUsers(query, searchFilters)
    } catch (err: any) {
      error.value = err.message || 'Error en búsqueda'
      throw err
    }
  }

  const exportUsers = async (options: ExportOptions) => {
    try {
      loading.value = true
      error.value = null

      const blob = await userService.exportUsers(options)

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `usuarios.${options.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      error.value = err.message || 'Error al exportar usuarios'
      throw err
    } finally {
      loading.value = false
    }
  }

  const setFilters = (newFilters: Partial<UserFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const resetFilters = () => {
    filters.value = {
      search: '',
      departamento_id: '',
      rol: undefined,
      estado: undefined,
      es_asignable: undefined,
    }
  }

  const setPagination = (newPagination: Partial<Pagination>) => {
    pagination.value = { ...pagination.value, ...newPagination }
  }

  const clearError = () => {
    error.value = null
  }

  const fetchUserById = async (id: string) => {
    try {
      loading.value = true
      error.value = null

      const user = await userService.getUserById(id)
      currentUser.value = user

      return user
    } catch (err: any) {
      error.value = err.message || 'Error al cargar usuario'
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearCurrentUser = () => {
    currentUser.value = null
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

    // Getters
    activeUsers,
    adminUsers,
    filteredUsers,

    // Acciones
    fetchUsers,
    fetchUserById,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    fetchAssignableUsers,
    fetchDepartments,
    resetPassword,
    checkUserConstraints,
    searchUsers,
    exportUsers,
    setFilters,
    resetFilters,
    setPagination,
    clearError,
    clearCurrentUser,
  }
})
