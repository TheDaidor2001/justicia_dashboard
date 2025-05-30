<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useExpedientes } from '@/composables/useExpedientes'
import { useAuth } from '@/composables/useAuth'
import { ExpedienteStatus } from '@/types/expediente'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import Toolbar from 'primevue/toolbar'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

const router = useRouter()
const { canCreateExpedientes } = useAuth()
const {
    expedientes,
    loading,
    pagination,
    filters,
    setStatusFilter,
    setSearchFilter,
    setPage,
    refreshExpedientes,
    canEdit,
    canSubmit,
    canApprove,
    canReject,
    getStatusBadge,
    getCurrentLevelText
} = useExpedientes()

// Estado local
const searchTerm = ref('')
const selectedStatus = ref<ExpedienteStatus | null>(null)

// Opciones de filtros
const statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Borrador', value: ExpedienteStatus.DRAFT },
    { label: 'Pendiente', value: ExpedienteStatus.PENDING_APPROVAL },
    { label: 'Aprobado', value: ExpedienteStatus.APPROVED },
    { label: 'Rechazado', value: ExpedienteStatus.REJECTED }
]

// Métodos
const onSearch = () => {
    setSearchFilter(searchTerm.value)
}

const onStatusChange = () => {
    setStatusFilter(selectedStatus.value || undefined)
}

const viewExpediente = (expediente: any) => {
    router.push(`/expedientes/${expediente.id}`)
}

const editExpediente = (expediente: any) => {
    router.push(`/expedientes/${expediente.id}/editar`)
}

const createNewExpediente = () => {
    router.push('/expedientes/nuevo')
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
</script>

<template>
    <div class="p-6">
        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900">Gestión de Expedientes</h1>
            <p class="text-gray-600 mt-2">Administra y supervisa todos los expedientes judiciales</p>
        </div>

        <!-- Toolbar con filtros -->
        <Card class="mb-6">
            <template #content>
                <Toolbar class="border-0 p-0">
                    <template #start>
                        <div class="flex gap-4 items-center">
                            <!-- Búsqueda -->
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText v-model="searchTerm" placeholder="Buscar por número o título..." class="w-80"
                                    @keyup.enter="onSearch" />
                            </IconField>

                            <!-- Filtro por estado -->
                            <Dropdown v-model="selectedStatus" :options="statusOptions" optionLabel="label"
                                optionValue="value" placeholder="Filtrar por estado" class="w-48"
                                @change="onStatusChange" />

                            <!-- Botón buscar -->
                            <Button label="Buscar" icon="pi pi-search" @click="onSearch" severity="secondary" />
                        </div>
                    </template>

                    <template #end>
                        <div class="flex gap-2">
                            <!-- Botón refrescar -->
                            <Button icon="pi pi-refresh" severity="secondary" text rounded @click="refreshExpedientes"
                                v-tooltip.top="'Actualizar lista'" />

                            <!-- Botón crear nuevo -->
                            <Button v-if="canCreateExpedientes" label="Nuevo Expediente" icon="pi pi-plus"
                                @click="createNewExpediente" />
                        </div>
                    </template>
                </Toolbar>
            </template>
        </Card>

        <!-- Tabla de expedientes -->
        <Card>
            <template #content>
                <DataTable :value="expedientes" :loading="loading" :paginator="true" :rows="pagination.limit"
                    :totalRecords="pagination.total" :lazy="true" @page="setPage($event.page + 1)" stripedRows
                    showGridlines responsiveLayout="scroll" class="p-datatable-sm">
                    <!-- Columna Número de Caso -->
                    <Column field="caseNumber" header="Nº Caso" :sortable="true" style="width: 10%">
                        <template #body="{ data }">
                            <span class="font-mono font-semibold">{{ data.caseNumber }}</span>
                        </template>
                    </Column>

                    <!-- Columna Título -->
                    <Column field="title" header="Título" :sortable="true" style="width: 30%">
                        <template #body="{ data }">
                            <div>
                                <p class="font-semibold">{{ data.title }}</p>
                                <p class="text-sm text-gray-500" v-if="data.description">
                                    {{ data.description.substring(0, 60) }}{{ data.description.length > 60 ? '...' : ''
                                    }}
                                </p>
                            </div>
                        </template>
                    </Column>

                    <!-- Columna Estado -->
                    <Column field="status" header="Estado" :sortable="true" style="width: 15%">
                        <template #body="{ data }">
                            <Tag :value="getStatusBadge(data.status).label"
                                :severity="getStatusBadge(data.status).severity"
                                :icon="getStatusBadge(data.status).icon" />
                        </template>
                    </Column>

                    <!-- Columna Nivel Actual -->
                    <Column field="currentLevel" header="Nivel Actual" style="width: 15%">
                        <template #body="{ data }">
                            <span v-if="data.status === ExpedienteStatus.PENDING_APPROVAL">
                                {{ getCurrentLevelText(data.currentLevel) }}
                            </span>
                            <span v-else class="text-gray-400">-</span>
                        </template>
                    </Column>

                    <!-- Columna Creado Por -->
                    <Column field="creator.fullName" header="Creado Por" style="width: 15%">
                        <template #body="{ data }">
                            <div v-if="data.creator">
                                <p class="font-medium">{{ data.creator.fullName }}</p>
                                <p class="text-xs text-gray-500">{{ data.department?.name }}</p>
                            </div>
                        </template>
                    </Column>

                    <!-- Columna Fecha -->
                    <Column field="createdAt" header="Fecha Creación" :sortable="true" style="width: 10%">
                        <template #body="{ data }">
                            <span class="text-sm">{{ formatDate(data.createdAt) }}</span>
                        </template>
                    </Column>

                    <!-- Columna Acciones -->
                    <Column header="Acciones" style="width: 5%" :exportable="false">
                        <template #body="{ data }">
                            <div class="flex gap-2 justify-end">
                                <!-- Ver -->
                                <Button icon="pi pi-eye" severity="info" text rounded v-tooltip.top="'Ver detalles'"
                                    @click="viewExpediente(data)" />

                                <!-- Editar -->
                                <Button v-if="canEdit(data)" icon="pi pi-pencil" severity="warning" text rounded
                                    v-tooltip.top="'Editar'" @click="editExpediente(data)" />

                                <!-- Aprobar/Rechazar -->
                                <Button v-if="canApprove(data)" icon="pi pi-check-circle" severity="success" text
                                    rounded v-tooltip.top="'Gestionar aprobación'" @click="viewExpediente(data)" />
                            </div>
                        </template>
                    </Column>

                    <!-- Template vacío -->
                    <template #empty>
                        <div class="text-center py-8">
                            <i class="pi pi-inbox text-4xl text-gray-400 mb-4"></i>
                            <p class="text-gray-500">No se encontraron expedientes</p>
                        </div>
                    </template>

                    <!-- Template de carga -->
                    <template #loading>
                        <div class="text-center py-8">
                            <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
                            <p class="text-gray-500 mt-2">Cargando expedientes...</p>
                        </div>
                    </template>
                </DataTable>
            </template>
        </Card>
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

    .p-datatable-tbody>tr:hover {
        background-color: #f8f9fa;
    }
}
</style>