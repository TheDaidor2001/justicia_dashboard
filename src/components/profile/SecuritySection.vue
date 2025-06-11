<template>
  <div class="security-section space-y-6">
    <!-- Header -->
    <Card>
      <template #title>
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <i class="pi pi-shield text-white text-xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-900">
              Seguridad y Contraseña
            </h2>
            <p class="text-gray-600">
              Cambia tu contraseña para mantener tu cuenta segura
            </p>
          </div>
        </div>
      </template>
    </Card>

    <!-- Formulario de cambio de contraseña -->
    <Card>
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-key text-xl text-purple-600"></i>
          <span class="text-gray-900">Cambiar Contraseña</span>
        </div>
      </template>
      <template #content>
        <form @submit.prevent="changePassword" class="space-y-6 max-w-md">
          <div class="form-group">
            <label for="currentPassword" class="form-label text-gray-700">
              <i class="pi pi-lock mr-1"></i>
              Contraseña Actual *
            </label>
            <Password
              id="currentPassword"
              v-model="passwordForm.currentPassword"
              :class="{ 'p-invalid': $v.currentPassword.$error }"
              placeholder="Ingrese su contraseña actual"
              :feedback="false"
              toggleMask
              class="w-full"
            />
            <small v-if="$v.currentPassword.$error" class="p-error">
              {{ $v.currentPassword.$errors[0].$message }}
            </small>
          </div>

          <div class="form-group">
            <label for="newPassword" class="form-label text-gray-700">
              <i class="pi pi-key mr-1"></i>
              Nueva Contraseña *
            </label>
            <Password
              id="newPassword"
              v-model="passwordForm.newPassword"
              :class="{ 'p-invalid': $v.newPassword.$error }"
              placeholder="Ingrese su nueva contraseña"
              promptLabel="Ingrese una contraseña"
              weakLabel="Débil"
              mediumLabel="Medio"
              strongLabel="Fuerte"
              toggleMask
              class="w-full"
            />
            <small v-if="$v.newPassword.$error" class="p-error">
              {{ $v.newPassword.$errors[0].$message }}
            </small>
          </div>

          <div class="form-group">
            <label for="confirmPassword" class="form-label text-gray-700">
              <i class="pi pi-check mr-1"></i>
              Confirmar Nueva Contraseña *
            </label>
            <Password
              id="confirmPassword"
              v-model="passwordForm.confirmPassword"
              :class="{ 'p-invalid': $v.confirmPassword.$error }"
              placeholder="Confirme su nueva contraseña"
              :feedback="false"
              toggleMask
              class="w-full"
            />
            <small v-if="$v.confirmPassword.$error" class="p-error">
              {{ $v.confirmPassword.$errors[0].$message }}
            </small>
          </div>

          <div class="flex justify-end pt-4">
            <Button
              type="submit"
              label="Cambiar Contraseña"
              icon="pi pi-shield"
              :loading="profileStore.loading"
              :disabled="!isFormValid"
            />
          </div>
        </form>

        <Message v-if="profileStore.error" severity="error" class="mt-6">
          {{ profileStore.error }}
        </Message>

        <Message v-if="successMessage" severity="success" class="mt-6">
          {{ successMessage }}
        </Message>
      </template>
    </Card>

    <!-- Información adicional de seguridad -->
    <Card>
      <template #title>
        <div class="flex items-center gap-2">
          <i class="pi pi-info-circle text-xl text-blue-600"></i>
          <span class="text-gray-900">Consejos de Seguridad</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-3">
            <div class="flex items-start gap-2">
              <i class="pi pi-check-circle text-green-600 mt-0.5"></i>
              <span class="text-sm text-gray-900">Use al menos 8 caracteres</span>
            </div>
            <div class="flex items-start gap-2">
              <i class="pi pi-check-circle text-green-600 mt-0.5"></i>
              <span class="text-sm text-gray-900">Incluya mayúsculas, minúsculas, números y símbolos</span>
            </div>
            <div class="flex items-start gap-2">
              <i class="pi pi-check-circle text-green-600 mt-0.5"></i>
              <span class="text-sm text-gray-900">No use información personal como nombres o fechas</span>
            </div>
          </div>
          <div class="space-y-3">
            <div class="flex items-start gap-2">
              <i class="pi pi-check-circle text-green-600 mt-0.5"></i>
              <span class="text-sm text-gray-900">Cambie su contraseña regularmente</span>
            </div>
            <div class="flex items-start gap-2">
              <i class="pi pi-check-circle text-green-600 mt-0.5"></i>
              <span class="text-sm text-gray-900">No comparta su contraseña con nadie</span>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, minLength, sameAs } from '@vuelidate/validators'
import Button from 'primevue/button'
import Password from 'primevue/password'
import Message from 'primevue/message'
import Card from 'primevue/card'
import { useProfileStore } from '@/stores/profile'
import type { ChangePasswordRequest } from '@/types/profile'

const profileStore = useProfileStore()

const passwordForm = reactive<ChangePasswordRequest>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const successMessage = ref('')

const validationRules = computed(() => ({
  currentPassword: { required },
  newPassword: { required, minLength: minLength(6) },
  confirmPassword: { 
    required, 
    sameAsPassword: sameAs(computed(() => passwordForm.newPassword))
  }
}))

const $v = useVuelidate(validationRules, passwordForm)

const isFormValid = computed(() => {
  return passwordForm.currentPassword && 
         passwordForm.newPassword && 
         passwordForm.confirmPassword &&
         passwordForm.newPassword === passwordForm.confirmPassword
})

async function changePassword() {
  const isValid = await $v.value.$validate()
  if (!isValid) return

  try {
    await profileStore.changePassword(passwordForm)
    
    // Limpiar formulario
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    $v.value.$reset()
    
    // Mostrar mensaje de éxito
    successMessage.value = 'Contraseña cambiada exitosamente'
    
    // Limpiar mensaje después de 5 segundos
    setTimeout(() => {
      successMessage.value = ''
    }, 5000)
    
  } catch (error) {
    console.error('Error changing password:', error)
  }
}
</script>

<style scoped>
@reference {
  @import 'tailwindcss';
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-semibold flex items-center;
}

/* Forzar texto negro siempre */
:deep(.p-card) {
  @apply text-gray-900 !important;
}

:deep(.p-card .p-card-title) {
  @apply text-gray-900 !important;
}

:deep(.p-card .p-card-content) {
  @apply text-gray-900 !important;
}

:deep(.p-password) {
  @apply w-full;
}

:deep(.p-password .p-inputtext) {
  @apply w-full bg-white border-gray-300 text-gray-900;
}

:deep(.p-password .p-inputtext:enabled:focus) {
  @apply border-blue-500 shadow-sm;
}

:deep(.p-password .p-inputtext:enabled:hover) {
  @apply border-gray-400;
}
</style>