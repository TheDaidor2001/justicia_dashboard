<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNews } from '@/composables/useNews'
import { useAuth } from '@/composables/useAuth'
import { NewsStatus, NewsType } from '@/types/news'
import type { News } from '@/types/news'
import NewsCard from '@/components/news/NewsCard.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const toast = useToast()
const confirm = useConfirm()
const { userRole } = useAuth()

const {
  newsList,
  loading,
  canApproveAsDirector,
  canApproveAsPresident,
  approveAsDirector,
  approveAsPresident,
  rejectNews,
  navigateToDetail,
  refreshNews,
  getNewsTypeLabel,
  getNewsTypeColor,
  formatPublishDate,
} = useNews()

// Estados
const processingId = ref<string | null>(null)
const showApprovalDialog = ref(false)
const showRejectDialog = ref(false)
const selectedNews = ref<News | null>(null)
const approvalComments = ref('')
const rejectionComments = ref('')

// Filtrar noticias pendientes según el rol
const pendingNews = computed(() => {
  if (userRole.value === 'director_prensa' || userRole.value === 'admin') {
    return newsList.value.filter((news) => news.status === NewsStatus.PENDING_DIRECTOR)
  }

  if (userRole.value === 'presidente_cspj') {
    return newsList.value.filter(
      (news) => news.status === NewsStatus.PENDING_PRESIDENT && news.type === NewsType.NOTICIA,
    )
  }

  return []
})

// Agrupar por tipo
const pendingByType = computed(() => {
  const groups = {
    [NewsType.NOTICIA]: [] as News[],
    [NewsType.AVISO]: [] as News[],
    [NewsType.COMUNICADO]: [] as News[],
  }

  pendingNews.value.forEach((news) => {
    groups[news.type].push(news)
  })

  return groups
})

// Título según rol
const pageTitle = computed(() => {
  if (userRole.value === 'director_prensa') {
    return 'Noticias Pendientes de Revisión'
  }
  if (userRole.value === 'presidente_cspj') {
    return 'Noticias Pendientes de Aprobación Presidencial'
  }
  return 'Noticias Pendientes'
})

// Descripción según rol
const pageDescription = computed(() => {
  if (userRole.value === 'director_prensa') {
    return 'Revisa y aprueba las noticias enviadas por los técnicos de prensa'
  }
  if (userRole.value === 'presidente_cspj') {
    return 'Aprueba las noticias que requieren autorización presidencial'
  }
  return ''
})

onMounted(() => {
  refreshNews()
})

// Métodos de aprobación
const handleApprove = (news: News) => {
  selectedNews.value = news
  showApprovalDialog.value = true
}

const handleReject = (news: News) => {
  selectedNews.value = news
  showRejectDialog.value = true
}

const confirmApprove = async () => {
  if (!selectedNews.value) return

  processingId.value = selectedNews.value.id

  try {
    let result

    if (userRole.value === 'director_prensa') {
      result = await approveAsDirector(selectedNews.value.id, { comments: approvalComments.value })
    } else if (userRole.value === 'presidente_cspj') {
      result = await approveAsPresident(selectedNews.value.id, { comments: approvalComments.value })
    }

    if (result?.success) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Noticia aprobada correctamente',
        life: 3000,
      })
      showApprovalDialog.value = false
      approvalComments.value = ''
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result?.message || 'Error al aprobar',
        life: 3000,
      })
    }
  } finally {
    processingId.value = null
  }
}

const confirmReject = async () => {
  if (!selectedNews.value || !rejectionComments.value.trim()) return

  processingId.value = selectedNews.value.id

  try {
    const result = await rejectNews(selectedNews.value.id, { comments: rejectionComments.value })

    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Noticia rechazada',
        life: 3000,
      })
      showRejectDialog.value = false
      rejectionComments.value = ''
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.message,
        life: 3000,
      })
    }
  } finally {
    processingId.value = null
  }
}

// Verificar qué pasará al aprobar
const getApprovalAction = (news: News) => {
  if (userRole.value === 'director_prensa') {
    if (news.type === NewsType.NOTICIA) {
      return 'Se enviará al Presidente CSPJ para aprobación final'
    } else {
      return 'Se publicará inmediatamente'
    }
  }
  if (userRole.value === 'presidente_cspj') {
    return 'Se publicará inmediatamente'
  }
  return ''
}

// Formatear fecha
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
  <div class="p-6 max-w-7xl mx-auto">
    <Toast />
    <ConfirmDialog />

    <!-- Header -->
    <div class="mb-6">
      <!-- Navegación -->
      <div class="flex items-center gap-2 text-gray-600 mb-4">
        <Button
          icon="pi pi-home"
          severity="secondary"
          text
          @click="$router.push('/dashboard')"
          v-tooltip.top="'Volver al Dashboard'"
        />
        <i class="pi pi-chevron-right text-sm"></i>
        <span>Noticias Pendientes</span>
      </div>
      
      <h1 class="text-3xl font-bold text-gray-900">{{ pageTitle }}</h1>
      <p class="text-gray-600 mt-2">{{ pageDescription }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <ProgressSpinner />
    </div>

    <!-- Contenido -->
    <div v-else>
      <!-- Estadísticas rápidas -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-3xl font-bold text-blue-600">{{ pendingNews.length }}</p>
                <p class="text-gray-600">Total Pendientes</p>
              </div>
              <i class="pi pi-clock text-4xl text-blue-200"></i>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-3xl font-bold text-purple-600">
                  {{ pendingByType[NewsType.NOTICIA].length }}
                </p>
                <p class="text-gray-600">Noticias</p>
              </div>
              <i class="pi pi-file-text text-4xl text-purple-200"></i>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-3xl font-bold text-orange-600">
                  {{
                    pendingByType[NewsType.AVISO].length + pendingByType[NewsType.COMUNICADO].length
                  }}
                </p>
                <p class="text-gray-600">Avisos y Comunicados</p>
              </div>
              <i class="pi pi-megaphone text-4xl text-orange-200"></i>
            </div>
          </template>
        </Card>
      </div>

      <!-- Lista de noticias pendientes -->
      <Card v-if="pendingNews.length > 0">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-list text-xl"></i>
            <span>Noticias que Requieren tu Acción</span>
          </div>
        </template>

        <template #content>
          <TabView>
            <TabPanel value="todas" header="Todas" :badge="pendingNews.length.toString()">
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div v-for="news in pendingNews" :key="news.id">
                  <NewsCard :news="news">
                    <template #footer>
                      <div class="flex justify-between items-center">
                        <div class="text-sm text-gray-600">
                          <i class="pi pi-user mr-1"></i>
                          {{ news.creator?.fullName }}
                        </div>
                        <div class="flex gap-2">
                          <Button
                            label="Ver"
                            icon="pi pi-eye"
                            severity="info"
                            size="small"
                            outlined
                            @click="navigateToDetail(news.id)"
                          />
                          <Button
                            label="Aprobar"
                            icon="pi pi-check"
                            severity="success"
                            size="small"
                            @click="handleApprove(news)"
                            :loading="processingId === news.id"
                          />
                          <Button
                            label="Rechazar"
                            icon="pi pi-times"
                            severity="danger"
                            size="small"
                            outlined
                            @click="handleReject(news)"
                            :loading="processingId === news.id"
                          />
                        </div>
                      </div>
                    </template>
                  </NewsCard>
                </div>
              </div>
            </TabPanel>

            <TabPanel
              v-if="pendingByType[NewsType.NOTICIA].length > 0"
              value="noticias"
              header="Noticias"
              :badge="pendingByType[NewsType.NOTICIA].length.toString()"
            >
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div v-for="news in pendingByType[NewsType.NOTICIA]" :key="news.id">
                  <NewsCard :news="news">
                    <template #footer>
                      <div class="flex justify-between items-center">
                        <div class="text-sm text-gray-600">
                          <i class="pi pi-calendar mr-1"></i>
                          {{ formatDate(news.createdAt) }}
                        </div>
                        <div class="flex gap-2">
                          <Button
                            label="Ver"
                            icon="pi pi-eye"
                            severity="info"
                            size="small"
                            outlined
                            @click="navigateToDetail(news.id)"
                          />
                          <Button
                            label="Aprobar"
                            icon="pi pi-check"
                            severity="success"
                            size="small"
                            @click="handleApprove(news)"
                            :loading="processingId === news.id"
                          />
                          <Button
                            label="Rechazar"
                            icon="pi pi-times"
                            severity="danger"
                            size="small"
                            outlined
                            @click="handleReject(news)"
                            :loading="processingId === news.id"
                          />
                        </div>
                      </div>
                    </template>
                  </NewsCard>
                </div>
              </div>
            </TabPanel>

            <TabPanel
              v-if="pendingByType[NewsType.AVISO].length > 0"
              value="avisos"
              header="Avisos"
              :badge="pendingByType[NewsType.AVISO].length.toString()"
            >
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div v-for="news in pendingByType[NewsType.AVISO]" :key="news.id">
                  <NewsCard :news="news">
                    <template #footer>
                      <div class="flex justify-between items-center">
                        <Tag :value="getNewsTypeLabel(news.type)" severity="warning" />
                        <div class="flex gap-2">
                          <Button
                            label="Ver"
                            icon="pi pi-eye"
                            severity="info"
                            size="small"
                            outlined
                            @click="navigateToDetail(news.id)"
                          />
                          <Button
                            label="Aprobar"
                            icon="pi pi-check"
                            severity="success"
                            size="small"
                            @click="handleApprove(news)"
                            :loading="processingId === news.id"
                          />
                          <Button
                            label="Rechazar"
                            icon="pi pi-times"
                            severity="danger"
                            size="small"
                            outlined
                            @click="handleReject(news)"
                            :loading="processingId === news.id"
                          />
                        </div>
                      </div>
                    </template>
                  </NewsCard>
                </div>
              </div>
            </TabPanel>

            <TabPanel
              v-if="pendingByType[NewsType.COMUNICADO].length > 0"
              value="comunicados"
              header="Comunicados"
              :badge="pendingByType[NewsType.COMUNICADO].length.toString()"
            >
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div v-for="news in pendingByType[NewsType.COMUNICADO]" :key="news.id">
                  <NewsCard :news="news">
                    <template #footer>
                      <div class="flex justify-between items-center">
                        <Tag :value="getNewsTypeLabel(news.type)" severity="info" />
                        <div class="flex gap-2">
                          <Button
                            label="Ver"
                            icon="pi pi-eye"
                            severity="info"
                            size="small"
                            outlined
                            @click="navigateToDetail(news.id)"
                          />
                          <Button
                            label="Aprobar"
                            icon="pi pi-check"
                            severity="success"
                            size="small"
                            @click="handleApprove(news)"
                            :loading="processingId === news.id"
                          />
                          <Button
                            label="Rechazar"
                            icon="pi pi-times"
                            severity="danger"
                            size="small"
                            outlined
                            @click="handleReject(news)"
                            :loading="processingId === news.id"
                          />
                        </div>
                      </div>
                    </template>
                  </NewsCard>
                </div>
              </div>
            </TabPanel>
          </TabView>
        </template>
      </Card>

      <!-- Estado vacío -->
      <Card v-else>
        <template #content>
          <div class="text-center py-12">
            <i class="pi pi-check-circle text-6xl text-green-400 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">¡Todo al día!</h3>
            <p class="text-gray-600">No hay noticias pendientes de tu aprobación</p>
            <Button
              label="Volver a Noticias"
              icon="pi pi-arrow-left"
              class="mt-4"
              @click="$router.push('/noticias')"
            />
          </div>
        </template>
      </Card>
    </div>

    <!-- Diálogo de Aprobación -->
    <Dialog
      v-model:visible="showApprovalDialog"
      modal
      :header="`Aprobar: ${selectedNews?.title}`"
      :style="{ width: '500px' }"
    >
      <div v-if="selectedNews">
        <!-- Información de la noticia -->
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
          <p class="font-semibold">{{ selectedNews.title }}</p>
          <div class="flex items-center gap-4 mt-2 text-sm">
            <Tag
              :value="getNewsTypeLabel(selectedNews.type)"
              :severity="getNewsTypeColor(selectedNews.type) as any"
            />
            <span class="text-gray-600">
              <i class="pi pi-user mr-1"></i>
              {{ selectedNews.creator?.fullName }}
            </span>
          </div>
        </div>

        <!-- Mensaje sobre qué pasará -->
        <Message
          :severity="selectedNews.type === NewsType.NOTICIA ? 'info' : 'success'"
          :closable="false"
          class="mb-4"
        >
          <i class="pi pi-info-circle mr-2"></i>
          {{ getApprovalAction(selectedNews) }}
        </Message>

        <!-- Comentarios -->
        <div class="mb-4">
          <label class="block mb-2">Comentarios (opcional):</label>
          <Textarea
            v-model="approvalComments"
            rows="4"
            class="w-full"
            placeholder="Añade comentarios sobre la aprobación..."
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          @click="showApprovalDialog = false"
          :disabled="processingId !== null"
        />
        <Button
          label="Aprobar"
          icon="pi pi-check"
          severity="success"
          @click="confirmApprove"
          :loading="processingId !== null"
        />
      </template>
    </Dialog>

    <!-- Diálogo de Rechazo -->
    <Dialog
      v-model:visible="showRejectDialog"
      modal
      :header="`Rechazar: ${selectedNews?.title}`"
      :style="{ width: '500px' }"
    >
      <div v-if="selectedNews">
        <!-- Información de la noticia -->
        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
          <p class="font-semibold">{{ selectedNews.title }}</p>
          <div class="flex items-center gap-4 mt-2 text-sm">
            <Tag
              :value="getNewsTypeLabel(selectedNews.type)"
              :severity="getNewsTypeColor(selectedNews.type) as any"
            />
            <span class="text-gray-600">
              <i class="pi pi-user mr-1"></i>
              {{ selectedNews.creator?.fullName }}
            </span>
          </div>
        </div>

        <!-- Advertencia -->
        <Message severity="warn" :closable="false" class="mb-4">
          <i class="pi pi-exclamation-triangle mr-2"></i>
          La noticia volverá al estado borrador y el autor será notificado
        </Message>

        <!-- Motivo del rechazo -->
        <div class="mb-4">
          <label class="block mb-2">
            Motivo del rechazo <span class="text-red-500">*</span>:
          </label>
          <Textarea
            v-model="rejectionComments"
            rows="4"
            class="w-full"
            placeholder="Explica el motivo del rechazo..."
            :class="{ 'p-invalid': !rejectionComments.trim() }"
          />
          <small class="text-red-500" v-if="!rejectionComments.trim()">
            El motivo es obligatorio
          </small>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          @click="showRejectDialog = false"
          :disabled="processingId !== null"
        />
        <Button
          label="Rechazar"
          icon="pi pi-times"
          severity="danger"
          @click="confirmReject"
          :loading="processingId !== null"
          :disabled="!rejectionComments.trim()"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
:deep(.p-tabview) {
  .p-tabview-nav {
    background: transparent;
    border: none;
  }

  .p-tabview-panels {
    background: transparent;
    padding: 1rem 0;
  }
}
</style>
