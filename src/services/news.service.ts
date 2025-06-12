// src/services/news.service.ts

import axiosInstance from '@/api/axios'
import { API_ENDPOINTS } from '@/api/config'
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
  NewsApprovalHistory,
} from '@/types/news'
import type { ApiResponse } from '@/types/auth'

// Cache para prevenir envíos duplicados
const pendingRequests = new Map<string, Promise<any>>()

// Rate limiting por endpoint
const lastRequestTime = new Map<string, number>()
const MIN_REQUEST_INTERVAL = 500 // 500ms mínimo entre peticiones al mismo endpoint

// Función para verificar rate limit
const checkRateLimit = (endpoint: string): void => {
  const now = Date.now()
  const lastTime = lastRequestTime.get(endpoint) || 0

  if (now - lastTime < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - (now - lastTime)
    const error = new Error(`Rate limit: wait ${waitTime}ms before next request to ${endpoint}`)
    error.name = 'ServiceRateLimitError'
    throw error
  }

  lastRequestTime.set(endpoint, now)
}

export const newsService = {
  // ===== ENDPOINTS PÚBLICOS =====

  async getPublicNews(filters?: NewsFilters): Promise<NewsResponse> {
    const { data } = await axiosInstance.get<NewsResponse>(API_ENDPOINTS.NEWS_PUBLIC, {
      params: filters,
    })
    return data
  },

  async getPublicNewsBySlug(slug: string): Promise<ApiResponse<News>> {
    const { data } = await axiosInstance.get<ApiResponse<News>>(
      API_ENDPOINTS.NEWS_PUBLIC_SLUG(slug),
    )
    return data
  },

  // ===== ENDPOINTS AUTENTICADOS =====

  async getNews(filters?: NewsFilters): Promise<NewsResponse> {
    const endpoint = 'getNews'
    checkRateLimit(endpoint)

    const { data } = await axiosInstance.get<NewsResponse>(API_ENDPOINTS.NEWS, { params: filters })
    return data
  },

  async getNewsById(id: string): Promise<ApiResponse<News>> {
    const { data } = await axiosInstance.get<ApiResponse<News>>(API_ENDPOINTS.NEWS_DETAIL(id))
    return data
  },

  async createNews(dto: CreateNewsDto): Promise<ApiResponse<News>> {
    // Crear clave única para esta operación
    const requestKey = `create_${dto.title}_${dto.type}_${Date.now()}`

    // Si ya hay una petición idéntica en progreso, devolverla
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey)!
    }

    const formData = new FormData()
    formData.append('title', dto.title)
    if (dto.subtitle) formData.append('subtitle', dto.subtitle)
    formData.append('content', dto.content)
    formData.append('type', dto.type)
    if (dto.image) formData.append('image', dto.image)

    // Crear y cachear la promesa
    const requestPromise = axiosInstance
      .post<ApiResponse<News>>(API_ENDPOINTS.NEWS, formData)
      .then((response) => {
        // Limpiar del cache cuando termine
        pendingRequests.delete(requestKey)
        return response.data
      })
      .catch((error) => {
        // Limpiar del cache también en caso de error
        pendingRequests.delete(requestKey)
        throw error
      })

    pendingRequests.set(requestKey, requestPromise)
    return requestPromise
  },

  async updateNews(id: string, dto: UpdateNewsDto): Promise<ApiResponse<News>> {
    const formData = new FormData()
    if (dto.title) formData.append('title', dto.title)
    if (dto.subtitle !== undefined) formData.append('subtitle', dto.subtitle)
    if (dto.content) formData.append('content', dto.content)
    if (dto.image) formData.append('image', dto.image)

    const { data } = await axiosInstance.put<ApiResponse<News>>(
      API_ENDPOINTS.NEWS_DETAIL(id),
      formData,
    )
    return data
  },

  async deleteNews(id: string): Promise<ApiResponse<void>> {
    const { data } = await axiosInstance.delete<ApiResponse<void>>(API_ENDPOINTS.NEWS_DETAIL(id))
    return data
  },

  // ===== FLUJO DE APROBACIÓN =====

  async submitToDirector(id: string, dto?: SubmitNewsDto): Promise<ApiResponse<void>> {
    const { data } = await axiosInstance.post<ApiResponse<void>>(
      API_ENDPOINTS.NEWS_SUBMIT_DIRECTOR(id),
      dto || {},
    )
    return data
  },

  async approveAsDirector(id: string, dto?: ApproveNewsDto): Promise<ApiResponse<void>> {
    try {
      const { data } = await axiosInstance.post<ApiResponse<void>>(
        API_ENDPOINTS.NEWS_APPROVE_DIRECTOR(id),
        dto || {},
      )
      return data
    } catch (error: any) {
      console.error('Error approving news as director:', error.response?.data || error.message)
      throw error
    }
  },

  async approveAsPresident(id: string, dto?: ApproveNewsDto): Promise<ApiResponse<void>> {
    const { data } = await axiosInstance.post<ApiResponse<void>>(
      API_ENDPOINTS.NEWS_APPROVE_PRESIDENT(id),
      dto || {},
    )
    return data
  },

  async rejectNews(id: string, dto: RejectNewsDto): Promise<ApiResponse<void>> {
    const { data } = await axiosInstance.post<ApiResponse<void>>(API_ENDPOINTS.NEWS_REJECT(id), dto)
    return data
  },

  // ===== ENVÍO DESDE JUZGADOS =====

  async submitFromCourt(dto: CourtSubmissionDto): Promise<ApiResponse<News>> {
    // Crear clave única para esta operación desde juzgado
    const requestKey = `court_${dto.title}_${dto.type}_${Date.now()}`

    // Si ya hay una petición idéntica en progreso, devolverla
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey)!
    }

    const formData = new FormData()
    formData.append('title', dto.title)
    if (dto.subtitle) formData.append('subtitle', dto.subtitle)
    formData.append('content', dto.content)
    formData.append('type', dto.type)
    if (dto.image) formData.append('image', dto.image)

    // Crear y cachear la promesa
    const requestPromise = axiosInstance
      .post<ApiResponse<News>>(API_ENDPOINTS.NEWS_COURT_SUBMISSION, formData)
      .then((response) => {
        // Limpiar del cache cuando termine
        pendingRequests.delete(requestKey)
        return response.data
      })
      .catch((error) => {
        // Limpiar del cache también en caso de error
        pendingRequests.delete(requestKey)
        throw error
      })

    pendingRequests.set(requestKey, requestPromise)
    return requestPromise
  },

  // ===== ESTADÍSTICAS =====

  async getStatistics(): Promise<ApiResponse<NewsStatistics>> {
    const endpoint = 'getStatistics'
    checkRateLimit(endpoint)

    const { data } = await axiosInstance.get<ApiResponse<NewsStatistics>>(API_ENDPOINTS.NEWS_STATS)
    return data
  },

  // ===== HISTORIAL =====

  async getApprovalHistory(id: string): Promise<ApiResponse<NewsApprovalHistory[]>> {
    const { data } = await axiosInstance.get<ApiResponse<NewsApprovalHistory[]>>(
      API_ENDPOINTS.NEWS_HISTORY(id),
    )
    return data
  },

  // ===== ENDPOINTS POR ROL =====

  async getMyNews(filters?: NewsFilters): Promise<NewsResponse> {
    const { data } = await axiosInstance.get<NewsResponse>(API_ENDPOINTS.NEWS_MY_NEWS, {
      params: filters,
    })
    return data
  },

  async getNewsPendingApproval(filters?: NewsFilters): Promise<NewsResponse> {
    const endpoint = 'getNewsPendingApproval'
    checkRateLimit(endpoint)

    const { data } = await axiosInstance.get<NewsResponse>(API_ENDPOINTS.NEWS_PENDING_APPROVAL, {
      params: filters,
    })
    return data
  },

  async getNewsCreatedByMe(filters?: NewsFilters): Promise<NewsResponse> {
    const { data } = await axiosInstance.get<NewsResponse>(API_ENDPOINTS.NEWS_CREATED_BY_ME, {
      params: filters,
    })
    return data
  },
}
