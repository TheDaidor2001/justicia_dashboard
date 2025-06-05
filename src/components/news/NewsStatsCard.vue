<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import { useAuth } from '@/composables/useAuth'

interface Props {
  total: number
  pending: number
  published: number
  rejected: number
  draft?: number
  byType?: {
    noticia: number
    aviso: number
    comunicado: number
  }
}

const props = defineProps<Props>()
const { userRole, isAdmin } = useAuth()

const isTecnicoPrensa = computed(() => userRole.value === 'tecnico_prensa')
const isDirectorPrensa = computed(() => userRole.value === 'director_prensa')
const isPresidenteCspj = computed(() => userRole.value === 'presidente_cspj')
const isJuez = computed(() => userRole.value === 'juez')
const isPresidenteAudiencia = computed(() => userRole.value === 'presidente_audiencia')

const stats = computed(() => {
  const items = []

  if (isTecnicoPrensa.value) {
    items.push(
      { label: 'Mis Noticias', value: props.total, icon: 'pi-file', color: 'blue' },
      { label: 'En Borrador', value: props.draft || 0, icon: 'pi-pencil', color: 'gray' },
      { label: 'En Revisión', value: props.pending, icon: 'pi-send', color: 'orange' },
      { label: 'Publicadas', value: props.published, icon: 'pi-check-circle', color: 'green' },
      { label: 'Rechazadas', value: props.rejected, icon: 'pi-times-circle', color: 'red' },
    )
  } else if (isDirectorPrensa.value) {
    items.push(
      { label: 'Total Noticias', value: props.total, icon: 'pi-folder', color: 'blue' },
      { label: 'Pendientes Revisión', value: props.pending, icon: 'pi-clock', color: 'orange' },
      { label: 'Publicadas', value: props.published, icon: 'pi-check', color: 'green' },
      { label: 'Rechazadas', value: props.rejected, icon: 'pi-times', color: 'red' },
    )
  } else if (isPresidenteCspj.value) {
    items.push(
      {
        label: 'Pendientes Aprobación',
        value: props.pending,
        icon: 'pi-briefcase',
        color: 'orange',
      },
      { label: 'Aprobadas Hoy', value: 0, icon: 'pi-verified', color: 'green' },
      { label: 'Total Procesadas', value: props.published, icon: 'pi-chart-line', color: 'blue' },
    )
  } else if (isJuez.value || isPresidenteAudiencia.value) {
    items.push(
      { label: 'Mis Envíos', value: props.total, icon: 'pi-send', color: 'blue' },
      { label: 'Avisos', value: props.byType?.aviso || 0, icon: 'pi-info-circle', color: 'orange' },
      {
        label: 'Comunicados',
        value: props.byType?.comunicado || 0,
        icon: 'pi-megaphone',
        color: 'purple',
      },
      { label: 'Publicados', value: props.published, icon: 'pi-check-circle', color: 'green' },
    )
  } else if (isAdmin.value) {
    items.push(
      { label: 'Total', value: props.total, icon: 'pi-folder', color: 'blue' },
      { label: 'Pendientes', value: props.pending, icon: 'pi-clock', color: 'orange' },
      { label: 'Publicadas', value: props.published, icon: 'pi-check-circle', color: 'green' },
      { label: 'Rechazadas', value: props.rejected, icon: 'pi-times-circle', color: 'red' },
    )
  } else {
    items.push(
      { label: 'Total', value: props.total, icon: 'pi-file', color: 'blue' },
      { label: 'Publicadas', value: props.published, icon: 'pi-check-circle', color: 'green' },
    )
  }

  return items
})

const getColorClasses = (color: string) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600',
    purple: 'bg-purple-100 text-purple-600',
  }
  return colors[color as keyof typeof colors] || colors.gray
}
</script>

<template>
  <Card class="mb-6">
    <template #content>
      <div class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="text-center p-4 rounded-lg transition-all hover:scale-105"
          :class="getColorClasses(stat.color)"
        >
          <i :class="[stat.icon, 'pi', 'text-2xl mb-2']"></i>
          <div class="text-2xl font-bold">{{ stat.value }}</div>
          <div class="text-xs font-medium opacity-80">{{ stat.label }}</div>
        </div>
      </div>
    </template>
  </Card>
</template>
