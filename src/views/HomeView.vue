<script setup lang="ts">
import Button from 'primevue/button'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <main>
    <div class="p-6">
      <!-- Navegación -->
      <div class="flex items-center gap-2 text-gray-600 mb-6">
        <Button
          icon="pi pi-home"
          severity="secondary"
          text
          @click="router.push('/dashboard')"
          v-tooltip.top="'Volver al Dashboard'"
        />
        <i class="pi pi-chevron-right text-sm"></i>
        <span>Inicio</span>
      </div>
      
      <h1 class="text-3xl font-bold text-gray-900">Página de Inicio</h1>
      <p class="text-gray-600 mt-4">Bienvenido al Sistema de Gestión Judicial del Consejo Superior del Poder Judicial.</p>
    </div>
  </main>
</template>
