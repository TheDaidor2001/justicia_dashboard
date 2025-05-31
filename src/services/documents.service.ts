import axiosInstance from '@/api/axios'
import { API_ENDPOINTS } from '@/api/config'
import type {
    Document,
    DocumentUploadResponse,
    DocumentsResponse,
    DocumentDownloadResponse,
    DocumentStats
} from '@/types/document'
import type { ApiResponse } from '@/types/auth'

export const documentsService = {
    async uploadDocument(expedienteId: string, file: File): Promise<DocumentUploadResponse> {
        const formData = new FormData()
        formData.append('document', file)

        const { data } = await axiosInstance.post<DocumentUploadResponse>(
            API_ENDPOINTS.DOCUMENTS_UPLOAD(expedienteId),
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        )
        return data
    },

    async getDocumentsByExpediente(expedienteId: string): Promise<DocumentsResponse> {
        const { data } = await axiosInstance.get<DocumentsResponse>(
            API_ENDPOINTS.DOCUMENTS_BY_EXPEDIENTE(expedienteId)
        )
        return data
    },

    async getDocumentDetail(documentId: string): Promise<ApiResponse<Document>> {
        const { data } = await axiosInstance.get<ApiResponse<Document>>(
            API_ENDPOINTS.DOCUMENT_DETAIL(documentId)
        )
        return data
    },

    async downloadDocument(documentId: string): Promise<DocumentDownloadResponse> {
        const { data } = await axiosInstance.get<DocumentDownloadResponse>(
            API_ENDPOINTS.DOCUMENT_DOWNLOAD(documentId)
        )
        return data
    },

    async deleteDocument(documentId: string): Promise<ApiResponse<void>> {
        const { data } = await axiosInstance.delete<ApiResponse<void>>(
            API_ENDPOINTS.DOCUMENT_DELETE(documentId)
        )
        return data
    },

    async getDocumentStats(): Promise<ApiResponse<DocumentStats>> {
        const { data } = await axiosInstance.get<ApiResponse<DocumentStats>>(
            API_ENDPOINTS.DOCUMENTS_STATS
        )
        return data
    }
}