<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { useExpedientesStore } from '@/stores/expedientes'
import { useNewsStore } from '@/stores/news'
import { useBooksStore } from '@/stores/books'
import { useContactStore } from '@/stores/contact'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Avatar from 'primevue/avatar'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const { user, userName, userRole, logout } = useAuth()
const router = useRouter()
const toast = useToast()
const expedientesStore = useExpedientesStore()
const newsStore = useNewsStore()
const booksStore = useBooksStore()
const contactStore = useContactStore()

// Estado
const currentTime = ref(new Date())
const loading = ref(false)
const stats = ref({
  expedientesTotal: 0,
  expedientesPendientes: 0,
  noticiasTotal: 0,
  noticiasPendientes: 0,
  librosTotal: 0,
  contactosTotal: 0,
  contactosPendientes: 0,
})

// Saludo según la hora del día
const greeting = computed(() => {
  const hour = currentTime.value.getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
})

// Obtener iniciales del usuario
const userInitials = computed(() => {
  const names = userName.value.split(' ')
  return names
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

// Enlaces del dashboard según el rol
const dashboardLinks = computed(() => {
  const links = []

  // Enlaces para todos los usuarios autenticados
  links.push({
    id: 'perfil',
    title: 'Mi Perfil',
    description: 'Gestiona tu información personal',
    icon: 'pi-user',
    color: 'gray',
    route: '/perfil',
    available: true,
  })

  // Enlaces según el rol
  switch (userRole.value) {
    case 'juez':
      links.unshift(
        {
          id: 'expedientes',
          title: 'Expedientes',
          description: 'Gestiona tus casos judiciales',
          icon: 'pi-folder',
          color: 'blue',
          route: '/expedientes',
          available: true,
          stats: stats.value.expedientesTotal,
        },
        {
          id: 'nuevo-expediente',
          title: 'Nuevo Expediente',
          description: 'Crear un nuevo caso',
          icon: 'pi-plus-circle',
          color: 'green',
          route: '/expedientes/nuevo',
          available: true,
        },
        {
          id: 'noticias',
          title: 'Avisos y Comunicados',
          description: 'Enviar desde mi juzgado',
          icon: 'pi-megaphone',
          color: 'purple',
          route: '/noticias',
          available: true,
        },
      )
      break

    case 'presidente_audiencia':
      links.unshift(
        {
          id: 'expedientes',
          title: 'Expedientes',
          description: 'Revisar y aprobar expedientes',
          icon: 'pi-folder-open',
          color: 'blue',
          route: '/expedientes',
          available: true,
          stats: stats.value.expedientesPendientes,
          badge: stats.value.expedientesPendientes > 0 ? 'Pendientes' : null,
        },
        {
          id: 'noticias',
          title: 'Avisos y Comunicados',
          description: 'Enviar desde mi audiencia',
          icon: 'pi-megaphone',
          color: 'purple',
          route: '/noticias',
          available: true,
        },
      )
      break

    case 'secretario_general':
      links.unshift(
        {
          id: 'expedientes',
          title: 'Expedientes',
          description: 'Aprobación final de expedientes',
          icon: 'pi-check-circle',
          color: 'green',
          route: '/expedientes',
          available: true,
          stats: stats.value.expedientesPendientes,
          badge: stats.value.expedientesPendientes > 0 ? 'Pendientes' : null,
        },
        {
          id: 'contactos',
          title: 'Contacto Ciudadano',
          description: 'Gestionar consultas ciudadanas',
          icon: 'pi-envelope',
          color: 'orange',
          route: '/contacto',
          available: true,
          stats: stats.value.contactosTotal,
          badge: stats.value.contactosPendientes > 0 ? 'Pendientes' : null,
        },
      )
      break

    case 'secretario_adjunto':
      links.unshift({
        id: 'contactos',
        title: 'Contacto Ciudadano',
        description: 'Asignar y gestionar consultas',
        icon: 'pi-envelope',
        color: 'orange',
        route: '/contacto',
        available: true,
        stats: stats.value.contactosTotal,
        badge: stats.value.contactosPendientes > 0 ? 'Pendientes' : null,
      })
      break

    case 'director_prensa':
    case 'tecnico_prensa':
      links.unshift({
        id: 'noticias',
        title: 'Noticias',
        description: 'Gestionar publicaciones',
        icon: 'pi-megaphone',
        color: 'purple',
        route: '/noticias',
        available: true,
        stats: stats.value.noticiasTotal,
      })
      break

    case 'presidente_cspj':
    case 'vicepresidente_cspj':
      links.unshift(
        {
          id: 'expedientes',
          title: 'Expedientes',
          description: 'Supervisión general',
          icon: 'pi-briefcase',
          color: 'blue',
          route: '/expedientes',
          available: true,
        },
        {
          id: 'noticias',
          title: 'Noticias',
          description: 'Aprobar publicaciones',
          icon: 'pi-megaphone',
          color: 'purple',
          route: '/noticias',
          available: true,
          stats: stats.value.noticiasPendientes,
          badge: stats.value.noticiasPendientes > 0 ? 'Pendientes' : null,
        },
        {
          id: 'contactos',
          title: 'Contacto Ciudadano',
          description: 'Supervisar consultas ciudadanas',
          icon: 'pi-envelope',
          color: 'orange',
          route: '/contacto',
          available: true,
          stats: stats.value.contactosTotal,
        },
        {
          id: 'administracion',
          title: 'Administración',
          description: 'Configuración del sistema',
          icon: 'pi-cog',
          color: 'red',
          route: '/admin',
          available: false,
        },
      )
      break

    case 'admin':
      links.unshift(
        {
          id: 'expedientes',
          title: 'Expedientes',
          description: 'Gestión completa',
          icon: 'pi-folder',
          color: 'blue',
          route: '/expedientes',
          available: true,
        },
        {
          id: 'noticias',
          title: 'Noticias',
          description: 'Administrar publicaciones',
          icon: 'pi-megaphone',
          color: 'purple',
          route: '/noticias',
          available: true,
          stats: stats.value.noticiasTotal,
        },
        {
          id: 'contactos',
          title: 'Contacto Ciudadano',
          description: 'Gestión completa de consultas',
          icon: 'pi-envelope',
          color: 'orange',
          route: '/contacto',
          available: true,
          stats: stats.value.contactosTotal,
          badge: stats.value.contactosPendientes > 0 ? 'Pendientes' : null,
        },
        {
          id: 'usuarios',
          title: 'Usuarios',
          description: 'Gestionar usuarios del sistema',
          icon: 'pi-users',
          color: 'green',
          route: '/admin/usuarios',
          available: true,
        },
        {
          id: 'biblioteca',
          title: 'Biblioteca Digital',
          description: 'Gestionar libros y documentos',
          icon: 'pi-book',
          color: 'indigo',
          route: '/admin/libros',
          available: true,
          stats: stats.value.librosTotal,
        },
        {
          id: 'administracion',
          title: 'Administración',
          description: 'Configuración del sistema',
          icon: 'pi-cog',
          color: 'red',
          route: '/admin',
          available: false,
        },
      )
      break
  }

  // Agregar enlaces comunes al final
  links.push({
    id: 'ayuda',
    title: 'Ayuda',
    description: 'Soporte y documentación',
    icon: 'pi-question-circle',
    color: 'teal',
    route: '/ayuda',
    available: true,
  })

  return links
})

// Cargar estadísticas básicas
const loadStats = async () => {
  loading.value = true
  try {
    // Cargar estadísticas de expedientes
    const expedientesResult = await expedientesStore.fetchStatistics()
    if (expedientesResult.success && expedientesStore.statistics) {
      stats.value.expedientesTotal = expedientesStore.statistics.total
      stats.value.expedientesPendientes = expedientesStore.statistics.myPendingApprovals || 0
    }

    // Cargar estadísticas de noticias
    const newsResult = await newsStore.fetchStatistics()
    if (newsResult.success && newsStore.statistics) {
      stats.value.noticiasTotal = newsStore.statistics.total || 0
      // Calcular pendientes según rol
      if (userRole.value === 'presidente_cspj' || userRole.value === 'vicepresidente_cspj') {
        stats.value.noticiasPendientes = newsStore.statistics.byStatus?.pending_president || 0
      } else if (userRole.value === 'director_prensa') {
        stats.value.noticiasPendientes = newsStore.statistics.byStatus?.pending_director || 0
      } else {
        stats.value.noticiasPendientes =
          (newsStore.statistics.byStatus?.pending_director || 0) +
          (newsStore.statistics.byStatus?.pending_president || 0)
      }
    }

    // Cargar datos de libros (solo para admins)
    if (userRole.value === 'admin') {
      try {
        await booksStore.fetchBooks()
        // Calcular total de libros desde los datos cargados
        stats.value.librosTotal = booksStore.books.length
      } catch (error) {
        console.error('Error al cargar estadísticas de libros:', error)
      }
    }

    // Cargar estadísticas de contacto (para roles con acceso)
    const contactRoles = [
      'secretario_adjunto',
      'secretario_general',
      'presidente_cspj',
      'vicepresidente_cspj',
      'admin',
    ]
    if (contactRoles.includes(userRole.value || '')) {
      try {
        await contactStore.fetchStatistics()
        if (contactStore.statistics) {
          stats.value.contactosTotal = contactStore.statistics.total || 0
          stats.value.contactosPendientes = contactStore.statistics.pending || 0
        }
      } catch (error) {
        console.error('Error al cargar estadísticas de contacto:', error)
      }
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error)
  } finally {
    loading.value = false
  }
}

// Actualizar hora
const updateTime = () => {
  currentTime.value = new Date()
}

// Navegación
const navigateTo = (link: any) => {
  if (link.available) {
    router.push(link.route)
  } else {
    toast.add({
      severity: 'info',
      summary: 'Próximamente',
      detail: `${link.title} estará disponible pronto`,
      life: 3000,
    })
  }
}

const handleLogout = async () => {
  await logout()
}

// Obtener color de fondo según el color del enlace
const getBgColor = (color: string) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 hover:bg-blue-100',
    green: 'bg-green-50 hover:bg-green-100',
    orange: 'bg-orange-50 hover:bg-orange-100',
    purple: 'bg-purple-50 hover:bg-purple-100',
    red: 'bg-red-50 hover:bg-red-100',
    gray: 'bg-gray-50 hover:bg-gray-100',
    indigo: 'bg-indigo-50 hover:bg-indigo-100',
    teal: 'bg-teal-50 hover:bg-teal-100',
  }
  return colors[color] || colors.gray
}

const getIconColor = (color: string) => {
  const colors: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    red: 'text-red-600',
    gray: 'text-gray-600',
    indigo: 'text-indigo-600',
    teal: 'text-teal-600',
  }
  return colors[color] || colors.gray
}

// Ya no necesitamos el watcher de needsRefresh, las estadísticas se actualizan cuando el usuario navega

onMounted(() => {
  updateTime()
  setInterval(updateTime, 60000) // Actualizar cada minuto
  loadStats()
})

// Recargar estadísticas cuando la vista se active (si usa keep-alive)
onActivated(() => {
  loadStats()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <Toast />

    <!-- Header minimalista -->
    <header class="bg-white shadow-sm">
      <div class="px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo y nombre -->
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <i class="pi pi-building text-white text-sm"></i>
            </div>
            <h1 class="text-lg font-semibold text-gray-900 hidden sm:block">Sistema Judicial</h1>
          </div>

          <!-- Usuario y logout -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-3">
              <Avatar
                :label="userInitials"
                shape="circle"
                class="bg-gray-200 text-gray-700"
                size="normal"
              />
              <div class="hidden sm:block text-right">
                <p class="text-sm font-medium text-gray-900">{{ userName }}</p>
                <p class="text-xs text-gray-500 capitalize">{{ userRole?.replace('_', ' ') }}</p>
              </div>
            </div>

            <Button
              icon="pi pi-sign-out"
              severity="secondary"
              class="text-white"
              text
              rounded
              v-tooltip.bottom="'Cerrar sesión'"
              @click="handleLogout"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- Contenido principal -->
    <main class="px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <!-- Saludo -->
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900">
          {{ greeting }}, {{ user?.fullName?.split(' ')[0] || 'Usuario' }}
        </h2>
        <p class="text-gray-600 mt-1">
          {{
            currentTime.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          }}
        </p>
      </div>

      <!-- Grid de enlaces -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="link in dashboardLinks"
          :key="link.id"
          @click="navigateTo(link)"
          class="group relative rounded-xl p-6 transition-all duration-200 cursor-pointer"
          :class="[getBgColor(link.color), link.available ? '' : 'opacity-60']"
        >
          <!-- Badge de estado -->
          <div v-if="link.badge" class="absolute top-4 right-4">
            <span
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
            >
              {{ link.badge }}
            </span>
          </div>

          <!-- Icono -->
          <div class="mb-4">
            <div
              class="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform"
            >
              <i :class="[link.icon, 'pi', 'text-xl', getIconColor(link.color)]"></i>
            </div>
          </div>

          <!-- Contenido -->
          <h3 class="text-lg font-semibold text-gray-900 mb-1">
            {{ link.title }}
          </h3>
          <p class="text-sm text-gray-600">
            {{ link.description }}
          </p>

          <!-- Estadística si existe -->
          <div v-if="link.stats !== undefined && link.stats > 0" class="mt-3">
            <span class="text-2xl font-bold" :class="getIconColor(link.color)">
              {{ link.stats }}
            </span>
          </div>

          <!-- Indicador de disponibilidad -->
          <div class="absolute bottom-4 right-4">
            <i
              v-if="!link.available"
              class="pi pi-lock text-gray-400"
              v-tooltip.top="'Próximamente'"
            ></i>
            <i
              v-else
              class="pi pi-arrow-right text-gray-400 group-hover:translate-x-1 transition-transform"
            ></i>
          </div>
        </div>
      </div>

      <!-- Información adicional -->
      <div class="mt-12 text-center text-sm text-gray-500">
        <p>© 2024 Sistema Judicial de Guinea Ecuatorial. Todos los derechos reservados.</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Animaciones suaves */
.group:hover {
  transform: translateY(-2px);
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
}

/* Personalización de avatar */
:deep(.p-avatar) {
  font-weight: 600;
}
</style>
