// src/services/upload.service.ts
import axiosInstance from '@/api/axios'
import { API_ENDPOINTS } from '@/api/config'
import type { DocumentUploadResponse } from '@/types/document'

export const uploadService = {
    /**
     * Upload de documento con manejo mejorado de FormData y CSRF
     */
    async uploadDocument(expedienteId: string, file: File): Promise<DocumentUploadResponse> {
        // Crear FormData
        const formData = new FormData()
        formData.append('document', file)

        // Agregar campos adicionales que el backend pueda esperar
        formData.append('_csrf', '') // Token CSRF vacío
        formData.append('expedienteId', expedienteId) // ID del expediente

        try {
            // Realizar la petición sin especificar Content-Type
            const { data } = await axiosInstance.post<DocumentUploadResponse>(
                API_ENDPOINTS.DOCUMENTS_UPLOAD(expedienteId),
                formData
            )

            return data
        } catch (error: any) {
            console.error('Upload error details:', {
                status: error.response?.status,
                data: error.response?.data,
                headers: error.response?.headers
            })

            // Re-lanzar el error con información más útil
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message)
            }
            throw error
        }
    },

    /**
     * Upload alternativo usando fetch si axios falla
     */
    async uploadDocumentFallback(expedienteId: string, file: File): Promise<DocumentUploadResponse> {
        const formData = new FormData()
        formData.append('document', file)
        formData.append('_csrf', '')

        const token = localStorage.getItem('access_token')

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/documents/upload/${expedienteId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Error al subir archivo')
        }

        return response.json()
    }
}