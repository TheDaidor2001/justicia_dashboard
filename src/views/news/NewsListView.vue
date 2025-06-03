<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNews } from '@/composables/useNews'
import { NewsType, NewsStatus, getNewsTypeLabel, getNewsStatusLabel } from '@/types/news'
import type { News } from '@/types/news'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import Toolbar from 'primevue/toolbar'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'

const toast = useToast()
const confirm = useConfirm()

const {
    newsList,
    loading,
    pagination,
    canCreateNews,
    canSubmitFromCourt,
    canEdit,
    canDelete,
    needsMyAction,
    getNewsStatusBadge,
    getNewsTypeColor,
    setTypeFilter,
    setStatusFilter,
    setSearchFilter,
    navigateToCreate,
    navigateToEdit,
    navigateToDetail,
    navigateToCourtSubmission,
    deleteNews,
    refreshNews,
    fetchStatistics
} = useNews()

// Estado local
const searchTerm = ref('')
const selectedType = ref<NewsType | null>(null)
const selectedStatus = ref<NewsStatus | null>(null)

// Opciones de filtros
const typeOptions = [
    { label: 'Todos', value: null },
    { label: 'Noticia', value: NewsType.NOTICIA },
    { label: 'Aviso', value: NewsType.AVISO },
    { label: 'Comunicado', value: NewsType.COMUNICADO }
]

const statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Borrador', value: NewsStatus.DRAFT },
    { label: 'Pendiente Director', value: NewsStatus.PENDING_DIRECTOR },
    { label: 'Pendiente Presidente', value: NewsStatus.PENDING_PRESIDENT },
    { label: 'Publicado', value: NewsStatus.PUBLISHED },
    { label: 'Rechazado', value: NewsStatus.REJECTED }
]

// Cargar estadísticas al montar
onMounted(() => {
    fetchStatistics()
})

// Métodos
const onSearch = () => {
    setSearchFilter(searchTerm.value)
}

const onTypeChange = () => {
    setTypeFilter(selectedType.value || undefined)
}

const onStatusChange = () => {
    setStatusFilter(selectedStatus.value || undefined)
}

const viewNews = (news: News) => {
    navigateToDetail(news.id)
}

const editNews = (news: News) => {
    navigateToEdit(news.id)
}

const confirmDelete = (news: News) => {
    confirm.require({
        message: `¿Estás seguro de eliminar la noticia "${news.title}"?`,
        header: 'Confirmar eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Eliminar',
        rejectLabel: 'Cancelar',
        accept: async () => {
            const result = await deleteNews(news.id)
            if (result.success) {
                toast.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Noticia eliminada correctamente',
                    life: 3000
                })
                refreshNews()
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: result.message,
                    life: 3000
                })
            }
        }
    })
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

// Obtener imagen o placeholder
const getNewsImage = (news: News) => {
    if (news.imageUrl) return news.imageUrl

    // Placeholder según tipo
    const placeholders = {
        noticia: '/images/news-placeholder.jpg',
        aviso: '/images/notice-placeholder.jpg',
        comunicado: '/images/announcement-placeholder.jpg'
    }

    return placeholders[news.type] || '/images/default-placeholder.jpg'
}
</script>

<template>
    <div class="p-6">
        <Toast />
        <ConfirmDialog />

        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900">Gestión de Noticias</h1>
            <p class="text-gray-600 mt-2">
                Administra las publicaciones, avisos y comunicados del sistema judicial
            </p>
        </div>

        <!-- Toolbar con filtros -->
        <Card class="mb-6">
            <template #content>
                <Toolbar class="border-0 p-0">
                    <template #start>
                        <div class="flex gap-4 items-center flex-wrap">
                            <!-- Búsqueda -->
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText v-model="searchTerm" placeholder="Buscar por título..." class="w-80"
                                    @keyup.enter="onSearch" />
                            </IconField>

                            <!-- Filtro por tipo -->
                            <Select v-model="selectedType" :options="typeOptions" optionLabel="label"
                                optionValue="value" placeholder="Tipo" class="w-40" @change="onTypeChange" />

                            <!-- Filtro por estado -->
                            <Select v-model="selectedStatus" :options="statusOptions" optionLabel="label"
                                optionValue="value" placeholder="Estado" class="w-48" @change="onStatusChange" />

                            <!-- Botón buscar -->
                            <Button label="Buscar" icon="pi pi-search" @click="onSearch" severity="secondary" />
                        </div>
                    </template>

                    <template #end>
                        <div class="flex gap-2">
                            <!-- Botón refrescar -->
                            <Button icon="pi pi-refresh" severity="secondary" text rounded @click="refreshNews"
                                v-tooltip.top="'Actualizar lista'" />

                            <!-- Botón envío desde juzgado -->
                            <Button v-if="canSubmitFromCourt" label="Enviar desde Juzgado" icon="pi pi-building"
                                severity="info" @click="navigateToCourtSubmission" />

                            <!-- Botón crear nueva -->
                            <Button v-if="canCreateNews" label="Nueva Noticia" icon="pi pi-plus"
                                @click="navigateToCreate" />
                        </div>
                    </template>
                </Toolbar>
            </template>
        </Card>

        <!-- Tabla de noticias -->
        <Card>
            <template #content>
                <DataTable :value="newsList" :loading="loading" :paginator="true" :rows="10"
                    :totalRecords="pagination.total" stripedRows showGridlines responsiveLayout="scroll"
                    class="p-datatable-sm">
                    <!-- Columna Imagen -->
                    <Column header="Imagen" style="width: 8%">
                        <template #body="{ data }">
                            <div class="w-16 h-16 rounded overflow-hidden bg-gray-100">
                                <img :src="getNewsImage(data)" :alt="data.title" class="w-full h-full object-cover"
                                    @error="(e: any) => e.target.src = '/images/default-placeholder.jpg'" />
                            </div>
                        </template>
                    </Column>

                    <!-- Columna Título -->
                    <Column field="title" header="Título" :sortable="true" style="width: 30%">
                        <template #body="{ data }">
                            <div>
                                <p class="font-semibold">{{ data.title }}</p>
                                <p class="text-sm text-gray-500" v-if="data.subtitle">
                                    {{ data.subtitle }}
                                </p>
                            </div>
                        </template>
                    </Column>

                    <!-- Columna Tipo -->
                    <Column field="type" header="Tipo" :sortable="true" style="width: 10%">
                        <template #body="{ data }">
                            <Tag :value="getNewsTypeLabel(data.type)" :severity="getNewsTypeColor(data.type) as any"
                                rounded />
                        </template>
                    </Column>

                    <!-- Columna Estado -->
                    <Column field="status" header="Estado" :sortable="true" style="width: 15%">
                        <template #body="{ data }">
                            <div class="flex items-center gap-2">
                                <Tag :value="getNewsStatusLabel(data.status)"
                                    :severity="getNewsStatusBadge(data.status).severity as any"
                                    :icon="'pi ' + getNewsStatusBadge(data.status).icon" />
                                <i v-if="needsMyAction(data)" class="pi pi-exclamation-circle text-orange-500"
                                    v-tooltip.top="'Requiere tu acción'"></i>
                            </div>
                        </template>
                    </Column>

                    <!-- Columna Creador -->
                    <Column field="creator.fullName" header="Creado por" style="width: 15%">
                        <template #body="{ data }">
                            <div v-if="data.creator">
                                <p class="font-medium text-sm">{{ data.creator.fullName }}</p>
                                <p class="text-xs text-gray-500">{{ data.department?.name }}</p>
                            </div>
                            <span v-else class="text-gray-400">-</span>
                        </template>
                    </Column>

                    <!-- Columna Fecha -->
                    <Column field="createdAt" header="Fecha" :sortable="true" style="width: 12%">
                        <template #body="{ data }">
                            <div class="text-sm">
                                <p>{{ formatDate(data.createdAt) }}</p>
                                <p v-if="data.publishedAt" class="text-xs text-green-600">
                                    <i class="pi pi-globe mr-1"></i>
                                    Publicado: {{ formatDate(data.publishedAt) }}
                                </p>
                            </div>
                        </template>
                    </Column>

                    <!-- Columna Vistas -->
                    <Column field="viewCount" header="Vistas" :sortable="true" style="width: 8%">
                        <template #body="{ data }">
                            <div class="text-center">
                                <span class="font-semibold">{{ data.viewCount }}</span>
                            </div>
                        </template>
                    </Column>

                    <!-- Columna Acciones -->
                    <Column header="Acciones" style="width: 12%" :exportable="false">
                        <template #body="{ data }">
                            <div class="flex gap-2 justify-end">
                                <!-- Ver -->
                                <Button icon="pi pi-eye" severity="info" text rounded v-tooltip.top="'Ver detalles'"
                                    @click="viewNews(data)" size="small" />

                                <!-- Editar -->
                                <Button v-if="canEdit(data)" icon="pi pi-pencil" severity="warning" text rounded
                                    v-tooltip.top="'Editar'" @click="editNews(data)" size="small" />

                                <!-- Eliminar -->
                                <Button v-if="canDelete(data)" icon="pi pi-trash" severity="danger" text rounded
                                    v-tooltip.top="'Eliminar'" @click="confirmDelete(data)" size="small" />

                                <!-- Acción requerida -->
                                <Button v-if="needsMyAction(data)" icon="pi pi-check-circle" severity="success" text
                                    rounded v-tooltip.top="'Acción requerida'" @click="viewNews(data)" size="small" />
                            </div>
                        </template>
                    </Column>

                    <!-- Template vacío -->
                    <template #empty>
                        <div class="text-center py-8">
                            <i class="pi pi-inbox text-4xl text-gray-400 mb-4"></i>
                            <p class="text-gray-500 mb-2">No se encontraron noticias</p>
                            <Button v-if="canCreateNews" label="Crear Primera Noticia" icon="pi pi-plus"
                                @click="navigateToCreate" severity="secondary" />
                        </div>
                    </template>

                    <!-- Template de carga -->
                    <template #loading>
                        <div class="text-center py-8">
                            <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
                            <p class="text-gray-500 mt-2">Cargando noticias...</p>
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