import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from '@/guards/auth.guard'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    // Solo dejamos las rutas que ya existen
    // Iremos agregando más conforme creemos los componentes
  ]
})

// Guard global para verificar autenticación
router.beforeEach((to, from, next) => {
  // Si la ruta requiere autenticación y no hay guard específico, usar authGuard
  if (to.meta.requiresAuth && !to.matched.some(record => record.beforeEnter)) {
    authGuard(to, from, next)
  } else {
    next()
  }
})

export default router