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
    NewsApprovalHistory
} from '@/types/news'
import type { ApiResponse } from '@/types/auth'

export const newsService = {
    // ===== ENDPOINTS PÚBLICOS =====

    async getPublicNews(filters?: NewsFilters): Promise<NewsResponse> {
        const { data } = await axiosInstance.get<NewsResponse>(
            API_ENDPOINTS.NEWS_PUBLIC,
            { params: filters }
        )
        return data
    },

    async getPublicNewsBySlug(slug: string): Promise<ApiResponse<News>> {
        const { data } = await axiosInstance.get<ApiResponse<News>>(
            API_ENDPOINTS.NEWS_PUBLIC_SLUG(slug)
        )
        return data
    },

    // ===== ENDPOINTS AUTENTICADOS =====

    async getNews(filters?: NewsFilters): Promise<NewsResponse> {
        const { data } = await axiosInstance.get<NewsResponse>(
            API_ENDPOINTS.NEWS,
            { params: filters }
        )
        return data
    },

    async getNewsById(id: string): Promise<ApiResponse<News>> {
        const { data } = await axiosInstance.get<ApiResponse<News>>(
            API_ENDPOINTS.NEWS_DETAIL(id)
        )
        return data
    },

    async createNews(dto: CreateNewsDto): Promise<ApiResponse<News>> {
        const formData = new FormData()
        formData.append('title', dto.title)
        if (dto.subtitle) formData.append('subtitle', dto.subtitle)
        formData.append('content', dto.content)
        formData.append('type', dto.type)
        if (dto.image) formData.append('image', dto.image)

        const { data } = await axiosInstance.post<ApiResponse<News>>(
            API_ENDPOINTS.NEWS,
            formData
        )
        return data
    },

    async updateNews(id: string, dto: UpdateNewsDto): Promise<ApiResponse<News>> {
        const formData = new FormData()
        if (dto.title) formData.append('title', dto.title)
        if (dto.subtitle !== undefined) formData.append('subtitle', dto.subtitle)
        if (dto.content) formData.append('content', dto.content)
        if (dto.image) formData.append('image', dto.image)

        const { data } = await axiosInstance.put<ApiResponse<News>>(
            API_ENDPOINTS.NEWS_DETAIL(id),
            formData
        )
        return data
    },

    async deleteNews(id: string): Promise<ApiResponse<void>> {
        const { data } = await axiosInstance.delete<ApiResponse<void>>(
            API_ENDPOINTS.NEWS_DETAIL(id)
        )
        return data
    },

    // ===== FLUJO DE APROBACIÓN =====

    async submitToDirector(id: string, dto?: SubmitNewsDto): Promise<ApiResponse<void>> {
        const { data } = await axiosInstance.post<ApiResponse<void>>(
            API_ENDPOINTS.NEWS_SUBMIT_DIRECTOR(id),
            dto || {}
        )
        return data
    },

    async approveAsDirector(id: string, dto?: ApproveNewsDto): Promise<ApiResponse<void>> {
        const { data } = await axiosInstance.post<ApiResponse<void>>(
            API_ENDPOINTS.NEWS_APPROVE_DIRECTOR(id),
            dto || {}
        )
        return data
    },

    async approveAsPresident(id: string, dto?: ApproveNewsDto): Promise<ApiResponse<void>> {
        const { data } = await axiosInstance.post<ApiResponse<void>>(
            API_ENDPOINTS.NEWS_APPROVE_PRESIDENT(id),
            dto || {}
        )
        return data
    },

    async rejectNews(id: string, dto: RejectNewsDto): Promise<ApiResponse<void>> {
        const { data } = await axiosInstance.post<ApiResponse<void>>(
            API_ENDPOINTS.NEWS_REJECT(id),
            dto
        )
        return data
    },

    // ===== ENVÍO DESDE JUZGADOS =====

    async submitFromCourt(dto: CourtSubmissionDto): Promise<ApiResponse<News>> {
        const formData = new FormData()
        formData.append('title', dto.title)
        formData.append('content', dto.content)
        formData.append('type', dto.type)
        if (dto.image) formData.append('image', dto.image)

        const { data } = await axiosInstance.post<ApiResponse<News>>(
            API_ENDPOINTS.NEWS_COURT_SUBMISSION,
            formData
        )
        return data
    },

    // ===== ESTADÍSTICAS =====

    async getStatistics(): Promise<ApiResponse<NewsStatistics>> {
        const { data } = await axiosInstance.get<ApiResponse<NewsStatistics>>(
            API_ENDPOINTS.NEWS_STATS
        )
        return data
    },

    // ===== HISTORIAL =====

    async getApprovalHistory(id: string): Promise<ApiResponse<NewsApprovalHistory[]>> {
        const { data } = await axiosInstance.get<ApiResponse<NewsApprovalHistory[]>>(
            API_ENDPOINTS.NEWS_HISTORY(id)
        )
        return data
    }
}