// src/services/documentUpload.service.ts
import { API_CONFIG, STORAGE_KEYS } from '@/api/config'
import type { DocumentUploadResponse } from '@/types/document'

export const documentUploadService = {
    /**
     * Upload directo sin campos adicionales
     */
    async uploadDocument(expedienteId: string, file: File): Promise<DocumentUploadResponse> {
        const formData = new FormData()
        formData.append('document', file)
        formData.append('_csrf', '') // Añadir campo vacío para evitar el error

        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/documents/upload/${expedienteId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // NO establecer Content-Type
                },
                body: formData
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || `Error ${response.status}`)
            }

            return data
        } catch (error: any) {
            console.error('Upload error:', error)
            throw error
        }
    },

    /**
     * Upload con XMLHttpRequest para más control
     */
    async uploadWithXHR(
        expedienteId: string,
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<DocumentUploadResponse> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            const formData = new FormData()
            formData.append('document', file)
            formData.append('_csrf', '') // Añadir campo vacío para evitar el error

            const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const progress = Math.round((e.loaded / e.total) * 100)
                    onProgress(progress)
                }
            })

            xhr.addEventListener('load', () => {
                try {
                    const response = JSON.parse(xhr.responseText)
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(response)
                    } else {
                        reject(new Error(response.message || `Error ${xhr.status}`))
                    }
                } catch (error) {
                    reject(new Error('Error al procesar la respuesta'))
                }
            })

            xhr.addEventListener('error', () => {
                reject(new Error('Error de red'))
            })

            xhr.open('POST', `${API_CONFIG.BASE_URL}/documents/upload/${expedienteId}`)
            xhr.setRequestHeader('Authorization', `Bearer ${token}`)
            xhr.send(formData)
        })
    }
}