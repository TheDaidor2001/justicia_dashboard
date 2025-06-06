<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useAuth } from '@/composables/useAuth'
import { newsService } from '@/services/news.service'
import { useRouter } from 'vue-router'
import { getNewsTypeLabel, getNewsTypeColor } from '@/types/news'
import type { News } from '@/types/news'

const { userRole } = useAuth()
const router = useRouter()

const isDirector = computed(() => userRole.value === 'director_prensa')
const isPresident = computed(
  () => userRole.value === 'presidente_cspj' || userRole.value === 'vicepresidente_cspj',
)

// Estado local para noticias pendientes
const pendingNews = ref<News[]>([])
const loading = ref(false)

const pendingCount = computed(() => pendingNews.value.length)

// Navegar al detalle
const navigateToDetail = (id?: string) => {
  if (id) {
    router.push(`/noticias/${id}`)
  } else {
    router.push('/noticias/pendientes')
  }
}

// Cargar noticias pendientes
const loadPendingNews = async () => {
  loading.value = true
  try {
    const response = await newsService.getNewsPendingApproval()
    if (response.success) {
      pendingNews.value = response.data
    }
  } catch (error) {
    console.error('Error loading pending news:', error)
    pendingNews.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (isDirector.value || isPresident.value) {
    loadPendingNews()
  }
})

const title = computed(() => {
  if (isDirector.value) return 'Noticias Pendientes de tu Aprobación'
  if (isPresident.value) return 'Noticias Pendientes de Aprobación Presidencial'
  return 'Noticias Pendientes'
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <Card v-if="pendingCount > 0 || loading" class="mb-6 border-l-4 border-orange-500">
    <template #title>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <i class="pi pi-exclamation-triangle text-orange-500 text-2xl"></i>
          <span>{{ title }}</span>
        </div>
        <Tag
          :value="`${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}`"
          severity="warning"
        />
      </div>
    </template>

    <template #content>
      <div v-if="loading" class="text-center py-4">
        <i class="pi pi-spin pi-spinner text-2xl"></i>
      </div>

      <div v-else-if="pendingCount === 0" class="text-center py-4 text-gray-500">
        No hay noticias pendientes de aprobación
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="item in pendingNews.slice(0, 5)"
          :key="item.id"
          class="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
          @click="navigateToDetail(item.id)"
        >
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <Tag
                :value="getNewsTypeLabel(item.type)"
                :severity="getNewsTypeColor(item.type) as any"
                rounded
                class="text-xs"
              />
              <span class="text-sm text-gray-600">
                Por {{ item.creator?.fullName || item.author?.fullName || 'Desconocido' }}
              </span>
            </div>
            <h4 class="font-semibold text-gray-900">{{ item.title }}</h4>
            <p v-if="item.subtitle" class="text-sm text-gray-600 mt-1">{{ item.subtitle }}</p>
            <p class="text-xs text-gray-500 mt-1">
              <i class="pi pi-clock mr-1"></i>
              Enviado {{ formatDate(item.updatedAt) }}
            </p>
          </div>

          <Button icon="pi pi-arrow-right" severity="warning" text rounded class="ml-4" />
        </div>

        <div v-if="pendingCount > 5" class="text-center pt-2">
          <Button
            label="Ver todas las pendientes"
            severity="warning"
            outlined
            size="small"
            @click="() => navigateToDetail()"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
