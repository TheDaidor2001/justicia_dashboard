<template>
  <div class="space-y-6 px-4 py-5 lg:px-6 xl:px-8">
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
      <span>Biblioteca Digital</span>
      <i class="pi pi-chevron-right text-sm"></i>
      <span>Nuevo Libro</span>
    </div>

    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Nuevo Libro</h1>
        <p class="text-gray-600 mt-1">Agregar un nuevo libro a la biblioteca digital</p>
      </div>

      <div class="flex gap-2">
        <Button
          label="Cancelar"
          severity="secondary"
          outlined
          class="!bg-white !text-gray-700 !border-gray-300 hover:!bg-gray-50"
          @click="goBack"
        />
        <Button
          label="Guardar"
          icon="pi pi-save"
          :loading="uploading"
          :disabled="!isFormValid"
          class="bg-blue-600 text-white hover:bg-blue-700"
          @click="createBook"
        />
      </div>
    </div>

    <!-- Formulario -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Formulario principal -->
      <div class="lg:col-span-2">
        <Card>
          <template #content>
            <form @submit.prevent="createBook" class="space-y-6">
              <!-- Información básica -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Información del Libro</h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label for="title" class="text-sm font-medium text-gray-700"> Título * </label>
                    <InputText
                      id="title"
                      v-model="bookForm.title"
                      :class="{ 'p-invalid': titleError }"
                      placeholder="Título del libro"
                      class="w-full"
                      @input="validateTitle"
                    />
                    <small v-if="titleError" class="text-red-500">{{ titleError }}</small>
                  </div>

                  <div class="space-y-2">
                    <label for="author" class="text-sm font-medium text-gray-700"> Autor * </label>
                    <InputText
                      id="author"
                      v-model="bookForm.author"
                      :class="{ 'p-invalid': authorError }"
                      placeholder="Nombre del autor"
                      class="w-full"
                      @input="validateAuthor"
                    />
                    <small v-if="authorError" class="text-red-500">{{ authorError }}</small>
                  </div>
                </div>

                <div class="space-y-2">
                  <label for="description" class="text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <Textarea
                    id="description"
                    v-model="bookForm.description"
                    placeholder="Descripción del contenido del libro"
                    class="w-full"
                    rows="3"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label for="type" class="text-sm font-medium text-gray-700"> Tipo * </label>
                    <Select
                      id="type"
                      v-model="bookForm.type"
                      :options="typeOptions"
                      option-label="label"
                      option-value="value"
                      :class="{ 'p-invalid': typeError }"
                      placeholder="Seleccionar tipo"
                      class="w-full"
                      @change="validateType"
                    />
                    <small v-if="typeError" class="text-red-500">{{ typeError }}</small>
                  </div>

                  <div class="space-y-2">
                    <label for="isPublic" class="text-sm font-medium text-gray-700">
                      Visibilidad
                    </label>
                    <Select
                      id="isPublic"
                      v-model="bookForm.isPublic"
                      :options="visibilityOptions"
                      option-label="label"
                      option-value="value"
                      placeholder="Seleccionar visibilidad"
                      class="w-full"
                    />
                  </div>
                </div>

                <div class="space-y-2">
                  <label for="tags" class="text-sm font-medium text-gray-700">
                    Tags (separados por comas)
                  </label>
                  <InputText
                    id="tags"
                    v-model="tagsString"
                    placeholder="ej: derecho, penal, código"
                    class="w-full"
                    @input="updateTags"
                  />
                  <div v-if="bookForm.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
                    <Tag
                      v-for="tag in bookForm.tags"
                      :key="tag"
                      :value="tag"
                      severity="secondary"
                      size="small"
                    />
                  </div>
                </div>
              </div>

              <!-- Archivos -->
              <Divider />

              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Archivos</h3>

                <!-- Archivo principal -->
                <div class="space-y-2">
                  <label class="text-sm font-medium text-gray-700"> Archivo del libro * </label>
                  <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      ref="fileInput"
                      type="file"
                      accept=".pdf,.epub,.doc,.docx"
                      @change="handleFileSelect"
                      class="hidden"
                    />
                    <div v-if="!bookForm.file" @click="fileInput?.click()" class="cursor-pointer">
                      <i class="pi pi-upload text-3xl text-gray-400 mb-2"></i>
                      <p class="text-gray-600">Haz clic para seleccionar un archivo</p>
                      <p class="text-sm text-gray-500 mt-1">PDF, EPUB, DOC, DOCX (máx. 50MB)</p>
                    </div>
                    <div v-else class="space-y-2">
                      <div class="flex items-center justify-center gap-2">
                        <i class="pi pi-file text-2xl text-blue-500"></i>
                        <span class="font-medium">{{ bookForm.file.name }}</span>
                      </div>
                      <p class="text-sm text-gray-500">{{ formatFileSize(bookForm.file.size) }}</p>
                      <Button
                        label="Cambiar archivo"
                        severity="secondary"
                        outlined
                        size="small"
                        @click="fileInput?.click()"
                      />
                    </div>
                  </div>
                  <small v-if="fileError" class="text-red-500">{{ fileError }}</small>
                </div>

                <!-- Portada (opcional) -->
                <div class="space-y-2">
                  <label class="text-sm font-medium text-gray-700"> Portada (opcional) </label>
                  <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      ref="coverInput"
                      type="file"
                      accept="image/*"
                      @change="handleCoverSelect"
                      class="hidden"
                    />
                    <div v-if="!bookForm.cover" @click="coverInput?.click()" class="cursor-pointer">
                      <i class="pi pi-image text-2xl text-gray-400 mb-2"></i>
                      <p class="text-gray-600">Imagen de portada</p>
                      <p class="text-sm text-gray-500">JPG, PNG, WebP (máx. 5MB)</p>
                    </div>
                    <div v-else class="space-y-2">
                      <img
                        v-if="coverPreview"
                        :src="coverPreview"
                        alt="Vista previa"
                        class="w-20 h-28 object-cover mx-auto rounded"
                      />
                      <p class="text-sm text-gray-500">{{ bookForm.cover.name }}</p>
                      <Button
                        label="Cambiar imagen"
                        severity="secondary"
                        outlined
                        size="small"
                        @click="coverInput?.click()"
                      />
                    </div>
                  </div>
                  <small v-if="coverError" class="text-red-500">{{ coverError }}</small>
                </div>
              </div>
            </form>
          </template>
        </Card>
      </div>

      <!-- Panel lateral -->
      <div class="space-y-6">
        <!-- Progreso de carga -->
        <Card v-if="uploading">
          <template #content>
            <div class="text-center space-y-4">
              <ProgressSpinner size="large" />
              <div>
                <p class="font-medium text-gray-900">Subiendo libro...</p>
                <p class="text-sm text-gray-600">Por favor espera mientras se procesa el archivo</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Información de ayuda -->
        <Card v-else>
          <template #content>
            <div class="space-y-4">
              <h4 class="font-medium text-gray-900">Formatos permitidos</h4>
              <div class="space-y-2 text-sm text-gray-600">
                <div class="flex items-center gap-2">
                  <i class="pi pi-file-pdf text-red-500"></i>
                  <span>PDF - Documentos portátiles</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="pi pi-book text-blue-500"></i>
                  <span>EPUB - Libros electrónicos</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="pi pi-file text-blue-500"></i>
                  <span>DOC/DOCX - Documentos Word</span>
                </div>
              </div>

              <Divider />

              <h4 class="font-medium text-gray-900">Tipos de libros</h4>
              <div class="space-y-1 text-sm text-gray-600">
                <div><strong>Código Legal:</strong> Leyes y códigos oficiales</div>
                <div><strong>Tratado:</strong> Documentos y acuerdos internacionales</div>
                <div><strong>Manual:</strong> Guías y manuales de procedimientos</div>
                <div><strong>Libro:</strong> Literatura jurídica general</div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'
import { useBooks } from '@/composables/useBooks'
import {
  BOOK_TYPE_LABELS,
  ALLOWED_FILE_TYPES,
  ALLOWED_COVER_TYPES,
  MAX_FILE_SIZE,
  MAX_COVER_SIZE,
} from '@/types/book'
import type { BookType, CreateBookRequest } from '@/types/book'

const router = useRouter()
const toast = useToast()

const {
  uploading,
  createBook: createBookAction,
  validateDocumentFile,
  validateCoverFile,
  formatFileSize,
} = useBooks()

// Estado del formulario
const bookForm = ref<CreateBookRequest>({
  title: '',
  description: '',
  author: '',
  tags: [],
  type: '' as BookType,
  cover: undefined,
  file: undefined as any,
  isPublic: true,
})

const tagsString = ref('')
const coverPreview = ref<string | null>(null)

// Referencias a elementos del template
const fileInput = ref<HTMLInputElement>()
const coverInput = ref<HTMLInputElement>()

// Errores de validación
const titleError = ref('')
const authorError = ref('')
const typeError = ref('')
const fileError = ref('')
const coverError = ref('')

// Opciones para selects
const typeOptions = computed(() => {
  return Object.entries(BOOK_TYPE_LABELS).map(([value, label]) => ({
    value: value as BookType,
    label,
  }))
})

const visibilityOptions = [
  { value: true, label: 'Público' },
  { value: false, label: 'Privado' },
]

// Validación del formulario
const isFormValid = computed(() => {
  return (
    bookForm.value.title.trim().length >= 3 &&
    bookForm.value.author.trim().length >= 3 &&
    bookForm.value.type &&
    bookForm.value.file &&
    !titleError.value &&
    !authorError.value &&
    !typeError.value &&
    !fileError.value &&
    !coverError.value
  )
})

// Validaciones
const validateTitle = () => {
  if (!bookForm.value.title.trim()) {
    titleError.value = 'El título es requerido'
  } else if (bookForm.value.title.length < 3) {
    titleError.value = 'El título debe tener al menos 3 caracteres'
  } else {
    titleError.value = ''
  }
}

const validateAuthor = () => {
  if (!bookForm.value.author.trim()) {
    authorError.value = 'El autor es requerido'
  } else if (bookForm.value.author.length < 3) {
    authorError.value = 'El autor debe tener al menos 3 caracteres'
  } else {
    authorError.value = ''
  }
}

const validateType = () => {
  if (!bookForm.value.type) {
    typeError.value = 'El tipo es requerido'
  } else {
    typeError.value = ''
  }
}

// Manejo de archivos
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    const validation = validateDocumentFile(file)
    if (validation.isValid) {
      bookForm.value.file = file
      fileError.value = ''
    } else {
      fileError.value = validation.errors.join(', ')
      target.value = ''
    }
  }
}

const handleCoverSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    const validation = validateCoverFile(file)
    if (validation.isValid) {
      bookForm.value.cover = file
      coverError.value = ''

      // Crear vista previa
      const reader = new FileReader()
      reader.onload = (e) => {
        coverPreview.value = e.target?.result as string
      }
      reader.readAsDataURL(file)
    } else {
      coverError.value = validation.errors.join(', ')
      target.value = ''
    }
  }
}

const updateTags = () => {
  const tags = tagsString.value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
  bookForm.value.tags = tags
}

const goBack = () => {
  router.push('/admin/libros')
}

const createBook = async () => {
  // Validar todos los campos
  validateTitle()
  validateAuthor()
  validateType()

  if (!isFormValid.value) {
    toast.add({
      severity: 'warn',
      summary: 'Formulario incompleto',
      detail: 'Por favor complete todos los campos requeridos',
      life: 3000,
    })
    return
  }

  try {
    await createBookAction(bookForm.value)

    toast.add({
      severity: 'success',
      summary: 'Libro creado',
      detail: 'El libro se ha agregado correctamente a la biblioteca',
      life: 3000,
    })

    goBack()
  } catch (error: any) {
    console.error('Error al crear libro:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al crear el libro',
      life: 5000,
    })
  }
}

// Limpiar vista previa al desmontar
onBeforeUnmount(() => {
  if (coverPreview.value) {
    URL.revokeObjectURL(coverPreview.value)
  }
})
</script>

<style scoped>
.p-invalid {
  border-color: rgb(239 68 68) !important;
}
</style>
