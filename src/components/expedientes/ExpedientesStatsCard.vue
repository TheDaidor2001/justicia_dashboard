<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import { useAuth } from '@/composables/useAuth'

interface Props {
  total: number
  pending: number
  approved: number
  rejected: number
  draft?: number
}

const props = defineProps<Props>()
const { isJuez, isPresidenteAudiencia, isSecretarioGeneral } = useAuth()

const stats = computed(() => {
  const items = []

  if (isJuez.value) {
    items.push(
      { label: 'Total Creados', value: props.total, icon: 'pi-folder', color: 'blue' },
      { label: 'En Borrador', value: props.draft || 0, icon: 'pi-pencil', color: 'gray' },
      { label: 'Enviados', value: props.pending, icon: 'pi-send', color: 'orange' },
      { label: 'Aprobados', value: props.approved, icon: 'pi-check-circle', color: 'green' },
      { label: 'Rechazados', value: props.rejected, icon: 'pi-times-circle', color: 'red' },
    )
  } else if (isPresidenteAudiencia.value) {
    items.push(
      { label: 'Pendientes de Revisión', value: props.pending, icon: 'pi-clock', color: 'orange' },
      { label: 'Aprobados Hoy', value: 0, icon: 'pi-check', color: 'green' },
      { label: 'Rechazados Hoy', value: 0, icon: 'pi-times', color: 'red' },
    )
  } else if (isSecretarioGeneral.value) {
    items.push(
      {
        label: 'Aprobación Final Pendiente',
        value: props.pending,
        icon: 'pi-briefcase',
        color: 'orange',
      },
      { label: 'Aprobados esta Semana', value: 0, icon: 'pi-verified', color: 'green' },
      { label: 'Total Procesados', value: props.approved, icon: 'pi-chart-line', color: 'blue' },
    )
  } else {
    items.push(
      { label: 'Total', value: props.total, icon: 'pi-folder', color: 'blue' },
      { label: 'Pendientes', value: props.pending, icon: 'pi-clock', color: 'orange' },
      { label: 'Aprobados', value: props.approved, icon: 'pi-check-circle', color: 'green' },
      { label: 'Rechazados', value: props.rejected, icon: 'pi-times-circle', color: 'red' },
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
  }
  return colors[color as keyof typeof colors] || colors.gray
}
</script>

<template>
  <Card class="mb-6">
    <template #content>
      <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
