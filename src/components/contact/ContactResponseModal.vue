<template>
  <Dialog
    v-model:visible="dialogVisible"
    header="Responder Mensaje"
    modal
    class="contact-response-modal"
    style="width: 700px"
    :closable="true"
  >
    <div v-if="contact" class="space-y-6">
      <!-- Información del mensaje -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h4 class="font-semibold text-gray-900 mb-3">Mensaje del ciudadano:</h4>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-sm font-medium text-gray-600">Ciudadano:</span>
              <p class="text-gray-900 font-medium">{{ contact.citizenName }}</p>
            </div>
            <div>
              <span class="text-sm font-medium text-gray-600">DNI:</span>
              <p class="text-gray-900 font-mono">{{ contact.citizenDni }}</p>
            </div>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-600">Asunto:</span>
            <p class="text-gray-900 font-medium">{{ contact.subject }}</p>
          </div>
          <div>
            <span class="text-sm font-medium text-gray-600">Mensaje:</span>
            <div class="mt-1 p-3 bg-white rounded border">
              <p class="text-gray-900 text-sm whitespace-pre-wrap">{{ contact.message }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulario de respuesta -->
      <form @submit.prevent="sendResponse" class="space-y-4">
        <div class="form-group">
          <label for="response" class="form-label">
            <i class="pi pi-reply mr-1"></i>
            Respuesta *
          </label>
          <Textarea
            id="response"
            v-model="responseForm.response"
            :class="{ 'p-invalid': $v.response.$error }"
            placeholder="Escriba su respuesta al ciudadano..."
            rows="8"
            class="w-full"
            :maxlength="2000"
          />
          <div class="flex justify-between items-center mt-1">
            <small v-if="$v.response.$error" class="p-error">
              {{ $v.response.$errors[0].$message }}
            </small>
            <small class="text-gray-500">
              {{ responseForm.response.length }}/2000 caracteres
            </small>
          </div>
        </div>

        <!-- Información del destinatario -->
        <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div class="flex items-start gap-2">
            <i class="pi pi-envelope text-blue-600 mt-0.5"></i>
            <div class="flex-1">
              <h5 class="font-semibold text-blue-900">Esta respuesta será enviada a:</h5>
              <p class="text-blue-800 mt-1">
                <span class="font-medium">{{ contact.citizenName }}</span>
                ({{ contact.citizenEmail }})
              </p>
              <p class="text-sm text-blue-700 mt-2">
                El ciudadano recibirá un email con tu respuesta y el mensaje será marcado como
                "Resuelto".
              </p>
            </div>
          </div>
        </div>

        <!-- Advertencias -->
        <div class="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div class="flex gap-2">
            <i class="pi pi-exclamation-triangle text-amber-600 mt-0.5"></i>
            <div class="text-sm text-amber-800">
              <p class="font-medium">Antes de enviar, verifica:</p>
              <ul class="list-disc list-inside mt-1 space-y-1">
                <li>La respuesta es clara y completa</li>
                <li>Has respondido a todas las inquietudes del ciudadano</li>
                <li>El tono es profesional y cordial</li>
                <li>No hay errores ortográficos o gramaticales</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="bg-red-50 p-4 rounded-lg border border-red-200">
          <div class="flex gap-2">
            <i class="pi pi-info-circle text-red-600 mt-0.5"></i>
            <div class="text-sm text-red-800">
              <p class="font-medium">⚠️ Esta acción no se puede deshacer</p>
              <p class="mt-1">
                Una vez enviada la respuesta, el mensaje se marcará como resuelto y se enviará
                automáticamente un email al ciudadano.
              </p>
            </div>
          </div>
        </div>
      </form>

      <!-- Preview de la respuesta -->
      <div
        v-if="responseForm.response.trim()"
        class="bg-green-50 p-4 rounded-lg border border-green-200"
      >
        <h5 class="font-semibold text-green-900 mb-2">Vista previa de la respuesta:</h5>
        <div class="bg-white p-3 rounded border">
          <p class="text-gray-900 text-sm whitespace-pre-wrap">{{ responseForm.response }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button @click="$emit('hide')" label="Cancelar" outlined :disabled="loading" />
        <Button
          @click="sendResponse"
          label="Enviar Respuesta"
          icon="pi pi-send"
          :loading="loading"
          :disabled="!responseForm.response.trim() || responseForm.response.length < 10"
          severity="success"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, minLength } from '@vuelidate/validators'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import { useContact } from '@/composables/useContact'
import type { Contact, RespondContactRequest } from '@/types/contact'

interface Props {
  visible: boolean
  contact: Contact | null
}

interface Emits {
  (e: 'hide'): void
  (e: 'responded', contact: Contact): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local ref for dialog visibility
const dialogVisible = ref(false)

const { store } = useContact()

const loading = ref(false)
const responseForm = reactive<RespondContactRequest>({
  response: '',
})

const validationRules = computed(() => ({
  response: {
    required,
    minLength: minLength(10),
  },
}))

const $v = useVuelidate(validationRules, responseForm)

// Watch for prop changes and sync with local ref
watch(
  () => props.visible,
  (newValue) => {
    dialogVisible.value = newValue
  },
)

// Watch for local changes and emit to parent
watch(dialogVisible, (newValue) => {
  if (!newValue) {
    emit('hide')
  }
})

// Reset form when modal opens/closes
watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      responseForm.response = ''
      $v.value.$reset()
      store.clearError()
    }
  },
)

async function sendResponse() {
  const isValid = await $v.value.$validate()
  if (!isValid || !props.contact) return

  loading.value = true
  try {
    const updatedContact = await store.respondContact(props.contact.id, responseForm)
    emit('responded', updatedContact)
    emit('hide')
  } catch (error) {
    console.error('Error responding to contact:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@reference {
  @import 'tailwindcss';
}

.contact-response-modal :deep(.p-dialog-content) {
  @apply p-6;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-semibold text-gray-700 flex items-center;
}

:deep(.p-textarea) {
  @apply resize-none;
}

:deep(.p-textarea:enabled:focus) {
  @apply border-blue-500 shadow-sm;
}

:deep(.p-textarea:enabled:hover) {
  @apply border-gray-400;
}
</style>
