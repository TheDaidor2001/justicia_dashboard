import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export const authGuard = (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
) => {
    const authStore = useAuthStore()

    // Inicializar auth si no está inicializado
    if (!authStore.user && !authStore.accessToken) {
        authStore.initializeAuth()
    }

    const isAuthenticated = authStore.isAuthenticated
    const isAuthRoute = to.path === '/login' || to.path === '/register'

    if (isAuthRoute && isAuthenticated) {
        // Si ya está autenticado y trata de ir a login, redirigir al dashboard
        next('/dashboard')
    } else if (!isAuthRoute && !isAuthenticated) {
        // Si no está autenticado y trata de acceder a ruta protegida
        next('/login')
    } else {
        // Continuar normalmente
        next()
    }
}

export const roleGuard = (allowedRoles: string[]) => {
    return (
        to: RouteLocationNormalized,
        from: RouteLocationNormalized,
        next: NavigationGuardNext
    ) => {
        const authStore = useAuthStore()

        if (!authStore.isAuthenticated) {
            next('/login')
            return
        }

        const userRole = authStore.userRole

        if (userRole && allowedRoles.includes(userRole)) {
            next()
        } else {
            // Redirigir a página de acceso denegado o dashboard
            next('/dashboard')
        }
    }
}

// Guards específicos para cada tipo de usuario
export const adminGuard = roleGuard(['admin'])

export const juezGuard = roleGuard(['juez', 'admin'])

export const presidenteAudienciaGuard = roleGuard(['presidente_audiencia', 'admin'])

export const secretarioGeneralGuard = roleGuard(['secretario_general', 'admin'])

export const prensaGuard = roleGuard(['director_prensa', 'tecnico_prensa', 'admin'])

export const contactoGuard = roleGuard([
    'secretario_adjunto',
    'secretario_general',
    'presidente_cspj',
    'vicepresidente_cspj',
    'admin'
])

export const expedientesGuard = roleGuard([
    'juez',
    'presidente_audiencia',
    'secretario_general',
    'admin'
])