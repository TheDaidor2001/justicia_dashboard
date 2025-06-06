<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useExpedientes } from '@/composables/useExpedientes'
import { useAuth } from '@/composables/useAuth'
import { ExpedienteStatus } from '@/types/expediente'
import type { Expediente, ApprovalHistoryItem } from '@/types/expediente'
import DocumentUpload from '@/components/documents/DocumentUpload.vue'
import DocumentList from '@/components/documents/DocumentList.vue'
import ApprovalDialog from '@/components/shared/ApprovalDialog.vue'
import ApprovalTimeline from '@/components/shared/ApprovalTimeline.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { expedientesService } from '@/services/expedientes.service'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const {
  fetchExpedienteById,
  submitExpediente,
  approveExpediente,
  rejectExpediente,
  canEdit,
  canSubmit,
  canApprove,
  canReject,
  getStatusBadge,
  getCurrentLevelText,
} = useExpedientes()

const { user, isJuez, isPresidenteAudiencia, isSecretarioGeneral } = useAuth()

// Referencias a componentes hijos
const documentListRef = ref<InstanceType<typeof DocumentList> | null>(null)

// Estado
const expediente = ref<Expediente | null>(null)
const loading = ref(true)
const processingAction = ref(false)
const approvalHistory = ref<ApprovalHistoryItem[]>([])
const loadingHistory = ref(false)

// Diálogos
const showApproveDialog = ref(false)
const showRejectDialog = ref(false)

const expedienteId = computed(() => route.params.id as string)

const canEditDocuments = computed(() => {
  if (!expediente.value || !user.value) return false

  const isCreator = expediente.value.createdBy === user.value.id
  const isPresidenteDelDepartamento =
    user.value.role === 'presidente_audiencia' &&
    user.value.departmentId === expediente.value.departmentId
  const isSecretarioGeneralUser = user.value.role === 'secretario_general'
  const isAdmin = user.value.role === 'admin'

  const isEditableStatus =
    expediente.value.status === ExpedienteStatus.DRAFT ||
    expediente.value.status === ExpedienteStatus.REJECTED

  return (
    (isCreator || isPresidenteDelDepartamento || isSecretarioGeneralUser || isAdmin) &&
    isEditableStatus
  )
})

// Cargar expediente
const loadExpediente = async () => {
  loading.value = true
  try {
    const result = await fetchExpedienteById(expedienteId.value)
    if (result.success && result.data) {
      expediente.value = result.data
      // Cargar historial después de cargar el expediente
      loadApprovalHistory()
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar el expediente',
        life: 3000,
      })
      router.push('/expedientes')
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar el expediente',
      life: 3000,
    })
    router.push('/expedientes')
  } finally {
    loading.value = false
  }
}

// Cargar historial de aprobación
const loadApprovalHistory = async () => {
  loadingHistory.value = true
  try {
    const historyResult = await expedientesService.getApprovalHistory(expedienteId.value)
    if (historyResult.success && historyResult.data) {
      approvalHistory.value = historyResult.data
    } else {
      approvalHistory.value = []
    }
  } catch (error) {
    console.error('Error al cargar historial:', error)
    approvalHistory.value = []
  } finally {
    loadingHistory.value = false
  }
}

onMounted(() => {
  loadExpediente()
})

// Métodos de acción
const handleEdit = () => {
  router.push(`/expedientes/${expedienteId.value}/editar`)
}

const handleSubmit = async () => {
  if (!confirm('¿Estás seguro de enviar este expediente para aprobación?')) return

  processingAction.value = true
  try {
    const result = await submitExpediente(expedienteId.value)
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Expediente enviado para aprobación',
        life: 3000,
      })
      await loadExpediente()
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

const handleApprove = async (comments: string) => {
  processingAction.value = true
  try {
    const result = await approveExpediente(expedienteId.value, { comments })
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Expediente aprobado correctamente',
        life: 3000,
      })
      showApproveDialog.value = false
      await loadExpediente()
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

const handleReject = async (comments: string) => {
  processingAction.value = true
  try {
    const result = await rejectExpediente(expedienteId.value, { comments })
    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Expediente rechazado',
        life: 3000,
      })
      showRejectDialog.value = false
      await loadExpediente()
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

// Manejar documento subido
const onDocumentUploaded = () => {
  documentListRef.value?.refreshDocuments()
  toast.add({
    severity: 'success',
    summary: 'Documento adjuntado',
    detail: 'El documento se ha adjuntado correctamente al expediente',
    life: 3000,
  })
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
    <div v-else-if="expediente">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-2 text-gray-600 mb-2">
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
            @click="router.push('/expedientes')"
          />
          <span>Volver a expedientes</span>
        </div>

        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
              {{ expediente.title }}
            </h1>
            <div class="flex items-center gap-4">
              <span class="text-gray-600 font-mono">{{ expediente.caseNumber }}</span>
              <Tag
                :value="getStatusBadge(expediente.status).label"
                :severity="getStatusBadge(expediente.status).severity"
                :icon="getStatusBadge(expediente.status).icon"
              />
              <span
                v-if="expediente.status === ExpedienteStatus.PENDING_APPROVAL"
                class="text-gray-600"
              >
                <i class="pi pi-user mr-1"></i>
                En: {{ getCurrentLevelText(expediente.currentLevel) }}
              </span>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex gap-2">
            <Button
              v-if="canEdit(expediente)"
              label="Editar"
              icon="pi pi-pencil"
              severity="secondary"
              @click="handleEdit"
            />
            <Button
              v-if="canSubmit(expediente)"
              label="Enviar para Aprobación"
              icon="pi pi-send"
              @click="handleSubmit"
              :loading="processingAction"
            />
            <Button
              v-if="canApprove(expediente)"
              label="Aprobar"
              icon="pi pi-check"
              severity="success"
              @click="showApproveDialog = true"
            />
            <Button
              v-if="canReject(expediente)"
              label="Rechazar"
              icon="pi pi-times"
              severity="danger"
              @click="showRejectDialog = true"
            />
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <TabView>
        <!-- Tab Información General -->
        <TabPanel value="0">
          <template #header>
            <i class="pi pi-info-circle mr-2"></i>
            <span>Información General</span>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Información básica -->
            <Card>
              <template #title>Datos del Expediente</template>
              <template #content>
                <div class="space-y-3">
                  <div>
                    <label class="font-semibold text-gray-600">Descripción:</label>
                    <p class="mt-1">{{ expediente.description || 'Sin descripción' }}</p>
                  </div>
                  <div>
                    <label class="font-semibold text-gray-600">Departamento:</label>
                    <p class="mt-1">{{ expediente.department?.name || expediente.departmentId }}</p>
                  </div>
                  <div>
                    <label class="font-semibold text-gray-600">Creado por:</label>
                    <p class="mt-1">{{ expediente.creator?.fullName || 'N/A' }}</p>
                  </div>
                  <div>
                    <label class="font-semibold text-gray-600">Fecha de creación:</label>
                    <p class="mt-1">{{ formatDate(expediente.createdAt) }}</p>
                  </div>
                  <div>
                    <label class="font-semibold text-gray-600">Última actualización:</label>
                    <p class="mt-1">{{ formatDate(expediente.updatedAt) }}</p>
                  </div>
                </div>
              </template>
            </Card>

            <!-- Estado actual -->
            <Card>
              <template #title>Estado Actual</template>
              <template #content>
                <div class="space-y-3">
                  <div>
                    <label class="font-semibold text-gray-600">Estado:</label>
                    <div class="mt-1">
                      <Tag
                        :value="getStatusBadge(expediente.status).label"
                        :severity="getStatusBadge(expediente.status).severity"
                        :icon="getStatusBadge(expediente.status).icon"
                        class="text-lg"
                      />
                    </div>
                  </div>

                  <div v-if="expediente.status === ExpedienteStatus.PENDING_APPROVAL">
                    <label class="font-semibold text-gray-600">Nivel de aprobación:</label>
                    <p class="mt-1">{{ getCurrentLevelText(expediente.currentLevel) }}</p>
                  </div>

                  <div v-if="expediente.rejectionReason">
                    <label class="font-semibold text-gray-600">Motivo de rechazo:</label>
                    <p class="mt-1 text-red-600">{{ expediente.rejectionReason }}</p>
                  </div>
                </div>

                <!-- Mensaje informativo según estado -->
                <Message
                  v-if="expediente.status === ExpedienteStatus.DRAFT"
                  severity="info"
                  :closable="false"
                  class="mt-4"
                >
                  Este expediente está en borrador. Debe ser enviado para aprobación.
                </Message>

                <Message
                  v-if="expediente.status === ExpedienteStatus.PENDING_APPROVAL"
                  severity="warn"
                  :closable="false"
                  class="mt-4"
                >
                  Este expediente está pendiente de aprobación en el nivel:
                  {{ getCurrentLevelText(expediente.currentLevel) }}
                </Message>

                <Message
                  v-if="expediente.status === ExpedienteStatus.APPROVED"
                  severity="success"
                  :closable="false"
                  class="mt-4"
                >
                  Este expediente ha sido aprobado completamente.
                </Message>
              </template>
            </Card>
          </div>
        </TabPanel>

        <!-- Tab Documentos -->
        <TabPanel value="1">
          <template #header>
            <i class="pi pi-file mr-2"></i>
            <span>Documentos</span>
          </template>
          <div class="space-y-6">
            <!-- Upload de documentos -->
            <Card v-if="canEditDocuments">
              <template #title>
                <div class="flex items-center gap-2">
                  <i class="pi pi-upload text-xl"></i>
                  <span>Adjuntar Documento</span>
                </div>
              </template>
              <template #content>
                <DocumentUpload
                  :expediente-id="expedienteId"
                  :disabled="!canEditDocuments"
                  @upload-success="onDocumentUploaded"
                />
              </template>
            </Card>

            <!-- Lista de documentos -->
            <Card>
              <template #title>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-list text-xl"></i>
                    <span>Documentos Adjuntos</span>
                  </div>
                </div>
              </template>
              <template #content>
                <DocumentList
                  ref="documentListRef"
                  :expediente-id="expedienteId"
                  :can-delete="canEditDocuments"
                />
              </template>
            </Card>
          </div>
        </TabPanel>

        <!-- Tab Historial -->
        <TabPanel value="2">
          <template #header>
            <i class="pi pi-history mr-2"></i>
            <span>Historial de Aprobación</span>
          </template>
          <Card>
            <template #content>
              <ApprovalTimeline
                :history="approvalHistory"
                :loading="loadingHistory"
                empty-message="No hay historial de aprobación para este expediente"
              />
            </template>
          </Card>
        </TabPanel>
      </TabView>
    </div>

    <!-- Diálogos usando el componente compartido -->
    <ApprovalDialog
      v-model:visible="showApproveDialog"
      title="Expediente"
      type="approve"
      :item-title="expediente?.title"
      :loading="processingAction"
      @confirm="handleApprove"
    />

    <ApprovalDialog
      v-model:visible="showRejectDialog"
      title="Expediente"
      type="reject"
      :item-title="expediente?.title"
      :require-comments="true"
      :loading="processingAction"
      @confirm="handleReject"
    />
  </div>
</template>
