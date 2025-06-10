import { createRouter, createWebHistory } from 'vue-router'
import { authGuard, expedientesGuard, juezGuard } from '@/guards/auth.guard'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/dashboard/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/expedientes',
      name: 'expedientes',
      component: () => import('@/views/expedientes/ExpedientesListView.vue'),
      beforeEnter: expedientesGuard,
      meta: { requiresAuth: true },
    },
    {
      path: '/expedientes/nuevo',
      name: 'expediente-nuevo',
      component: () => import('@/views/expedientes/ExpedienteFormView.vue'),
      beforeEnter: juezGuard,
      meta: { requiresAuth: true },
    },
    {
      path: '/expedientes/:id',
      name: 'expediente-detalle',
      component: () => import('@/views/expedientes/ExpedienteDetailView.vue'),
      beforeEnter: expedientesGuard,
      meta: { requiresAuth: true },
    },
    {
      path: '/expedientes/:id/editar',
      name: 'expediente-editar',
      component: () => import('@/views/expedientes/ExpedienteFormView.vue'),
      beforeEnter: juezGuard,
      meta: { requiresAuth: true },
    },
    {
      path: '/noticias',
      name: 'noticias',
      component: () => import('@/views/news/NewsListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/noticias/nueva',
      name: 'noticia-nueva',
      component: () => import('@/views/news/NewsFormView.vue'),
      meta: { requiresAuth: true },
      beforeEnter: (to, from, next) => {
        const authStore = useAuthStore()
        // Solo técnicos de prensa y admins pueden crear noticias
        const allowedRoles = ['tecnico_prensa', 'admin']

        if (allowedRoles.includes(authStore.user?.role || '')) {
          next()
        } else {
          next('/noticias')
        }
      },
    },
    {
      path: '/noticias/enviar-juzgado',
      name: 'noticia-enviar-juzgado',
      component: () => import('@/views/news/NewsFormView.vue'),
      meta: { requiresAuth: true, courtSubmission: true },
    },
    {
      path: '/noticias/pendientes',
      name: 'noticias-pendientes',
      component: () => import('@/views/news/NewsPendingView.vue'),
      meta: { requiresAuth: true },
      beforeEnter: (to, from, next) => {
        const authStore = useAuthStore()
        const allowedRoles = ['director_prensa', 'presidente_cspj', 'admin']

        if (allowedRoles.includes(authStore.user?.role || '')) {
          next()
        } else {
          next('/noticias')
        }
      },
    },
    {
      path: '/noticias/:id',
      name: 'noticia-detalle',
      component: () => import('@/views/news/NewsDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/noticias/:id/editar',
      name: 'noticia-editar',
      component: () => import('@/views/news/NewsFormView.vue'),
      meta: { requiresAuth: true },
    },
    // Rutas de gestión de usuarios - Solo admins según los endpoints especificados
    {
      path: '/admin/usuarios',
      name: 'usuarios',
      component: () => import('@/views/users/UserListView.vue'),
      meta: { requiresAuth: true },
      beforeEnter: (to, from, next) => {
        const authStore = useAuthStore()
        // Solo admins pueden ver usuarios según los endpoints GET /users
        if (authStore.user?.role === 'admin') {
          next()
        } else {
          next('/dashboard')
        }
      },
    },
    {
      path: '/admin/usuarios/nuevo',
      name: 'usuario-nuevo',
      component: () => import('@/views/users/UserCreateView.vue'),
      meta: { requiresAuth: true },
      beforeEnter: (to, from, next) => {
        const authStore = useAuthStore()
        // Solo admins pueden crear usuarios según los endpoints POST /users
        if (authStore.user?.role === 'admin') {
          next()
        } else {
          next('/dashboard')
        }
      },
    },
    {
      path: '/admin/usuarios/:id/editar',
      name: 'usuario-editar',
      component: () => import('@/views/users/UserEditView.vue'),
      meta: { requiresAuth: true },
      beforeEnter: (to, from, next) => {
        const authStore = useAuthStore()
        // Solo admins pueden modificar usuarios según los endpoints PUT /users/:id
        if (authStore.user?.role === 'admin') {
          next()
        } else {
          next('/dashboard')
        }
      },
    },
    // Rutas de gestión de libros - Solo admins según los endpoints especificados
    {
      path: '/admin/libros',
      name: 'libros',
      component: () => import('@/views/books/BooksListView.vue'),
      meta: { requiresAuth: true },
      beforeEnter: (to, from, next) => {
        const authStore = useAuthStore()
        // Solo admins pueden ver libros según los endpoints GET /books
        if (authStore.user?.role === 'admin') {
          next()
        } else {
          next('/dashboard')
        }
      },
    },
    {
      path: '/admin/libros/nuevo',
      name: 'libro-nuevo',
      component: () => import('@/views/books/BookCreateView.vue'),
      meta: { requiresAuth: true },
      beforeEnter: (to, from, next) => {
        const authStore = useAuthStore()
        // Solo admins pueden crear libros según los endpoints POST /books
        if (authStore.user?.role === 'admin') {
          next()
        } else {
          next('/dashboard')
        }
      },
    },
    {
      path: '/admin/libros/:id/editar',
      name: 'libro-editar',
      component: () => import('@/views/books/BookEditView.vue'),
      meta: { requiresAuth: true },
      beforeEnter: (to, from, next) => {
        const authStore = useAuthStore()
        // Solo admins pueden modificar libros según los endpoints PUT /books/:id
        if (authStore.user?.role === 'admin') {
          next()
        } else {
          next('/dashboard')
        }
      },
    },
    {
      path: '/admin/libros/:id',
      name: 'libro-detalle',
      component: () => import('@/views/books/BookDetailView.vue'),
      meta: { requiresAuth: true },
      beforeEnter: (to, from, next) => {
        const authStore = useAuthStore()
        // Solo admins pueden ver detalles de libros según los endpoints GET /books/:id
        if (authStore.user?.role === 'admin') {
          next()
        } else {
          next('/dashboard')
        }
      },
    },
    {
      path: '/ayuda',
      name: 'ayuda',
      component: () => import('@/views/HelpView.vue'),
      meta: { requiresAuth: true },
    },
  ],
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
