<template>
  <Dialog
    v-model:visible="dialogVisible"
    header="Asignar Mensaje"
    modal
    class="contact-assign-modal"
    style="width: 500px"
    :closable="true"
  >
    <div v-if="contact" class="space-y-6">
      <!-- Información del mensaje -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h4 class="font-semibold text-gray-900 mb-2">Mensaje a asignar:</h4>
        <div class="space-y-2">
          <p class="text-sm">
            <span class="font-medium text-gray-600">Ciudadano:</span>
            <span class="text-gray-900">{{ contact.citizenName }}</span>
          </p>
          <p class="text-sm">
            <span class="font-medium text-gray-600">Asunto:</span>
            <span class="text-gray-900">{{ contact.subject }}</span>
          </p>
          <p class="text-sm">
            <span class="font-medium text-gray-600">Fecha:</span>
            <span class="text-gray-900">{{ formatDateLong(contact.createdAt) }}</span>
          </p>
        </div>
      </div>

      <!-- Formulario de asignación -->
      <form @submit.prevent="assignContact" class="space-y-4">
        <div class="form-group">
          <label for="assignedTo" class="form-label">
            <i class="pi pi-user mr-1"></i>
            Asignar a *
          </label>
          <Select
            id="userId"
            v-model="assignForm.userId"
            :options="assignableUsers"
            optionLabel="nombre"
            optionValue="id"
            placeholder="Selecciona un funcionario"
            :class="{ 'p-invalid': $v.userId.$error }"
            class="w-full"
            :loading="loading"
            @focus="loadAssignableUsers"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold"
                >
                  {{ getInitials(option.nombre) }}
                </div>
                <div>
                  <div class="font-medium">{{ option.nombre }}</div>
                  <div class="text-sm text-gray-600">
                    <UserRoleBadge :role="option.rol" size="small" />
                  </div>
                </div>
              </div>
            </template>
            <template #value="{ value }">
              <div v-if="value" class="flex items-center gap-2">
                <div
                  class="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold"
                >
                  {{ getInitials(getSelectedUserName(value)) }}
                </div>
                <span>{{ getSelectedUserName(value) }}</span>
              </div>
            </template>
          </Select>
          <small v-if="$v.userId.$error" class="p-error">
            {{ $v.userId.$errors[0].$message }}
          </small>
        </div>

        <!-- Información sobre el usuario seleccionado -->
        <div v-if="selectedUser" class="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold"
            >
              {{ getInitials(selectedUser.nombre) }}
            </div>
            <div class="flex-1">
              <h5 class="font-semibold text-blue-900">{{ selectedUser.nombre }}</h5>
              <div class="flex items-center gap-2 mt-1">
                <UserRoleBadge :role="selectedUser.rol" />
                <span class="text-sm text-blue-600">{{ selectedUser.email }}</span>
              </div>
              <p class="text-sm text-blue-700 mt-2">
                Este mensaje será asignado a {{ selectedUser.nombre }} y su estado cambiará a "En
                Proceso".
              </p>
            </div>
          </div>
        </div>

        <!-- Advertencia -->
        <div class="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div class="flex gap-2">
            <i class="pi pi-info-circle text-amber-600 mt-0.5"></i>
            <div class="text-sm text-amber-800">
              <p class="font-medium">Información importante:</p>
              <ul class="list-disc list-inside mt-1 space-y-1">
                <li>El funcionario asignado recibirá una notificación</li>
                <li>El estado del mensaje cambiará a "En Proceso"</li>
                <li>Solo el funcionario asignado podrá responder el mensaje</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button @click="$emit('hide')" label="Cancelar" outlined :disabled="loading" />
        <Button
          @click="assignContact"
          label="Asignar Mensaje"
          icon="pi pi-user-plus"
          :loading="loading"
          :disabled="!assignForm.userId"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { useContact } from '@/composables/useContact'
import { useUsers } from '@/composables/useUsers'
import UserRoleBadge from '@/components/users/UserRoleBadge.vue'
import type { Contact, AssignContactRequest } from '@/types/contact'
import type { User } from '@/types/user'

interface Props {
  visible: boolean
  contact: Contact | null
}

interface Emits {
  (e: 'hide'): void
  (e: 'assigned', contact: Contact): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { store, formatDateLong } = useContact()
const { assignableUsers, loading: loadingUsers, fetchAssignableUsers } = useUsers()

// Local ref for dialog visibility
const dialogVisible = ref(false)
const loading = ref(false)
const assignForm = reactive<AssignContactRequest>({
  userId: '',
})

const validationRules = computed(() => ({
  userId: { required },
}))

const $v = useVuelidate(validationRules, assignForm)

const selectedUser = computed(() => {
  if (!assignForm.userId) return null
  return assignableUsers.value.find((user) => user.id === assignForm.userId)
})

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
      assignForm.userId = ''
      $v.value.$reset()
      store.clearError()
    }
  },
)

async function loadAssignableUsers() {
  if (assignableUsers.value.length === 0) {
    await fetchAssignableUsers()
  }
}

async function assignContact() {
  const isValid = await $v.value.$validate()
  if (!isValid || !props.contact) return

  loading.value = true
  try {
    const updatedContact = await store.assignContact(props.contact.id, assignForm)
    emit('assigned', updatedContact)
    emit('hide')
  } catch (error) {
    console.error('Error assigning contact:', error)
  } finally {
    loading.value = false
  }
}

function getInitials(name: string): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

function getSelectedUserName(userId: string): string {
  const user = assignableUsers.value.find((u) => u.id === userId)
  return user?.nombre || ''
}
</script>

<style scoped>
@reference {
  @import 'tailwindcss';
}

.contact-assign-modal :deep(.p-dialog-content) {
  @apply p-6;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-semibold text-gray-700 flex items-center;
}

:deep(.p-select) {
  @apply w-full;
}

:deep(.p-select .p-select-label) {
  @apply w-full;
}
</style>
