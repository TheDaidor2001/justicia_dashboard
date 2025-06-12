<template>
  <div class="contact-view">
    <!-- Header con breadcrumbs -->
    <div class="mb-6">
      <div class="flex items-center gap-2 text-gray-600 mb-4">
        <Button
          icon="pi pi-home"
          severity="contrast"
          text
          @click="router.push('/dashboard')"
          v-tooltip.top="'Volver al Dashboard'"
        />
        <i class="pi pi-chevron-right text-sm"></i>
        <span>Contacto Ciudadano</span>
      </div>

      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Contacto Ciudadano</h1>
          <p class="text-gray-600 mt-2">
            Gestión de mensajes y consultas recibidas de los ciudadanos
          </p>
        </div>

        <!-- Indicadores rápidos -->
        <div class="flex gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-yellow-600">
              {{ store.statistics?.pending || 0 }}
            </div>
            <div class="text-xs text-gray-600">Pendientes</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">
              {{ store.statistics?.inProgress || 0 }}
            </div>
            <div class="text-xs text-gray-600">En Proceso</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">
              {{ store.statistics?.resolvedToday || 0 }}
            </div>
            <div class="text-xs text-gray-600">Resueltos Hoy</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Verificación de permisos -->
    <div v-if="!canViewAllMessages" class="text-center py-16">
      <div class="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
        <i class="pi pi-shield text-4xl text-red-500 mb-4"></i>
        <h3 class="text-lg font-semibold text-red-900 mb-2">Acceso Restringido</h3>
        <p class="text-red-700">No tienes permisos para acceder al módulo de Contacto Ciudadano.</p>
        <Button
          @click="router.push('/dashboard')"
          label="Volver al Dashboard"
          class="mt-4"
          outlined
        />
      </div>
    </div>

    <!-- Contenido principal -->
    <div v-else>
      <!-- Información contextual -->
      <Card v-if="showInfo" class="mb-6 bg-blue-50 border-blue-200">
        <template #content>
          <div class="flex items-start gap-3">
            <i class="pi pi-info-circle text-blue-600 text-xl mt-0.5"></i>
            <div class="flex-1">
              <h4 class="font-semibold text-blue-900 mb-2">Sobre este módulo</h4>
              <p class="text-blue-800 text-sm mb-3">
                Este módulo permite gestionar los mensajes enviados por ciudadanos desde el
                formulario público de contacto. Los mensajes siguen un flujo de asignación y
                respuesta que garantiza atención oportuna.
              </p>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div class="bg-white p-3 rounded border border-blue-200">
                  <div class="flex items-center gap-2 mb-1">
                    <Badge value="Pendiente" severity="warn" class="text-xs" />
                    <span class="font-medium text-blue-900">Paso 1</span>
                  </div>
                  <p class="text-blue-700">Mensaje recibido sin asignar</p>
                </div>
                <div class="bg-white p-3 rounded border border-blue-200">
                  <div class="flex items-center gap-2 mb-1">
                    <Badge value="En Proceso" severity="info" class="text-xs" />
                    <span class="font-medium text-blue-900">Paso 2</span>
                  </div>
                  <p class="text-blue-700">Asignado a funcionario</p>
                </div>
                <div class="bg-white p-3 rounded border border-blue-200">
                  <div class="flex items-center gap-2 mb-1">
                    <Badge value="Resuelto" severity="success" class="text-xs" />
                    <span class="font-medium text-blue-900">Paso 3</span>
                  </div>
                  <p class="text-blue-700">Respuesta enviada al ciudadano</p>
                </div>
              </div>
            </div>
            <Button
              @click="showInfo = false"
              icon="pi pi-times"
              text
              size="small"
              class="text-blue-600"
            />
          </div>
        </template>
      </Card>

      <!-- Componente principal -->
      <ContactManagement />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Badge from 'primevue/badge'
import ContactManagement from '@/components/contact/ContactManagement.vue'
import { useContact } from '@/composables/useContact'

const router = useRouter()
const { store, canViewAllMessages } = useContact()

const showInfo = ref(true)

// Cargar datos al montar el componente
onMounted(() => {
  if (canViewAllMessages.value) {
    // Los datos se cargan automáticamente en el componente ContactManagement
    store.fetchStatistics()
  }
})
</script>

<style scoped>
@reference {
  @import 'tailwindcss';
}

.contact-view {
  @apply max-w-7xl mx-auto p-6;
}

:deep(.p-card) {
  @apply shadow-sm;
}

:deep(.p-button-text) {
  @apply !text-gray-600;
}

:deep(.p-button-text:hover) {
  @apply !text-gray-900 !bg-gray-100;
}
</style>
