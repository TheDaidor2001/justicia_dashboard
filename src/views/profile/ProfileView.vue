<template>
  <div class="profile-view">
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
        <span>Mi Perfil</span>
      </div>

      <h1 class="text-3xl font-bold text-gray-900">Mi Perfil</h1>
      <p class="text-gray-600 mt-2">Gestiona tu información personal y configuración de cuenta</p>
    </div>

    <div class="bg-white rounded-lg shadow">
      <Tabs value="0" class="profile-tabs">
        <TabList>
          <Tab value="0">
            <i class="pi pi-user mr-2"></i>
            Datos Personales
          </Tab>
          <Tab value="1">
            <i class="pi pi-shield mr-2"></i>
            Seguridad
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <PersonalDataSection />
          </TabPanel>

          <TabPanel value="1">
            <SecuritySection />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Button from 'primevue/button'
import { useProfileStore } from '@/stores/profile'
import PersonalDataSection from '@/components/profile/PersonalDataSection.vue'
import SecuritySection from '@/components/profile/SecuritySection.vue'

const router = useRouter()

const profileStore = useProfileStore()

onMounted(async () => {
  try {
    await profileStore.fetchProfile()
  } catch (error) {
    console.error('Error loading profile:', error)
  }
})
</script>

<style scoped>
@reference {
  @import 'tailwindcss';
}

.profile-view {
  @apply max-w-6xl mx-auto p-6;
}

:deep(.profile-tabs .p-tablist) {
  @apply bg-gray-50 rounded-t-lg;
}

:deep(.profile-tabs .p-tabpanels) {
  @apply p-6;
}

/* Forzar texto negro en toda la vista de perfil */
.profile-view {
  @apply text-gray-900;
}

.profile-view * {
  @apply text-gray-900;
}

/* Cards específicamente */
.profile-view :deep(.p-card) {
  @apply !text-gray-900;
}

.profile-view :deep(.p-card *) {
  @apply !text-gray-900;
}

.profile-view :deep(.p-card .p-card-title) {
  @apply !text-gray-900;
}

.profile-view :deep(.p-card .p-card-content) {
  @apply !text-gray-900;
}

/* Excepciones para iconos y badges que deben mantener sus colores */
.profile-view :deep(.pi) {
  @apply !text-current;
}

.profile-view :deep(.p-tag) {
  @apply !text-current;
}

.profile-view :deep(.p-badge) {
  @apply !text-current;
}

/* Botones outlined visibles */
.profile-view :deep(.p-button-outlined) {
  @apply !text-gray-900 !border-gray-600 !bg-white;
}

.profile-view :deep(.p-button-outlined .p-button-label) {
  @apply !text-gray-900;
}

.profile-view :deep(.p-button-outlined .p-button-icon) {
  @apply !text-gray-900;
}

.profile-view :deep(.p-button-outlined:hover) {
  @apply !bg-gray-100 !text-gray-900 !border-gray-700;
}

.profile-view :deep(.p-button-outlined:hover .p-button-label) {
  @apply !text-gray-900;
}

.profile-view :deep(.p-button-outlined:hover .p-button-icon) {
  @apply !text-gray-900;
}

.profile-view :deep(.p-button-outlined:focus) {
  @apply !border-blue-500 !text-gray-900;
}

/* Estilos específicos para botones de navegación */
.profile-view :deep(.p-button-text) {
  @apply !text-gray-600;
}

.profile-view :deep(.p-button-text:hover) {
  @apply !text-gray-900 !bg-gray-100;
}

.profile-view :deep(.p-button-text .p-button-icon) {
  @apply !text-gray-600;
}

.profile-view :deep(.p-button-text:hover .p-button-icon) {
  @apply !text-gray-900;
}
</style>
