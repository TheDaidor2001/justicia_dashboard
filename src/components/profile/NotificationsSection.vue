<template>
  <div class="notifications-section">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Notificaciones
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        Gestiona tus notificaciones y preferencias
      </p>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <ProgressSpinner />
    </div>

    <div v-else-if="notifications && notifications.length > 0" class="space-y-4">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-item"
        :class="{ 'unread': !notification.read }"
      >
        <div class="flex items-start gap-4">
          <div class="notification-icon">
            <i :class="getNotificationIcon(notification.type)" class="text-lg"></i>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                {{ notification.title }}
              </h3>
              <div class="flex items-center gap-2">
                <time class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDateTime(notification.createdAt) }}
                </time>
                <Button
                  v-if="!notification.read"
                  @click="markAsRead(notification.id)"
                  icon="pi pi-check"
                  size="small"
                  text
                  rounded
                  class="text-green-600"
                  v-tooltip="'Marcar como leída'"
                />
              </div>
            </div>
            
            <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {{ notification.message }}
            </p>
            
            <Badge
              :value="getTypeLabel(notification.type)"
              :severity="getTypeSeverity(notification.type)"
              size="small"
              class="mt-2"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="text-center py-8">
      <i class="pi pi-bell text-4xl text-gray-400 mb-4"></i>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Sin notificaciones
      </h3>
      <p class="text-gray-600 dark:text-gray-400">
        No tienes notificaciones pendientes
      </p>
    </div>

    <Message v-if="profileStore.error" severity="error" class="mt-4">
      {{ profileStore.error }}
    </Message>

    <!-- Acciones -->
    <div class="flex justify-between items-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        {{ unreadCount }} notificaciones sin leer
      </div>
      <div class="flex gap-2">
        <Button
          @click="refreshNotifications"
          label="Actualizar"
          icon="pi pi-refresh"
          outlined
          size="small"
          :loading="loading"
        />
        <Button
          v-if="unreadCount > 0"
          @click="markAllAsRead"
          label="Marcar todas como leídas"
          size="small"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Message from 'primevue/message'
import { useProfileStore } from '@/stores/profile'

const profileStore = useProfileStore()

const notifications = computed(() => profileStore.notifications)
const loading = computed(() => profileStore.loading)
const unreadCount = computed(() => profileStore.unreadNotificationsCount)

onMounted(async () => {
  await loadNotifications()
})

async function loadNotifications() {
  try {
    await profileStore.fetchNotifications()
  } catch (error) {
    console.error('Error loading notifications:', error)
  }
}

async function refreshNotifications() {
  await loadNotifications()
}

async function markAsRead(notificationId: number) {
  try {
    await profileStore.markNotificationAsRead(notificationId)
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

async function markAllAsRead() {
  try {
    const promises = notifications.value
      .filter(n => !n.read)
      .map(n => profileStore.markNotificationAsRead(n.id))
    
    await Promise.all(promises)
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
  }
}

function getNotificationIcon(type: string): string {
  const iconMap: Record<string, string> = {
    'info': 'pi pi-info-circle text-blue-600',
    'warning': 'pi pi-exclamation-triangle text-yellow-600',
    'success': 'pi pi-check-circle text-green-600',
    'error': 'pi pi-times-circle text-red-600'
  }
  
  return iconMap[type] || 'pi pi-bell text-gray-600'
}

function getTypeLabel(type: string): string {
  const labelMap: Record<string, string> = {
    'info': 'Información',
    'warning': 'Advertencia',
    'success': 'Éxito',
    'error': 'Error'
  }
  
  return labelMap[type] || type
}

function getTypeSeverity(type: string): 'success' | 'info' | 'warning' | 'danger' {
  const severityMap: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
    'info': 'info',
    'warning': 'warning',
    'success': 'success',
    'error': 'danger'
  }
  
  return severityMap[type] || 'info'
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
      day: 'numeric'
    })
  }
}
</script>

<style scoped>
@reference {
  @import 'tailwindcss';
}

.notification-item {
  @apply p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors;
}

.notification-item.unread {
  @apply bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800;
}

.notification-icon {
  @apply w-10 h-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm;
}
</style>