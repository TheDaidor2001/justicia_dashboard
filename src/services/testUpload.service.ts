// src/services/testUpload.service.ts
import { API_CONFIG, STORAGE_KEYS } from '@/api/config'

export const testUploadService = {
    /**
     * Prueba simple para verificar si el servidor acepta multipart/form-data
     */
    async testSimpleUpload(expedienteId: string, file: File) {
        console.log('=== TEST UPLOAD DEBUG ===')
        console.log('File:', file.name, file.size, file.type)
        console.log('ExpedienteId:', expedienteId)

        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        console.log('Token exists:', !!token)

        // Intento 1: Solo el archivo
        try {
            console.log('Attempt 1: Only file')
            const formData1 = new FormData()
            formData1.append('document', file)

            const response1 = await fetch(`${API_CONFIG.BASE_URL}/documents/upload/${expedienteId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData1
            })

            console.log('Response 1:', response1.status, response1.statusText)
            const data1 = await response1.json()
            console.log('Data 1:', data1)

            if (response1.ok) {
                return data1
            }
        } catch (error) {
            console.error('Attempt 1 failed:', error)
        }

        // Intento 2: Con campos adicionales
        try {
            console.log('Attempt 2: With additional fields')
            const formData2 = new FormData()
            formData2.append('document', file)
            formData2.append('expedienteId', expedienteId)
            formData2.append('filename', file.name)

            const response2 = await fetch(`${API_CONFIG.BASE_URL}/documents/upload/${expedienteId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData2
            })

            console.log('Response 2:', response2.status, response2.statusText)
            const data2 = await response2.json()
            console.log('Data 2:', data2)

            if (response2.ok) {
                return data2
            }
        } catch (error) {
            console.error('Attempt 2 failed:', error)
        }

        // Intento 3: Como JSON (para verificar si el servidor acepta JSON)
        try {
            console.log('Attempt 3: As JSON (base64)')
            const base64 = await this.fileToBase64(file)

            const response3 = await fetch(`${API_CONFIG.BASE_URL}/documents/upload/${expedienteId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    document: base64,
                    filename: file.name,
                    mimeType: file.type,
                    size: file.size
                })
            })

            console.log('Response 3:', response3.status, response3.statusText)
            const data3 = await response3.json()
            console.log('Data 3:', data3)

            if (response3.ok) {
                return data3
            }
        } catch (error) {
            console.error('Attempt 3 failed:', error)
        }

        throw new Error('Todos los intentos fallaron. Ver consola para detalles.')
    },

    /**
     * Convertir archivo a base64
     */
    async fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = error => reject(error)
        })
    }
}