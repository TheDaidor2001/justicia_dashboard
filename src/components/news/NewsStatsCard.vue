<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import { useAuth } from '@/composables/useAuth'

interface Props {
  total?: number
  pending?: number
  published?: number
  rejected?: number
  draft?: number
  byType?: {
    noticia?: number
    aviso?: number
    comunicado?: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  total: 0,
  pending: 0,
  published: 0,
  rejected: 0,
  draft: 0,
  byType: () => ({
    noticia: 0,
    aviso: 0,
    comunicado: 0,
  }),
})

// Emits
const emit = defineEmits<{
  viewPending: []
}>()

// Calcular estadísticas localmente usando props
const pendingApprovalCount = computed(() => {
  if (!isDirectorPrensa.value && !isPresidenteCspj.value) return 0
  return props.pending || 0
})

const { userRole, isAdmin } = useAuth()

const isTecnicoPrensa = computed(() => userRole.value === 'tecnico_prensa')
const isDirectorPrensa = computed(() => userRole.value === 'director_prensa')
const isPresidenteCspj = computed(() => userRole.value === 'presidente_cspj')
const isJuez = computed(() => userRole.value === 'juez')
const isPresidenteAudiencia = computed(() => userRole.value === 'presidente_audiencia')

// Solo mostrar tarjetas de estadísticas para roles que NO son director ni presidente
const showRegularStats = computed(() => {
  return !isDirectorPrensa.value && !isPresidenteCspj.value
})

const stats = computed(() => {
  if (!showRegularStats.value) return []

  const items = []

  if (isTecnicoPrensa.value) {
    items.push(
      { label: 'Mis Noticias', value: props.total, icon: 'pi-file', color: 'blue' },
      { label: 'En Borrador', value: props.draft || 0, icon: 'pi-pencil', color: 'gray' },
      { label: 'En Revisión', value: props.pending, icon: 'pi-send', color: 'orange' },
      { label: 'Publicadas', value: props.published, icon: 'pi-check-circle', color: 'green' },
      { label: 'Rechazadas', value: props.rejected, icon: 'pi-times-circle', color: 'red' },
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
  <div class="mb-6 space-y-4">
    <!-- Tarjeta especial para aprobaciones pendientes (Director y Presidente) -->
    <Card
      v-if="isDirectorPrensa || isPresidenteCspj"
      class="border-l-4 border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg hover:shadow-xl transition-shadow duration-300"
    >
      <template #content>
        <div class="flex items-center justify-between p-2">
          <div class="flex items-center space-x-4">
            <div class="flex-shrink-0 relative">
              <div class="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                <i class="pi pi-exclamation-triangle text-white text-2xl"></i>
              </div>
              <!-- Badge pulsante si hay noticias pendientes -->
              <div
                v-if="pendingApprovalCount > 0"
                class="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse"
              >
                <span class="text-white text-xs font-bold">{{
                  pendingApprovalCount > 99 ? '99+' : pendingApprovalCount
                }}</span>
              </div>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">
                {{
                  isDirectorPrensa
                    ? 'Noticias Esperando tu Aprobación'
                    : 'Noticias para Aprobación Presidencial'
                }}
              </h3>
              <p class="text-sm text-gray-600 mt-1">
                {{
                  isDirectorPrensa
                    ? 'Como Director de Prensa, tienes noticias pendientes de revisar y aprobar'
                    : 'Como Presidente CSPJ, tienes noticias pendientes de aprobación final'
                }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-4xl font-bold text-orange-600">
              {{ pendingApprovalCount }}
            </div>
            <div class="text-sm text-orange-700 font-medium">
              {{ pendingApprovalCount === 1 ? 'noticia pendiente' : 'noticias pendientes' }}
            </div>
            <div v-if="pendingApprovalCount > 0" class="mt-2">
              <button
                class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-all duration-200 transform hover:scale-105 shadow-md"
                @click="$emit('viewPending')"
              >
                <i class="pi pi-eye mr-2"></i>
                Ver Pendientes
              </button>
            </div>
            <div v-else class="mt-2">
              <div
                class="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium border border-green-200"
              >
                <i class="pi pi-check mr-2"></i>
                ¡Todo al día!
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Tarjetas de estadísticas regulares (solo para otros roles) -->
    <Card v-if="showRegularStats && stats.length > 0">
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
  </div>
</template>
