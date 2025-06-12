// src/stores/news.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { newsService } from '@/services/news.service'
import type {
  News,
  NewsFilters,
  NewsResponse,
  CreateNewsDto,
  UpdateNewsDto,
  SubmitNewsDto,
  ApproveNewsDto,
  RejectNewsDto,
  CourtSubmissionDto,
  NewsStatistics,
  NewsStatus,
  NewsType,
} from '@/types/news'

export const useNewsStore = defineStore('news', () => {
  // State
  const newsList = ref<News[]>([])
  const publicNewsList = ref<News[]>([])
  const currentNews = ref<News | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<NewsFilters>({
    page: 1,
    limit: 10,
    search: '',
    type: undefined,
    status: undefined,
    authorId: undefined,
  })
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const statistics = ref<NewsStatistics | null>(null)
  const needsRefresh = ref(false) // Flag para indicar si se necesita recarga

  // Getters
  const totalNews = computed(() => pagination.value.total)

  const newsByStatus = computed(() => {
    const grouped: Record<NewsStatus, News[]> = {
      draft: [],
      pending_director_approval: [],
      pending_president_approval: [],
      published: [],
      rejected: [],
    }

    newsList.value.forEach((news) => {
      if (grouped[news.status]) {
        grouped[news.status].push(news)
      }
    })

    return grouped
  })

  const newsByType = computed(() => {
    const grouped: Record<NewsType, News[]> = {
      noticia: [],
      aviso: [],
      comunicado: [],
    }

    newsList.value.forEach((news) => {
      if (grouped[news.type]) {
        grouped[news.type].push(news)
      }
    })

    return grouped
  })

  const draftNews = computed(() => newsList.value.filter((n) => n.status === 'draft'))
  const pendingNews = computed(() =>
    newsList.value.filter(
      (n) => n.status === 'pending_director_approval' || n.status === 'pending_president_approval',
    ),
  )
  const publishedNews = computed(() => newsList.value.filter((n) => n.status === 'published'))

  // Actions - Public
  const fetchPublicNews = async (customFilters?: NewsFilters) => {
    loading.value = true
    error.value = null

    try {
      const finalFilters = { ...filters.value, ...customFilters }

      // Limpiar filtros vacíos
      if (finalFilters.search === '') {
        delete finalFilters.search
      }
      if (!finalFilters.type) {
        delete finalFilters.type
      }
      if (!finalFilters.status) {
        delete finalFilters.status
      }

      const response = await newsService.getPublicNews(finalFilters)

      if (response.success) {
        publicNewsList.value = response.data
        pagination.value = response.pagination
        return { success: true }
      }

      return { success: false, message: response.message || 'Error al cargar noticias' }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar noticias públicas'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const fetchPublicNewsBySlug = async (slug: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await newsService.getPublicNewsBySlug(slug)

      if (response.success && response.data) {
        currentNews.value = response.data
        return { success: true, data: response.data }
      }

      return { success: false, message: response.message }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar noticia'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  // Control para evitar loops de peticiones
  let lastFetchTime = 0
  const MIN_FETCH_INTERVAL = 1000 // 1 segundo mínimo entre fetchNews

  // Actions - Authenticated
  const fetchNews = async (customFilters?: NewsFilters, forceRefresh = false) => {
    const now = Date.now()

    // Si es forzado, saltar las verificaciones de rate limit
    if (!forceRefresh) {
      // Evitar múltiples cargas simultáneas
      if (loading.value) {
        return { success: false, message: 'Ya hay una carga en progreso' }
      }

      // Rate limiting para evitar loops
      if (now - lastFetchTime < MIN_FETCH_INTERVAL) {
        return { success: false, message: 'Demasiadas peticiones frecuentes' }
      }
    }

    lastFetchTime = now

    loading.value = true
    error.value = null

    try {
      const finalFilters = { ...filters.value, ...customFilters }

      // Limpiar filtros vacíos para evitar enviar parámetros innecesarios
      if (finalFilters.search === '') {
        delete finalFilters.search
      }
      if (!finalFilters.type) {
        delete finalFilters.type
      }
      if (!finalFilters.status) {
        delete finalFilters.status
      }

      // Agregar timestamp para forzar recarga si es necesario
      if (forceRefresh) {
        finalFilters._t = now
      }

      const response = await newsService.getNews(finalFilters)

      if (response.success) {
        newsList.value = response.data
        pagination.value = response.pagination
        return { success: true }
      }

      return { success: false, message: response.message || 'Error al cargar noticias' }
    } catch (err: any) {
      // Si es un error de cancelación de axios, no mostrar error
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
        return { success: false, message: '', cancelled: true }
      }

      // Si es error de rate limit del servicio, no mostrar como error
      if (err.name === 'ServiceRateLimitError' || err.name === 'RateLimitError') {
        return { success: false, message: '', rateLimited: true }
      }

      // Si es error 429, mostrar mensaje más amigable
      if (err.response?.status === 429 || err.name === 'RateLimitExceededError') {
        error.value = 'Servidor sobrecargado. Espera un momento e intenta de nuevo.'
      } else {
        error.value = err.message || 'Error al cargar noticias'
      }
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const fetchNewsById = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await newsService.getNewsById(id)

      if (response.success && response.data) {
        currentNews.value = response.data
        return { success: true, data: response.data }
      }

      return { success: false, message: response.message }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar noticia'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const createNews = async (data: CreateNewsDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await newsService.createNews(data)

      if (response.success && response.data) {
        // Marcar que se necesita recarga en lugar de recargar inmediatamente
        markNeedsRefresh()
        return { success: true, data: response.data }
      }

      return { success: false, message: response.message || 'Error al crear noticia' }
    } catch (err: any) {
      error.value = err.message || 'Error al crear noticia'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateNews = async (id: string, data: UpdateNewsDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await newsService.updateNews(id, data)

      if (response.success && response.data) {
        // Actualizar la noticia actual si es la misma
        if (currentNews.value?.id === id) {
          currentNews.value = response.data
        }

        // Marcar que se necesita recarga en lugar de recargar inmediatamente
        markNeedsRefresh()

        return { success: true, data: response.data }
      }

      return { success: false, message: response.message || 'Error al actualizar noticia' }
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar noticia'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const deleteNews = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await newsService.deleteNews(id)

      if (response.success) {
        // Limpiar si es la noticia actual
        if (currentNews.value?.id === id) {
          currentNews.value = null
        }

        // Marcar que se necesita recarga en lugar de recargar inmediatamente
        markNeedsRefresh()

        return { success: true, message: 'Noticia eliminada correctamente' }
      }

      return { success: false, message: response.message }
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar noticia'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  // Actions - Approval Flow
  const submitToDirector = async (id: string, data?: SubmitNewsDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await newsService.submitToDirector(id, data)

      if (response.success) {
        // Eliminar de la lista local ya que el usuario no debe verlo más
        newsList.value = newsList.value.filter((news) => news.id !== id)

        // Actualizar paginación
        if (pagination.value.total > 0) {
          pagination.value.total -= 1
        }

        return { success: true, message: 'Noticia enviada al director' }
      }

      return { success: false, message: response.message }
    } catch (err: any) {
      error.value = err.message || 'Error al enviar noticia'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const approveAsDirector = async (id: string, data?: ApproveNewsDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await newsService.approveAsDirector(id, data)

      if (response.success) {
        // Eliminar de la lista local ya que el director no debe verlo más
        // (va al presidente o se publica directamente)
        newsList.value = newsList.value.filter((news) => news.id !== id)

        // Actualizar paginación
        if (pagination.value.total > 0) {
          pagination.value.total -= 1
        }

        return { success: true, message: 'Noticia aprobada por director' }
      }

      return { success: false, message: response.message }
    } catch (err: any) {
      error.value = err.message || 'Error al aprobar noticia'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const approveAsPresident = async (id: string, data?: ApproveNewsDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await newsService.approveAsPresident(id, data)

      if (response.success) {
        // Eliminar de la lista local ya que el presidente no debe verlo más
        // (se publica y ya no está pendiente)
        newsList.value = newsList.value.filter((news) => news.id !== id)

        // Actualizar paginación
        if (pagination.value.total > 0) {
          pagination.value.total -= 1
        }

        return { success: true, message: 'Noticia aprobada y publicada' }
      }

      return { success: false, message: response.message }
    } catch (err: any) {
      error.value = err.message || 'Error al aprobar noticia'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const rejectNews = async (id: string, data: RejectNewsDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await newsService.rejectNews(id, data)

      if (response.success) {
        // Eliminar de la lista local ya que el usuario no debe verlo más
        // (vuelve al creador como rechazada)
        newsList.value = newsList.value.filter((news) => news.id !== id)

        // Actualizar paginación
        if (pagination.value.total > 0) {
          pagination.value.total -= 1
        }

        return { success: true, message: 'Noticia rechazada' }
      }

      return { success: false, message: response.message }
    } catch (err: any) {
      error.value = err.message || 'Error al rechazar noticia'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const submitFromCourt = async (data: CourtSubmissionDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await newsService.submitFromCourt(data)

      if (response.success && response.data) {
        // Marcar que se necesita recarga
        markNeedsRefresh()
        return { success: true, data: response.data }
      }

      return { success: false, message: response.message || 'Error al enviar' }
    } catch (err: any) {
      error.value = err.message || 'Error al enviar desde juzgado'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  // Control para estadísticas
  let lastStatsTime = 0
  const MIN_STATS_INTERVAL = 5000 // 5 segundos mínimo entre estadísticas

  // Actions - Statistics
  const fetchStatistics = async () => {
    const now = Date.now()

    // Rate limiting para estadísticas
    if (now - lastStatsTime < MIN_STATS_INTERVAL) {
      return { success: true, cached: true }
    }

    lastStatsTime = now

    try {
      const response = await newsService.getStatistics()

      if (response.success && response.data) {
        statistics.value = response.data
        return { success: true, data: response.data }
      }

      return { success: false, message: response.message }
    } catch (err: any) {
      // Si no hay estadísticas del backend, no hacer nada especial
      // El composable calculará las estadísticas desde los datos locales
      return { success: false, message: err.message }
    }
  }

  // Utility Actions
  const setFilters = (newFilters: Partial<NewsFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const resetFilters = () => {
    filters.value = {
      page: 1,
      limit: 10,
      search: '',
      type: undefined,
      status: undefined,
      authorId: undefined,
    }
  }

  const clearCurrentNews = () => {
    currentNews.value = null
  }

  // Funciones para el flag de recarga
  const markNeedsRefresh = () => {
    needsRefresh.value = true
  }

  const clearNeedsRefresh = () => {
    needsRefresh.value = false
  }

  const checkAndRefreshIfNeeded = async () => {
    if (needsRefresh.value) {
      await fetchNews(undefined, true) // Forzar recarga
      await fetchStatistics() // También actualizar estadísticas
      needsRefresh.value = false
      return true
    }
    return false
  }

  // Métodos especializados por rol
  const fetchMyNews = async (customFilters?: NewsFilters) => {
    loading.value = true
    error.value = null

    try {
      const finalFilters = { ...filters.value, ...customFilters }

      // Limpiar filtros vacíos
      if (finalFilters.search === '') {
        delete finalFilters.search
      }
      if (!finalFilters.type) {
        delete finalFilters.type
      }
      if (!finalFilters.status) {
        delete finalFilters.status
      }

      const response = await newsService.getMyNews(finalFilters)

      if (response.success) {
        newsList.value = response.data
        pagination.value = response.pagination
        return { success: true }
      }

      return { success: false, message: response.message || 'Error al cargar mis noticias' }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar mis noticias'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const fetchNewsPendingApproval = async (customFilters?: NewsFilters) => {
    loading.value = true
    error.value = null

    try {
      const finalFilters = { ...filters.value, ...customFilters }

      // Limpiar filtros vacíos
      if (finalFilters.search === '') {
        delete finalFilters.search
      }
      if (!finalFilters.type) {
        delete finalFilters.type
      }
      if (!finalFilters.status) {
        delete finalFilters.status
      }

      const response = await newsService.getNewsPendingApproval(finalFilters)

      if (response.success) {
        newsList.value = response.data
        pagination.value = response.pagination
        return { success: true }
      }

      return { success: false, message: response.message || 'Error al cargar noticias pendientes' }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar noticias pendientes'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const fetchNewsCreatedByMe = async (customFilters?: NewsFilters) => {
    loading.value = true
    error.value = null

    try {
      const finalFilters = { ...filters.value, ...customFilters }

      // Limpiar filtros vacíos
      if (finalFilters.search === '') {
        delete finalFilters.search
      }
      if (!finalFilters.type) {
        delete finalFilters.type
      }
      if (!finalFilters.status) {
        delete finalFilters.status
      }

      const response = await newsService.getNewsCreatedByMe(finalFilters)

      if (response.success) {
        newsList.value = response.data
        pagination.value = response.pagination
        return { success: true }
      }

      return { success: false, message: response.message || 'Error al cargar noticias creadas' }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar noticias creadas'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    newsList,
    publicNewsList,
    currentNews,
    loading,
    error,
    filters,
    pagination,
    statistics,
    needsRefresh,

    // Getters
    totalNews,
    newsByStatus,
    newsByType,
    draftNews,
    pendingNews,
    publishedNews,

    // Public Actions
    fetchPublicNews,
    fetchPublicNewsBySlug,

    // Authenticated Actions
    fetchNews,
    fetchNewsById,
    createNews,
    updateNews,
    deleteNews,

    // Approval Flow
    submitToDirector,
    approveAsDirector,
    approveAsPresident,
    rejectNews,
    submitFromCourt,

    // Statistics
    fetchStatistics,

    // Utilities
    setFilters,
    resetFilters,
    clearCurrentNews,
    markNeedsRefresh,
    clearNeedsRefresh,
    checkAndRefreshIfNeeded,

    // Role-based methods
    fetchMyNews,
    fetchNewsPendingApproval,
    fetchNewsCreatedByMe,
  }
})
