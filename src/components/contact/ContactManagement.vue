<template>
  <div class="contact-management">
    <!-- Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <Card class="stats-card">
        <template #content>
          <div class="flex items-center gap-4">
            <div class="stats-icon bg-blue-100 text-blue-600">
              <i class="pi pi-envelope text-xl"></i>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">
                {{ statistics?.total || 0 }}
              </p>
              <p class="text-sm text-gray-600">Total Mensajes</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stats-card">
        <template #content>
          <div class="flex items-center gap-4">
            <div class="stats-icon bg-yellow-100 text-yellow-600">
              <i class="pi pi-clock text-xl"></i>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">
                {{ statistics?.pending || 0 }}
              </p>
              <p class="text-sm text-gray-600">Pendientes</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stats-card">
        <template #content>
          <div class="flex items-center gap-4">
            <div class="stats-icon bg-blue-100 text-blue-600">
              <i class="pi pi-sync text-xl"></i>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">
                {{ statistics?.inProgress || 0 }}
              </p>
              <p class="text-sm text-gray-600">En Proceso</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stats-card">
        <template #content>
          <div class="flex items-center gap-4">
            <div class="stats-icon bg-green-100 text-green-600">
              <i class="pi pi-check-circle text-xl"></i>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">
                {{ statistics?.resolvedToday || 0 }}
              </p>
              <p class="text-sm text-gray-600">Resueltos Hoy</p>
            </div>
          </div>
        </template>
      </Card>

      <Card class="stats-card">
        <template #content>
          <div class="flex items-center gap-4">
            <div class="stats-icon bg-purple-100 text-purple-600">
              <i class="pi pi-chart-line text-xl"></i>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">
                {{ statistics ? formatResponseTime(statistics.averageResponseTime) : '--' }}
              </p>
              <p class="text-sm text-gray-600">Tiempo Promedio</p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Filtros y búsqueda -->
    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Búsqueda -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="Buscar por nombre, DNI o asunto..."
                class="w-full"
                @input="onSearch"
              />
            </IconField>
          </div>

          <!-- Filtro por estado -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <Select
              v-model="selectedStatus"
              :options="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Todos los estados"
              class="w-full"
              @change="onFilterChange"
            >
              <template #option="{ option }">
                <div class="flex items-center gap-2">
                  <i :class="getStatusIcon(option.value)" class="text-sm"></i>
                  <span>{{ option.label }}</span>
                </div>
              </template>
            </Select>
          </div>

          <!-- Fecha desde -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
            <DatePicker
              v-model="startDate"
              placeholder="Seleccionar fecha"
              class="w-full"
              dateFormat="dd/mm/yy"
              @date-select="onFilterChange"
            />
          </div>

          <!-- Fecha hasta -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
            <DatePicker
              v-model="endDate"
              placeholder="Seleccionar fecha"
              class="w-full"
              dateFormat="dd/mm/yy"
              @date-select="onFilterChange"
            />
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div class="flex gap-2">
            <Button
              @click="clearFilters"
              label="Limpiar Filtros"
              icon="pi pi-filter-slash"
              outlined
              size="small"
            />
            <Button
              @click="refreshData"
              label="Actualizar"
              icon="pi pi-refresh"
              outlined
              size="small"
              :loading="store.loading"
            />
          </div>
          <p class="text-sm text-gray-600">
            Mostrando {{ store.contacts.length }} de {{ store.total }} mensajes
          </p>
        </div>
      </template>
    </Card>

    <!-- Tabla de mensajes -->
    <Card>
      <template #content>
        <DataTable
          :value="store.contacts"
          :loading="store.loading"
          stripedRows
          responsiveLayout="scroll"
          :paginator="true"
          :rows="store.pageSize"
          :totalRecords="store.total"
          :lazy="true"
          @page="onPageChange"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} mensajes"
          :rowsPerPageOptions="[10, 25, 50]"
          class="contact-table"
        >
          <template #empty>
            <div class="text-center py-8">
              <i class="pi pi-inbox text-4xl text-gray-400 mb-4"></i>
              <p class="text-gray-600">No se encontraron mensajes</p>
            </div>
          </template>

          <!-- Fecha -->
          <Column field="createdAt" header="Fecha" sortable style="min-width: 150px">
            <template #body="{ data }">
              <div>
                <p class="font-medium text-gray-900">{{ formatDate(data.createdAt) }}</p>
                <p class="text-xs text-gray-500">{{ getTimeAgo(data.createdAt) }}</p>
              </div>
            </template>
          </Column>

          <!-- Ciudadano -->
          <Column field="citizenName" header="Ciudadano" sortable style="min-width: 200px">
            <template #body="{ data }">
              <div>
                <p class="font-medium text-gray-900">{{ data.citizenName }}</p>
                <p class="text-sm text-gray-600">{{ data.citizenEmail }}</p>
              </div>
            </template>
          </Column>

          <!-- DNI -->
          <Column field="citizenDni" header="DNI" sortable style="min-width: 120px">
            <template #body="{ data }">
              <span class="font-mono text-sm">{{ data.citizenDni }}</span>
            </template>
          </Column>

          <!-- Asunto -->
          <Column field="subject" header="Asunto" style="min-width: 250px">
            <template #body="{ data }">
              <div class="max-w-xs">
                <p class="font-medium text-gray-900 truncate" :title="data.subject">
                  {{ data.subject }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <i v-if="data.attachmentUrl" class="pi pi-paperclip text-blue-600 text-xs"></i>
                  <span class="text-xs text-gray-500">
                    {{
                      data.message.length > 50
                        ? data.message.substring(0, 50) + '...'
                        : data.message
                    }}
                  </span>
                </div>
              </div>
            </template>
          </Column>

          <!-- Estado -->
          <Column field="status" header="Estado" sortable style="min-width: 120px">
            <template #body="{ data }">
              <Badge
                :value="getStatusLabel(data.status)"
                :severity="getStatusSeverity(data.status)"
                class="status-badge"
              >
                <i :class="getStatusIcon(data.status)" class="mr-1"></i>
                {{ getStatusLabel(data.status) }}
              </Badge>
            </template>
          </Column>

          <!-- Asignado a -->
          <Column field="assignedToName" header="Asignado a" style="min-width: 150px">
            <template #body="{ data }">
              <div v-if="data.assignedToName" class="flex items-center gap-2">
                <div
                  class="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold"
                >
                  {{ getInitials(data.assignedToName) }}
                </div>
                <span class="text-sm text-gray-900">{{ data.assignedToName }}</span>
              </div>
              <span v-else class="text-sm text-gray-500">Sin asignar</span>
            </template>
          </Column>

          <!-- Acciones -->
          <Column header="Acciones" style="min-width: 200px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                  v-if="canViewDetails"
                  @click="viewDetails(data)"
                  icon="pi pi-eye"
                  size="small"
                  outlined
                  v-tooltip.top="'Ver detalles'"
                />
                <Button
                  v-if="canAssign(data.status)"
                  @click="assignContact(data)"
                  icon="pi pi-user-plus"
                  size="small"
                  outlined
                  v-tooltip.top="'Asignar'"
                />
                <Button
                  v-if="canRespond(data.status, data.assignedTo)"
                  @click="respondContact(data)"
                  icon="pi pi-reply"
                  size="small"
                  outlined
                  v-tooltip.top="'Responder'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Modales -->
    <ContactDetailModal
      :visible="detailModalVisible"
      :contact="selectedContact"
      :loading="detailLoading"
      @hide="closeDetailModal"
      @assign="assignContact"
      @respond="respondContact"
    />

    <ContactAssignModal
      :visible="assignModalVisible"
      :contact="selectedContact"
      @hide="closeAssignModal"
      @assigned="onContactAssigned"
    />

    <ContactResponseModal
      :visible="responseModalVisible"
      :contact="selectedContact"
      @hide="closeResponseModal"
      @responded="onContactResponded"
    />

    <!-- Mensajes de error -->
    <Message v-if="store.error" severity="error" class="mt-4">
      {{ store.error }}
    </Message>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Badge from 'primevue/badge'
import Message from 'primevue/message'
import { useContact } from '@/composables/useContact'
import ContactDetailModal from './ContactDetailModal.vue'
import ContactAssignModal from './ContactAssignModal.vue'
import ContactResponseModal from './ContactResponseModal.vue'
import type { Contact, ContactDetail, ContactStatus } from '@/types/contact'

const {
  store,
  canViewAllMessages,
  canViewDetails,
  canAssign,
  canRespond,
  getStatusLabel,
  getStatusSeverity,
  getStatusIcon,
  formatDate,
  getTimeAgo,
  formatResponseTime,
} = useContact()

// Filters
const searchQuery = ref('')
const selectedStatus = ref<ContactStatus | undefined>()
const startDate = ref<Date | undefined>()
const endDate = ref<Date | undefined>()

// Modals
const detailModalVisible = ref(false)
const assignModalVisible = ref(false)
const responseModalVisible = ref(false)
const selectedContact = ref<ContactDetail | null>(null)
const detailLoading = ref(false)

// Statistics
const statistics = computed(() => store.statistics)

// Status options for filter
const statusOptions = [
  { value: undefined, label: 'Todos los estados' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'in_progress', label: 'En Proceso' },
  { value: 'resolved', label: 'Resueltos' },
]

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    store.updateFilters({
      search: searchQuery.value || undefined,
      page: 1,
    })
    store.fetchContacts()
  }, 500)
}

onMounted(() => {
  if (canViewAllMessages.value) {
    loadData()
  }
})

async function loadData() {
  try {
    await Promise.all([store.fetchContacts(), store.fetchStatistics()])
  } catch (error) {
    // Error ya manejado en el store
    console.log('Error loading contact data, using fallback UI')
  }
}

function onSearch() {
  debouncedSearch()
}

function onFilterChange() {
  store.updateFilters({
    status: selectedStatus.value,
    startDate: startDate.value ? formatDateForAPI(startDate.value) : undefined,
    endDate: endDate.value ? formatDateForAPI(endDate.value) : undefined,
    page: 1,
  })
  store.fetchContacts()
}

function onPageChange(event: any) {
  store.updateFilters({
    page: event.page + 1,
    limit: event.rows,
  })
  store.fetchContacts()
}

function clearFilters() {
  searchQuery.value = ''
  selectedStatus.value = undefined
  startDate.value = undefined
  endDate.value = undefined
  store.clearFilters()
  store.fetchContacts()
}

function refreshData() {
  loadData()
}

// Modal actions
async function viewDetails(contact: Contact) {
  detailModalVisible.value = true
  detailLoading.value = true
  selectedContact.value = null

  try {
    await store.fetchContactDetail(contact.id)
    selectedContact.value = store.currentContact
  } catch (error) {
    console.error('Error loading contact detail:', error)
  } finally {
    detailLoading.value = false
  }
}

function assignContact(contact: Contact | ContactDetail) {
  selectedContact.value = contact as ContactDetail
  assignModalVisible.value = true
}

function respondContact(contact: Contact | ContactDetail) {
  selectedContact.value = contact as ContactDetail
  responseModalVisible.value = true
}

function closeDetailModal() {
  detailModalVisible.value = false
  selectedContact.value = null
  store.clearCurrentContact()
}

function closeAssignModal() {
  assignModalVisible.value = false
  selectedContact.value = null
}

function closeResponseModal() {
  responseModalVisible.value = false
  selectedContact.value = null
}

function onContactAssigned(contact: Contact) {
  // Refresh the list and statistics
  loadData()
  closeAssignModal()
}

function onContactResponded(contact: Contact) {
  // Refresh the list and statistics
  loadData()
  closeResponseModal()
}

// Utility functions
function getInitials(name: string): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0]
}
</script>

<style scoped>
@reference {
  @import 'tailwindcss';
}

.contact-management {
  @apply space-y-6;
}

.stats-card {
  @apply hover:shadow-lg transition-shadow;
}

.stats-icon {
  @apply w-12 h-12 rounded-lg flex items-center justify-center;
}

.contact-table :deep(.p-datatable-tbody tr:hover) {
  @apply bg-gray-50;
}

.status-badge {
  @apply px-2 py-1 rounded-full text-xs font-medium;
}

:deep(.p-paginator) {
  @apply border-t border-gray-200 bg-gray-50;
}

:deep(.p-datatable .p-datatable-thead tr th) {
  @apply bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold;
}

:deep(.p-select),
:deep(.p-datepicker) {
  @apply w-full;
}
</style>
