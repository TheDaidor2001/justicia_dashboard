<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNews } from '@/composables/useNews'
import { useAuth } from '@/composables/useAuth'
import { NewsStatus, getNewsTypeLabel, getNewsStatusLabel } from '@/types/news'
import type { News, NewsApprovalHistory } from '@/types/news'
import { newsService } from '@/services/news.service'
import NewsActionButtons from '@/components/news/NewsActionButtons.vue'
import NewsApprovalTimeline from '@/components/news/NewsApprovalTimeline.vue'
import ApprovalDialog from '@/components/shared/ApprovalDialog.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Toast from 'primevue/toast'
import Image from 'primevue/image'
import Avatar from 'primevue/avatar'
import { useToast } from 'primevue/usetoast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import Timeline from 'primevue/timeline'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const confirm = useConfirm()

const { user, userRole } = useAuth()
const {
  loading,
  fetchNewsById,
  submitToDirector,
  approveAsDirector,
  approveAsPresident,
  rejectNews,
  deleteNews,
  getNewsStatusBadge,
  getNewsTypeColor,
  formatPublishDate,
  navigateToEdit,
} = useNews()

// Estado
const news = ref<News | null>(null)
const approvalHistory = ref<NewsApprovalHistory[]>([])
const loadingHistory = ref(false)
const processingAction = ref(false)
const isLoadingNews = ref(false)
const hasLoadedHistory = ref(false)

// Diálogos
const showApproveDialog = ref(false)
const showRejectDialog = ref(false)
const approvalComments = ref('')
const rejectionComments = ref('')

const newsId = computed(() => route.params.id as string)

// Cargar noticia
const loadNews = async () => {
  if (isLoadingNews.value) {
    return
  }

  isLoadingNews.value = true
  try {
    const result = await fetchNewsById(newsId.value)
    if (result.success && result.data) {
      news.value = result.data
      if (!hasLoadedHistory.value) {
        await loadApprovalHistory()
        hasLoadedHistory.value = true
      }
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar la noticia',
        life: 3000,
      })
      router.push('/noticias')
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar la noticia',
      life: 3000,
    })
    router.push('/noticias')
  } finally {
    isLoadingNews.value = false
  }
}

// Cargar historial de aprobación
const loadApprovalHistory = async () => {
  if (loadingHistory.value) {
    return
  }

  loadingHistory.value = true
  try {
    const historyResult = await newsService.getApprovalHistory(newsId.value)
    if (historyResult.success && historyResult.data) {
      approvalHistory.value = historyResult.data
    } else {
      approvalHistory.value = []
    }
  } catch (error: any) {
    // Verificar si es un error 500 (endpoint no implementado)
    const isServerError =
      error?.response?.status === 500 ||
      error?.status === 500 ||
      (error?.message && error.message.includes('500'))

    if (isServerError) {
      console.info('Historial de aprobación no disponible, usando historial básico')
      const basicHistory = generateBasicHistory()
      approvalHistory.value = basicHistory
    } else {
      // Para otros errores, loggear y mostrar notificación
      console.error('Error al cargar historial:', error)
      toast.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No se pudo cargar el historial de aprobación',
        life: 3000,
      })
      approvalHistory.value = []
    }
  } finally {
    loadingHistory.value = false
  }
}

// Generar historial básico cuando no esté disponible en el backend
const generateBasicHistory = (): NewsApprovalHistory[] => {
  if (!news.value) return []

  const history: NewsApprovalHistory[] = []

  // Entrada de creación
  history.push({
    id: `${news.value.id}_create`,
    action: 'create',
    user: news.value.creator || {
      id: 'unknown',
      fullName: 'Usuario desconocido',
      role: 'unknown',
    },
    createdAt: news.value.createdAt,
    comments: 'Noticia creada',
    fromStatus: null,
    toStatus: 'DRAFT',
  })

  // Si está publicada, agregar entrada de publicación
  if (news.value.publishedAt) {
    history.push({
      id: `${news.value.id}_publish`,
      action: 'publish',
      user: news.value.creator || {
        id: 'unknown',
        fullName: 'Usuario desconocido',
        role: 'unknown',
      },
      createdAt: news.value.publishedAt,
      comments: 'Noticia publicada',
      fromStatus: 'APPROVED',
      toStatus: 'PUBLISHED',
    })
  }

  return history
}

// Watch for route changes to reset state
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      // Reset state when navigating to a different news item
      hasLoadedHistory.value = false
      isLoadingNews.value = false
      news.value = null
      approvalHistory.value = []
      loadNews()
    }
  },
)

onMounted(() => {
  loadNews()
})

// Métodos de acción del componente NewsActionButtons
const handleEdit = () => {
  if (news.value) {
    navigateToEdit(news.value.id)
  }
}

const handleSubmitToDirector = async () => {
  processingAction.value = true
  try {
    const result = await submitToDirector(newsId.value)
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Noticia enviada al director para revisión',
        life: 3000,
      })
      hasLoadedHistory.value = false
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.message,
        life: 3000,
      })
    }
  } finally {
    processingAction.value = false
  }
}

const handleApproveDirector = () => {
  showApproveDialog.value = true
}

const handleApprovePresident = () => {
  showApproveDialog.value = true
}

const handleReject = () => {
  showRejectDialog.value = true
}

const handleDelete = () => {
  confirm.require({
    message: `¿Estás seguro de eliminar la noticia "${news.value?.title}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      if (!news.value) return

      const result = await deleteNews(news.value.id)
      if (result.success) {
        toast.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Noticia eliminada correctamente',
          life: 3000,
        })
        router.push('/noticias')
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

// Manejo de diálogos de aprobación/rechazo
const confirmApprove = async (comments: string) => {
  processingAction.value = true
  try {
    let result

    if (news.value?.status === NewsStatus.PENDING_DIRECTOR) {
      result = await approveAsDirector(newsId.value, { comments })
    } else if (news.value?.status === NewsStatus.PENDING_PRESIDENT) {
      result = await approveAsPresident(newsId.value, { comments })
    } else {
      throw new Error(`Estado no válido para aprobación: ${news.value?.status}`)
    }

    if (result?.success) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Noticia aprobada correctamente',
        life: 3000,
      })
      showApproveDialog.value = false
    } else {
      // Mostrar error más amigable para problemas del backend
      let errorMessage = 'Error interno del servidor'

      if (result?.message?.includes('Cannot access')) {
        errorMessage = 'Error en el sistema de aprobación. Por favor contacta al administrador.'
      } else if (result?.message?.includes('500')) {
        errorMessage = 'Error interno del servidor. Intenta nuevamente en unos minutos.'
      } else {
        errorMessage = result?.message || 'Error desconocido al aprobar'
      }

      toast.add({
        severity: 'error',
        summary: 'Error en aprobación',
        detail: errorMessage,
        life: 8000,
      })
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error de conexión',
      detail: 'No se pudo conectar con el servidor. Verifica tu conexión.',
      life: 5000,
    })
  } finally {
    processingAction.value = false
  }
}

const confirmReject = async (comments: string) => {
  processingAction.value = true
  try {
    const result = await rejectNews(newsId.value, { comments })

    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Noticia rechazada',
        life: 3000,
      })
      showRejectDialog.value = false
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.message,
        life: 3000,
      })
    }
  } finally {
    processingAction.value = false
  }
}

// Formatear contenido HTML
const formatContent = (content: string) => {
  // El contenido viene del editor Quill, ya está en HTML
  return content
}

// Formatear fecha
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <Toast />

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <ProgressSpinner />
    </div>

    <!-- Contenido -->
    <div v-else-if="news">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-2 text-gray-600 mb-4">
          <Button
            icon="pi pi-home"
            severity="secondary"
            text
            @click="router.push('/dashboard')"
            v-tooltip.top="'Volver al Dashboard'"
          />
          <i class="pi pi-chevron-right text-sm"></i>
          <Button
            icon="pi pi-arrow-left"
            severity="secondary"
            text
            @click="router.push('/noticias')"
          />
          <span>Volver a noticias</span>
        </div>

        <!-- Título y acciones -->
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
              {{ news.title }}
            </h1>
            <div class="flex items-center gap-4">
              <Tag
                :value="getNewsTypeLabel(news.type)"
                :severity="getNewsTypeColor(news.type) as any"
                rounded
              />
              <Tag
                :value="getNewsStatusLabel(news.status)"
                :severity="getNewsStatusBadge(news.status).severity as any"
                :icon="'pi ' + getNewsStatusBadge(news.status).icon"
              />
              <span v-if="news.publishedAt" class="text-green-600">
                <i class="pi pi-globe mr-1"></i>
                Publicado: {{ formatPublishDate(news.publishedAt) }}
              </span>
            </div>
          </div>

          <!-- Acciones -->
          <div class="w-64">
            <NewsActionButtons
              :news="news"
              :loading="processingAction"
              @edit="handleEdit"
              @submit-to-director="handleSubmitToDirector"
              @approve-director="handleApproveDirector"
              @approve-president="handleApprovePresident"
              @reject="handleReject"
              @delete="handleDelete"
            />
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <Tabs value="0">
        <TabList>
          <Tab value="0">
            <i class="pi pi-file-text mr-2"></i>
            <span>Contenido</span>
          </Tab>
          <Tab value="1">
            <i class="pi pi-history mr-2"></i>
            <span>Historial de Aprobación</span>
          </Tab>
        </TabList>

        <TabPanels>
          <!-- Tab Contenido -->
          <TabPanel value="0">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Columna principal -->
              <div class="lg:col-span-2">
                <!-- Imagen destacada -->
                <div v-if="news.imageUrl" class="mb-6">
                  <Image
                    :src="news.imageUrl"
                    :alt="news.title"
                    class="w-full rounded-lg shadow-lg"
                    preview
                  />
                </div>

                <!-- Subtítulo -->
                <Card v-if="news.subtitle" class="mb-6">
                  <template #title>Subtítulo</template>
                  <template #content>
                    <p class="text-xl text-gray-600">{{ news.subtitle }}</p>
                  </template>
                </Card>

                <!-- Contenido -->
                <Card class="mb-6">
                  <template #title>Contenido Principal</template>
                  <template #content>
                    <div
                      class="prose prose-lg max-w-none"
                      v-html="formatContent(news.content)"
                    ></div>
                  </template>
                </Card>

                <!-- Motivo de rechazo si existe -->
                <Message
                  v-if="news.status === NewsStatus.REJECTED && news.rejectionReason"
                  severity="error"
                  :closable="false"
                  class="mb-6"
                >
                  <div>
                    <strong>Motivo del rechazo:</strong>
                    <p class="mt-2">{{ news.rejectionReason }}</p>
                  </div>
                </Message>
              </div>

              <!-- Columna lateral - Información -->
              <div class="space-y-6">
                <!-- Información básica -->
                <Card>
                  <template #title>
                    <div class="flex items-center gap-2">
                      <i class="pi pi-info-circle text-xl"></i>
                      <span>Información</span>
                    </div>
                  </template>
                  <template #content>
                    <div class="space-y-3">
                      <div>
                        <label class="text-sm text-gray-600">Autor</label>
                        <div class="flex items-center gap-2 mt-1">
                          <Avatar
                            :label="
                              (
                                (news as any).author?.fullName ||
                                news.creator?.fullName ||
                                user?.fullName ||
                                'U'
                              )?.charAt(0)
                            "
                            shape="circle"
                            size="small"
                            class="bg-gray-200"
                          />
                          <span class="font-medium">
                            {{
                              (news as any).author?.fullName ||
                              news.creator?.fullName ||
                              'Autor desconocido'
                            }}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label class="text-sm text-gray-600">Departamento</label>
                        <p class="font-medium">{{ news.department?.name || 'N/A' }}</p>
                      </div>

                      <div>
                        <label class="text-sm text-gray-600">Fecha de creación</label>
                        <p class="font-medium">{{ formatDate(news.createdAt) }}</p>
                      </div>

                      <div>
                        <label class="text-sm text-gray-600">Estado actual</label>
                        <div class="mt-1">
                          <Tag
                            :value="getNewsStatusLabel(news.status)"
                            :severity="getNewsStatusBadge(news.status).severity as any"
                            :icon="'pi ' + getNewsStatusBadge(news.status).icon"
                            class="text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label class="text-sm text-gray-600">Visualizaciones</label>
                        <p class="font-medium">
                          <i class="pi pi-eye mr-1"></i>
                          {{ news.viewCount }} vistas
                        </p>
                      </div>

                      <div v-if="news.publishedAt">
                        <label class="text-sm text-gray-600">URL pública</label>
                        <p class="font-mono text-xs text-blue-600 break-all">
                          /noticias/{{ news.slug }}
                        </p>
                      </div>
                    </div>
                  </template>
                </Card>

              </div>
            </div>
          </TabPanel>

          <!-- Tab Historial -->
          <TabPanel value="1">
            <div class="max-w-4xl">
              <NewsApprovalTimeline
                :history="approvalHistory"
                :loading="loadingHistory"
                empty-message="No hay historial de aprobación disponible"
              />
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <!-- Diálogo de Confirmación -->
    <ConfirmDialog />

    <!-- Diálogo de Aprobación -->
    <Dialog
      v-model:visible="showApproveDialog"
      modal
      header="Aprobar Noticia"
      :style="{ width: '450px' }"
    >
      <div class="mb-4">
        <label class="block mb-2">Comentarios (opcional):</label>
        <Textarea
          v-model="approvalComments"
          rows="4"
          class="w-full"
          placeholder="Añade comentarios sobre la aprobación..."
        />
      </div>

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          @click="showApproveDialog = false"
          :disabled="processingAction"
        />
        <Button
          label="Aprobar"
          icon="pi pi-check"
          @click="confirmApprove(approvalComments)"
          :loading="processingAction"
        />
      </template>
    </Dialog>

    <!-- Diálogo de Rechazo -->
    <Dialog
      v-model:visible="showRejectDialog"
      modal
      header="Rechazar Noticia"
      :style="{ width: '450px' }"
    >
      <div class="mb-4">
        <label class="block mb-2"> Motivo del rechazo <span class="text-red-500">*</span>: </label>
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

      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          @click="showRejectDialog = false"
          :disabled="processingAction"
        />
        <Button
          label="Rechazar"
          icon="pi pi-times"
          severity="danger"
          @click="confirmReject(rejectionComments)"
          :loading="processingAction"
          :disabled="!rejectionComments.trim()"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* Estilos para el contenido rico */
:deep(.prose) {
  color: #374151;
  max-width: none;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: #111827;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }

  p {
    margin-bottom: 1em;
    line-height: 1.7;
  }

  ul,
  ol {
    margin: 1em 0;
    padding-left: 2em;
  }

  a {
    color: #3b82f6;
    text-decoration: underline;
  }

  img {
    max-width: 100%;
    height: auto;
    margin: 1em 0;
  }

  blockquote {
    border-left: 4px solid #e5e7eb;
    padding-left: 1em;
    margin: 1em 0;
    color: #6b7280;
  }
}
</style>
