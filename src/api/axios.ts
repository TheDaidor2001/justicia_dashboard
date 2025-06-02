import axios, { type AxiosInstance, AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_CONFIG, STORAGE_KEYS } from './config'

// Crear instancia de Axios
const axiosInstance: AxiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Interceptor de request - agregar token
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // Para FormData, NO establecer Content-Type
        // El browser lo hará automáticamente con el boundary correcto
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type']
        }

        return config
    },
    (error: AxiosError) => {
        return Promise.reject(error)
    }
)

// Interceptor de response - manejar errores
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Si el error es 401 y no es una petición de refresh
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
            originalRequest._retry = true

            try {
                // Intentar renovar el token
                const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

                if (refreshToken) {
                    const { data } = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
                        refreshToken
                    })

                    // Guardar nuevo access token
                    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.data.accessToken)

                    // Reintentar la petición original con el nuevo token
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
                    }

                    return axiosInstance(originalRequest)
                }
            } catch (refreshError) {
                // Si falla el refresh, limpiar tokens y redirigir a login
                localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
                localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
                localStorage.removeItem(STORAGE_KEYS.USER)

                // Redirigir a login
                window.location.href = '/login'

                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default axiosInstance