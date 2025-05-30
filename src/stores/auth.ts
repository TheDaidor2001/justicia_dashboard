import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axiosInstance from '@/api/axios'
import { API_ENDPOINTS, STORAGE_KEYS } from '@/api/config'
import type { User, LoginCredentials, AuthState, ApiResponse, LoginResponse } from '@/types/auth'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
    // State
    const user = ref<User | null>(null)
    const accessToken = ref<string | null>(null)
    const refreshToken = ref<string | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Getters
    const isAuthenticated = computed(() => !!accessToken.value && !!user.value)

    const userRole = computed(() => user.value?.role || null)

    const userName = computed(() => user.value?.fullName || '')

    const isAdmin = computed(() => user.value?.role === 'admin')

    const isJuez = computed(() => user.value?.role === 'juez')

    const isPresidenteAudiencia = computed(() => user.value?.role === 'presidente_audiencia')

    const isSecretarioGeneral = computed(() => user.value?.role === 'secretario_general')

    // Actions
    const login = async (credentials: LoginCredentials) => {
        loading.value = true
        error.value = null

        try {
            const { data } = await axiosInstance.post<LoginResponse>(
                API_ENDPOINTS.LOGIN,
                credentials
            )

            if (data.success) {
                // Guardar tokens y usuario
                accessToken.value = data.data.accessToken
                refreshToken.value = data.data.refreshToken
                user.value = data.data.user

                // Guardar en localStorage
                localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.data.accessToken)
                localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.data.refreshToken)
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.data.user))

                return { success: true, user: data.data.user }
            }

            return { success: false, message: data.message }
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Error al iniciar sesión'
            return { success: false, message: error.value }
        } finally {
            loading.value = false
        }
    }

    const logout = async () => {
        try {
            const token = refreshToken.value

            // Limpiar estado local primero
            clearAuth()

            // Intentar logout en el servidor
            if (token) {
                await axiosInstance.post(API_ENDPOINTS.LOGOUT, { refreshToken: token })
            }
        } catch (err) {
            // Ignorar errores de logout, ya limpiamos localmente
            console.error('Error during logout:', err)
        }
    }

    const clearAuth = () => {
        user.value = null
        accessToken.value = null
        refreshToken.value = null

        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
    }

    const initializeAuth = () => {
        // Cargar datos desde localStorage
        const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER)

        if (storedToken && storedRefreshToken && storedUser) {
            accessToken.value = storedToken
            refreshToken.value = storedRefreshToken

            try {
                user.value = JSON.parse(storedUser)
            } catch (e) {
                console.error('Error parsing stored user:', e)
                clearAuth()
            }
        }
    }

    const updateProfile = async (data: Partial<User>) => {
        loading.value = true
        error.value = null

        try {
            const response = await axiosInstance.put<ApiResponse<User>>(
                API_ENDPOINTS.UPDATE_PROFILE,
                data
            )

            if (response.data.success && response.data.data) {
                user.value = response.data.data
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.data))
                return { success: true }
            }

            return { success: false, message: response.data.message }
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Error al actualizar perfil'
            return { success: false, message: error.value }
        } finally {
            loading.value = false
        }
    }

    const changePassword = async (oldPassword: string, newPassword: string) => {
        loading.value = true
        error.value = null

        try {
            const response = await axiosInstance.put<ApiResponse>(
                API_ENDPOINTS.CHANGE_PASSWORD,
                { oldPassword, newPassword }
            )

            return {
                success: response.data.success,
                message: response.data.message
            }
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Error al cambiar contraseña'
            return { success: false, message: error.value }
        } finally {
            loading.value = false
        }
    }

    return {
        // State
        user,
        accessToken,
        refreshToken,
        loading,
        error,

        // Getters
        isAuthenticated,
        userRole,
        userName,
        isAdmin,
        isJuez,
        isPresidenteAudiencia,
        isSecretarioGeneral,

        // Actions
        login,
        logout,
        clearAuth,
        initializeAuth,
        updateProfile,
        changePassword
    }
})