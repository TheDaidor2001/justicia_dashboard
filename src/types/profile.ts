export interface UserProfile {
  id: number
  fullName: string
  email: string
  dni: string
  phone: string
  role: string
  department: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UpdateProfileRequest {
  fullName: string
  phone: string
  email?: string
}

export interface UserActivity {
  id: number
  action: string
  entity: string
  entityType: string
  timestamp: string
  description: string
}

export interface UserStats {
  juez?: {
    totalExpedientes: number
    expedientesBorrador: number
    expedientesPendientes: number
    expedientesAprobados: number
    expedientesRechazados: number
  }
  presidenteAudiencia?: {
    expedientesPendientes: number
    expedientesAprobadosMes: number
    tiempoPromedioAprobacion: number
  }
  directorPrensa?: {
    noticiasPublicadas: number
    noticiasBorrador: number
    noticiasPendientes: number
  }
  secretarioAdjunto?: {
    mensajesAsignados: number
    mensajesRespondidos: number
    tiempoPromedioRespuesta: number
  }
}

export interface UserNotification {
  id: number
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  createdAt: string
}

export interface ActiveSession {
  id: string
  device: string
  browser: string
  ip: string
  lastActivity: string
  isCurrent: boolean
}

export interface DepartmentInfo {
  id: number
  name: string
  location: string
  phone: string
}