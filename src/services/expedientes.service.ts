import axiosInstance from '@/api/axios'
import { API_ENDPOINTS } from '@/api/config'
import type {
    Expediente,
    ExpedienteFilters,
    ExpedientesResponse,
    CreateExpedienteDto,
    UpdateExpedienteDto,
    SubmitExpedienteDto,
    ApproveExpedienteDto,
    RejectExpedienteDto,
    ExpedienteStatistics,
    ApprovalHistoryItem
} from '@/types/expediente'
import type { ApiResponse } from '@/types/auth'

export const expedientesService = {
    async getExpedientes(filters?: ExpedienteFilters): Promise<ExpedientesResponse> {
        const { data } = await axiosInstance.get<ExpedientesResponse>(
            API_ENDPOINTS.EXPEDIENTES,
            { params: filters }
        )
        return data
    },

    async getExpedienteById(id: string): Promise<ApiResponse<Expediente>> {
        const { data } = await axiosInstance.get<ApiResponse<Expediente>>(
            API_ENDPOINTS.EXPEDIENTE_DETAIL(id)
        )
        return data
    },

    async createExpediente(dto: CreateExpedienteDto): Promise<ApiResponse<Expediente>> {
        const { data } = await axiosInstance.post<ApiResponse<Expediente>>(
            API_ENDPOINTS.EXPEDIENTES,
            dto
        )
        return data
    },

    async updateExpediente(id: string, dto: UpdateExpedienteDto): Promise<ApiResponse<Expediente>> {
        const { data } = await axiosInstance.put<ApiResponse<Expediente>>(
            API_ENDPOINTS.EXPEDIENTE_DETAIL(id),
            dto
        )
        return data
    },

    async deleteExpediente(id: string): Promise<ApiResponse<void>> {
        const { data } = await axiosInstance.delete<ApiResponse<void>>(
            API_ENDPOINTS.EXPEDIENTE_DETAIL(id)
        )
        return data
    },

    async submitExpediente(id: string, dto?: SubmitExpedienteDto): Promise<ApiResponse<void>> {
        const { data } = await axiosInstance.post<ApiResponse<void>>(
            API_ENDPOINTS.EXPEDIENTE_SUBMIT(id),
            dto || {}
        )
        return data
    },

    async approveExpediente(id: string, dto?: ApproveExpedienteDto): Promise<ApiResponse<void>> {
        const { data } = await axiosInstance.post<ApiResponse<void>>(
            API_ENDPOINTS.EXPEDIENTE_APPROVE(id),
            dto || {}
        )
        return data
    },

    async rejectExpediente(id: string, dto: RejectExpedienteDto): Promise<ApiResponse<void>> {
        const { data } = await axiosInstance.post<ApiResponse<void>>(
            API_ENDPOINTS.EXPEDIENTE_REJECT(id),
            dto
        )
        return data
    },

    async returnExpediente(id: string, comments: string): Promise<ApiResponse<void>> {
        const { data } = await axiosInstance.post<ApiResponse<void>>(
            API_ENDPOINTS.EXPEDIENTE_RETURN(id),
            { comments }
        )
        return data
    },

    async getApprovalHistory(id: string): Promise<ApiResponse<ApprovalHistoryItem[]>> {
        const { data } = await axiosInstance.get<ApiResponse<ApprovalHistoryItem[]>>(
            API_ENDPOINTS.EXPEDIENTE_HISTORY(id)
        )
        return data
    },

    async getStatistics(): Promise<ApiResponse<ExpedienteStatistics>> {
        const { data } = await axiosInstance.get<ApiResponse<ExpedienteStatistics>>(
            API_ENDPOINTS.EXPEDIENTES_STATS
        )
        return data
    }
}