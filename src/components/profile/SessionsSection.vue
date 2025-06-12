<template>
  <div class="sessions-section">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Sesiones Activas</h2>
      <p class="text-gray-600 dark:text-gray-400">
        Gestiona tus sesiones abiertas en diferentes dispositivos
      </p>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <ProgressSpinner />
    </div>

    <div v-else-if="activeSessions && activeSessions.length > 0" class="space-y-4">
      <div
        v-for="session in activeSessions"
        :key="session.id"
        class="session-item"
        :class="{ 'current-session': session.isCurrent }"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="session-icon">
              <i :class="getDeviceIcon(session.device)" class="text-lg"></i>
            </div>

            <div>
              <h3 class="text-sm font-medium text-gray-900 dark:text-white">
                {{ session.device }}
                <Badge
                  v-if="session.isCurrent"
                  value="Actual"
                  severity="success"
                  size="small"
                  class="ml-2"
                />
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-300">
                {{ session.browser }} • {{ session.ip }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Última actividad: {{ formatDateTime(session.lastActivity) }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <Button
              v-if="!session.isCurrent"
              @click="confirmCloseSession(session)"
              icon="pi pi-sign-out"
              severity="danger"
              text
              rounded
              size="small"
              v-tooltip="'Cerrar sesión'"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="text-center py-8">
      <i class="pi pi-desktop text-4xl text-gray-400 mb-4"></i>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Sin sesiones activas</h3>
      <p class="text-gray-600 dark:text-gray-400">No hay sesiones activas registradas</p>
    </div>

    <Message v-if="profileStore.error" severity="error" class="mt-4">
      {{ profileStore.error }}
    </Message>

    <!-- Acciones -->
    <div class="flex justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <Button
        @click="refreshSessions"
        label="Actualizar Sesiones"
        icon="pi pi-refresh"
        outlined
        :loading="loading"
      />
    </div>

    <!-- Dialog de confirmación -->
    <Dialog
      v-model:visible="showConfirmDialog"
      modal
      header="Cerrar Sesión"
      :style="{ width: '25rem' }"
    >
      <div class="flex items-center gap-3 mb-4">
        <i class="pi pi-exclamation-triangle text-orange-500 text-xl"></i>
        <span>¿Estás seguro de que quieres cerrar esta sesión?</span>
      </div>
      <div v-if="sessionToClose" class="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-4">
        <p class="text-sm font-medium">{{ sessionToClose.device }}</p>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          {{ sessionToClose.browser }} • {{ sessionToClose.ip }}
        </p>
      </div>
      <template #footer>
        <Button label="Cancelar" outlined @click="showConfirmDialog = false" />
        <Button label="Cerrar Sesión" severity="danger" @click="closeSession" :loading="loading" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import { useProfileStore } from '@/stores/profile'
import type { ActiveSession } from '@/types/profile'

const profileStore = useProfileStore()

const activeSessions = computed(() => profileStore.activeSessions)
const loading = computed(() => profileStore.loading)

const showConfirmDialog = ref(false)
const sessionToClose = ref<ActiveSession | null>(null)

onMounted(async () => {
  await loadSessions()
})

async function loadSessions() {
  try {
    await profileStore.fetchActiveSessions()
  } catch (error) {
    console.error('Error loading active sessions:', error)
  }
}

async function refreshSessions() {
  await loadSessions()
}

function confirmCloseSession(session: ActiveSession) {
  sessionToClose.value = session
  showConfirmDialog.value = true
}

async function closeSession() {
  if (!sessionToClose.value) return

  try {
    await profileStore.closeRemoteSession(sessionToClose.value.id)
    showConfirmDialog.value = false
    sessionToClose.value = null
  } catch (error) {
    console.error('Error closing session:', error)
  }
}

function getDeviceIcon(device: string): string {
  const deviceLower = device.toLowerCase()

  if (deviceLower.includes('mobile') || deviceLower.includes('phone')) {
    return 'pi pi-mobile text-blue-600'
  } else if (deviceLower.includes('tablet') || deviceLower.includes('ipad')) {
    return 'pi pi-tablet text-purple-600'
  } else {
    return 'pi pi-desktop text-gray-600'
  }
}

function formatDateTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInHours * 60)
    return `Hace ${diffInMinutes} minutos`
  } else if (diffInHours < 24) {
    return `Hace ${Math.floor(diffInHours)} horas`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `Hace ${diffInDays} días`
  }
}
</script>

<style scoped>
@reference {
  @import 'tailwindcss';
}

.session-item {
  @apply p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700;
}

.session-item.current-session {
  @apply bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800;
}

.session-icon {
  @apply w-12 h-12 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm;
}
</style>
