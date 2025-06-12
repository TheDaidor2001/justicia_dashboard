<template>
  <Dialog
    v-model:visible="dialogVisible"
    :header="'Detalle del Mensaje #' + (contact?.id.slice(-6) || '')"
    modal
    class="contact-detail-modal"
    style="width: 90vw; max-width: 800px"
    :closable="true"
  >
    <div v-if="loading" class="flex justify-center py-8">
      <ProgressSpinner />
    </div>

    <div v-else-if="contact" class="space-y-6">
      <!-- Información del ciudadano -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-user text-xl text-blue-600"></i>
            <span>Información del Ciudadano</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-3">
              <div>
                <label class="text-sm font-medium text-gray-600">Nombre Completo</label>
                <p class="text-gray-900 font-medium">{{ contact.citizenName }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-600">DNI</label>
                <p class="text-gray-900 font-mono">{{ contact.citizenDni }}</p>
              </div>
            </div>
            <div class="space-y-3">
              <div>
                <label class="text-sm font-medium text-gray-600">Email</label>
                <p class="text-gray-900">{{ contact.citizenEmail }}</p>
              </div>
              <div v-if="contact.citizenPhone">
                <label class="text-sm font-medium text-gray-600">Teléfono</label>
                <p class="text-gray-900">{{ contact.citizenPhone }}</p>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Estado y asignación -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-info-circle text-xl text-purple-600"></i>
            <span>Estado del Mensaje</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-600">Estado</label>
              <div class="mt-1">
                <Badge
                  :value="getStatusLabel(contact.status)"
                  :severity="getStatusSeverity(contact.status)"
                  :class="'status-badge-' + contact.status"
                >
                  <i :class="getStatusIcon(contact.status)" class="mr-1"></i>
                  {{ getStatusLabel(contact.status) }}
                </Badge>
              </div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Asignado a</label>
              <p class="text-gray-900 font-medium mt-1">
                {{ contact.assignedToName || 'Sin asignar' }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Fecha de Creación</label>
              <p class="text-gray-900 mt-1">{{ formatDateLong(contact.createdAt) }}</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Mensaje -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-envelope text-xl text-green-600"></i>
            <span>Mensaje</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium text-gray-600">Asunto</label>
              <p class="text-gray-900 font-medium text-lg mt-1">{{ contact.subject }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Contenido</label>
              <div class="mt-2 p-4 bg-gray-50 rounded-lg border">
                <p class="text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {{ contact.message }}
                </p>
              </div>
            </div>

            <!-- Archivo adjunto -->
            <div v-if="contact.attachmentUrl" class="border-t pt-4">
              <label class="text-sm font-medium text-gray-600">Archivo Adjunto</label>
              <div
                class="mt-2 flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <i class="pi pi-paperclip text-blue-600 text-lg"></i>
                <div class="flex-1">
                  <p class="text-blue-900 font-medium">{{ contact.attachmentName }}</p>
                  <p class="text-blue-600 text-sm">Haz clic en descargar para ver el archivo</p>
                </div>
                <Button
                  @click="downloadAttachment"
                  icon="pi pi-download"
                  label="Descargar"
                  size="small"
                  outlined
                  :loading="downloadingAttachment"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Respuesta (si existe) -->
      <Card v-if="contact.response">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-reply text-xl text-orange-600"></i>
            <span>Respuesta Enviada</span>
          </div>
        </template>
        <template #content>
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium text-gray-600">Fecha de Respuesta</label>
              <p class="text-gray-900 mt-1">
                {{ contact.respondedAt ? formatDateLong(contact.respondedAt) : 'N/A' }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-600">Respuesta</label>
              <div class="mt-2 p-4 bg-green-50 rounded-lg border border-green-200">
                <p class="text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {{ contact.response }}
                </p>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Historial de acciones -->
      <Card v-if="contact.actions && contact.actions.length > 0">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-history text-xl text-gray-600"></i>
            <span>Historial de Acciones</span>
          </div>
        </template>
        <template #content>
          <Timeline :value="contact.actions" class="timeline-actions">
            <template #content="{ item }">
              <div class="timeline-item">
                <div class="flex items-start gap-3">
                  <div class="timeline-icon" :class="getActionIconClass(item.action)">
                    <i :class="getActionIcon(item.action)"></i>
                  </div>
                  <div class="flex-1">
                    <p class="text-gray-900 font-medium">{{ item.description }}</p>
                    <p class="text-sm text-gray-600">
                      {{ item.performedByName }} • {{ formatDateLong(item.createdAt) }}
                    </p>
                  </div>
                </div>
              </div>
            </template>
          </Timeline>
        </template>
      </Card>
    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <div class="flex gap-2">
          <Button
            v-if="contact && canAssign(contact.status)"
            @click="contact && $emit('assign', contact)"
            icon="pi pi-user-plus"
            label="Asignar"
            outlined
          />
          <Button
            v-if="contact && canRespond(contact.status, contact.assignedTo)"
            @click="contact && $emit('respond', contact)"
            icon="pi pi-reply"
            label="Responder"
          />
        </div>
        <Button @click="$emit('hide')" label="Cerrar" outlined />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Timeline from 'primevue/timeline'
import { useContact } from '@/composables/useContact'
import type { ContactDetail } from '@/types/contact'

interface Props {
  visible: boolean
  contact: ContactDetail | null
  loading?: boolean
}

interface Emits {
  (e: 'hide'): void
  (e: 'assign', contact: ContactDetail): void
  (e: 'respond', contact: ContactDetail): void
}

const {
  store,
  getStatusLabel,
  getStatusSeverity,
  getStatusIcon,
  formatDateLong,
  canAssign,
  canRespond,
} = useContact()

// Local ref for dialog visibility
const dialogVisible = ref(false)
const downloadingAttachment = ref(false)

async function downloadAttachment() {
  if (!props.contact?.attachmentName || !props.contact?.id) return

  downloadingAttachment.value = true
  try {
    await store.downloadAttachment(props.contact.id, props.contact.attachmentName)
  } catch (error) {
    console.error('Error downloading attachment:', error)
  } finally {
    downloadingAttachment.value = false
  }
}

function getActionIcon(action: string): string {
  const icons: Record<string, string> = {
    created: 'pi pi-plus-circle',
    assigned: 'pi pi-user-plus',
    responded: 'pi pi-reply',
  }
  return icons[action] || 'pi pi-circle'
}

function getActionIconClass(action: string): string {
  const classes: Record<string, string> = {
    created: 'bg-blue-100 text-blue-600',
    assigned: 'bg-purple-100 text-purple-600',
    responded: 'bg-green-100 text-green-600',
  }
  return classes[action] || 'bg-gray-100 text-gray-600'
}

const props = defineProps<Props>()

// Watch for prop changes and sync with local ref
watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue
  },
)

// Watch for local changes and emit to parent
const emit = defineEmits<Emits>()
watch(dialogVisible, (newValue) => {
  if (!newValue) {
    emit('hide')
  }
})
</script>

<style scoped>
@reference {
  @import 'tailwindcss';
}

.contact-detail-modal :deep(.p-dialog-content) {
  @apply p-0;
}

.contact-detail-modal :deep(.p-dialog-header) {
  @apply border-b border-gray-200;
}

.timeline-item {
  @apply pb-4;
}

.timeline-icon {
  @apply w-8 h-8 rounded-full flex items-center justify-center text-sm;
}

.status-badge-pending {
  @apply bg-yellow-100 text-yellow-800;
}

.status-badge-in_progress {
  @apply bg-blue-100 text-blue-800;
}

.status-badge-resolved {
  @apply bg-green-100 text-green-800;
}

:deep(.timeline-actions .p-timeline-event-content) {
  @apply pl-0;
}

:deep(.timeline-actions .p-timeline-event-marker) {
  @apply hidden;
}
</style>
