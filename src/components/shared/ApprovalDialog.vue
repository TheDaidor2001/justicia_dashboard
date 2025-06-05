<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Message from 'primevue/message'

interface Props {
  visible: boolean
  title: string
  type: 'approve' | 'reject'
  itemTitle?: string
  requireComments?: boolean
  loading?: boolean
  maxCommentLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  requireComments: false,
  loading: false,
  maxCommentLength: 500,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: [comments: string]
  cancel: []
}>()

const comments = ref('')

const isReject = computed(() => props.type === 'reject')
const commentsRequired = computed(() => props.requireComments || isReject.value)

const dialogHeader = computed(() => {
  return isReject.value ? `Rechazar ${props.title}` : `Aprobar ${props.title}`
})

const confirmLabel = computed(() => {
  return isReject.value ? 'Rechazar' : 'Aprobar'
})

const confirmSeverity = computed(() => {
  return isReject.value ? 'danger' : 'success'
})

const confirmIcon = computed(() => {
  return isReject.value ? 'pi pi-times' : 'pi pi-check'
})

const isValid = computed(() => {
  if (commentsRequired.value) {
    return comments.value.trim().length > 0
  }
  return true
})

const remainingChars = computed(() => {
  return props.maxCommentLength - comments.value.length
})

const handleConfirm = () => {
  if (!isValid.value) return
  emit('confirm', comments.value.trim())
}

const handleCancel = () => {
  comments.value = ''
  emit('cancel')
  emit('update:visible', false)
}

const handleHide = () => {
  comments.value = ''
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    @hide="handleHide"
    modal
    :header="dialogHeader"
    :style="{ width: '500px' }"
    :closable="!loading"
  >
    <!-- Información del item -->
    <div v-if="itemTitle" class="mb-4 p-3 bg-gray-50 rounded-lg">
      <p class="text-sm text-gray-600">
        Estás a punto de {{ type === 'reject' ? 'rechazar' : 'aprobar' }}:
      </p>
      <p class="font-semibold text-gray-800 mt-1">{{ itemTitle }}</p>
    </div>

    <!-- Mensaje de advertencia para rechazo -->
    <Message v-if="isReject" severity="warn" :closable="false" class="mb-4">
      <i class="pi pi-exclamation-triangle mr-2"></i>
      Esta acción devolverá el documento al estado borrador y notificará al creador.
    </Message>

    <!-- Campo de comentarios -->
    <div class="mb-4">
      <label class="block mb-2 font-medium">
        Comentarios
        <span v-if="commentsRequired" class="text-red-500">*</span>
        <span v-else class="text-gray-500">(opcional)</span>
      </label>
      <Textarea
        v-model="comments"
        rows="4"
        class="w-full"
        :placeholder="
          isReject ? 'Explica el motivo del rechazo...' : 'Añade comentarios sobre la aprobación...'
        "
        :class="{ 'p-invalid': commentsRequired && !comments.trim() }"
        :disabled="loading"
        :maxlength="maxCommentLength"
      />
      <div class="flex justify-between mt-1">
        <small v-if="commentsRequired && !comments.trim()" class="text-red-500">
          {{
            isReject ? 'El motivo del rechazo es obligatorio' : 'Los comentarios son obligatorios'
          }}
        </small>
        <small class="text-gray-500 text-right"> {{ remainingChars }} caracteres restantes </small>
      </div>
    </div>

    <!-- Información adicional -->
    <div class="text-sm text-gray-600 space-y-1">
      <p v-if="!isReject">
        <i class="pi pi-info-circle mr-1"></i>
        Al aprobar, el documento avanzará al siguiente nivel del flujo.
      </p>
      <p>
        <i class="pi pi-envelope mr-1"></i>
        Se enviará una notificación por correo electrónico.
      </p>
    </div>

    <template #footer>
      <div class="flex gap-2 justify-end">
        <Button label="Cancelar" severity="secondary" @click="handleCancel" :disabled="loading" />
        <Button
          :label="confirmLabel"
          :icon="loading ? 'pi pi-spinner pi-spin' : confirmIcon"
          :severity="confirmSeverity"
          @click="handleConfirm"
          :loading="loading"
          :disabled="!isValid"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
:deep(.p-dialog) {
  .p-dialog-header {
    padding: 1.5rem;
    background-color: #f8f9fa;
  }

  .p-dialog-content {
    padding: 1.5rem;
  }
}
</style>
