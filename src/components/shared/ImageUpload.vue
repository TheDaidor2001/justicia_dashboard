<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Button from 'primevue/button'
import Message from 'primevue/message'

interface Props {
  modelValue?: File | null
  maxSize?: number // en MB
  acceptedTypes?: string[]
  disabled?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: File | null): void
  (e: 'error', message: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  maxSize: 5,
  acceptedTypes: () => ['image/jpeg', 'image/png', 'image/gif'],
  disabled: false,
})

const emit = defineEmits<Emits>()

// Estado
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement>()
const previewUrl = ref<string>('')
const error = ref<string>('')

// Computed
const acceptedTypesText = computed(() => {
  return props.acceptedTypes.map((type) => type.split('/')[1].toUpperCase()).join(', ')
})

const sizeText = computed(() => {
  return `Máximo ${props.maxSize}MB`
})

// Métodos
const createPreview = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const clearPreview = () => {
  previewUrl.value = ''
  error.value = ''
}

// Watchers
watch(
  () => props.modelValue,
  (newFile) => {
    if (newFile) {
      createPreview(newFile)
    } else {
      clearPreview()
    }
  },
  { immediate: true },
)

const validateFile = (file: File): string | null => {
  // Validar tipo
  if (!props.acceptedTypes.includes(file.type)) {
    return `Tipo de archivo no válido. Solo se permiten: ${acceptedTypesText.value}`
  }

  // Validar tamaño
  const sizeInMB = file.size / (1024 * 1024)
  if (sizeInMB > props.maxSize) {
    return `El archivo es demasiado grande. ${sizeText.value}`
  }

  return null
}

const handleFileSelect = (file: File) => {
  error.value = ''

  const validationError = validateFile(file)
  if (validationError) {
    error.value = validationError
    emit('error', validationError)
    return
  }

  emit('update:modelValue', file)
}

const onFileInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    handleFileSelect(file)
  }
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  dragOver.value = false

  if (props.disabled) return

  const file = event.dataTransfer?.files[0]
  if (file) {
    handleFileSelect(file)
  }
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (!props.disabled) {
    dragOver.value = true
  }
}

const onDragLeave = () => {
  dragOver.value = false
}

const openFileDialog = () => {
  if (!props.disabled) {
    fileInput.value?.click()
  }
}

const removeImage = () => {
  emit('update:modelValue', null)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="image-upload">
    <!-- Input oculto -->
    <input
      ref="fileInput"
      type="file"
      :accept="acceptedTypes.join(',')"
      @change="onFileInputChange"
      class="hidden"
      :disabled="disabled"
    />

    <!-- Zona de drop -->
    <div
      v-if="!previewUrl"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @click="openFileDialog"
      class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all"
      :class="{
        'border-blue-400 bg-blue-50': dragOver && !disabled,
        'border-gray-300 hover:border-blue-400 hover:bg-gray-50': !dragOver && !disabled,
        'border-gray-200 bg-gray-100 cursor-not-allowed': disabled,
      }"
    >
      <div class="space-y-4">
        <div class="text-4xl text-gray-400">
          <i class="pi pi-cloud-upload"></i>
        </div>
        <div>
          <p class="text-lg font-medium text-gray-700">
            {{ dragOver ? 'Suelta la imagen aquí' : 'Selecciona o arrastra una imagen' }}
          </p>
          <p class="text-sm text-gray-500 mt-2">{{ acceptedTypesText }} • {{ sizeText }}</p>
        </div>
        <Button
          label="Seleccionar archivo"
          icon="pi pi-upload"
          severity="secondary"
          outlined
          :disabled="disabled"
          @click.stop="openFileDialog"
        />
      </div>
    </div>

    <!-- Preview de imagen -->
    <div v-else class="space-y-4">
      <div class="relative inline-block">
        <img
          :src="previewUrl"
          :alt="modelValue?.name || 'Preview'"
          class="max-w-full h-48 object-cover rounded-lg border border-gray-200"
        />
        <Button
          v-if="!disabled"
          icon="pi pi-times"
          severity="danger"
          rounded
          size="small"
          class="absolute top-2 right-2"
          @click="removeImage"
          v-tooltip.left="'Eliminar imagen'"
        />
      </div>

      <!-- Información del archivo -->
      <div class="text-sm text-gray-600">
        <p><strong>Archivo:</strong> {{ modelValue?.name }}</p>
        <p><strong>Tamaño:</strong> {{ ((modelValue?.size || 0) / 1024 / 1024).toFixed(2) }} MB</p>
      </div>

      <!-- Botón para cambiar -->
      <Button
        v-if="!disabled"
        label="Cambiar imagen"
        icon="pi pi-refresh"
        severity="secondary"
        outlined
        size="small"
        @click="openFileDialog"
      />
    </div>

    <!-- Mensaje de error -->
    <Message v-if="error" severity="error" :closable="false" class="mt-3">
      {{ error }}
    </Message>
  </div>
</template>

<style scoped>
.hidden {
  display: none;
}

.image-upload {
  width: 100%;
}
</style>
