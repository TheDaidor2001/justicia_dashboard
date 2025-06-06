<template>
  <div class="p-6">
    <!-- Navegación -->
    <div class="flex items-center gap-2 text-gray-600 mb-6">
      <Button
        icon="pi pi-home"
        severity="secondary"
        text
        @click="$router.push('/dashboard')"
        v-tooltip.top="'Volver al Dashboard'"
      />
      <i class="pi pi-chevron-right text-sm"></i>
      <span>Acerca de</span>
    </div>
    
    <div class="about">
      <h1 class="text-3xl font-bold text-gray-900">Acerca del Sistema</h1>
      <p class="text-gray-600 mt-4">Sistema de Gestión Judicial - Consejo Superior del Poder Judicial</p>
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button'
</script>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
