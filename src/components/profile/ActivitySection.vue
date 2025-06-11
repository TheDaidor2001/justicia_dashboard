<template>
  <div class="activity-section">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Mi Actividad Reciente
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        Últimas 10 acciones realizadas en el sistema
      </p>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <ProgressSpinner />
    </div>

    <div v-else-if="userActivity && userActivity.length > 0" class="space-y-4">
      <div
        v-for="activity in userActivity"
        :key="activity.id"
        class="activity-item"
      >
        <div class="flex items-start gap-4">
          <div class="activity-icon">
            <i :class="getActionIcon(activity.action)" class="text-lg"></i>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                {{ getActionLabel(activity.action) }}
              </h3>
              <time class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDateTime(activity.timestamp) }}
              </time>
            </div>
            
            <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {{ activity.description }}
            </p>
            
            <div v-if="activity.entity" class="flex items-center gap-2 mt-2">
              <Badge
                :value="activity.entityType"
                :severity="getEntitySeverity(activity.entityType)"
                size="small"
              />
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ activity.entity }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="text-center py-8">
      <i class="pi pi-history text-4xl text-gray-400 mb-4"></i>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Sin actividad reciente
      </h3>
      <p class="text-gray-600 dark:text-gray-400">
        No hay actividad registrada en tu cuenta
      </p>
    </div>

    <Message v-if="profileStore.error" severity="error" class="mt-4">
      {{ profileStore.error }}
    </Message>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import Badge from 'primevue/badge'
import Message from 'primevue/message'
import { useProfileStore } from '@/stores/profile'

const profileStore = useProfileStore()

const userActivity = computed(() => profileStore.userActivity)
const loading = computed(() => profileStore.loading)

onMounted(async () => {
  if (profileStore.profile) {
    try {
      await profileStore.fetchUserActivity()
    } catch (error) {
      console.error('Error loading user activity:', error)
    }
  }
})

function getActionIcon(action: string): string {
  const iconMap: Record<string, string> = {
    'login': 'pi pi-sign-in text-green-600',
    'logout': 'pi pi-sign-out text-red-600',
    'create': 'pi pi-plus text-blue-600',
    'update': 'pi pi-pencil text-yellow-600',
    'delete': 'pi pi-trash text-red-600',
    'approve': 'pi pi-check text-green-600',
    'reject': 'pi pi-times text-red-600',
    'submit': 'pi pi-send text-blue-600',
    'view': 'pi pi-eye text-gray-600',
    'download': 'pi pi-download text-purple-600',
    'upload': 'pi pi-upload text-indigo-600'
  }
  
  return iconMap[action] || 'pi pi-info-circle text-gray-600'
}

function getActionLabel(action: string): string {
  const labelMap: Record<string, string> = {
    'login': 'Inicio de sesión',
    'logout': 'Cierre de sesión',
    'create': 'Creación',
    'update': 'Actualización',
    'delete': 'Eliminación',
    'approve': 'Aprobación',
    'reject': 'Rechazo',
    'submit': 'Envío',
    'view': 'Visualización',
    'download': 'Descarga',
    'upload': 'Carga'
  }
  
  return labelMap[action] || action
}

function getEntitySeverity(entityType: string): 'success' | 'info' | 'warning' | 'danger' {
  const severityMap: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
    'expediente': 'info',
    'news': 'success',
    'user': 'warning',
    'document': 'info',
    'contact': 'warning'
  }
  
  return severityMap[entityType] || 'info'
}

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60)
    return `Hace ${diffInMinutes} min`
  } else if (diffInHours < 24) {
    return `Hace ${Math.floor(diffInHours)} h`
  } else {
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}
</script>

<style scoped>
@reference {
  @import 'tailwindcss';
}

.activity-item {
  @apply p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
}

.activity-icon {
  @apply w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm;
}
</style>