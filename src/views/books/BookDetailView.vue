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
      <span>Detalle</span>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner size="large" />
      <p class="text-gray-600 mt-4">Cargando información del libro...</p>
    </div>

    <!-- Contenido del libro -->
    <div v-else-if="currentBook" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Información principal -->
      <div class="lg:col-span-2">
        <Card>
          <template #header>
            <div class="flex items-center justify-between p-6 pb-0">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">{{ currentBook.title }}</h1>
                <p class="text-lg text-gray-600 mt-1">{{ currentBook.author }}</p>
              </div>
              <div class="flex gap-2">
                <Button
                  v-if="canEditBook(currentBook)"
                  label="Editar"
                  icon="pi pi-pencil"
                  severity="warn"
                  outlined
                  class="!text-white"
                  @click="editBook"
                />
                <Button
                  v-if="canDownloadBooks"
                  label="Ver archivo"
                  icon="pi pi-external-link"
                  severity="success"
                  class="!text-white"
                  @click="downloadBook"
                />
              </div>
            </div>
          </template>

          <template #content>
            <div class="space-y-6">
              <!-- Metadatos -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-gray-700">Tipo</label>
                  <div class="mt-1">
                    <Tag
                      :value="getBookTypeLabel(currentBook.type)"
                      :severity="getBookTypeColor(currentBook.type)"
                    />
                  </div>
                </div>

                <div>
                  <label class="text-sm font-medium text-gray-700">Visibilidad</label>
                  <div class="mt-1">
                    <Tag
                      :value="currentBook.isPublic ? 'Público' : 'Privado'"
                      :severity="currentBook.isPublic ? 'success' : 'warn'"
                      :icon="currentBook.isPublic ? 'pi pi-unlock' : 'pi pi-lock'"
                    />
                  </div>
                </div>

                <div>
                  <label class="text-sm font-medium text-gray-700">Fecha de subida</label>
                  <p class="text-gray-900 mt-1">
                    {{
                      new Date(currentBook.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    }}
                  </p>
                </div>

                <div v-if="currentBook.updatedAt !== currentBook.createdAt">
                  <label class="text-sm font-medium text-gray-700">Última actualización</label>
                  <p class="text-gray-900 mt-1">
                    {{
                      new Date(currentBook.updatedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    }}
                  </p>
                </div>
              </div>

              <!-- Descripción -->
              <div v-if="currentBook.description">
                <label class="text-sm font-medium text-gray-700">Descripción</label>
                <p class="text-gray-900 mt-1 leading-relaxed">{{ currentBook.description }}</p>
              </div>

              <!-- Tags -->
              <div v-if="currentBook.tags && currentBook.tags.length > 0">
                <label class="text-sm font-medium text-gray-700">Tags</label>
                <div class="flex flex-wrap gap-2 mt-2">
                  <Tag
                    v-for="tag in currentBook.tags"
                    :key="tag"
                    :value="tag"
                    severity="secondary"
                  />
                </div>
              </div>

              <!-- Información del usuario que subió -->
              <div v-if="currentBook.uploader">
                <label class="text-sm font-medium text-gray-700">Subido por</label>
                <div class="flex items-center gap-3 mt-2">
                  <Avatar
                    :label="getAvatarLabel(currentBook.uploader.fullName)"
                    size="normal"
                    shape="circle"
                    class="bg-gray-200 text-gray-700"
                  />
                  <div>
                    <p class="font-medium text-gray-900">
                      {{ currentBook.uploader.fullName || 'Usuario' }}
                    </p>
                    <p class="text-sm text-gray-600">{{ currentBook.uploader.email || '' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Panel lateral -->
      <div class="space-y-6">
        <!-- Portada -->
        <Card v-if="currentBook.coverImageUrl">
          <template #content>
            <div class="text-center">
              <h4 class="font-medium text-gray-900 mb-4">Portada</h4>
              <img
                :src="currentBook.coverImageUrl"
                :alt="`Portada de ${currentBook.title}`"
                class="w-full max-w-48 mx-auto rounded-lg shadow-md"
              />
            </div>
          </template>
        </Card>

        <!-- Información del archivo -->
        <Card>
          <template #content>
            <div class="space-y-4">
              <h4 class="font-medium text-gray-900">Información del Archivo</h4>

              <div class="space-y-3">
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <i class="pi pi-file text-2xl text-blue-500"></i>
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">{{ getFileName(currentBook.fileUrl) }}</p>
                    <p class="text-sm text-gray-600">
                      <span v-if="currentBook.fileUrl">{{
                        getFileExtension(currentBook.fileUrl)
                      }}</span>
                      <span v-if="currentBook.fileSize">
                        • {{ formatFileSize(currentBook.fileSize) }}
                      </span>
                    </p>
                  </div>
                </div>

                <Button
                  v-if="canDownloadBooks"
                  label="Ver archivo"
                  icon="pi pi-external-link"
                  severity="success"
                  class="w-full !text-white"
                  @click="downloadBook"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Acciones -->
        <Card>
          <template #content>
            <div class="space-y-3">
              <h4 class="font-medium text-gray-900">Acciones</h4>

              <div class="space-y-2">
                <Button
                  label="Volver a la lista"
                  icon="pi pi-arrow-left"
                  severity="secondary"
                  outlined
                  class="w-full !text-white"
                  @click="goBack"
                />

                <Button
                  v-if="currentBook && canEditBook(currentBook)"
                  label="Editar libro"
                  icon="pi pi-pencil"
                  severity="warn"
                  outlined
                  class="w-full !text-white"
                  @click="editBook"
                />

                <Button
                  v-if="currentBook && canDeleteBook(currentBook)"
                  label="Eliminar libro"
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  class="w-full !text-white"
                  @click="confirmDeleteBook"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <!-- Error state -->
    <Card v-else>
      <template #content>
        <div class="text-center py-8">
          <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Libro no encontrado</h3>
          <p class="text-gray-600 mb-4">
            El libro que buscas no existe o no tienes permisos para verlo.
          </p>
          <Button
            label="Volver a la biblioteca"
            icon="pi pi-arrow-left"
            severity="secondary"
            @click="goBack"
          />
        </div>
      </template>
    </Card>

    <!-- Modal de confirmación para eliminar -->
    <Dialog
      v-model:visible="showDeleteDialog"
      modal
      header="Confirmar eliminación"
      :style="{ width: '450px' }"
    >
      <div class="flex items-center gap-3 mb-4">
        <i class="pi pi-exclamation-triangle text-3xl text-orange-500"></i>
        <div>
          <p class="font-medium text-gray-900 mb-1">
            ¿Estás seguro que deseas eliminar este libro?
          </p>
          <p class="text-sm text-gray-600">Esta acción no se puede deshacer.</p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancelar"
            severity="secondary"
            outlined
            @click="showDeleteDialog = false"
            :disabled="deletingBook"
          />
          <Button
            label="Eliminar"
            severity="danger"
            icon="pi pi-trash"
            @click="deleteBook"
            :loading="deletingBook"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import { useBooks } from '@/composables/useBooks'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const {
  currentBook,
  loading,
  fetchBookById,
  deleteBook: deleteBookAction,
  downloadBook: downloadBookAction,
  canEditBook,
  canDeleteBook,
  canDownloadBooks,
  getBookTypeLabel,
  getBookTypeColor,
  formatFileSize,
  getFileExtension,
} = useBooks()

const bookId = route.params.id as string
const showDeleteDialog = ref(false)
const deletingBook = ref(false)

const loadBook = async () => {
  try {
    await fetchBookById(bookId)
    console.log('currentBook after fetch:', currentBook.value)
  } catch (error: any) {
    console.error('Error al cargar libro:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar la información del libro',
      life: 3000,
    })
  }
}

const getFileName = (filePath: string | undefined) => {
  if (!filePath) return 'Archivo no disponible'
  return filePath.split('/').pop() || filePath
}

const getAvatarLabel = (name: string | undefined) => {
  if (!name) return 'U'
  const names = name.split(' ')
  return names.length > 1
    ? `${names[0][0]}${names[1][0]}`.toUpperCase()
    : names[0].substring(0, 2).toUpperCase()
}

const goBack = () => {
  router.push('/admin/libros')
}

const editBook = () => {
  router.push(`/admin/libros/${bookId}/editar`)
}

const downloadBook = async () => {
  if (!currentBook.value) return

  try {
    await downloadBookAction(currentBook.value)
    toast.add({
      severity: 'success',
      summary: 'Abriendo archivo',
      detail: `Abriendo "${currentBook.value.title}" en nueva pestaña`,
      life: 3000,
    })
  } catch (error: any) {
    console.error('Error al descargar libro:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al abrir el archivo',
      life: 3000,
    })
  }
}

const confirmDeleteBook = () => {
  showDeleteDialog.value = true
}

const deleteBook = async () => {
  if (!currentBook.value) return

  try {
    deletingBook.value = true
    await deleteBookAction(currentBook.value.id)

    toast.add({
      severity: 'success',
      summary: 'Libro eliminado',
      detail: `El libro "${currentBook.value.title}" ha sido eliminado correctamente`,
      life: 3000,
    })

    showDeleteDialog.value = false
    goBack()
  } catch (error: any) {
    console.error('Error al eliminar libro:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al eliminar el libro',
      life: 5000,
    })
  } finally {
    deletingBook.value = false
  }
}

// Watcher temporal para depuración
watch(
  currentBook,
  (newValue) => {
    console.log('currentBook changed:', newValue)
  },
  { deep: true },
)

watch(loading, (newValue) => {
  console.log('loading changed:', newValue)
})

onMounted(() => {
  console.log('Component mounted, bookId:', bookId)
  loadBook()
})
</script>
