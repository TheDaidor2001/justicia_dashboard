<template>
  <div class="space-y-6">
    <!-- Breadcrumb -->
    <Breadcrumb :model="breadcrumbItems" class="mb-4" />

    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">
          {{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}
        </h1>
        <p class="text-gray-600 mt-1">
          {{ isEditing ? 'Modificar información del usuario' : 'Crear un nuevo usuario del sistema' }}
        </p>
      </div>
      
      <div class="flex gap-2">
        <Button
          label="Cancelar"
          severity="secondary"
          outlined
          @click="goBack"
        />
        <Button
          label="Guardar"
          icon="pi-save"
          :loading="loading"
          @click="saveUser"
        />
      </div>
    </div>

    <!-- Formulario -->
    <Card>
      <template #content>
        <div class="text-center py-12">
          <i class="pi pi-user-edit text-6xl text-gray-400 mb-4"></i>
          <h3 class="text-xl font-medium text-gray-900 mb-2">Formulario en Desarrollo</h3>
          <p class="text-gray-600">Esta vista está siendo implementada</p>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Breadcrumb from 'primevue/breadcrumb'
import Card from 'primevue/card'
import Button from 'primevue/button'

const router = useRouter()
const route = useRoute()

const loading = ref(false)

const isEditing = computed(() => route.params.id !== undefined && route.params.id !== 'nuevo')

const breadcrumbItems = computed(() => [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Usuarios', to: '/admin/usuarios' },
  { label: isEditing.value ? 'Editar' : 'Nuevo' }
])

const goBack = () => {
  router.push('/admin/usuarios')
}

const saveUser = async () => {
  // Implementar lógica de guardado
  loading.value = true
  try {
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000))
    goBack()
  } finally {
    loading.value = false
  }
}
</script>