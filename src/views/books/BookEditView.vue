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
      <span>Editar</span>
    </div>

    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Editar Libro</h1>
        <p class="text-gray-600 mt-1">Modificar información del libro</p>
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
          :loading="loading"
          class="bg-blue-600 text-white hover:bg-blue-700"
          @click="saveBook"
        />
      </div>
    </div>

    <!-- Formulario -->
    <Card v-if="currentBook">
      <template #content>
        <form @submit.prevent="saveBook" class="space-y-6">
          <!-- Información básica -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900">Información del Libro</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label for="title" class="text-sm font-medium text-gray-700"> Título * </label>
                <InputText
                  id="title"
                  v-model="bookForm.title"
                  placeholder="Título del libro"
                  class="w-full"
                  required
                />
              </div>

              <div class="space-y-2">
                <label for="author" class="text-sm font-medium text-gray-700"> Autor * </label>
                <InputText
                  id="author"
                  v-model="bookForm.author"
                  placeholder="Nombre del autor"
                  class="w-full"
                  required
                />
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
                  placeholder="Seleccionar tipo"
                  class="w-full"
                />
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
              <div
                v-if="bookForm.tags && bookForm.tags.length > 0"
                class="flex flex-wrap gap-1 mt-2"
              >
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

          <!-- Información de archivo (solo lectura) -->
          <Divider />

          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900">Archivo del Libro</h3>
            <Message severity="info">
              <template #icon>
                <i class="pi pi-info-circle"></i>
              </template>
              Los archivos no pueden modificarse después de la creación. Para cambiar el archivo,
              elimina este libro y crea uno nuevo.
            </Message>

            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex items-center gap-3">
                <i class="pi pi-file text-2xl text-blue-500"></i>
                <div>
                  <p class="font-medium text-gray-900">{{ getFileName(currentBook.fileUrl) }}</p>
                  <p class="text-sm text-gray-600">
                    Subido el {{ new Date(currentBook.createdAt).toLocaleDateString('es-ES') }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </template>
    </Card>

    <!-- Loading state -->
    <div v-else-if="loading" class="space-y-6">
      <Card class="relative">
        <template #content>
          <div class="animate-pulse space-y-6">
            <!-- Header skeleton -->
            <div class="flex items-center justify-between">
              <div>
                <div class="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                <div class="h-5 bg-gray-200 rounded w-96"></div>
              </div>
              <div class="flex gap-2">
                <div class="h-10 bg-gray-200 rounded w-24"></div>
                <div class="h-10 bg-gray-200 rounded w-28"></div>
              </div>
            </div>

            <!-- Form skeleton -->
            <div class="space-y-4">
              <div>
                <div class="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                <div class="h-10 bg-gray-200 rounded w-full"></div>
              </div>

              <div>
                <div class="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div class="h-10 bg-gray-200 rounded w-full"></div>
              </div>

              <div>
                <div class="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div class="h-24 bg-gray-200 rounded w-full"></div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div class="h-10 bg-gray-200 rounded w-full"></div>
                </div>
                <div>
                  <div class="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div class="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading overlay with spinner -->
          <div
            class="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg"
          >
            <div class="text-center">
              <ProgressSpinner
                style="width: 50px; height: 50px"
                strokeWidth="4"
                animationDuration=".8s"
              />
              <p class="text-gray-700 font-medium mt-4">Cargando información del libro...</p>
              <p class="text-sm text-gray-500 mt-1">Por favor espere un momento</p>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import { useBooks } from '@/composables/useBooks'
import { BOOK_TYPE_LABELS } from '@/types/book'
import type { BookType, UpdateBookRequest } from '@/types/book'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const { currentBook, loading, fetchBookById, updateBook, parseTags, formatTags } = useBooks()

const bookId = route.params.id as string

// Estado del formulario
const bookForm = ref<UpdateBookRequest>({
  title: '',
  description: '',
  author: '',
  tags: [],
  type: '' as BookType,
  isPublic: true,
})

const tagsString = ref('')

const getFileName = (filePath: string | undefined) => {
  if (!filePath) return 'Archivo no disponible'
  return filePath.split('/').pop() || filePath
}

// Opciones para selects
const typeOptions = Object.entries(BOOK_TYPE_LABELS).map(([value, label]) => ({
  value: value as BookType,
  label,
}))

const visibilityOptions = [
  { value: true, label: 'Público' },
  { value: false, label: 'Privado' },
]

const loadBook = async () => {
  try {
    const book = await fetchBookById(bookId)

    // Poblar el formulario
    bookForm.value = {
      title: book.title,
      description: book.description || '',
      author: book.author,
      tags: book.tags || [],
      type: book.type,
      isPublic: book.isPublic,
    }

    tagsString.value = formatTags(book.tags || [])
  } catch (error: any) {
    console.error('Error al cargar libro:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar la información del libro',
      life: 3000,
    })
    goBack()
  }
}

const updateTags = () => {
  bookForm.value.tags = parseTags(tagsString.value)
}

const goBack = () => {
  router.push('/admin/libros')
}

const saveBook = async () => {
  try {
    await updateBook(bookId, bookForm.value)

    toast.add({
      severity: 'success',
      summary: 'Libro actualizado',
      detail: 'La información del libro se ha actualizado correctamente',
      life: 3000,
    })

    goBack()
  } catch (error: any) {
    console.error('Error al actualizar libro:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al actualizar el libro',
      life: 3000,
    })
  }
}

onMounted(() => {
  loadBook()
})
</script>

<style scoped>
.p-invalid {
  border-color: rgb(239 68 68) !important;
}
</style>
