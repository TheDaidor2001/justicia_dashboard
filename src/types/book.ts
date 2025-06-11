export interface Book {
  id: string
  title: string
  description?: string
  author: string
  tags: string[]
  type: BookType
  coverImageUrl?: string | null
  coverImagePublicId?: string | null
  fileUrl: string
  filePublicId: string
  fileSize?: number
  fileType?: string
  uploadedBy: string
  viewCount?: number
  downloadCount?: number
  isPublic: boolean
  createdAt: string
  updatedAt: string
  uploader?: {
    id: string
    fullName: string
    email: string
  }
}

export type BookType = 'codigo_legal' | 'tratado' | 'manual' | 'libro'

export interface BookFilters {
  search?: string
  type?: BookType
  isPublic?: boolean
}

export interface BookListResponse {
  success: boolean
  message?: string
  data: Book[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateBookRequest {
  title: string
  description?: string
  author: string
  tags: string[]
  type: BookType
  cover?: File
  file: File
  isPublic?: boolean
}

export interface UpdateBookRequest {
  title?: string
  description?: string
  author?: string
  tags?: string[]
  type?: BookType
  isPublic?: boolean
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export const BOOK_TYPE_LABELS: Record<BookType, string> = {
  codigo_legal: 'Código Legal',
  tratado: 'Tratado',
  manual: 'Manual',
  libro: 'Libro',
}

export const BOOK_TYPE_COLORS: Record<BookType, string> = {
  codigo_legal: 'danger',
  tratado: 'primary',
  manual: 'success',
  libro: 'info',
}

// Tipos de archivo permitidos
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/epub+zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const ALLOWED_COVER_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const MAX_COVER_SIZE = 5 * 1024 * 1024 // 5MB
