<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { documentsService } from '@/services/documents.service'
import { formatFileSize, getFileIcon, isImageFile } from '@/types/document'
import type { Document } from '@/types/document'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Image from 'primevue/image'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { useAuth } from '@/composables/useAuth'

const props = defineProps<{
    expedienteId: string
    canDelete?: boolean
}>()

const emit = defineEmits<{
    'document-deleted': [documentId: string]
}>()

const toast = useToast()
const { user } = useAuth()

// Estado
const documents = ref<Document[]>([])
const loading = ref(true)
const downloading = ref<string | null>(null)
const deleting = ref<string | null>(null)
const selectedDocument = ref<Document | null>(null)
const showDeleteDialog = ref(false)

// Cargar documentos
const loadDocuments = async () => {
    loading.value = true
    try {
        const response = await documentsService.getDocumentsByExpediente(props.expedienteId)
        if (response.success) {
            documents.value = response.data
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar los documentos',
            life: 3000
        })
    } finally {
        loading.value = false
    }
}

// Descargar documento
const downloadDocument = async (document: Document) => {
    downloading.value = document.id

    try {
        const response = await documentsService.downloadDocument(document.id)

        if (response.success && response.data) {
            // Abrir en nueva pestaña
            window.open(response.data.url, '_blank')

            toast.add({
                severity: 'info',
                summary: 'Descarga iniciada',
                detail: `Descargando ${document.originalName}`,
                life: 3000
            })
        } else {
            throw new Error('No se pudo generar el enlace de descarga')
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al descargar el documento',
            life: 3000
        })
    } finally {
        downloading.value = null
    }
}

// Confirmar eliminación
const confirmDelete = (document: Document) => {
    selectedDocument.value = document
    showDeleteDialog.value = true
}

// Eliminar documento
const deleteDocument = async () => {
    if (!selectedDocument.value) return

    deleting.value = selectedDocument.value.id

    try {
        const response = await documentsService.deleteDocument(selectedDocument.value.id)

        if (response.success) {
            // Remover de la lista local
            documents.value = documents.value.filter(d => d.id !== selectedDocument.value!.id)

            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Documento eliminado correctamente',
                life: 3000
            })

            emit('document-deleted', selectedDocument.value.id)
            showDeleteDialog.value = false
        } else {
            throw new Error(response.message || 'Error al eliminar')
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'Error al eliminar el documento',
            life: 3000
        })
    } finally {
        deleting.value = null
        selectedDocument.value = null
    }
}

// Verificar si puede eliminar
const canDeleteDocument = (document: Document) => {
    if (!props.canDelete || !user.value) return false

    // Solo el que subió el documento o un admin puede eliminar
    return document.uploadedBy === user.value.id || user.value.role === 'admin'
}

// Formatear fecha
const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Recargar documentos cuando se sube uno nuevo
const refreshDocuments = () => {
    loadDocuments()
}

// Montar
onMounted(() => {
    loadDocuments()
})

// Exponer método para refrescar
defineExpose({
    refreshDocuments
})
</script>

<template>
    <div class="document-list">
        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-8">
            <ProgressSpinner />
        </div>

        <!-- Lista de documentos -->
        <div v-else-if="documents.length > 0">
            <DataTable :value="documents" stripedRows showGridlines responsiveLayout="scroll" class="p-datatable-sm">
                <!-- Columna Archivo -->
                <Column field="originalName" header="Archivo" :sortable="true" style="width: 40%">
                    <template #body="{ data }">
                        <div class="flex items-center gap-3">
                            <!-- Icono o miniatura -->
                            <div v-if="isImageFile(data.mimeType)" class="w-10 h-10 rounded overflow-hidden">
                                <Image :src="data.fileUrl" :alt="data.originalName" preview
                                    class="w-full h-full object-cover" />
                            </div>
                            <i v-else :class="`pi ${getFileIcon(data.mimeType)} text-2xl text-gray-600`"></i>

                            <!-- Nombre del archivo -->
                            <div>
                                <p class="font-medium">{{ data.originalName }}</p>
                                <p class="text-xs text-gray-500">{{ formatFileSize(data.fileSize) }}</p>
                            </div>
                        </div>
                    </template>
                </Column>

                <!-- Columna Subido por -->
                <Column field="uploader.fullName" header="Subido por" style="width: 20%">
                    <template #body="{ data }">
                        <span>{{ data.uploader?.fullName || 'N/A' }}</span>
                    </template>
                </Column>

                <!-- Columna Fecha -->
                <Column field="uploadedAt" header="Fecha" :sortable="true" style="width: 20%">
                    <template #body="{ data }">
                        <span class="text-sm">{{ formatDate(data.uploadedAt) }}</span>
                    </template>
                </Column>

                <!-- Columna Acciones -->
                <Column header="Acciones" style="width: 20%" :exportable="false">
                    <template #body="{ data }">
                        <div class="flex gap-2 justify-end">
                            <!-- Descargar -->
                            <Button icon="pi pi-download" severity="info" text rounded v-tooltip.top="'Descargar'"
                                @click="downloadDocument(data)" :loading="downloading === data.id" />

                            <!-- Ver (solo para imágenes) -->
                            <Image v-if="isImageFile(data.mimeType)" :src="data.fileUrl" :alt="data.originalName"
                                preview class="hidden">
                                <template #previewicon>
                                    <Button icon="pi pi-eye" severity="secondary" text rounded
                                        v-tooltip.top="'Ver imagen'" />
                                </template>
                            </Image>

                            <!-- Eliminar -->
                            <Button v-if="canDeleteDocument(data)" icon="pi pi-trash" severity="danger" text rounded
                                v-tooltip.top="'Eliminar'" @click="confirmDelete(data)"
                                :loading="deleting === data.id" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Sin documentos -->
        <div v-else class="text-center py-8">
            <i class="pi pi-folder-open text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-500">No hay documentos adjuntos</p>
        </div>

        <!-- Diálogo de confirmación -->
        <Dialog v-model:visible="showDeleteDialog" modal header="Confirmar eliminación" :style="{ width: '450px' }">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle text-4xl text-orange-500"></i>
                <div>
                    <p>¿Estás seguro de eliminar este documento?</p>
                    <p class="font-semibold mt-2" v-if="selectedDocument">
                        {{ selectedDocument.originalName }}
                    </p>
                    <p class="text-sm text-gray-500 mt-1">Esta acción no se puede deshacer.</p>
                </div>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" @click="showDeleteDialog = false"
                    :disabled="deleting !== null" />
                <Button label="Eliminar" icon="pi pi-trash" severity="danger" @click="deleteDocument"
                    :loading="deleting !== null" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
:deep(.p-datatable) {
    .p-datatable-header {
        background-color: transparent;
        border: none;
    }

    .p-datatable-thead>tr>th {
        background-color: #f8f9fa;
        color: #495057;
        font-weight: 600;
    }
}
</style>