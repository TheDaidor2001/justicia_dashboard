<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNews } from '@/composables/useNews'
import { NewsStatus, getNewsTypeLabel, getNewsStatusLabel } from '@/types/news'
import type { News, NewsApprovalHistory } from '@/types/news'
import { newsService } from '@/services/news.service'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Timeline from 'primevue/timeline'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'
import Divider from 'primevue/divider'
import Toast from 'primevue/toast'
import Image from 'primevue/image'
import Avatar from 'primevue/avatar'
import Chip from 'primevue/chip'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const {
    currentNews,
    loading,
    fetchNewsById,
    canEdit,
    canSubmitToDirector,
    canApproveAsDirector,
    canApproveAsPresident,
    canReject,
    submitToDirector,
    approveAsDirector,
    approveAsPresident,
    rejectNews,
    getNewsStatusBadge,
    getNewsTypeColor,
    formatPublishDate,
    navigateToEdit
} = useNews()

// Estado
const news = ref<News | null>(null)
const approvalHistory = ref<NewsApprovalHistory[]>([])
const processingAction = ref(false)

// Diálogos
const showApproveDialog = ref(false)
const showRejectDialog = ref(false)
const approvalComments = ref('')
const rejectionComments = ref('')

const newsId = computed(() => route.params.id as string)

// Cargar noticia
const loadNews = async () => {
    try {
        const result = await fetchNewsById(newsId.value)
        if (result.success && result.data) {
            news.value = result.data

            // Cargar historial de aprobación
            try {
                const historyResult = await newsService.getApprovalHistory(newsId.value)
                if (historyResult.success && historyResult.data) {
                    approvalHistory.value = historyResult.data
                }
            } catch (error) {
                console.error('Error al cargar historial:', error)
                approvalHistory.value = []
            }
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo cargar la noticia',
                life: 3000
            })
            router.push('/noticias')
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar la noticia',
            life: 3000
        })
        router.push('/noticias')
    }
}

onMounted(() => {
    loadNews()
})

// Métodos de acción
const handleEdit = () => {
    if (news.value) {
        navigateToEdit(news.value.id)
    }
}

const handleSubmitToDirector = async () => {
    if (!confirm('¿Estás seguro de enviar esta noticia para revisión?')) return

    processingAction.value = true
    try {
        const result = await submitToDirector(newsId.value)
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Noticia enviada al director',
                life: 3000
            })
            await loadNews()
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message,
                life: 3000
            })
        }
    } finally {
        processingAction.value = false
    }
}

const confirmApprove = async () => {
    processingAction.value = true
    try {
        let result

        if (news.value?.status === NewsStatus.PENDING_DIRECTOR) {
            result = await approveAsDirector(newsId.value, {
                comments: approvalComments.value
            })
        } else if (news.value?.status === NewsStatus.PENDING_PRESIDENT) {
            result = await approveAsPresident(newsId.value, {
                comments: approvalComments.value
            })
        }

        if (result?.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Noticia aprobada correctamente',
                life: 3000
            })
            showApproveDialog.value = false
            approvalComments.value = ''
            await loadNews()
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result?.message || 'Error al aprobar',
                life: 3000
            })
        }
    } finally {
        processingAction.value = false
    }
}

const confirmReject = async () => {
    if (!rejectionComments.value.trim()) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Debes proporcionar un motivo de rechazo',
            life: 3000
        })
        return
    }

    processingAction.value = true
    try {
        const result = await rejectNews(newsId.value, {
            comments: rejectionComments.value
        })

        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Noticia rechazada',
                life: 3000
            })
            showRejectDialog.value = false
            rejectionComments.value = ''
            await loadNews()
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message,
                life: 3000
            })
        }
    } finally {
        processingAction.value = false
    }
}

// Formatear contenido HTML
const formatContent = (content: string) => {
    // El contenido viene del editor Quill, ya está en HTML
    return content
}

// Obtener icono para historial
const getHistoryIcon = (action: string) => {
    const icons: Record<string, string> = {
        submit: 'pi-send',
        approve_director: 'pi-check-circle',
        approve_president: 'pi-verified',
        reject: 'pi-times-circle'
    }
    return icons[action] || 'pi-circle'
}

// Obtener color para historial
const getHistoryColor = (action: string) => {
    const colors: Record<string, string> = {
        submit: '#3B82F6',
        approve_director: '#10B981',
        approve_president: '#8B5CF6',
        reject: '#EF4444'
    }
    return colors[action] || '#6B7280'
}

// Obtener etiqueta de acción
const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
        submit: 'Enviado para revisión',
        approve_director: 'Aprobado por Director',
        approve_president: 'Aprobado por Presidente',
        reject: 'Rechazado'
    }
    return labels[action] || action
}

// Formatear fecha
const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}
</script>

<template>
    <div class="p-6 max-w-6xl mx-auto">
        <Toast />

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center items-center h-64">
            <ProgressSpinner />
        </div>

        <!-- Contenido -->
        <div v-else-if="news">
            <!-- Header -->
            <div class="mb-6">
                <div class="flex items-center gap-2 text-gray-600 mb-4">
                    <i class="pi pi-arrow-left cursor-pointer" @click="router.push('/noticias')"></i>
                    <span>Volver a noticias</span>
                </div>

                <!-- Título y acciones -->
                <div class="flex justify-between items-start gap-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <Tag :value="getNewsTypeLabel(news.type)" :severity="getNewsTypeColor(news.type) as any"
                                rounded />
                            <Tag :value="getNewsStatusLabel(news.status)"
                                :severity="getNewsStatusBadge(news.status).severity as any"
                                :icon="'pi ' + getNewsStatusBadge(news.status).icon" />
                        </div>

                        <h1 class="text-3xl font-bold text-gray-900 mb-2">
                            {{ news.title }}
                        </h1>

                        <p v-if="news.subtitle" class="text-xl text-gray-600 mb-4">
                            {{ news.subtitle }}
                        </p>

                        <div class="flex items-center gap-4 text-sm text-gray-500">
                            <div class="flex items-center gap-2">
                                <Avatar :label="news.creator?.fullName?.charAt(0)" shape="circle" size="small"
                                    class="bg-gray-200" />
                                <span>{{ news.creator?.fullName || 'Autor desconocido' }}</span>
                            </div>
                            <span>•</span>
                            <span>{{ formatDate(news.createdAt) }}</span>
                            <span v-if="news.publishedAt">•</span>
                            <span v-if="news.publishedAt" class="text-green-600">
                                <i class="pi pi-globe mr-1"></i>
                                Publicado: {{ formatPublishDate(news.publishedAt) }}
                            </span>
                            <span>•</span>
                            <span>
                                <i class="pi pi-eye mr-1"></i>
                                {{ news.viewCount }} vistas
                            </span>
                        </div>
                    </div>

                    <!-- Acciones -->
                    <div class="flex flex-col gap-2">
                        <Button v-if="canEdit(news)" label="Editar" icon="pi pi-pencil" severity="secondary"
                            @click="handleEdit" />

                        <Button v-if="canSubmitToDirector(news)" label="Enviar para Revisión" icon="pi pi-send"
                            @click="handleSubmitToDirector" :loading="processingAction" />

                        <Button v-if="canApproveAsDirector(news) || canApproveAsPresident(news)" label="Aprobar"
                            icon="pi pi-check" severity="success" @click="showApproveDialog = true" />

                        <Button v-if="canReject(news)" label="Rechazar" icon="pi pi-times" severity="danger"
                            @click="showRejectDialog = true" />
                    </div>
                </div>
            </div>

            <!-- Contenido principal -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Columna principal -->
                <div class="lg:col-span-2">
                    <!-- Imagen destacada -->
                    <div v-if="news.imageUrl" class="mb-6">
                        <Image :src="news.imageUrl" :alt="news.title" class="w-full rounded-lg shadow-lg" preview />
                    </div>

                    <!-- Contenido -->
                    <Card class="mb-6">
                        <template #content>
                            <div class="prose prose-lg max-w-none" v-html="formatContent(news.content)"></div>
                        </template>
                    </Card>

                    <!-- Motivo de rechazo si existe -->
                    <Message v-if="news.status === NewsStatus.REJECTED && news.rejectionReason" severity="error"
                        :closable="false" class="mb-6">
                        <div>
                            <strong>Motivo del rechazo:</strong>
                            <p class="mt-2">{{ news.rejectionReason }}</p>
                        </div>
                    </Message>
                </div>

                <!-- Columna lateral -->
                <div class="space-y-6">
                    <!-- Información -->
                    <Card>
                        <template #title>
                            <div class="flex items-center gap-2">
                                <i class="pi pi-info-circle text-xl"></i>
                                <span>Información</span>
                            </div>
                        </template>
                        <template #content>
                            <div class="space-y-3">
                                <div>
                                    <label class="text-sm text-gray-600">Departamento</label>
                                    <p class="font-medium">{{ news.department?.name || 'N/A' }}</p>
                                </div>

                                <div>
                                    <label class="text-sm text-gray-600">Estado actual</label>
                                    <div class="mt-1">
                                        <Tag :value="getNewsStatusLabel(news.status)"
                                            :severity="getNewsStatusBadge(news.status).severity as any"
                                            :icon="'pi ' + getNewsStatusBadge(news.status).icon" class="text-sm" />
                                    </div>
                                </div>

                                <div v-if="news.publishedAt">
                                    <label class="text-sm text-gray-600">URL pública</label>
                                    <p class="font-mono text-xs text-blue-600 break-all">
                                        /noticias/{{ news.slug }}
                                    </p>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <!-- Historial de aprobación -->
                    <Card>
                        <template #title>
                            <div class="flex items-center gap-2">
                                <i class="pi pi-history text-xl"></i>
                                <span>Historial</span>
                            </div>
                        </template>
                        <template #content>
                            <Timeline v-if="approvalHistory.length > 0" :value="approvalHistory"
                                class="customized-timeline">
                                <template #marker="slotProps">
                                    <span
                                        class="flex w-8 h-8 items-center justify-center text-white rounded-full z-10 shadow-sm"
                                        :style="{ backgroundColor: getHistoryColor(slotProps.item.action) }">
                                        <i :class="`pi ${getHistoryIcon(slotProps.item.action)} text-sm`"></i>
                                    </span>
                                </template>

                                <template #content="slotProps">
                                    <div class="pb-4">
                                        <p class="font-semibold text-sm">
                                            {{ getActionLabel(slotProps.item.action) }}
                                        </p>
                                        <p class="text-xs text-gray-600 mt-1">
                                            Por {{ slotProps.item.user.fullName }}
                                        </p>
                                        <p class="text-xs text-gray-500">
                                            {{ formatDate(slotProps.item.createdAt) }}
                                        </p>
                                        <p v-if="slotProps.item.comments" class="text-sm text-gray-700 mt-2 italic">
                                            "{{ slotProps.item.comments }}"
                                        </p>
                                    </div>
                                </template>
                            </Timeline>

                            <div v-else class="text-center py-4 text-gray-500">
                                <i class="pi pi-history text-2xl mb-2"></i>
                                <p class="text-sm">Sin historial</p>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>
        </div>

        <!-- Diálogo de Aprobación -->
        <Dialog v-model:visible="showApproveDialog" modal header="Aprobar Noticia" :style="{ width: '450px' }">
            <div class="mb-4">
                <label class="block mb-2">Comentarios (opcional):</label>
                <Textarea v-model="approvalComments" rows="4" class="w-full"
                    placeholder="Añade comentarios sobre la aprobación..." />
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" @click="showApproveDialog = false"
                    :disabled="processingAction" />
                <Button label="Aprobar" icon="pi pi-check" @click="confirmApprove" :loading="processingAction" />
            </template>
        </Dialog>

        <!-- Diálogo de Rechazo -->
        <Dialog v-model:visible="showRejectDialog" modal header="Rechazar Noticia" :style="{ width: '450px' }">
            <div class="mb-4">
                <label class="block mb-2">
                    Motivo del rechazo <span class="text-red-500">*</span>:
                </label>
                <Textarea v-model="rejectionComments" rows="4" class="w-full"
                    placeholder="Explica el motivo del rechazo..."
                    :class="{ 'p-invalid': !rejectionComments.trim() }" />
                <small class="text-red-500" v-if="!rejectionComments.trim()">
                    El motivo es obligatorio
                </small>
            </div>

            <template #footer>
                <Button label="Cancelar" severity="secondary" @click="showRejectDialog = false"
                    :disabled="processingAction" />
                <Button label="Rechazar" icon="pi pi-times" severity="danger" @click="confirmReject"
                    :loading="processingAction" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
/* Estilos para el contenido rico */
:deep(.prose) {
    color: #374151;
    max-width: none;

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        color: #111827;
        margin-top: 1.5em;
        margin-bottom: 0.5em;
    }

    p {
        margin-bottom: 1em;
        line-height: 1.7;
    }

    ul,
    ol {
        margin: 1em 0;
        padding-left: 2em;
    }

    a {
        color: #3b82f6;
        text-decoration: underline;
    }

    img {
        max-width: 100%;
        height: auto;
        margin: 1em 0;
    }

    blockquote {
        border-left: 4px solid #e5e7eb;
        padding-left: 1em;
        margin: 1em 0;
        color: #6b7280;
    }
}

/* Timeline personalizado */
:deep(.customized-timeline) {
    .p-timeline-event-content {
        background-color: transparent;
    }

    .p-timeline-event-opposite {
        display: none;
    }

    .p-timeline-event-separator {
        flex: 0;
    }
}
</style>