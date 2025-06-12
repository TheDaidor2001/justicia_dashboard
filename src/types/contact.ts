export type ContactStatus = 'pending' | 'in_progress' | 'resolved'

export interface Contact {
  id: string
  citizenName: string
  citizenDni: string
  citizenEmail: string
  citizenPhone?: string
  subject: string
  message: string
  attachmentUrl?: string
  attachmentName?: string
  status: ContactStatus
  assignedTo?: string
  assignedToName?: string
  createdAt: string
  updatedAt: string
  respondedAt?: string
  response?: string
}

export interface ContactFilters {
  status?: ContactStatus
  startDate?: string
  endDate?: string
  search?: string
  page?: number
  limit?: number
}

export interface ContactListResponse {
  contacts: Contact[]
  total: number
  currentPage: number
  totalPages: number
}

export interface ContactStatistics {
  total: number
  pending: number
  inProgress: number
  resolvedToday: number
  averageResponseTime: number // en horas
}

export interface UpdateContactStatusRequest {
  status: ContactStatus
}

export interface AssignContactRequest {
  userId: string
}

export interface RespondContactRequest {
  response: string
}

export interface ContactAction {
  id: string
  action: 'created' | 'assigned' | 'responded'
  description: string
  performedBy: string
  performedByName: string
  createdAt: string
}

export interface ContactDetail extends Contact {
  actions: ContactAction[]
}

export const ContactStatusLabels: Record<ContactStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En Proceso',
  resolved: 'Resuelto',
}

export const ContactStatusSeverities: Record<ContactStatus, 'warn' | 'info' | 'success'> = {
  pending: 'warn',
  in_progress: 'info',
  resolved: 'success',
}
