import axios, { type AxiosInstance, AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_CONFIG, STORAGE_KEYS } from './config'

// Mapa para almacenar controladores de cancelación
const abortControllers = new Map<string, AbortController>()

// Mapa para prevenir peticiones duplicadas
const activeRequests = new Map<string, Promise<any>>()

// Mapa para rate limiting
const requestTimes = new Map<string, number[]>()

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

    // Para FormData, eliminar Content-Type para que el browser lo establezca
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    // Implementar rate limiting para evitar demasiadas peticiones
    const url = config.url || ''
    const method = config.method || 'get'
    const rateLimitKey = `${method}_${url}`
    const now = Date.now()

    if (!requestTimes.has(rateLimitKey)) {
      requestTimes.set(rateLimitKey, [])
    }

    const times = requestTimes.get(rateLimitKey)!
    // Filtrar peticiones de los últimos 10 segundos
    const recentTimes = times.filter((time) => now - time < 10000)

    // Si hay más de 5 peticiones en 10 segundos, bloquear
    if (recentTimes.length >= 5) {
      const error = new Error('Too many requests. Please wait a moment.')
      error.name = 'RateLimitError'
      return Promise.reject(error)
    }

    // Registrar esta petición
    recentTimes.push(now)
    requestTimes.set(rateLimitKey, recentTimes)

    // Cancelar petición anterior si es la misma URL (para búsquedas)
    if (config.url && config.url.includes('/news') && config.params?.search !== undefined) {
      const key = `${config.method}_${config.url}`
      const existingController = abortControllers.get(key)

      if (existingController) {
        existingController.abort()
      }

      const controller = new AbortController()
      config.signal = controller.signal
      abortControllers.set(key, controller)
    }

    // Prevenir peticiones duplicadas
    const requestKey = `${config.method}_${config.url}_${JSON.stringify(config.params || {})}`

    // Para peticiones GET, verificar si ya está en progreso
    if (config.method === 'get' && activeRequests.has(requestKey)) {
      const error = new Error('Duplicate request blocked')
      error.name = 'DuplicateRequestError'
      return Promise.reject(error)
    }

    // Para operaciones críticas (POST), usar una clave más específica
    if (
      config.method === 'post' &&
      config.url &&
      (config.url.includes('/news') ||
        config.url.includes('/approve') ||
        config.url.includes('/reject')) &&
      config.data instanceof FormData
    ) {
      const formDataKey = config.data.get('title') || config.data.get('comments') || 'unknown'
      const criticalKey = `${config.method}_${config.url}_${formDataKey}`

      if (activeRequests.has(criticalKey)) {
        const error = new Error('Operation already in progress')
        error.name = 'DuplicateOperationError'
        return Promise.reject(error)
      }
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  },
)

// Interceptor de response - manejar errores
axiosInstance.interceptors.response.use(
  (response) => {
    // Limpiar el controlador y peticiones activas después de una respuesta exitosa
    if (response.config.url) {
      const requestKey = `${response.config.method}_${response.config.url}_${JSON.stringify(response.config.params || {})}`
      const controllerKey = `${response.config.method}_${response.config.url}`

      abortControllers.delete(controllerKey)
      activeRequests.delete(requestKey)

      // Para operaciones críticas, limpiar usando clave específica
      if (response.config.method === 'post' && response.config.data instanceof FormData) {
        const formDataKey =
          response.config.data.get('title') || response.config.data.get('comments') || 'unknown'
        const criticalKey = `${response.config.method}_${response.config.url}_${formDataKey}`
        activeRequests.delete(criticalKey)
      }
    }
    return response
  },
  async (error: AxiosError) => {
    // Limpiar peticiones activas en caso de error
    if (error.config?.url) {
      const requestKey = `${error.config.method}_${error.config.url}_${JSON.stringify(error.config.params || {})}`
      const controllerKey = `${error.config.method}_${error.config.url}`

      abortControllers.delete(controllerKey)
      activeRequests.delete(requestKey)

      // Para operaciones críticas, limpiar usando clave específica
      if (error.config.method === 'post' && error.config.data instanceof FormData) {
        const formDataKey =
          error.config.data.get('title') || error.config.data.get('comments') || 'unknown'
        const criticalKey = `${error.config.method}_${error.config.url}_${formDataKey}`
        activeRequests.delete(criticalKey)
      }
    }

    // Si es un error de cancelación o duplicado, no hacer nada
    if (
      error.code === 'ERR_CANCELED' ||
      error.name === 'DuplicateRequestError' ||
      error.name === 'DuplicateOperationError' ||
      error.name === 'RateLimitError'
    ) {
      return Promise.reject(error)
    }

    // Si es error 429 (Too Many Requests), esperar antes de reintentar
    if (error.response?.status === 429) {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retryCount?: number }

      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0
      }

      if (originalRequest._retryCount < 1) {
        originalRequest._retryCount++
        // Esperar más tiempo para 429: 3 segundos, luego 6 segundos
        const delay = originalRequest._retryCount * 3000
        await new Promise((resolve) => setTimeout(resolve, delay))
        return axiosInstance(originalRequest)
      } else {
        console.error('Rate limit exceeded, max retries reached')
        // Devolver un error más amigable
        const friendlyError = new Error(
          'Servidor sobrecargado. Espera un momento e intenta de nuevo.',
        )
        friendlyError.name = 'RateLimitExceededError'
        return Promise.reject(friendlyError)
      }
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Si el error es 401 y no es una petición de refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true

      try {
        // Intentar renovar el token
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

        if (refreshToken) {
          const { data } = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh`, {
            refreshToken,
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
  },
)

export default axiosInstance
export { axiosInstance as api }
