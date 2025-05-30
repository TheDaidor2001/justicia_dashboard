import { createRouter, createWebHistory } from 'vue-router'
import { authGuard, expedientesGuard, juezGuard } from '@/guards/auth.guard'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/dashboard/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/expedientes',
      name: 'expedientes',
      component: () => import('@/views/expedientes/ExpedientesListView.vue'),
      beforeEnter: expedientesGuard,
      meta: { requiresAuth: true }
    },
    {
      path: '/expedientes/nuevo',
      name: 'expediente-nuevo',
      component: () => import('@/views/expedientes/ExpedienteFormView.vue'),
      beforeEnter: juezGuard,
      meta: { requiresAuth: true }
    },
    {
      path: '/expedientes/:id/editar',
      name: 'expediente-editar',
      component: () => import('@/views/expedientes/ExpedienteFormView.vue'),
      beforeEnter: juezGuard,
      meta: { requiresAuth: true }
    }
  ]
})

// Guard global para verificar autenticación en TODAS las rutas
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Inicializar auth si no está inicializado
  if (!authStore.user && localStorage.getItem('access_token')) {
    authStore.initializeAuth()
  }

  const isAuthenticated = authStore.isAuthenticated
  const requiresAuth = to.meta.requiresAuth !== false // Por defecto todas requieren auth excepto las que explícitamente dicen que no

  if (to.path === '/login' && isAuthenticated) {
    // Usuario autenticado tratando de ir a login
    next('/dashboard')
  } else if (requiresAuth && !isAuthenticated) {
    // Ruta protegida sin autenticación
    next('/login')
  } else {
    // Permitir navegación
    next()
  }
})

export default router