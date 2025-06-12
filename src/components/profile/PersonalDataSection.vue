<template>
  <div class="personal-data-section">
    <div class="flex justify-between items-center mb-6">
      <div></div>
      <Button
        v-if="!isEditing"
        @click="startEditing"
        icon="pi pi-pencil"
        label="Editar"
        outlined
        size="small"
        class="edit-button"
      />
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <ProgressSpinner />
    </div>

    <div v-else-if="!profile" class="text-center py-8">
      <p class="text-gray-500">No se pudo cargar la información del perfil</p>
      <Button @click="loadProfile" label="Reintentar" outlined class="mt-4" />
    </div>

    <div v-else class="space-y-6">
      <!-- Modo visualización -->
      <template v-if="!isEditing">
        <!-- Header con avatar y info básica -->
        <Card>
          <template #content>
            <div class="flex items-start gap-6">
              <div class="flex-shrink-0">
                <div
                  class="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                >
                  {{ getInitials(profile.fullName) }}
                </div>
              </div>

              <div class="flex-1 min-w-0">
                <h3 class="text-2xl font-bold text-gray-900 mb-2">
                  {{ profile.fullName || 'Usuario' }}
                </h3>
                <div class="flex items-center gap-3 mb-3">
                  <UserRoleBadge v-if="profile.role" :role="profile.role as UserRoleType" />
                  <Badge
                    v-if="profile.isActive !== undefined"
                    :value="profile.isActive ? 'Activo' : 'Inactivo'"
                    :severity="profile.isActive ? 'success' : 'danger'"
                  />
                </div>
                <p class="text-gray-600">
                  <i class="pi pi-envelope mr-2"></i>
                  {{ profile.email || 'Email no especificado' }}
                </p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Información detallada en cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Card de Información Personal -->
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-user text-xl text-blue-600"></i>
                <span class="text-gray-900">Información Personal</span>
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <div class="info-item">
                  <label class="info-label text-gray-600">DNI</label>
                  <p class="info-value text-gray-900">{{ profile.dni || 'No especificado' }}</p>
                </div>

                <div class="info-item">
                  <label class="info-label text-gray-600">Teléfono</label>
                  <p class="info-value flex items-center text-gray-900">
                    <i class="pi pi-phone mr-2 text-green-600"></i>
                    {{ profile.phone || 'No especificado' }}
                  </p>
                </div>

                <div class="info-item">
                  <label class="info-label text-gray-600">Departamento</label>
                  <p class="info-value flex items-center text-gray-900">
                    <i class="pi pi-building mr-2 text-purple-600"></i>
                    {{ profile.department || 'No especificado' }}
                  </p>
                </div>
              </div>
            </template>
          </Card>

          <!-- Card de Información del Sistema -->
          <Card>
            <template #title>
              <div class="flex items-center gap-2">
                <i class="pi pi-cog text-xl text-green-600"></i>
                <span class="text-gray-900">Información del Sistema</span>
              </div>
            </template>
            <template #content>
              <div class="space-y-4">
                <div class="info-item">
                  <label class="info-label text-gray-600">ID de Usuario</label>
                  <p
                    class="info-value font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-900"
                  >
                    {{ profile.id }}
                  </p>
                </div>

                <div class="info-item">
                  <label class="info-label text-gray-600">Fecha de Creación</label>
                  <p class="info-value flex items-center text-gray-900">
                    <i class="pi pi-calendar mr-2 text-blue-600"></i>
                    {{ profile.createdAt ? formatDate(profile.createdAt) : 'No especificado' }}
                  </p>
                </div>

                <div class="info-item" v-if="profile.updatedAt">
                  <label class="info-label text-gray-600">Última Actualización</label>
                  <p class="info-value flex items-center text-gray-900">
                    <i class="pi pi-clock mr-2 text-orange-600"></i>
                    {{ formatDate(profile.updatedAt) }}
                  </p>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </template>

      <!-- Modo edición -->
      <template v-else>
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-pencil text-xl text-orange-600"></i>
              <span class="text-gray-900">Editar Información Personal</span>
            </div>
          </template>
          <template #content>
            <form @submit.prevent="saveChanges" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <div class="form-group">
                    <label for="fullName" class="form-label text-gray-700">
                      <i class="pi pi-user mr-1"></i>
                      Nombre Completo *
                    </label>
                    <InputText
                      id="fullName"
                      v-model="editForm.fullName"
                      :class="{ 'p-invalid': $v.fullName.$error }"
                      placeholder="Ingrese su nombre completo"
                      class="w-full"
                    />
                    <small v-if="$v.fullName.$error" class="p-error">
                      {{ $v.fullName.$errors[0].$message }}
                    </small>
                  </div>

                  <div class="form-group">
                    <label for="phone" class="form-label text-gray-700">
                      <i class="pi pi-phone mr-1"></i>
                      Teléfono
                    </label>
                    <InputText
                      id="phone"
                      v-model="editForm.phone"
                      :class="{ 'p-invalid': $v.phone.$error }"
                      placeholder="Ej: +57 300 123 4567"
                      class="w-full"
                    />
                    <small v-if="$v.phone.$error" class="p-error">
                      {{ $v.phone.$errors[0].$message }}
                    </small>
                  </div>
                </div>

                <div class="space-y-4">
                  <div class="form-group">
                    <label for="email" class="form-label text-gray-700">
                      <i class="pi pi-envelope mr-1"></i>
                      Email *
                    </label>
                    <InputText
                      id="email"
                      v-model="editForm.email"
                      :class="{ 'p-invalid': $v.email.$error }"
                      placeholder="Ingrese su email"
                      class="w-full"
                    />
                    <small v-if="$v.email.$error" class="p-error">
                      {{ $v.email.$errors[0].$message }}
                    </small>
                  </div>

                  <div class="bg-gray-100 p-4 rounded-lg">
                    <label class="form-label text-gray-600">
                      <i class="pi pi-id-card mr-1"></i>
                      DNI (No editable)
                    </label>
                    <p class="text-gray-900 font-medium mt-1">{{ profile.dni }}</p>
                  </div>
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <Button
                  @click="cancelEditing"
                  label="Cancelar"
                  outlined
                  icon="pi pi-times"
                  :disabled="profileStore.loading"
                />
                <Button
                  type="submit"
                  label="Guardar Cambios"
                  icon="pi pi-check"
                  :loading="profileStore.loading"
                />
              </div>
            </form>
          </template>
        </Card>
      </template>
    </div>

    <Message v-if="profileStore.error" severity="error" class="mt-4">
      {{ profileStore.error }}
    </Message>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength } from '@vuelidate/validators'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import Badge from 'primevue/badge'
import Message from 'primevue/message'
import Card from 'primevue/card'
import { useProfileStore } from '@/stores/profile'
import UserRoleBadge from '@/components/users/UserRoleBadge.vue'
import type { UpdateProfileRequest } from '@/types/profile'
import type { UserRoleType } from '@/types/user'

const profileStore = useProfileStore()

const isEditing = ref(false)
const editForm = reactive<UpdateProfileRequest>({
  fullName: '',
  phone: '',
  email: '',
})

const profile = computed(() => profileStore.profile)
const loading = computed(() => profileStore.loading)

const validationRules = computed(() => ({
  fullName: { required, minLength: minLength(2) },
  email: { required, email },
  phone: {},
}))

const $v = useVuelidate(validationRules, editForm as any)

async function loadProfile() {
  try {
    await profileStore.fetchProfile()
  } catch (error) {
    console.error('Error loading profile:', error)
  }
}

function startEditing() {
  if (!profile.value) return

  editForm.fullName = profile.value.fullName
  editForm.phone = profile.value.phone
  editForm.email = profile.value.email

  isEditing.value = true
  profileStore.clearError()
}

function cancelEditing() {
  isEditing.value = false
  $v.value.$reset()
  profileStore.clearError()
}

async function saveChanges() {
  const isValid = await $v.value.$validate()
  if (!isValid) return

  try {
    await profileStore.updateProfile(editForm)
    isEditing.value = false
    $v.value.$reset()
  } catch (error) {
    console.error('Error updating profile:', error)
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
@reference {
  @import 'tailwindcss';
}

.info-item {
  @apply space-y-2;
}

.info-item {
  @apply space-y-2;
}

.info-label {
  @apply block text-sm font-medium;
}

.info-value {
  @apply font-medium text-base;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-semibold flex items-center;
}

/* Forzar texto negro siempre */
:deep(.p-card) {
  @apply !text-gray-900;
}

:deep(.p-card .p-card-title) {
  @apply !text-gray-900;
}

:deep(.p-card .p-card-content) {
  @apply !text-gray-900;
}

/* Mejorar contraste en inputs */
:deep(.p-inputtext) {
  @apply bg-white border-gray-300 text-gray-900;
}

:deep(.p-inputtext:enabled:focus) {
  @apply border-blue-500 shadow-sm;
}

:deep(.p-inputtext:enabled:hover) {
  @apply border-gray-400;
}

/* Asegurar visibilidad del botón Editar */
.edit-button :deep(.p-button) {
  @apply !text-gray-800 !border-gray-500 !bg-white;
}

.edit-button :deep(.p-button-label) {
  @apply !text-gray-800;
}

.edit-button :deep(.p-button-icon) {
  @apply !text-gray-800;
}

.edit-button :deep(.p-button:hover) {
  @apply !bg-gray-50 !text-gray-900 !border-gray-600;
}

.edit-button :deep(.p-button:hover .p-button-label) {
  @apply !text-gray-900;
}

.edit-button :deep(.p-button:hover .p-button-icon) {
  @apply !text-gray-900;
}

.edit-button :deep(.p-button:focus) {
  @apply !border-blue-500 !text-gray-800;
}
</style>
