<script setup lang="ts">
import { ref, computed } from 'vue'
import { documentsService } from '@/services/documents.service'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, formatFileSize } from '@/types/document'
import FileUpload from 'primevue/fileupload'
import Message from 'primevue/message'
import ProgressBar from 'primevue/progressbar'
import { useToast } from 'primevue/usetoast'

const props = defineProps<{
  expedienteId: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'upload-success': [document: any]
  'upload-error': [error: string]
}>()

const toast = useToast()
const uploading = ref(false)
const uploadProgress = ref(0)

// Generar string de tipos permitidos para el input
const acceptedFileTypes = computed(() => {
  return Object.keys(ALLOWED_FILE_TYPES).join(',')
})

// Validar archivo antes de subir
const validateFile = (file: File): string | null => {
  // Validar tipo
  if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
    return `Tipo de archivo no permitido. Solo se permiten: PDF, DOC, DOCX, JPG, PNG, GIF`
  }

  // Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return `El archivo excede el tamaño máximo permitido de ${formatFileSize(MAX_FILE_SIZE)}`
  }

  return null
}

// Manejar selección de archivo
const onFileSelect = async (event: any) => {
  const file = event.files[0]
  if (!file) return

  // Validar archivo
  const error = validateFile(file)
  if (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error,
      life: 5000,
    })
    event.files.splice(0, 1) // Limpiar selección
    return
  }

  // Subir archivo
  await uploadFile(file)
}

// Subir archivo
const uploadFile = async (file: File) => {
  uploading.value = true
  uploadProgress.value = 0

  try {
    // Simular progreso
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 200)

    const response = await documentsService.uploadDocument(props.expedienteId, file)

    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (response.success && response.data) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Documento subido correctamente',
        life: 3000,
      })

      emit('upload-success', response.data)

      setTimeout(() => {
        uploadProgress.value = 0
      }, 1000)
    } else {
      throw new Error(response.message || 'Error al subir documento')
    }
  } catch (error: any) {
    console.error('Error completo:', error)
    console.error('Response:', error.response)

    let errorMessage = 'Error al subir el documento'

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000,
    })

    emit('upload-error', errorMessage)
    uploadProgress.value = 0
  } finally {
    uploading.value = false
  }
}

// Personalizar mensajes
const chooseLabel = computed(() => (uploading.value ? 'Subiendo...' : 'Seleccionar Archivo'))
</script>

<template>
  <div class="document-upload">
    <!-- Información sobre archivos permitidos -->
    <Message severity="info" :closable="false" class="mb-4">
      <div class="flex items-start gap-2">
        <i class="pi pi-info-circle mt-1"></i>
        <div class="text-sm">
          <p class="font-semibold mb-1">Archivos permitidos:</p>
          <ul class="list-disc list-inside space-y-1">
            <li>Documentos: PDF, DOC, DOCX</li>
            <li>Imágenes: JPG, PNG, GIF</li>
            <li>Tamaño máximo: {{ formatFileSize(MAX_FILE_SIZE) }}</li>
          </ul>
        </div>
      </div>
    </Message>

    <!-- Componente de upload -->
    <FileUpload
      mode="basic"
      :accept="acceptedFileTypes"
      :maxFileSize="MAX_FILE_SIZE"
      :disabled="disabled || uploading"
      :chooseLabel="chooseLabel"
      :auto="true"
      @select="onFileSelect"
      class="w-full"
    >
      <template #empty>
        <p class="text-center text-gray-500">
          Arrastra y suelta archivos aquí o haz clic para seleccionar
        </p>
      </template>
    </FileUpload>

    <!-- Barra de progreso -->
    <div v-if="uploading || uploadProgress > 0" class="mt-4">
      <div class="flex justify-between text-sm text-gray-600 mb-1">
        <span>Subiendo archivo...</span>
        <span>{{ uploadProgress }}%</span>
      </div>
      <ProgressBar :value="uploadProgress" :showValue="false" />
    </div>
  </div>
</template>

<style scoped>
:deep(.p-fileupload) {
  .p-fileupload-buttonbar {
    background: transparent;
    border: 2px dashed #e5e7eb;
    border-radius: 0.5rem;
    padding: 2rem;
    transition: all 0.2s;
  }

  .p-fileupload-buttonbar:hover {
    border-color: #3b82f6;
    background-color: #f3f4f6;
  }

  .p-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
