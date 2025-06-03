// src/composables/useNews.ts

import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNewsStore } from '@/stores/news'
import { useAuth } from '@/composables/useAuth'
import type { News, NewsType, NewsStatus, NewsFilters } from '@/types/news'
import { getNewsStatusBadge, getNewsTypeLabel, getNewsTypeColor } from '@/types/news'

export const useNews = () => {
    const newsStore = useNewsStore()
    const { user, userRole, isJuez, isPresidenteAudiencia, isAdmin } = useAuth()

    // Roles adicionales para noticias
    const isDirectorPrensa = computed(() => userRole.value === 'director_prensa')
    const isTecnicoPrensa = computed(() => userRole.value === 'tecnico_prensa')
    const isPresidenteCspj = computed(() => userRole.value === 'presidente_cspj')
    const router = useRouter()

    // Cargar noticias al montar (solo para usuarios autenticados)
    onMounted(() => {
        if (user.value) {
            newsStore.fetchNews()
        }
    })

    // ===== PERMISOS =====

    // Verificar si puede crear noticias
    const canCreateNews = computed(() => {
        if (!user.value) return false

        const allowedRoles = ['director_prensa', 'tecnico_prensa', 'admin']
        return allowedRoles.includes(userRole.value || '')
    })

    // Verificar si puede enviar avisos/comunicados desde juzgados
    const canSubmitFromCourt = computed(() => {
        if (!user.value) return false

        const allowedRoles = ['juez', 'presidente_audiencia', 'admin']
        return allowedRoles.includes(userRole.value || '')
    })

    // Verificar si puede editar una noticia
    const canEdit = (news: News) => {
        if (!user.value) return false

        // Solo el creador o admin pueden editar
        const isCreator = news.createdBy === user.value.id
        const isAdminUser = userRole.value === 'admin'

        // Y solo si está en borrador o rechazada
        const isEditableStatus = news.status === 'draft' || news.status === 'rejected'

        return (isCreator || isAdminUser) && isEditableStatus
    }

    // Verificar si puede eliminar una noticia
    const canDelete = (news: News) => {
        if (!user.value) return false

        // Solo se pueden eliminar noticias en borrador
        if (news.status !== 'draft') return false

        // Solo el creador o admin
        return news.createdBy === user.value.id || userRole.value === 'admin'
    }

    // Verificar si puede enviar al director
    const canSubmitToDirector = (news: News) => {
        if (!user.value) return false

        // Solo el creador puede enviar
        if (news.createdBy !== user.value.id) return false

        // Solo si está en borrador o rechazada
        return news.status === 'draft' || news.status === 'rejected'
    }

    // Verificar si puede aprobar como director
    const canApproveAsDirector = (news: News) => {
        if (!user.value) return false

        // Solo director de prensa o admin
        if (userRole.value !== 'director_prensa' && userRole.value !== 'admin') return false

        // Solo si está pendiente del director
        return news.status === 'pending_director'
    }

    // Verificar si puede aprobar como presidente
    const canApproveAsPresident = (news: News) => {
        if (!user.value) return false

        // Solo presidente CSPJ o admin
        if (userRole.value !== 'presidente_cspj' && userRole.value !== 'admin') return false

        // Solo si está pendiente del presidente y es tipo noticia
        return news.status === 'pending_president' && news.type === 'noticia'
    }

    // Verificar si puede rechazar
    const canReject = (news: News) => {
        // Mismas reglas que aprobar según el nivel
        return canApproveAsDirector(news) || canApproveAsPresident(news)
    }

    // ===== FILTROS Y BÚSQUEDA =====

    const setTypeFilter = (type: NewsType | undefined) => {
        newsStore.setFilters({ type, page: 1 })
        newsStore.fetchNews()
    }

    const setStatusFilter = (status: NewsStatus | undefined) => {
        newsStore.setFilters({ status, page: 1 })
        newsStore.fetchNews()
    }

    const setSearchFilter = (search: string) => {
        newsStore.setFilters({ search, page: 1 })
        newsStore.fetchNews()
    }

    const setPage = (page: number) => {
        newsStore.setFilters({ page })
        newsStore.fetchNews()
    }

    const refreshNews = () => {
        newsStore.fetchNews()
    }

    // ===== NAVEGACIÓN =====

    const navigateToCreate = () => {
        router.push('/noticias/nueva')
    }

    const navigateToEdit = (id: string) => {
        router.push(`/noticias/${id}/editar`)
    }

    const navigateToDetail = (id: string) => {
        router.push(`/noticias/${id}`)
    }

    const navigateToCourtSubmission = () => {
        router.push('/noticias/enviar-juzgado')
    }

    // ===== HELPERS =====

    // Obtener etiqueta de acción según estado y rol
    const getActionLabel = (news: News): string | null => {
        if (canSubmitToDirector(news)) return 'Enviar para revisión'
        if (canApproveAsDirector(news)) return 'Aprobar y publicar'
        if (canApproveAsPresident(news)) return 'Aprobar publicación'
        if (canReject(news)) return 'Rechazar'
        return null
    }

    // Verificar si necesita acción del usuario actual
    const needsMyAction = (news: News): boolean => {
        return canApproveAsDirector(news) || canApproveAsPresident(news)
    }

    // Formatear fecha de publicación
    const formatPublishDate = (date: string | undefined): string => {
        if (!date) return 'No publicado'

        return new Date(date).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // ===== ESTADÍSTICAS =====

    const newsStats = computed(() => {
        const stats = newsStore.statistics
        if (!stats) return null

        return {
            total: stats.total,
            porTipo: [
                { tipo: 'Noticias', cantidad: stats.byType.noticia, color: 'blue' },
                { tipo: 'Avisos', cantidad: stats.byType.aviso, color: 'orange' },
                { tipo: 'Comunicados', cantidad: stats.byType.comunicado, color: 'purple' }
            ],
            porEstado: [
                { estado: 'Borrador', cantidad: stats.byStatus.draft, color: 'gray' },
                { estado: 'En Revisión', cantidad: stats.byStatus.pending_director + stats.byStatus.pending_president, color: 'yellow' },
                { estado: 'Publicados', cantidad: stats.byStatus.published, color: 'green' },
                { estado: 'Rechazados', cantidad: stats.byStatus.rejected, color: 'red' }
            ],
            publicadasMes: stats.publishedThisMonth,
            vistasMes: stats.viewsThisMonth
        }
    })

    return {
        // Estado del store
        newsList: computed(() => newsStore.newsList),
        currentNews: computed(() => newsStore.currentNews),
        loading: computed(() => newsStore.loading),
        error: computed(() => newsStore.error),
        pagination: computed(() => newsStore.pagination),

        // Estadísticas
        newsStats,

        // Permisos
        canCreateNews,
        canSubmitFromCourt,
        canEdit,
        canDelete,
        canSubmitToDirector,
        canApproveAsDirector,
        canApproveAsPresident,
        canReject,

        // Helpers
        getNewsStatusBadge,
        getNewsTypeLabel,
        getNewsTypeColor,
        getActionLabel,
        needsMyAction,
        formatPublishDate,

        // Filtros
        setTypeFilter,
        setStatusFilter,
        setSearchFilter,
        setPage,
        refreshNews,

        // Navegación
        navigateToCreate,
        navigateToEdit,
        navigateToDetail,
        navigateToCourtSubmission,

        // Acciones del store
        createNews: newsStore.createNews,
        updateNews: newsStore.updateNews,
        deleteNews: newsStore.deleteNews,
        submitToDirector: newsStore.submitToDirector,
        approveAsDirector: newsStore.approveAsDirector,
        approveAsPresident: newsStore.approveAsPresident,
        rejectNews: newsStore.rejectNews,
        submitFromCourt: newsStore.submitFromCourt,
        fetchNewsById: newsStore.fetchNewsById,
        fetchStatistics: newsStore.fetchStatistics,

        // Acciones públicas
        fetchPublicNews: newsStore.fetchPublicNews,
        fetchPublicNewsBySlug: newsStore.fetchPublicNewsBySlug,
        publicNewsList: computed(() => newsStore.publicNewsList)
    }
}