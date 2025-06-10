<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onUnmounted, watch } from 'vue'
import { useNews } from '@/composables/useNews'
import { useAuth } from '@/composables/useAuth'
import { useRouter, useRoute } from 'vue-router'
import { NewsType, NewsStatus, getNewsTypeLabel, getNewsStatusLabel } from '@/types/news'
import type { News } from '@/types/news'
import NewsStatsCard from '@/components/news/NewsStatsCard.vue'
import { useNewsStore } from '@/stores/news'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import Toolbar from 'primevue/toolbar'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'

const toast = useToast()
const confirm = useConfirm()
const router = useRouter()
const route = useRoute()
const { user, userRole, isAdmin } = useAuth()
const newsStore = useNewsStore()

const {
  newsList,
  loading,
  pagination,
  newsStats,
  needsRefresh,
  canCreateNews,
  canSubmitFromCourt,
  canEdit,
  canDelete,
  canSubmitToDirector,
  needsMyAction,
  getNewsStatusBadge,
  getNewsTypeColor,
  setTypeFilter,
  setStatusFilter,
  setSearchFilter,
  navigateToCreate,
  navigateToEdit,
  navigateToDetail,
  navigateToCourtSubmission,
  submitToDirector,
  deleteNews,
  refreshNews,
  checkAndRefreshIfNeeded,
  fetchStatistics,
} = useNews()

// Roles específicos para títulos
const isTecnicoPrensa = computed(() => userRole.value === 'tecnico_prensa')
const isDirectorPrensa = computed(() => userRole.value === 'director_prensa')
const isPresidenteCspj = computed(() => userRole.value === 'presidente_cspj')
const isVicepresidenteCspj = computed(() => userRole.value === 'vicepresidente_cspj')
const isJuez = computed(() => userRole.value === 'juez')
const isPresidenteAudiencia = computed(() => userRole.value === 'presidente_audiencia')

// Verificar qué filtros mostrar según el rol
const showTypeFilter = computed(() => {
  // Técnicos y jueces pueden filtrar por tipo
  return isTecnicoPrensa.value || isJuez.value || isPresidenteAudiencia.value || isAdmin.value
})

const showStatusFilter = computed(() => {
  // Solo técnicos y admins pueden filtrar por estado
  // Director y presidente ven un estado específico
  return isTecnicoPrensa.value || isAdmin.value
})

// Estado local
const searchTerm = ref('')
const selectedType = ref<NewsType | null>(null)
const selectedStatus = ref<NewsStatus | null>(null)

// Opciones de filtros (ajustadas según el rol)
const typeOptions = computed(() => {
  const baseOptions = [{ label: 'Todos', value: null }]

  // Para jueces y presidentes de audiencia, solo avisos y comunicados
  if (isJuez.value || isPresidenteAudiencia.value) {
    return [
      ...baseOptions,
      { label: 'Aviso', value: NewsType.AVISO },
      { label: 'Comunicado', value: NewsType.COMUNICADO },
    ]
  }

  // Para otros roles, todos los tipos
  return [
    ...baseOptions,
    { label: 'Noticia', value: NewsType.NOTICIA },
    { label: 'Aviso', value: NewsType.AVISO },
    { label: 'Comunicado', value: NewsType.COMUNICADO },
  ]
})

const statusOptions = [
  { label: 'Todos', value: null },
  { label: 'Borrador', value: NewsStatus.DRAFT },
  { label: 'Pendiente Director', value: NewsStatus.PENDING_DIRECTOR },
  { label: 'Pendiente Presidente', value: NewsStatus.PENDING_PRESIDENT },
  { label: 'Publicado', value: NewsStatus.PUBLISHED },
  { label: 'Rechazado', value: NewsStatus.REJECTED },
]

// Manejar vista de noticias pendientes
const handleViewPending = () => {
  if (isDirectorPrensa.value) {
    setStatusFilter(NewsStatus.PENDING_DIRECTOR)
  } else if (isPresidenteCspj.value || isVicepresidenteCspj.value) {
    setStatusFilter(NewsStatus.PENDING_PRESIDENT)
  }
}

// Función para cargar datos cuando sea necesario
const loadDataIfNeeded = async () => {
  // Verificar si necesita recarga por acciones previas
  const wasRefreshed = await checkAndRefreshIfNeeded()

  // Si no se refrescó y la lista está vacía, hacer carga inicial
  if (!wasRefreshed && newsList.value.length === 0) {
    refreshNews()
    await fetchStatistics()
  }
}

// Ya no necesitamos el watcher de needsRefresh porque eliminamos directamente de la lista

// Cargar datos al montar
onMounted(async () => {
  await loadDataIfNeeded()
})

// Recargar cuando el componente se activa (si usamos keep-alive)
onActivated(async () => {
  await loadDataIfNeeded()
})

// Métodos
const onSearch = () => {
  setSearchFilter(searchTerm.value)
}

const onSearchInput = () => {
  // El debounce se maneja en el composable
  setSearchFilter(searchTerm.value)
}

const onTypeChange = () => {
  setTypeFilter(selectedType.value || undefined)
}

const onStatusChange = () => {
  setStatusFilter(selectedStatus.value || undefined)
}

const viewNews = (news: News) => {
  navigateToDetail(news.id)
}

const editNews = (news: News) => {
  navigateToEdit(news.id)
}

const confirmDelete = (news: News) => {
  confirm.require({
    message: `¿Estás seguro de eliminar la noticia "${news.title}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const result = await deleteNews(news.id)
      if (result.success) {
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Noticia eliminada correctamente',
          life: 3000,
        })
        // El elemento se eliminó automáticamente de la lista
      } else {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: result.message,
          life: 3000,
        })
      }
    },
  })
}

const handleSubmitToDirector = async (news: News) => {
  confirm.require({
    message: `¿Enviar "${news.title}" al Director de Prensa para su revisión?`,
    header: 'Confirmar envío',
    icon: 'pi pi-send',
    acceptLabel: 'Enviar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      const result = await submitToDirector(news.id)
      if (result.success) {
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Noticia enviada al director para revisión',
          life: 3000,
        })
        // La tabla se actualizará automáticamente via watcher de needsRefresh
      } else {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: result.message,
          life: 3000,
        })
      }
    },
  })
}

// Formatear fecha
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Verificar si la noticia tiene imagen
const hasImage = (news: News) => {
  return !!(news.imageUrl && news.imageUrl.trim() !== '')
}
</script>

<template>
  <div class="p-6">
    <Toast />
    <ConfirmDialog />

    <!-- Header -->
    <div class="mb-6">
      <!-- Navegación -->
      <div class="flex items-center gap-2 text-gray-600 mb-4">
        <Button
          icon="pi pi-home"
          severity="contrast"
          text
          @click="router.push('/dashboard')"
          v-tooltip.top="'Volver al Dashboard'"
        />
        <i class="pi pi-chevron-right text-sm"></i>
        <span>Noticias</span>
      </div>

      <h1 class="text-3xl font-bold text-gray-900">
        <template v-if="isTecnicoPrensa">Mis Noticias</template>
        <template v-else-if="isDirectorPrensa">Mis Noticias y Aprobaciones</template>
        <template v-else-if="isPresidenteCspj || isVicepresidenteCspj"
          >Mis Noticias y Aprobación Presidencial</template
        >
        <template v-else-if="isJuez || isPresidenteAudiencia">Mis Avisos y Comunicados</template>
        <template v-else>Gestión de Noticias</template>
      </h1>
      <p class="text-gray-600 mt-2">
        <template v-if="isTecnicoPrensa"
          >Administra y supervisa las noticias que has creado</template
        >
        <template v-else-if="isDirectorPrensa"
          >Gestiona tus noticias y aprueba las pendientes de revisión</template
        >
        <template v-else-if="isPresidenteCspj || isVicepresidenteCspj"
          >Gestiona tus noticias y aprueba las pendientes presidenciales</template
        >
        <template v-else-if="isJuez || isPresidenteAudiencia"
          >Gestiona los avisos y comunicados que has enviado</template
        >
        <template v-else
          >Administra las publicaciones, avisos y comunicados del sistema judicial</template
        >
      </p>
    </div>

    <!-- Estadísticas -->
    <NewsStatsCard
      v-if="newsStats"
      :total="newsStats.total"
      :pending="newsStats.porEstado.find((e) => e.estado === 'En Revisión')?.cantidad || 0"
      :published="newsStats.porEstado.find((e) => e.estado === 'Publicados')?.cantidad || 0"
      :rejected="newsStats.porEstado.find((e) => e.estado === 'Rechazados')?.cantidad || 0"
      :draft="newsStats.porEstado.find((e) => e.estado === 'Borrador')?.cantidad || 0"
      :byType="{
        noticia: newsStats.porTipo.find((t) => t.tipo === 'Noticias')?.cantidad || 0,
        aviso: newsStats.porTipo.find((t) => t.tipo === 'Avisos')?.cantidad || 0,
        comunicado: newsStats.porTipo.find((t) => t.tipo === 'Comunicados')?.cantidad || 0,
      }"
      @viewPending="handleViewPending"
    />

    <!-- Las noticias pendientes ya aparecen en la lista principal filtradas por el backend -->

    <!-- Toolbar con filtros -->
    <Card class="mb-6">
      <template #content>
        <Toolbar class="border-0 p-0">
          <template #start>
            <div class="flex gap-4 items-center flex-wrap">
              <!-- Búsqueda -->
              <IconField>
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText
                  v-model="searchTerm"
                  placeholder="Buscar por título..."
                  class="w-80"
                  @input="onSearchInput"
                  @keyup.enter="onSearch"
                />
              </IconField>

              <!-- Filtro por tipo -->
              <Select
                v-if="showTypeFilter"
                v-model="selectedType"
                :options="typeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Tipo"
                class="w-40"
                @change="onTypeChange"
              />

              <!-- Filtro por estado -->
              <Select
                v-if="showStatusFilter"
                v-model="selectedStatus"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Estado"
                class="w-48"
                @change="onStatusChange"
              />

              <!-- Botón buscar -->
              <Button label="Buscar" icon="pi pi-search" @click="onSearch" severity="secondary" />
            </div>
          </template>

          <template #end>
            <div class="flex gap-2">
              <!-- Botón refrescar -->
              <Button
                icon="pi pi-refresh"
                severity="secondary"
                text
                rounded
                @click="refreshNews"
                v-tooltip.top="'Actualizar lista'"
              />

              <!-- Botón crear aviso/comunicado para juzgados -->
              <Button
                v-if="canSubmitFromCourt"
                :label="
                  isJuez || isPresidenteAudiencia
                    ? 'Nuevo Aviso/Comunicado'
                    : 'Enviar desde Juzgado'
                "
                icon="pi pi-plus"
                severity="info"
                @click="navigateToCourtSubmission"
              />

              <!-- Botón crear nueva -->
              <Button
                v-if="canCreateNews"
                label="Nueva Noticia"
                icon="pi pi-plus"
                @click="navigateToCreate"
              />
            </div>
          </template>
        </Toolbar>
      </template>
    </Card>

    <!-- Tabla de noticias -->
    <Card>
      <template #content>
        <DataTable
          :value="newsList"
          :loading="loading"
          :paginator="true"
          :rows="10"
          :totalRecords="pagination.total"
          stripedRows
          showGridlines
          responsiveLayout="scroll"
          class="p-datatable-sm"
        >
          <!-- Columna Imagen -->
          <Column header="Imagen" style="width: 8%">
            <template #body="{ data }">
              <div
                class="w-16 h-16 rounded overflow-hidden bg-gray-100 flex items-center justify-center"
              >
                <img
                  v-if="hasImage(data)"
                  :src="data.imageUrl"
                  :alt="data.title"
                  class="w-full h-full object-cover"
                />
                <i v-else class="pi pi-image text-gray-400 text-xl"></i>
              </div>
            </template>
          </Column>

          <!-- Columna Título -->
          <Column field="title" header="Título" :sortable="true" style="width: 30%">
            <template #body="{ data }">
              <div>
                <p class="font-semibold">{{ data.title }}</p>
                <p class="text-sm text-gray-500" v-if="data.subtitle">
                  {{ data.subtitle }}
                </p>
              </div>
            </template>
          </Column>

          <!-- Columna Tipo -->
          <Column field="type" header="Tipo" :sortable="true" style="width: 10%">
            <template #body="{ data }">
              <Tag
                :value="getNewsTypeLabel(data.type)"
                :severity="getNewsTypeColor(data.type) as any"
                rounded
              />
            </template>
          </Column>

          <!-- Columna Estado -->
          <Column field="status" header="Estado" :sortable="true" style="width: 15%">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <Tag
                  :value="getNewsStatusLabel(data.status)"
                  :severity="getNewsStatusBadge(data.status).severity as any"
                  :icon="'pi ' + getNewsStatusBadge(data.status).icon"
                />
                <i
                  v-if="needsMyAction(data)"
                  class="pi pi-exclamation-circle text-orange-500"
                  v-tooltip.top="'Requiere tu acción'"
                ></i>
              </div>
            </template>
          </Column>

          <!-- Columna Creador -->
          <Column field="creator.fullName" header="Creado por" style="width: 15%">
            <template #body="{ data }">
              <div v-if="data.creator">
                <p class="font-medium text-sm">{{ data.creator.fullName }}</p>
                <p class="text-xs text-gray-500">{{ data.department?.name }}</p>
              </div>
              <span v-else class="text-gray-400">-</span>
            </template>
          </Column>

          <!-- Columna Fecha -->
          <Column field="createdAt" header="Fecha" :sortable="true" style="width: 12%">
            <template #body="{ data }">
              <div class="text-sm">
                <p>{{ formatDate(data.createdAt) }}</p>
                <p v-if="data.publishedAt" class="text-xs text-green-600">
                  <i class="pi pi-globe mr-1"></i>
                  Publicado: {{ formatDate(data.publishedAt) }}
                </p>
              </div>
            </template>
          </Column>

          <!-- Columna Vistas -->
          <Column field="viewCount" header="Vistas" :sortable="true" style="width: 8%">
            <template #body="{ data }">
              <div class="text-center">
                <span class="font-semibold">{{ data.viewCount }}</span>
              </div>
            </template>
          </Column>

          <!-- Columna Acciones -->
          <Column header="Acciones" style="width: 12%" :exportable="false">
            <template #body="{ data }">
              <div class="flex gap-2 justify-end">
                <!-- Ver -->
                <Button
                  icon="pi pi-eye"
                  severity="info"
                  text
                  rounded
                  v-tooltip.top="'Ver detalles'"
                  @click="viewNews(data)"
                  size="small"
                />

                <!-- Editar -->
                <Button
                  v-if="canEdit(data)"
                  icon="pi pi-pencil"
                  severity="warning"
                  text
                  rounded
                  v-tooltip.top="'Editar'"
                  @click="editNews(data)"
                  size="small"
                />

                <!-- Enviar al director -->
                <Button
                  v-if="canSubmitToDirector(data)"
                  icon="pi pi-send"
                  severity="info"
                  text
                  rounded
                  v-tooltip.top="'Enviar al Director'"
                  @click="handleSubmitToDirector(data)"
                  size="small"
                />

                <!-- Eliminar -->
                <Button
                  v-if="canDelete(data)"
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  v-tooltip.top="'Eliminar'"
                  @click="confirmDelete(data)"
                  size="small"
                />

                <!-- Acción requerida -->
                <Button
                  v-if="needsMyAction(data)"
                  icon="pi pi-check-circle"
                  severity="success"
                  text
                  rounded
                  v-tooltip.top="'Acción requerida'"
                  @click="viewNews(data)"
                  size="small"
                />
              </div>
            </template>
          </Column>

          <!-- Template vacío -->
          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-inbox text-4xl text-gray-400 mb-4"></i>
              <p class="text-gray-500 mb-2">
                <template v-if="isTecnicoPrensa"> No tienes noticias creadas </template>
                <template v-else-if="isDirectorPrensa">
                  No hay noticias pendientes de revisión
                </template>
                <template v-else-if="isPresidenteCspj || isVicepresidenteCspj">
                  No hay noticias pendientes de aprobación presidencial
                </template>
                <template v-else-if="isJuez || isPresidenteAudiencia">
                  No has enviado avisos o comunicados
                </template>
                <template v-else> No se encontraron noticias </template>
              </p>
              <Button
                v-if="canCreateNews"
                label="Crear Primera Noticia"
                icon="pi pi-plus"
                @click="navigateToCreate"
              />
              <Button
                v-if="canSubmitFromCourt && !canCreateNews"
                :label="
                  isJuez || isPresidenteAudiencia
                    ? 'Crear Primer Aviso/Comunicado'
                    : 'Enviar desde Juzgado'
                "
                icon="pi pi-plus"
                @click="navigateToCourtSubmission"
                severity="info"
              />
            </div>
          </template>

          <!-- Template de carga -->
          <template #loading>
            <div class="text-center py-8">
              <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
              <p class="text-gray-500 mt-2">Cargando noticias...</p>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<style scoped>
:deep(.p-datatable) {
  .p-datatable-header {
    background-color: transparent;
    border: none;
  }

  .p-datatable-thead > tr > th {
    background-color: #f8f9fa;
    color: #495057;
    font-weight: 600;
  }

  .p-datatable-tbody > tr:hover {
    background-color: #f8f9fa;
  }
}
</style>
