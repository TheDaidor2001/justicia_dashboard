import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useBooksStore } from '@/stores/books'
import { useAuth } from '@/composables/useAuth'
import type { Book, BookType, BookFilters, CreateBookRequest } from '@/types/book'
import {
  ALLOWED_FILE_TYPES,
  ALLOWED_COVER_TYPES,
  MAX_FILE_SIZE,
  MAX_COVER_SIZE,
} from '@/types/book'

export const useBooks = () => {
  const booksStore = useBooksStore()
  const { user, userRole } = useAuth()

  // Estado del store con reactividad preservada
  const {
    books,
    currentBook,
    bookStats,
    filters,
    pagination,
    loading,
    uploading,
    error,
    publicBooks,
    privateBooks,
    booksByType,
    filteredBooks,
  } = storeToRefs(booksStore)

  // Permisos - Solo admins pueden gestionar biblioteca según los endpoints especificados
  const canViewBooks = computed(() => {
    return userRole.value === 'admin'
  })

  const canCreateBooks = computed(() => {
    return userRole.value === 'admin'
  })

  const canEditBooks = computed(() => {
    return userRole.value === 'admin'
  })

  const canDeleteBooks = computed(() => {
    return userRole.value === 'admin'
  })

  const canDownloadBooks = computed(() => {
    return userRole.value === 'admin'
  })

  const canViewBookDetail = computed(() => (targetBook: Book) => {
    return userRole.value === 'admin'
  })

  const canEditBook = computed(() => (targetBook: Book) => {
    return userRole.value === 'admin'
  })

  const canDeleteBook = computed(() => (targetBook: Book) => {
    return userRole.value === 'admin'
  })

  // Validaciones
  const validateBookData = (bookData: Partial<CreateBookRequest>) => {
    const errors: Record<string, string> = {}

    if (!bookData.title?.trim()) {
      errors.title = 'El título es requerido'
    } else if (bookData.title.length < 3) {
      errors.title = 'El título debe tener al menos 3 caracteres'
    }

    if (!bookData.author?.trim()) {
      errors.author = 'El autor es requerido'
    } else if (bookData.author.length < 3) {
      errors.author = 'El autor debe tener al menos 3 caracteres'
    }

    if (!bookData.type) {
      errors.type = 'El tipo de libro es requerido'
    }

    if (!bookData.file) {
      errors.file = 'El archivo es requerido'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  const validateFile = (file: File, type: 'document' | 'cover') => {
    if (type === 'document') {
      return validateDocumentFile(file)
    } else {
      return validateCoverFile(file)
    }
  }

  const validateDocumentFile = (file: File) => {
    const errors: string[] = []

    if (!file) {
      errors.push('No se ha seleccionado ningún archivo')
    } else {
      if (file.size > MAX_FILE_SIZE) {
        const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024))
        errors.push(`El archivo es demasiado grande. Máximo permitido: ${maxSizeMB}MB`)
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push('Tipo de archivo no permitido. Use PDF, EPUB, DOC o DOCX')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  const validateCoverFile = (file: File) => {
    const errors: string[] = []

    if (file) {
      if (file.size > MAX_COVER_SIZE) {
        const maxSizeMB = Math.round(MAX_COVER_SIZE / (1024 * 1024))
        errors.push(`La imagen es demasiado grande. Máximo permitido: ${maxSizeMB}MB`)
      }

      if (!ALLOWED_COVER_TYPES.includes(file.type)) {
        errors.push('Tipo de imagen no permitido. Use JPG, PNG o WebP')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Utilidades
  const getBooksByType = (type: BookType) => {
    return books.value.filter((book) => book.type === type)
  }

  const getBookTypeLabel = (type: BookType) => {
    const labels: Record<BookType, string> = {
      codigo_legal: 'Código Legal',
      tratado: 'Tratado',
      manual: 'Manual',
      libro: 'Libro',
    }
    return labels[type] || type
  }

  const getBookTypeColor = (type: BookType) => {
    const colors: Record<BookType, string> = {
      codigo_legal: 'danger',
      tratado: 'primary',
      manual: 'success',
      libro: 'info',
    }
    return colors[type] || 'secondary'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE'
  }

  const isImageFile = (filename: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const extension = filename.split('.').pop()?.toLowerCase()
    return extension ? imageExtensions.includes(extension) : false
  }

  const isPdfFile = (filename: string) => {
    return filename.toLowerCase().endsWith('.pdf')
  }

  // Búsqueda con debounce
  const searchBooks = async (query: string, searchFilters?: Partial<BookFilters>) => {
    if (query.length < 2) return []

    try {
      const results = await booksStore.searchBooks(query, searchFilters)
      return results || []
    } catch (error) {
      console.error('Error searching books:', error)
      return []
    }
  }

  // Funciones de formateo de tags
  const formatTags = (tags: string[]) => {
    return tags.join(', ')
  }

  const parseTags = (tagsString: string): string[] => {
    return tagsString
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
  }

  // Métodos de acción del store
  const {
    fetchBooks,
    fetchBookById,
    createBook,
    updateBook,
    deleteBook,
    downloadBook,
    fetchBookStats,
    setFilters,
    resetFilters,
    setPagination,
    clearError,
    clearCurrentBook,
  } = booksStore

  return {
    // Estado
    books,
    currentBook,
    bookStats,
    filters,
    pagination,
    loading,
    uploading,
    error,
    publicBooks,
    privateBooks,
    booksByType,
    filteredBooks,

    // Permisos
    canViewBooks,
    canCreateBooks,
    canEditBooks,
    canDeleteBooks,
    canDownloadBooks,
    canViewBookDetail,
    canEditBook,
    canDeleteBook,

    // Validaciones
    validateBookData,
    validateFile,
    validateDocumentFile,
    validateCoverFile,

    // Utilidades
    getBooksByType,
    getBookTypeLabel,
    getBookTypeColor,
    formatFileSize,
    getFileExtension,
    isImageFile,
    isPdfFile,
    searchBooks,
    formatTags,
    parseTags,

    // Acciones
    fetchBooks,
    fetchBookById,
    createBook,
    updateBook,
    deleteBook,
    downloadBook,
    fetchBookStats,
    setFilters,
    resetFilters,
    setPagination,
    clearError,
    clearCurrentBook,
  }
}
