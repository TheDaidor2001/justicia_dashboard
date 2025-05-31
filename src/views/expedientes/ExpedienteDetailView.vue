<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useExpedientes } from '@/composables/useExpedientes'
import { useAuth } from '@/composables/useAuth'
import { ExpedienteStatus } from '@/types/expediente'
import type { Expediente, ApprovalHistoryItem } from '@/types/expediente'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Timeline from 'primevue/timeline'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

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
    getCurrentLevelText
} = useExpedientes()

const { user, isJuez, isPresidenteAudiencia, isSecretarioGeneral } = useAuth()

// Estado
const expediente = ref<Expediente | null>(null)
const loading = ref(true)
const processingAction = ref(false)
const approvalHistory = ref<ApprovalHistoryItem[]>([])

// Diálogos
const showApproveDialog = ref(false)
const showRejectDialog = ref(false)
const approvalComments = ref('')
const rejectionComments = ref('')

const expedienteId = computed(() => route.params.id as string)

// Cargar expediente
const loadExpediente = async () => {
    loading.value = true
    try {
        const result = await fetchExpedienteById(expedienteId.value)
        if (result.success && result.data) {
            expediente.value = result.data
            // Simular historial (después vendrá del backend)
            approvalHistory.value = result.data.approvalHistory || []
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo cargar el expediente',
                life: 3000
            })
            router.push('/expedientes')
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar el expediente',
            life: 3000
        })
        router.push('/expedientes')
    } finally {
        loading.value = false
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
                life: 3000
            })
            await loadExpediente()
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message,
                life: 3000
            })
        }
    } finally {
        processingAction.value = false
    }
}

const confirmApprove = async () => {
    processingAction.value = true
    try {
        const result = await approveExpediente(expedienteId.value, {
            comments: approvalComments.value
        })
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Expediente aprobado correctamente',
                life: 3000
            })
            showApproveDialog.value = false
            approvalComments.value = ''
            await loadExpediente()
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message,
                life: 3000
            })
        }
    } finally {
        processingAction.value = false
    }
}

const confirmReject = async () => {
    if (!rejectionComments.value.trim()) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Debes proporcionar un motivo de rechazo',
            life: 3000
        })
        return
    }

    processingAction.value = true
    try {
        const result = await rejectExpediente(expedienteId.value, {
            comments: rejectionComments.value
        })
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Expediente rechazado',
                life: 3000
            })
            showRejectDialog.value = false
            rejectionComments.value = ''
            await loadExpediente()
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message,
                life: 3000
            })
        }
    } finally {
        processingAction.value = false
    }
}

// Formatear fecha
const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Obtener icono para historial
const getHistoryIcon = (action: string) => {
    const icons: Record<string, string> = {
        submit: 'pi-send',
        approve: 'pi-check-circle',
        reject: 'pi-times-circle',
        return_for_revision: 'pi-replay'
    }
    return icons[action] || 'pi-circle'
}

// Obtener color para historial
const getHistoryColor = (action: string) => {
    const colors: Record<string, string> = {
        submit: '#3B82F6',
        approve: '#10B981',
        reject: '#EF4444',
        return_for_revision: '#F59E0B'
    }
    return colors[action] || '#6B7280'
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
                    <i class="pi pi-arrow-left cursor-pointer" @click="router.push('/expedientes')"></i>
                    <span>Volver a expedientes</span>
                </div>

                <div class="flex justify-between items-start">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900 mb-2">
                            {{ expediente.title }}
                        </h1>
                        <div class="flex items-center gap-4">
                            <span class="text-gray-600 font-mono">{{ expediente.caseNumber }}</span>
                            <Tag :value="getStatusBadge(expediente.status).label"
                                :severity="getStatusBadge(expediente.status).severity"
                                :icon="getStatusBadge(expediente.status).icon" />
                            <span v-if="expediente.status === ExpedienteStatus.PENDING_APPROVAL" class="text-gray-600">
                                <i class="pi pi-user mr-1"></i>
                                En: {{ getCurrentLevelText(expediente.currentLevel) }}
                            </span>
                        </div>
                    </div>

                    <!-- Acciones -->
                    <div class="flex gap-2">
                        <Button v-if="canEdit(expediente)" label="Editar" icon="pi pi-pencil" severity="secondary"
                            @click="handleEdit" />
                        <Button v-if="canSubmit(expediente)" label="Enviar para Aprobación" icon="pi pi-send"
                            @click="handleSubmit" :loading="processingAction" />
                        <Button v-if="canApprove(expediente)" label="Aprobar" icon="pi pi-check" severity="success"
                            @click="showApproveDialog = true" />
                        <Button v-if="canReject(expediente)" label="Rechazar" icon="pi pi-times" severity="danger"
                            @click="showRejectDialog = true" />
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
                                            <Tag :value="getStatusBadge(expediente.status).label"
                                                :severity="getStatusBadge(expediente.status).severity"
                                                :icon="getStatusBadge(expediente.status).icon" class="text-lg" />
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
                                <Message v-if="expediente.status === ExpedienteStatus.DRAFT" severity="info"
                                    :closable="false" class="mt-4">
                                    Este expediente está en borrador. Debe ser enviado para aprobación.
                                </Message>

                                <Message v-if="expediente.status === ExpedienteStatus.PENDING_APPROVAL" severity="warn"
                                    :closable="false" class="mt-4">
                                    Este expediente está pendiente de aprobación en el nivel:
                                    {{ getCurrentLevelText(expediente.currentLevel) }}
                                </Message>

                                <Message v-if="expediente.status === ExpedienteStatus.APPROVED" severity="success"
                                    :closable="false" class="mt-4">
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
                    <Card>
                        <template #content>
                            <div class="text-center py-8 text-gray-500">
                                <i class="pi pi-folder-open text-4xl mb-4"></i>
                                <p>Gestión de documentos - Próximamente</p>
                            </div>
                        </template>
                    </Card>
                </TabPanel>

                <!-- Tab Historial -->
                <TabPanel value="2">
                    <template #header>
                        <i class="pi pi-history mr-2"></i>
                        <span>Historial de Aprobación</span>
                    </template>
                    <Card>
                        <template #content>
                            <Timeline v-if="approvalHistory.length > 0" :value="approvalHistory"
                                class="customized-timeline">
                                <template #marker="slotProps">
                                    <span class="flex w-8 h-8 items-center justify-center text-white rounded-full z-10"
                                        :style="{ backgroundColor: getHistoryColor(slotProps.item.action) }">
                                        <i :class="`pi ${getHistoryIcon(slotProps.item.action)}`"></i>
                                    </span>
                                </template>
                                <template #content="slotProps">
                                    <Card class="mb-4">
                                        <template #content>
                                            <div class="flex justify-between items-start mb-2">
                                                <h4 class="font-semibold capitalize">
                                                    {{ slotProps.item.action.replace('_', ' ') }}
                                                </h4>
                                                <small class="text-gray-500">
                                                    {{ formatDate(slotProps.item.createdAt) }}
                                                </small>
                                            </div>
                                            <p class="text-gray-700 mb-2">
                                                <strong>{{ slotProps.item.fromUser.fullName }}</strong>
                                                ({{ slotProps.item.fromUser.role }})
                                                <span v-if="slotProps.item.toUser">
                                                    → <strong>{{ slotProps.item.toUser.fullName }}</strong>
                                                    ({{ slotProps.item.toUser.role }})
                                                </span>
                                            </p>
                                            <p v-if="slotProps.item.comments" class="text-gray-600 italic">
                                                "{{ slotProps.item.comments }}"
                                            </p>
                                        </template>
                                    </Card>
                                </template>
                            </Timeline>

                            <div v-else class="text-center py-8 text-gray-500">
                                <i class="pi pi-history text-4xl mb-4"></i>
                                <p>No hay historial de aprobación disponible</p>
                            </div>
                        </template>
                    </Card>
                </TabPanel>
            </TabView>
        </div>

        <!-- Diálogo de Aprobación -->
        <Dialog v-model:visible="showApproveDialog" modal header="Aprobar Expediente" :style="{ width: '450px' }">
            <div class="mb-4">
                <label class="block mb-2">Comentarios (opcional):</label>
                <Textarea v-model="approvalComments" rows="4" class="w-full"
                    placeholder="Añade comentarios sobre la aprobación..." />
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" @click="showApproveDialog = false"
                    :disabled="processingAction" />
                <Button label="Aprobar" icon="pi pi-check" @click="confirmApprove" :loading="processingAction" />
            </template>
        </Dialog>

        <!-- Diálogo de Rechazo -->
        <Dialog v-model:visible="showRejectDialog" modal header="Rechazar Expediente" :style="{ width: '450px' }">
            <div class="mb-4">
                <label class="block mb-2">Motivo del rechazo <span class="text-red-500">*</span>:</label>
                <Textarea v-model="rejectionComments" rows="4" class="w-full"
                    placeholder="Explica el motivo del rechazo..."
                    :class="{ 'p-invalid': !rejectionComments.trim() }" />
                <small class="text-red-500" v-if="!rejectionComments.trim()">
                    El motivo es obligatorio
                </small>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" @click="showRejectDialog = false"
                    :disabled="processingAction" />
                <Button label="Rechazar" icon="pi pi-times" severity="danger" @click="confirmReject"
                    :loading="processingAction" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
:deep(.customized-timeline) {
    .p-timeline-event-content {
        background-color: transparent;
    }

    .p-timeline-event-opposite {
        color: #6b7280;
        font-size: 0.875rem;
    }
}
</style>