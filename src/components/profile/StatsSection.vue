<template>
  <div class="stats-section">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Mis Estadísticas</h2>
      <p class="text-gray-600 dark:text-gray-400">
        Resumen de tu actividad según tu rol en el sistema
      </p>
    </div>

    <div v-if="loading" class="flex justify-center py-8">
      <ProgressSpinner />
    </div>

    <div v-else-if="userStats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Estadísticas para Juez -->
      <template v-if="userRole === 'juez' && userStats.juez">
        <StatCard
          title="Total Expedientes"
          :value="userStats.juez.totalExpedientes"
          icon="pi pi-folder"
          color="blue"
        />
        <StatCard
          title="En Borrador"
          :value="userStats.juez.expedientesBorrador"
          icon="pi pi-file-edit"
          color="gray"
        />
        <StatCard
          title="Pendientes"
          :value="userStats.juez.expedientesPendientes"
          icon="pi pi-clock"
          color="yellow"
        />
        <StatCard
          title="Aprobados"
          :value="userStats.juez.expedientesAprobados"
          icon="pi pi-check-circle"
          color="green"
        />
        <StatCard
          title="Rechazados"
          :value="userStats.juez.expedientesRechazados"
          icon="pi pi-times-circle"
          color="red"
        />
      </template>

      <!-- Estadísticas para Presidente de Audiencia -->
      <template v-if="userRole === 'presidente_audiencia' && userStats.presidenteAudiencia">
        <StatCard
          title="Pendientes de Aprobación"
          :value="userStats.presidenteAudiencia.expedientesPendientes"
          icon="pi pi-clock"
          color="yellow"
        />
        <StatCard
          title="Aprobados este Mes"
          :value="userStats.presidenteAudiencia.expedientesAprobadosMes"
          icon="pi pi-check-circle"
          color="green"
        />
        <StatCard
          title="Tiempo Promedio (horas)"
          :value="userStats.presidenteAudiencia.tiempoPromedioAprobacion"
          icon="pi pi-stopwatch"
          color="blue"
        />
      </template>

      <!-- Estadísticas para Director/Técnico de Prensa -->
      <template
        v-if="
          (userRole === 'director_prensa' || userRole === 'tecnico_prensa') &&
          userStats.directorPrensa
        "
      >
        <StatCard
          title="Noticias Publicadas"
          :value="userStats.directorPrensa.noticiasPublicadas"
          icon="pi pi-megaphone"
          color="green"
        />
        <StatCard
          title="En Borrador"
          :value="userStats.directorPrensa.noticiasBorrador"
          icon="pi pi-file-edit"
          color="gray"
        />
        <StatCard
          title="Pendientes de Aprobación"
          :value="userStats.directorPrensa.noticiasPendientes"
          icon="pi pi-clock"
          color="yellow"
        />
      </template>

      <!-- Estadísticas para Secretario Adjunto -->
      <template v-if="userRole === 'secretario_adjunto' && userStats.secretarioAdjunto">
        <StatCard
          title="Mensajes Asignados"
          :value="userStats.secretarioAdjunto.mensajesAsignados"
          icon="pi pi-inbox"
          color="blue"
        />
        <StatCard
          title="Mensajes Respondidos"
          :value="userStats.secretarioAdjunto.mensajesRespondidos"
          icon="pi pi-check"
          color="green"
        />
        <StatCard
          title="Tiempo Promedio Respuesta (horas)"
          :value="userStats.secretarioAdjunto.tiempoPromedioRespuesta"
          icon="pi pi-stopwatch"
          color="purple"
        />
      </template>
    </div>

    <!-- Mensaje si no hay estadísticas disponibles -->
    <div v-else-if="!loading && !hasRoleStats" class="text-center py-8">
      <i class="pi pi-chart-bar text-4xl text-gray-400 mb-4"></i>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Sin estadísticas disponibles
      </h3>
      <p class="text-gray-600 dark:text-gray-400">
        No hay datos estadísticos para mostrar según tu rol actual
      </p>
    </div>

    <Message v-if="profileStore.error" severity="error" class="mt-4">
      {{ profileStore.error }}
    </Message>

    <!-- Botón para refrescar estadísticas -->
    <div class="flex justify-end mt-6">
      <Button
        @click="refreshStats"
        label="Actualizar Estadísticas"
        icon="pi pi-refresh"
        outlined
        :loading="loading"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useProfileStore } from '@/stores/profile'
import StatCard from '@/components/profile/StatCard.vue'

const profileStore = useProfileStore()

const userStats = computed(() => profileStore.userStats)
const userRole = computed(() => profileStore.userRole)
const loading = computed(() => profileStore.loading)

const hasRoleStats = computed(() => {
  const stats = userStats.value
  return !!(
    (userRole.value === 'juez' && stats.juez) ||
    (userRole.value === 'presidente_audiencia' && stats.presidenteAudiencia) ||
    ((userRole.value === 'director_prensa' || userRole.value === 'tecnico_prensa') &&
      stats.directorPrensa) ||
    (userRole.value === 'secretario_adjunto' && stats.secretarioAdjunto)
  )
})

onMounted(async () => {
  if (profileStore.profile) {
    await loadStats()
  }
})

async function loadStats() {
  try {
    await profileStore.fetchUserStats()
  } catch (error) {
    console.error('Error loading user stats:', error)
  }
}

async function refreshStats() {
  await loadStats()
}
</script>

<style scoped>
@reference {
  @import 'tailwindcss';
}

.stats-section {
  @apply space-y-6;
}
</style>
