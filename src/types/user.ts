export interface User {
  id: string
  email: string
  dni: string
  nombre: string
  telefono?: string
  rol: UserRole
  departamento_id: string
  departamento?: Department
  estado: 'activo' | 'inactivo'
  foto_perfil?: string
  fecha_creacion: string
  ultima_actividad?: string
  permisos_especiales?: string[]
  es_asignable: boolean
  carga_trabajo?: number
  tareas_pendientes?: number
  expedientes_pendientes?: number
  contactos_asignados?: number
}

export type UserRole =
  | 'admin'
  | 'presidente_cspj'
  | 'secretario_general'
  | 'juez'
  | 'presidente_audiencia'
  | 'director_prensa'
  | 'tecnico_prensa'

export interface Department {
  id: string
  nombre?: string
  name?: string
  descripcion?: string
  parent_id?: string
  nivel: number
  estado: 'activo' | 'inactivo'
  usuarios_count?: number
  children?: Department[]
}

export interface UserFilters {
  search?: string
  departamento_id?: string
  rol?: UserRole
  estado?: 'activo' | 'inactivo'
  es_asignable?: boolean
}

export interface UserPermission {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  modulo: string
}

export interface CreateUserRequest {
  email: string
  dni: string
  nombre: string
  telefono?: string
  rol: UserRole
  departamento_id: string
  password: string
}

export interface UpdateUserRequest {
  nombre?: string
  telefono?: string
  rol?: UserRole
  departamento_id?: string
  permisos_especiales?: string[]
  estado?: 'activo' | 'inactivo'
}

export interface UserListResponse {
  success?: boolean
  message?: string
  data?: User[]
  users?: User[] // Mantener por compatibilidad
  total?: number
  page?: number
  limit?: number
  total_pages?: number
}

export interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface ExportOptions {
  format: 'excel' | 'pdf'
  filters?: UserFilters
  columns?: string[]
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  presidente_cspj: 'Presidente CSPJ',
  secretario_general: 'Secretario General',
  juez: 'Juez',
  presidente_audiencia: 'Presidente de Audiencia',
  director_prensa: 'Director de Prensa',
  tecnico_prensa: 'Técnico de Prensa',
}

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  admin: 'danger',
  presidente_cspj: 'warn',
  secretario_general: 'info',
  juez: 'success',
  presidente_audiencia: 'secondary',
  director_prensa: 'primary',
  tecnico_prensa: 'contrast',
}

export const USER_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],
  presidente_cspj: ['users.view', 'expedientes.*', 'noticias.*', 'dashboard.view'],
  secretario_general: ['users.view', 'contactos.*', 'dashboard.view'],
  juez: ['expedientes.*', 'dashboard.view', 'profile.edit'],
  presidente_audiencia: ['expedientes.*', 'dashboard.view', 'profile.edit'],
  director_prensa: ['noticias.*', 'dashboard.view', 'profile.edit'],
  tecnico_prensa: ['noticias.create', 'noticias.edit', 'dashboard.view', 'profile.edit'],
}
