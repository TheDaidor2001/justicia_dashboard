import { api } from '@/api/axios'
import type {
  Book,
  BookFilters,
  Pagination,
  BookListResponse,
  CreateBookRequest,
  UpdateBookRequest,
} from '@/types/book'

export const booksService = {
  async getBooks(filters: BookFilters = {}, pagination: Pagination): Promise<BookListResponse> {
    const params = new URLSearchParams()

    // Agregar filtros
    if (filters.search) params.append('search', filters.search)
    if (filters.type) params.append('type', filters.type)
    if (filters.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString())

    // Agregar paginación
    params.append('page', pagination.page.toString())
    params.append('limit', pagination.limit.toString())

    const response = await api.get(`/books/public?${params.toString()}`)
    return response.data
  },

  async getBookById(id: string): Promise<Book> {
    const response = await api.get(`/books/${id}`)
    console.log('Raw API response for book:', response)
    
    // Si la respuesta viene envuelta en un objeto con success/data
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data
    }
    
    return response.data
  },

  async createBook(bookData: CreateBookRequest): Promise<Book> {
    const formData = new FormData()

    // Agregar campos de texto
    formData.append('title', bookData.title)
    formData.append('author', bookData.author)
    formData.append('type', bookData.type)

    if (bookData.description) {
      formData.append('description', bookData.description)
    }

    if (bookData.isPublic !== undefined) {
      formData.append('isPublic', bookData.isPublic.toString())
    }

    // Agregar tags como JSON string
    formData.append('tags', JSON.stringify(bookData.tags))

    // Agregar archivos
    formData.append('file', bookData.file)

    if (bookData.cover) {
      formData.append('cover', bookData.cover)
    }

    const response = await api.post('/books', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.data || response.data
  },

  async updateBook(id: string, bookData: UpdateBookRequest): Promise<Book> {
    const response = await api.put(`/books/${id}`, bookData)
    return response.data
  },

  async deleteBook(id: string): Promise<void> {
    await api.delete(`/books/${id}`)
  },

  async downloadBook(id: string): Promise<{ url: string; filename: string }> {
    const response = await api.get(`/books/${id}/download`)
    
    // El endpoint devuelve JSON con la URL de descarga
    if (response.data && response.data.data) {
      return response.data.data
    }
    
    return response.data
  },

  async getPopularTags(limit: number = 20): Promise<string[]> {
    const response = await api.get(`/books/tags/popular?limit=${limit}`)
    return response.data
  },

  // Búsqueda con debounce
  async searchBooks(query: string, filters?: Partial<BookFilters>): Promise<Book[]> {
    if (query.length < 2) return []

    const params = new URLSearchParams()
    params.append('search', query)
    params.append('limit', '10') // Limitar resultados para búsqueda

    if (filters?.type) params.append('type', filters.type)
    if (filters?.isPublic !== undefined) {
      params.append('isPublic', filters.isPublic.toString())
    }

    const response = await api.get(`/books/public?${params.toString()}`)
    return response.data?.data || []
  },

  // Validar archivo antes de subir
  validateFile(
    file: File,
    maxSize: number,
    allowedTypes: string[],
  ): {
    isValid: boolean
    error?: string
  } {
    if (!file) {
      return { isValid: false, error: 'No se ha seleccionado ningún archivo' }
    }

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      return {
        isValid: false,
        error: `El archivo es demasiado grande. Máximo permitido: ${maxSizeMB}MB`,
      }
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Tipo de archivo no permitido',
      }
    }

    return { isValid: true }
  },

  // Obtener URL temporal para vista previa de portada
  async getBookCoverUrl(bookId: string): Promise<string> {
    const response = await api.get(`/books/${bookId}/cover`)
    return response.data.url
  },
}
