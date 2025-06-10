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
    </div>

    <!-- Header con título y acciones -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Biblioteca Digital</h1>
        <p class="text-gray-600 mt-1">Gestión de libros y documentos legales</p>
      </div>

      <div class="flex gap-2">
        <Button
          v-if="canCreateBooks"
          label="Nuevo Libro"
          icon="pi pi-plus"
          class="bg-blue-600 text-white hover:bg-blue-700"
          @click="navigateToCreate"
        />
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card class="border-l-4 border-l-blue-500">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total de Libros</p>
              <p class="text-2xl font-bold text-gray-900">{{ bookStats.total || 0 }}</p>
            </div>
            <i class="pi pi-book text-2xl text-blue-500"></i>
          </div>
        </template>
      </Card>

      <Card class="border-l-4 border-l-green-500">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Libros Públicos</p>
              <p class="text-2xl font-bold text-gray-900">{{ bookStats.publicBooks || 0 }}</p>
            </div>
            <i class="pi pi-unlock text-2xl text-green-500"></i>
          </div>
        </template>
      </Card>

      <Card class="border-l-4 border-l-orange-500">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Libros Privados</p>
              <p class="text-2xl font-bold text-gray-900">{{ bookStats.privateBooks || 0 }}</p>
            </div>
            <i class="pi pi-lock text-2xl text-orange-500"></i>
          </div>
        </template>
      </Card>

      <Card class="border-l-4 border-l-purple-500">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Tamaño Total</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ formatFileSize(bookStats.totalSize || 0) }}
              </p>
            </div>
            <i class="pi pi-database text-2xl text-purple-500"></i>
          </div>
        </template>
      </Card>
    </div>

    <!-- Filtros -->
    <Card>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Búsqueda -->
          <div class="flex flex-col">
            <label class="text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="Título, autor o tags..."
                class="w-full"
              />
            </IconField>
          </div>

          <!-- Filtro por tipo -->
          <div class="flex flex-col">
            <label class="text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <Select
              v-model="filters.type"
              :options="typeOptions"
              option-label="label"
              option-value="value"
              placeholder="Todos los tipos"
              class="w-full"
              show-clear
            />
          </div>

          <!-- Filtro por visibilidad -->
          <div class="flex flex-col">
            <label class="text-sm font-medium text-gray-700 mb-1">Visibilidad</label>
            <Select
              v-model="filters.isPublic"
              :options="visibilityOptions"
              option-label="label"
              option-value="value"
              placeholder="Todos"
              class="w-full"
              show-clear
            />
          </div>
        </div>

        <div class="flex justify-end mt-4">
          <Button
            label="Limpiar Filtros"
            severity="secondary"
            outlined
            size="small"
            @click="clearFilters"
          />
        </div>
      </template>
    </Card>

    <!-- Tabla de libros -->
    <Card>
      <template #content>
        <!-- Mensaje cuando no hay libros -->
        <div v-if="!loading && books.length === 0" class="text-center py-8">
          <i class="pi pi-book text-4xl text-gray-400 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No hay libros disponibles</h3>
          <p class="text-gray-600 mb-4">No se encontraron libros en la biblioteca</p>
          <Button
            v-if="canCreateBooks"
            label="Agregar primer libro"
            icon="pi pi-plus"
            class="bg-blue-600 text-white hover:bg-blue-700"
            @click="navigateToCreate"
          />
        </div>

        <DataTable
          v-else
          :value="filteredBooks"
          :loading="loading"
          paginator
          :rows="20"
          class="p-datatable-sm"
          dataKey="id"
        >
          <Column field="title" header="Libro" sortable>
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <div class="w-12 h-16 bg-gray-100 rounded flex items-center justify-center">
                  <i v-if="data.cover" class="pi pi-image text-gray-500"></i>
                  <i v-else class="pi pi-book text-gray-500"></i>
                </div>
                <div>
                  <div class="font-medium text-gray-900">{{ data.title }}</div>
                  <div class="text-sm text-gray-600">{{ data.author }}</div>
                  <div class="flex gap-1 mt-1">
                    <Tag
                      :value="getBookTypeLabel(data.type)"
                      :severity="getBookTypeColor(data.type)"
                      size="small"
                    />
                  </div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="tags" header="Tags">
            <template #body="{ data }">
              <div class="flex flex-wrap gap-1">
                <Tag
                  v-for="tag in data.tags.slice(0, 3)"
                  :key="tag"
                  :value="tag"
                  severity="secondary"
                  size="small"
                />
                <span v-if="data.tags.length > 3" class="text-xs text-gray-500">
                  +{{ data.tags.length - 3 }} más
                </span>
              </div>
            </template>
          </Column>

          <Column field="isPublic" header="Visibilidad" sortable>
            <template #body="{ data }">
              <Tag
                :value="data.isPublic ? 'Público' : 'Privado'"
                :severity="data.isPublic ? 'success' : 'warn'"
                :icon="data.isPublic ? 'pi pi-unlock' : 'pi pi-lock'"
              />
            </template>
          </Column>

          <Column field="createdAt" header="Fecha" sortable>
            <template #body="{ data }">
              <span class="text-sm">
                {{ new Date(data.createdAt).toLocaleDateString('es-ES') }}
              </span>
            </template>
          </Column>

          <Column header="Acciones">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                  icon="pi pi-eye"
                  severity="info"
                  text
                  rounded
                  size="small"
                  @click="viewBook(data.id)"
                  title="Ver detalles"
                />
                <Button
                  v-if="canEditBook(data)"
                  icon="pi pi-pencil"
                  severity="warn"
                  text
                  rounded
                  size="small"
                  @click="editBook(data.id)"
                  title="Editar libro"
                />
                <Button
                  v-if="canDownloadBooks"
                  icon="pi pi-download"
                  severity="success"
                  text
                  rounded
                  size="small"
                  @click="downloadBook(data)"
                  title="Descargar"
                />
                <Button
                  v-if="canDeleteBook(data)"
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  @click="confirmDeleteBook(data)"
                  title="Eliminar libro"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Modal de confirmación para eliminar libro -->
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

      <div v-if="bookToDelete" class="bg-gray-50 p-3 rounded-lg mb-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
            <i class="pi pi-book text-gray-500"></i>
          </div>
          <div>
            <p class="font-medium text-gray-900">{{ bookToDelete.title }}</p>
            <p class="text-sm text-gray-600">{{ bookToDelete.author }}</p>
            <Tag
              :value="getBookTypeLabel(bookToDelete.type)"
              :severity="getBookTypeColor(bookToDelete.type)"
              size="small"
            />
          </div>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import { useBooks } from '@/composables/useBooks'
import { BOOK_TYPE_LABELS } from '@/types/book'
import type { BookType } from '@/types/book'

const router = useRouter()
const toast = useToast()

const {
  books,
  bookStats,
  filters,
  loading,
  canCreateBooks,
  canEditBook,
  canDeleteBook,
  canDownloadBooks,
  fetchBooks,
  deleteBook: deleteBookAction,
  downloadBook: downloadBookAction,
  fetchBookStats,
  setFilters,
  resetFilters,
  getBookTypeLabel,
  getBookTypeColor,
  formatFileSize,
} = useBooks()

// Estado local
const searchQuery = ref('')
const showDeleteDialog = ref(false)
const bookToDelete = ref<any>(null)
const deletingBook = ref(false)

// Opciones para filtros
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

// Filtrado local
const filteredBooks = computed(() => {
  let filtered = books.value || []

  // Filtro de búsqueda
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (book) =>
        book.title.toLowerCase().includes(search) ||
        book.author.toLowerCase().includes(search) ||
        book.tags.some((tag) => tag.toLowerCase().includes(search)),
    )
  }

  // Filtro por tipo
  if (filters.value.type) {
    filtered = filtered.filter((book) => book.type === filters.value.type)
  }

  // Filtro por visibilidad
  if (filters.value.isPublic !== undefined) {
    filtered = filtered.filter((book) => book.isPublic === filters.value.isPublic)
  }

  return filtered
})

// Handlers
const navigateToCreate = () => {
  router.push('/admin/libros/nuevo')
}

const viewBook = (bookId: string) => {
  router.push(`/admin/libros/${bookId}`)
}

const editBook = (bookId: string) => {
  router.push(`/admin/libros/${bookId}/editar`)
}

const clearFilters = () => {
  searchQuery.value = ''
  filters.value.type = undefined
  filters.value.isPublic = undefined
}

const confirmDeleteBook = (book: any) => {
  bookToDelete.value = book
  showDeleteDialog.value = true
}

const deleteBook = async () => {
  if (!bookToDelete.value) return

  try {
    deletingBook.value = true
    await deleteBookAction(bookToDelete.value.id)

    toast.add({
      severity: 'success',
      summary: 'Libro eliminado',
      detail: `El libro "${bookToDelete.value.title}" ha sido eliminado correctamente`,
      life: 3000,
    })

    showDeleteDialog.value = false
    bookToDelete.value = null

    // Recargar la lista y estadísticas
    await Promise.all([fetchBooks(), fetchBookStats()])
  } catch (error: any) {
    console.error('Error al eliminar libro:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al eliminar el libro',
      life: 5000,
    })
  } finally {
    deletingBook.value = false
  }
}

const downloadBook = async (book: any) => {
  try {
    await downloadBookAction(book)
    toast.add({
      severity: 'success',
      summary: 'Descarga iniciada',
      detail: `Descargando "${book.title}"`,
      life: 3000,
    })
  } catch (error: any) {
    console.error('Error al descargar libro:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al descargar el libro',
      life: 3000,
    })
  }
}

// Ciclo de vida
onMounted(async () => {
  try {
    await Promise.all([fetchBooks(), fetchBookStats()])
  } catch (error: any) {
    console.error('Error al cargar datos:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar los datos',
      life: 5000,
    })
  }
})
</script>

<style scoped>
:deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

:deep(.p-datatable-tbody > tr:hover) {
  background-color: #f8fafc;
}
</style>
