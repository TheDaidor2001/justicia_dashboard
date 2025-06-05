// Tipos para autenticación
export interface User {
  id: string
  email: string
  fullName: string
  dni: string
  phone: string
  role: UserRole
  departmentId: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export enum UserRole {
  ADMIN = 'admin',
  PRESIDENTE_CSPJ = 'presidente_cspj',
  VICEPRESIDENTE_CSPJ = 'vicepresidente_cspj',
  SECRETARIO_GENERAL = 'secretario_general',
  SECRETARIO_ADJUNTO = 'secretario_adjunto',
  PRESIDENTE_AUDIENCIA = 'presidente_audiencia',
  JUEZ = 'juez',
  DIRECTOR_PRENSA = 'director_prensa',
  TECNICO_PRENSA = 'tecnico_prensa',
  USUARIO_GENERAL = 'usuario_general',
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    user: User
    accessToken: string
    refreshToken: string
  }
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: Array<{
    field: string
    message: string
  }>
}
