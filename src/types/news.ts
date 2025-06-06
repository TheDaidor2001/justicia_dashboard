// src/types/news.ts

export enum NewsType {
  NOTICIA = 'noticia',
  AVISO = 'aviso',
  COMUNICADO = 'comunicado',
}

export enum NewsStatus {
  DRAFT = 'draft',
  PENDING_DIRECTOR = 'pending_director_approval',
  PENDING_PRESIDENT = 'pending_president_approval',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
}

export interface News {
  id: string
  title: string
  subtitle?: string
  content: string
  type: NewsType
  status: NewsStatus
  slug: string
  imageUrl?: string
  imagePublicId?: string
  publishedAt?: string
  createdBy?: string // Puede venir del backend legacy
  authorId?: string // Nuevo campo del backend
  departmentId?: string
  rejectionReason?: string
  viewCount: number
  createdAt: string
  updatedAt: string

  // Relaciones opcionales
  creator?: {
    id: string
    fullName: string
    role: string
  }
  author?: {
    id: string
    fullName: string
    email: string
  }
  department?: {
    id: string
    name: string
  }
}

export interface CreateNewsDto {
  title: string
  subtitle?: string
  content: string
  type: NewsType
  image?: File
}

export interface UpdateNewsDto {
  title?: string
  subtitle?: string
  content?: string
  image?: File
}

export interface SubmitNewsDto {
  comments?: string
}

export interface ApproveNewsDto {
  comments?: string
}

export interface RejectNewsDto {
  comments: string // Requerido al rechazar
}

export interface CourtSubmissionDto {
  title: string
  content: string
  type: 'aviso' | 'comunicado' // Solo estos dos tipos desde juzgados
  image?: File
}

export interface NewsFilters {
  page?: number
  limit?: number
  search?: string
  type?: NewsType
  status?: NewsStatus
  departmentId?: string
  createdBy?: string
  authorId?: string
  dateFrom?: string
  dateTo?: string
  _t?: number
}

export interface NewsResponse {
  success: boolean
  message?: string
  data: News[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface NewsStatistics {
  total?: number
  byType?: {
    noticia?: number
    aviso?: number
    comunicado?: number
  }
  byStatus?: {
    draft?: number
    pending_director?: number
    pending_president?: number
    published?: number
    rejected?: number
  }
  publishedThisMonth?: number
  viewsThisMonth?: number
}

export interface NewsApprovalHistory {
  id: string
  action:
    | 'create'
    | 'submit'
    | 'approve_director'
    | 'approve_president'
    | 'reject'
    | 'publish'
    | 'edit'
    | 'submit_to_director'
    | 'submit_to_president'
    | 'submit_from_court'
  comments?: string
  createdAt: string
  fromStatus?: string | null
  toStatus?: string
  user: {
    id: string
    fullName: string
    role: string
  }
}

// Helpers para el frontend
export const getNewsTypeLabel = (type: NewsType): string => {
  const labels: Record<NewsType, string> = {
    [NewsType.NOTICIA]: 'Noticia',
    [NewsType.AVISO]: 'Aviso',
    [NewsType.COMUNICADO]: 'Comunicado',
  }
  return labels[type] || type
}

export const getNewsStatusLabel = (status: NewsStatus): string => {
  const labels: Record<NewsStatus, string> = {
    [NewsStatus.DRAFT]: 'Borrador',
    [NewsStatus.PENDING_DIRECTOR]: 'Pendiente Director',
    [NewsStatus.PENDING_PRESIDENT]: 'Pendiente Presidente',
    [NewsStatus.PUBLISHED]: 'Publicado',
    [NewsStatus.REJECTED]: 'Rechazado',
  }
  // También manejar los valores que vienen del backend directamente
  const directLabels: Record<string, string> = {
    draft: 'Borrador',
    pending_director_approval: 'Pendiente Director',
    pending_president_approval: 'Pendiente Presidente',
    published: 'Publicado',
    rejected: 'Rechazado',
  }

  return labels[status] || directLabels[status as string] || status
}

export const getNewsStatusBadge = (status: NewsStatus) => {
  const badges = {
    [NewsStatus.DRAFT]: { severity: 'secondary', label: 'Borrador', icon: 'pi-pencil' },
    [NewsStatus.PENDING_DIRECTOR]: {
      severity: 'warning',
      label: 'Pendiente Director',
      icon: 'pi-clock',
    },
    [NewsStatus.PENDING_PRESIDENT]: {
      severity: 'info',
      label: 'Pendiente Presidente',
      icon: 'pi-user',
    },
    [NewsStatus.PUBLISHED]: { severity: 'success', label: 'Publicado', icon: 'pi-check' },
    [NewsStatus.REJECTED]: { severity: 'danger', label: 'Rechazado', icon: 'pi-times' },
  }

  // También manejar los valores que vienen del backend directamente
  const directBadges: Record<string, any> = {
    draft: { severity: 'secondary', label: 'Borrador', icon: 'pi-pencil' },
    pending_director_approval: {
      severity: 'warning',
      label: 'Pendiente Director',
      icon: 'pi-clock',
    },
    pending_president_approval: {
      severity: 'info',
      label: 'Pendiente Presidente',
      icon: 'pi-user',
    },
    published: { severity: 'success', label: 'Publicado', icon: 'pi-check' },
    rejected: { severity: 'danger', label: 'Rechazado', icon: 'pi-times' },
  }

  return badges[status] || directBadges[status as string] || badges[NewsStatus.DRAFT]
}

export const getNewsTypeColor = (type: NewsType): string => {
  const colors: Record<NewsType, string> = {
    [NewsType.NOTICIA]: 'blue',
    [NewsType.AVISO]: 'orange',
    [NewsType.COMUNICADO]: 'purple',
  }
  return colors[type] || 'gray'
}
