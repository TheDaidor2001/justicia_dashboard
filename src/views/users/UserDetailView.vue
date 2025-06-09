<template>
  <div class="space-y-6">
    <!-- Breadcrumb -->
    <Breadcrumb :model="breadcrumbItems" class="mb-4" />

    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Detalle de Usuario</h1>
        <p class="text-gray-600 mt-1">Información completa del usuario</p>
      </div>
      
      <div class="flex gap-2">
        <Button
          label="Volver"
          severity="contrast"
          outlined
          icon="pi-arrow-left"
          @click="goBack"
        />
        <Button
          v-if="canEdit"
          label="Editar"
          icon="pi-pencil"
          @click="editUser"
        />
      </div>
    </div>

    <!-- Contenido -->
    <Card>
      <template #content>
        <div class="text-center py-12">
          <i class="pi pi-user text-6xl text-gray-400 mb-4"></i>
          <h3 class="text-xl font-medium text-gray-900 mb-2">Vista en Desarrollo</h3>
          <p class="text-gray-600">Esta vista está siendo implementada</p>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import Breadcrumb from 'primevue/breadcrumb'
import Card from 'primevue/card'
import Button from 'primevue/button'

const router = useRouter()
const route = useRoute()

const breadcrumbItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Usuarios', to: '/admin/usuarios' },
  { label: 'Detalle' }
]

const canEdit = true // Implementar lógica real

const goBack = () => {
  router.push('/admin/usuarios')
}

const editUser = () => {
  router.push(`/admin/usuarios/${route.params.id}/editar`)
}
</script>