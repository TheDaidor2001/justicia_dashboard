import { api } from '@/api/axios'
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

export const userService = {
  async getUsers(filters: UserFilters = {}, pagination: Pagination): Promise<UserListResponse> {
    const params = new URLSearchParams()

    // Agregar filtros
    if (filters.search) params.append('search', filters.search)
    if (filters.departamento_id) params.append('departamento_id', filters.departamento_id)
    if (filters.rol) params.append('rol', filters.rol)
    if (filters.estado) params.append('estado', filters.estado)
    if (filters.es_asignable !== undefined)
      params.append('es_asignable', filters.es_asignable.toString())

    // Agregar paginación
    params.append('page', pagination.page.toString())
    params.append('limit', pagination.limit.toString())

    const response = await api.get(`/users?${params.toString()}`)
    return response.data
  },

  async getUserById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await api.post('/users', userData)
    return response.data
  },

  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    // Mapear los campos del formato español al formato inglés que espera el backend
    const mappedData: any = {}
    
    if (userData.nombre !== undefined) mappedData.fullName = userData.nombre
    if (userData.telefono !== undefined) mappedData.phone = userData.telefono
    if (userData.rol !== undefined) mappedData.role = userData.rol
    if (userData.departamento_id !== undefined) mappedData.departmentId = userData.departamento_id
    if (userData.permisos_especiales !== undefined) mappedData.permissions = userData.permisos_especiales
    if (userData.estado !== undefined) mappedData.isActive = userData.estado === 'activo'
    
    console.log('Mapped update data:', mappedData)
    
    const response = await api.put(`/users/${id}`, mappedData)
    return response.data
  },

  async toggleUserStatus(id: string, currentStatus: boolean): Promise<User> {
    const response = await api.put(`/users/${id}`, {
      isActive: !currentStatus,
    })
    return response.data
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`)
  },

  async getAssignableUsers(forModule?: string): Promise<User[]> {
    const params = new URLSearchParams()
    if (forModule) params.append('for_module', forModule)

    const response = await api.get(`/users/assignable?${params.toString()}`)
    return response.data
  },

  async getDepartments(): Promise<Department[]> {
    const response = await api.get('/departments')
    return response.data
  },

  async resetPassword(userId: string): Promise<void> {
    await api.post(`/users/${userId}/reset-password`)
  },

  async updateUserPermissions(userId: string, permissions: string[]): Promise<User> {
    const response = await api.put(`/users/${userId}/permissions`, {
      permisos_especiales: permissions,
    })
    return response.data
  },

  async uploadUserPhoto(userId: string, file: File): Promise<User> {
    const formData = new FormData()
    formData.append('photo', file)

    const response = await api.post(`/users/${userId}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async deleteUserPhoto(userId: string): Promise<User> {
    const response = await api.delete(`/users/${userId}/photo`)
    return response.data
  },

  async exportUsers(options: ExportOptions): Promise<Blob> {
    const params = new URLSearchParams()
    params.append('format', options.format)

    if (options.filters) {
      if (options.filters.search) params.append('search', options.filters.search)
      if (options.filters.departamento_id)
        params.append('departamento_id', options.filters.departamento_id)
      if (options.filters.rol) params.append('rol', options.filters.rol)
      if (options.filters.estado) params.append('estado', options.filters.estado)
      if (options.filters.es_asignable !== undefined) {
        params.append('es_asignable', options.filters.es_asignable.toString())
      }
    }

    if (options.columns) {
      params.append('columns', options.columns.join(','))
    }

    const response = await api.get(`/users/export?${params.toString()}`, {
      responseType: 'blob',
    })

    return response.data
  },

  async checkUserConstraints(userId: string): Promise<{
    can_deactivate: boolean
    pending_tasks: number
    assigned_contacts: number
    pending_expedientes: number
    is_last_admin: boolean
    warnings: string[]
  }> {
    const response = await api.get(`/users/${userId}/constraints`)
    return response.data
  },

  async reassignUserTasks(
    userId: string,
    targetUserId: string,
    taskTypes: string[],
  ): Promise<void> {
    await api.post(`/users/${userId}/reassign-tasks`, {
      target_user_id: targetUserId,
      task_types: taskTypes,
    })
  },

  async searchUsers(query: string, filters?: Partial<UserFilters>): Promise<User[]> {
    const params = new URLSearchParams()
    params.append('q', query)

    if (filters) {
      if (filters.departamento_id) params.append('departamento_id', filters.departamento_id)
      if (filters.rol) params.append('rol', filters.rol)
      if (filters.estado) params.append('estado', filters.estado)
      if (filters.es_asignable !== undefined) {
        params.append('es_asignable', filters.es_asignable.toString())
      }
    }

    const response = await api.get(`/users/search?${params.toString()}`)
    return response.data
  },

  async getUserWorkload(userId: string): Promise<{
    total_assigned: number
    pending_review: number
    completed_this_month: number
    workload_percentage: number
    can_assign_more: boolean
  }> {
    const response = await api.get(`/users/${userId}/workload`)
    return response.data
  },
}
