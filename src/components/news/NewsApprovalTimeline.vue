<script setup lang="ts">
import { computed } from 'vue'
import Timeline from 'primevue/timeline'
import Card from 'primevue/card'
import Avatar from 'primevue/avatar'
import Tag from 'primevue/tag'
import type { NewsApprovalHistory } from '@/types/news'

interface Props {
  history: NewsApprovalHistory[]
  loading?: boolean
  emptyMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyMessage: 'No hay historial de aprobación disponible',
})

// Configuración de acciones específicas para noticias
const actionConfig: Record<string, any> = {
  create: {
    label: 'Noticia creada',
    icon: 'pi-plus-circle',
    color: '#6B7280',
    severity: 'secondary',
  },
  submit: {
    label: 'Enviado para revisión',
    icon: 'pi-send',
    color: '#3B82F6',
    severity: 'info',
  },
  submit_to_director: {
    label: 'Enviado al Director de Prensa',
    icon: 'pi-send',
    color: '#3B82F6',
    severity: 'info',
  },
  approve_director: {
    label: 'Aprobado por Director de Prensa',
    icon: 'pi-check-circle',
    color: '#10B981',
    severity: 'success',
  },
  submit_to_president: {
    label: 'Enviado al Presidente CSPJ',
    icon: 'pi-send',
    color: '#8B5CF6',
    severity: 'info',
  },
  approve_president: {
    label: 'Aprobado por Presidente CSPJ',
    icon: 'pi-verified',
    color: '#8B5CF6',
    severity: 'success',
  },
  publish: {
    label: 'Publicado',
    icon: 'pi-globe',
    color: '#059669',
    severity: 'success',
  },
  reject: {
    label: 'Rechazado',
    icon: 'pi-times-circle',
    color: '#EF4444',
    severity: 'danger',
  },
  edit: {
    label: 'Editado',
    icon: 'pi-pencil',
    color: '#F59E0B',
    severity: 'warning',
  },
  submit_from_court: {
    label: 'Enviado desde Juzgado',
    icon: 'pi-building',
    color: '#7C3AED',
    severity: 'help',
  },
  court_submission: {
    label: 'Enviado desde Juzgado',
    icon: 'pi-building',
    color: '#7C3AED',
    severity: 'help',
  },
}

// Obtener configuración de acción
const getActionConfig = (action: string) => {
  return (
    actionConfig[action] || {
      label: translateAction(action),
      icon: 'pi-circle',
      color: '#6B7280',
      severity: 'secondary',
    }
  )
}

// Función para traducir acciones al español
const translateAction = (action: string): string => {
  const translations: Record<string, string> = {
    create: 'Creado',
    submit: 'Enviado para revisión',
    submit_to_director: 'Enviado al Director',
    approve_director: 'Aprobado por Director',
    submit_to_president: 'Enviado al Presidente',
    approve_president: 'Aprobado por Presidente',
    publish: 'Publicado',
    reject: 'Rechazado',
    edit: 'Editado',
    submit_from_court: 'Enviado desde Juzgado',
    court_submission: 'Enviado desde Juzgado',
    update: 'Actualizado',
    delete: 'Eliminado',
  }
  
  return translations[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Función para traducir estados al español
const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    draft: 'Borrador',
    DRAFT: 'Borrador',
    pending_director_approval: 'Pendiente de Aprobación del Director',
    pending_director: 'Pendiente de Director',
    PENDING_DIRECTOR: 'Pendiente de Director',
    PENDING_DIRECTOR_APPROVAL: 'Pendiente de Aprobación del Director',
    pending_president_approval: 'Pendiente de Aprobación del Presidente',
    pending_president: 'Pendiente de Presidente',
    PENDING_PRESIDENT: 'Pendiente de Presidente',
    PENDING_PRESIDENT_APPROVAL: 'Pendiente de Aprobación del Presidente',
    published: 'Publicado',
    PUBLISHED: 'Publicado',
    rejected: 'Rechazado',
    REJECTED: 'Rechazado',
    approved: 'Aprobado',
    APPROVED: 'Aprobado',
    court_submission: 'Enviado desde Juzgado',
    submitted: 'Enviado',
    SUBMITTED: 'Enviado',
    'court submission': 'Enviado desde Juzgado',
  }
  
  return translations[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Formatear fecha relativa
const formatRelativeDate = (date: string) => {
  const now = new Date()
  const actionDate = new Date(date)
  const diffMs = now.getTime() - actionDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Hace un momento'
  if (diffMins < 60) return `Hace ${diffMins} minutos`
  if (diffHours < 24) return `Hace ${diffHours} horas`
  if (diffDays < 7) return `Hace ${diffDays} días`

  return actionDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Obtener iniciales del usuario
const getUserInitials = (fullName: string) => {
  if (!fullName || fullName.trim() === '') return 'S'
  
  return fullName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Formatear rol específico para noticias
const formatRole = (role: string) => {
  const roles: Record<string, string> = {
    juez: 'Juez',
    presidente_audiencia: 'Presidente de Audiencia',
    director_prensa: 'Director de Prensa',
    tecnico_prensa: 'Técnico de Prensa',
    presidente_cspj: 'Presidente CSPJ',
    vicepresidente_cspj: 'Vicepresidente CSPJ',
    admin: 'Administrador',
    sistema: 'Sistema',
    unknown: 'Desconocido',
  }
  return roles[role] || role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Ordenar historial por fecha (más reciente primero)
const sortedHistory = computed(() => {
  return [...props.history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
})
</script>

<template>
  <div class="news-approval-timeline">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-8">
      <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
      <p class="text-gray-500 mt-2">Cargando historial...</p>
    </div>

    <!-- Timeline -->
    <Timeline v-else-if="sortedHistory.length > 0" :value="sortedHistory" class="custom-timeline">
      <template #marker="slotProps">
        <span
          class="flex w-10 h-10 items-center justify-center text-white rounded-full z-10 shadow-md"
          :style="{ backgroundColor: getActionConfig(slotProps.item.action).color }"
        >
          <i :class="`pi ${getActionConfig(slotProps.item.action).icon}`"></i>
        </span>
      </template>

      <template #content="slotProps">
        <Card class="mb-4 shadow-sm hover:shadow-md transition-shadow">
          <template #content>
            <!-- Header -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <Tag
                  :value="getActionConfig(slotProps.item.action).label"
                  :severity="getActionConfig(slotProps.item.action).severity"
                  class="text-sm"
                />
                <span class="text-sm text-gray-500">
                  {{ formatRelativeDate(slotProps.item.createdAt) }}
                </span>
              </div>
            </div>

            <!-- Usuario -->
            <div class="flex items-center gap-3 mb-3">
              <Avatar
                v-if="(slotProps.item.fromUser || slotProps.item.user) && (slotProps.item.fromUser?.fullName || slotProps.item.user?.fullName) && (slotProps.item.fromUser?.fullName || slotProps.item.user?.fullName) !== 'Sistema'"
                :label="getUserInitials(slotProps.item.fromUser?.fullName || slotProps.item.user?.fullName || 'S')"
                shape="circle"
                size="small"
                class="bg-gray-200"
              />
              <Avatar
                v-else
                label="S"
                shape="circle"
                size="small"
                class="bg-blue-200"
              />
              <div>
                <p class="font-medium text-gray-900">
                  {{ 
                    (slotProps.item.fromUser?.fullName && slotProps.item.fromUser.fullName !== 'Usuario desconocido') 
                      ? slotProps.item.fromUser.fullName 
                      : (slotProps.item.user?.fullName && slotProps.item.user.fullName !== 'Usuario desconocido')
                        ? slotProps.item.user.fullName
                        : 'Sistema' 
                  }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ formatRole(slotProps.item.fromUser?.role || slotProps.item.user?.role || 'sistema') }}
                </p>
              </div>
            </div>

            <!-- Estado anterior y nuevo -->
            <div v-if="slotProps.item.fromStatus || slotProps.item.toStatus" class="mb-3">
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <i class="pi pi-arrow-right"></i>
                <span v-if="slotProps.item.fromStatus && slotProps.item.toStatus">
                  <span class="text-red-600">{{ translateStatus(slotProps.item.fromStatus) }}</span>
                  →
                  <span class="text-green-600">{{ translateStatus(slotProps.item.toStatus) }}</span>
                </span>
                <span v-else-if="slotProps.item.toStatus">
                  Estado: <strong>{{ translateStatus(slotProps.item.toStatus) }}</strong>
                </span>
              </div>
            </div>

            <!-- Comentarios -->
            <div v-if="slotProps.item.comments" class="mt-3 p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-700 italic">
                <i class="pi pi-comment mr-1"></i>
                "{{ slotProps.item.comments }}"
              </p>
            </div>

            <!-- Información adicional según acción -->
            <div v-if="slotProps.item.action === 'publish'" class="mt-3 p-3 bg-green-50 rounded-lg">
              <p class="text-sm text-green-700">
                <i class="pi pi-globe mr-1"></i>
                La noticia está ahora visible públicamente
              </p>
            </div>
          </template>
        </Card>
      </template>

      <template #opposite="slotProps">
        <small class="text-gray-500">
          {{
            new Date(slotProps.item.createdAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          }}
        </small>
      </template>
    </Timeline>

    <!-- Empty state -->
    <div v-else class="text-center py-12">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
        <i class="pi pi-history text-2xl text-gray-400"></i>
      </div>
      <p class="text-gray-500">{{ emptyMessage }}</p>
    </div>
  </div>
</template>

<style scoped>
:deep(.custom-timeline) {
  .p-timeline-event-content {
    background-color: transparent;
  }

  .p-timeline-event-separator {
    background-color: #e5e7eb;
  }

  .p-timeline-event-marker {
    border: 3px solid white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
}

:deep(.p-card) {
  border: 1px solid #e5e7eb;

  .p-card-content {
    padding: 1rem;
  }
}

:deep(.p-tag) {
  font-weight: 500;
}
</style>
