import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Book,
  BookFilters,
  Pagination,
  BookListResponse,
  CreateBookRequest,
  UpdateBookRequest,
  BookType,
} from '@/types/book'
import { booksService } from '@/services/books.service'

export const useBooksStore = defineStore('books', () => {
  // Estado
  const books = ref<Book[]>([])
  const currentBook = ref<Book | null>(null)
  const popularTags = ref<string[]>([])

  const filters = ref<BookFilters>({
    search: '',
    type: undefined,
    isPublic: undefined,
  })

  const pagination = ref<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const loading = ref(false)
  const uploading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const publicBooks = computed(() => books.value.filter((book) => book.isPublic))
  const privateBooks = computed(() => books.value.filter((book) => !book.isPublic))

  const booksByType = computed(() => {
    const grouped: Record<BookType, Book[]> = {
      codigo_legal: [],
      tratado: [],
      manual: [],
      libro: [],
    }

    books.value.forEach((book) => {
      if (grouped[book.type]) {
        grouped[book.type].push(book)
      }
    })

    return grouped
  })

  const filteredBooks = computed(() => {
    let filtered = books.value

    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(search) ||
          book.author.toLowerCase().includes(search) ||
          book.tags.some((tag) => tag.toLowerCase().includes(search)),
      )
    }

    if (filters.value.type) {
      filtered = filtered.filter((book) => book.type === filters.value.type)
    }

    if (filters.value.isPublic !== undefined) {
      filtered = filtered.filter((book) => book.isPublic === filters.value.isPublic)
    }

    return filtered
  })

  // Acciones
  const fetchBooks = async (
    customFilters?: BookFilters,
    customPagination?: Partial<Pagination>,
  ) => {
    try {
      loading.value = true
      error.value = null

      const requestFilters = { ...filters.value, ...customFilters }
      const requestPagination = { ...pagination.value, ...customPagination }

      const response: BookListResponse = await booksService.getBooks(
        requestFilters,
        requestPagination,
      )

      books.value = response.data || []
      pagination.value = {
        page: response.page || 1,
        limit: response.limit || 20,
        total: response.total || 0,
        totalPages: response.totalPages || 0,
      }
    } catch (err: any) {
      books.value = []
      error.value = err.message || 'Error al cargar libros'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchBookById = async (id: string) => {
    try {
      loading.value = true
      error.value = null

      const book = await booksService.getBookById(id)
      currentBook.value = book

      return book
    } catch (err: any) {
      error.value = err.message || 'Error al cargar libro'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createBook = async (bookData: CreateBookRequest) => {
    try {
      uploading.value = true
      error.value = null

      const newBook = await booksService.createBook(bookData)
      books.value.unshift(newBook)

      // Actualizar tags populares
      await fetchPopularTags()

      return newBook
    } catch (err: any) {
      error.value = err.message || 'Error al crear libro'
      throw err
    } finally {
      uploading.value = false
    }
  }

  const updateBook = async (id: string, bookData: UpdateBookRequest) => {
    try {
      loading.value = true
      error.value = null

      const updatedBook = await booksService.updateBook(id, bookData)

      const index = books.value.findIndex((book) => book.id === id)
      if (index !== -1) {
        books.value[index] = updatedBook
      }

      if (currentBook.value?.id === id) {
        currentBook.value = updatedBook
      }

      return updatedBook
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar libro'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteBook = async (id: string) => {
    try {
      loading.value = true
      error.value = null

      await booksService.deleteBook(id)

      books.value = books.value.filter((book) => book.id !== id)

      if (currentBook.value?.id === id) {
        currentBook.value = null
      }

      // Actualizar tags populares
      await fetchPopularTags()
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar libro'
      throw err
    } finally {
      loading.value = false
    }
  }

  const downloadBook = async (book: Book) => {
    try {
      const blob = await booksService.downloadBook(book.id)

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // Determinar extensión del archivo
      const extension = book.file.split('.').pop() || 'pdf'
      const fileName = `${book.title.replace(/[^\w\s-]/g, '')}.${extension}`

      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      error.value = err.message || 'Error al descargar libro'
      throw err
    }
  }

  const searchBooks = async (query: string, searchFilters?: Partial<BookFilters>) => {
    try {
      const results = await booksService.searchBooks(query, searchFilters)
      return results
    } catch (err: any) {
      error.value = err.message || 'Error en búsqueda'
      throw err
    }
  }

  const fetchPopularTags = async (limit: number = 20) => {
    try {
      const tags = await booksService.getPopularTags(limit)
      popularTags.value = tags
      return tags
    } catch (err: any) {
      error.value = err.message || 'Error al cargar tags populares'
      throw err
    }
  }

  const setFilters = (newFilters: Partial<BookFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const resetFilters = () => {
    filters.value = {
      search: '',
      type: undefined,
      isPublic: undefined,
    }
  }

  const setPagination = (newPagination: Partial<Pagination>) => {
    pagination.value = { ...pagination.value, ...newPagination }
  }

  const clearError = () => {
    error.value = null
  }

  const clearCurrentBook = () => {
    currentBook.value = null
  }

  return {
    // Estado
    books,
    currentBook,
    popularTags,
    filters,
    pagination,
    loading,
    uploading,
    error,

    // Getters
    publicBooks,
    privateBooks,
    booksByType,
    filteredBooks,

    // Acciones
    fetchBooks,
    fetchBookById,
    createBook,
    updateBook,
    deleteBook,
    downloadBook,
    searchBooks,
    fetchPopularTags,
    setFilters,
    resetFilters,
    setPagination,
    clearError,
    clearCurrentBook,
  }
})
