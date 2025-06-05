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
    limit: 20,
    search: '',
    type: undefined,
    status: undefined,
  })
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const statistics = ref<NewsStatistics | null>(null)

  // Getters
  const totalNews = computed(() => pagination.value.total)

  const newsByStatus = computed(() => {
    const grouped: Record<NewsStatus, News[]> = {
      draft: [],
      pending_director: [],
      pending_president: [],
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
      (n) => n.status === 'pending_director' || n.status === 'pending_president',
    ),
  )
  const publishedNews = computed(() => newsList.value.filter((n) => n.status === 'published'))

  // Actions - Public
  const fetchPublicNews = async (customFilters?: NewsFilters) => {
    loading.value = true
    error.value = null

    try {
      const finalFilters = { ...filters.value, ...customFilters }
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

  // Actions - Authenticated
  const fetchNews = async (customFilters?: NewsFilters) => {
    loading.value = true
    error.value = null

    try {
      const finalFilters = { ...filters.value, ...customFilters }
      const response = await newsService.getNews(finalFilters)

      if (response.success) {
        newsList.value = response.data
        pagination.value = response.pagination
        return { success: true }
      }

      return { success: false, message: response.message || 'Error al cargar noticias' }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar noticias'
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
        // Agregar la nueva noticia a la lista
        newsList.value.unshift(response.data)
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
        // Actualizar en la lista
        const index = newsList.value.findIndex((n) => n.id === id)
        if (index !== -1) {
          newsList.value[index] = response.data
        }

        // Actualizar la noticia actual si es la misma
        if (currentNews.value?.id === id) {
          currentNews.value = response.data
        }

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
        // Eliminar de la lista
        newsList.value = newsList.value.filter((n) => n.id !== id)

        // Limpiar si es la noticia actual
        if (currentNews.value?.id === id) {
          currentNews.value = null
        }

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
        await fetchNewsById(id)
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
        await fetchNewsById(id)
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
        await fetchNewsById(id)
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
        await fetchNewsById(id)
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

  // Actions - Statistics
  const fetchStatistics = async () => {
    try {
      const response = await newsService.getStatistics()

      if (response.success && response.data) {
        statistics.value = response.data
        return { success: true, data: response.data }
      }

      return { success: false, message: response.message }
    } catch (err: any) {
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
      limit: 20,
      search: '',
      type: undefined,
      status: undefined,
    }
  }

  const clearCurrentNews = () => {
    currentNews.value = null
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
  }
})
