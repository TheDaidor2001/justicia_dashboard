// src/composables/useNews.ts

import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNewsStore } from '@/stores/news'
import { useAuth } from '@/composables/useAuth'
import type { News, NewsFilters } from '@/types/news'
import {
  NewsType,
  NewsStatus,
  getNewsStatusBadge,
  getNewsTypeLabel,
  getNewsTypeColor,
} from '@/types/news'

export const useNews = () => {
  const newsStore = useNewsStore()
  const { user, userRole, isJuez, isPresidenteAudiencia, isAdmin } = useAuth()

  // Roles adicionales para noticias
  const isDirectorPrensa = computed(() => userRole.value === 'director_prensa')
  const isTecnicoPrensa = computed(() => userRole.value === 'tecnico_prensa')
  const isPresidenteCspj = computed(() => userRole.value === 'presidente_cspj')
  const router = useRouter()

  // Debounce timer
  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

  // Flag para evitar cargas múltiples
  const hasInitiallyLoaded = ref(false)

  // Protección contra loops de peticiones
  let lastRefreshTime = 0
  const MIN_REFRESH_INTERVAL = 2000 // 2 segundos mínimo entre refreshes

  // Cargar noticias al montar (solo para usuarios autenticados)
  onMounted(() => {
    // Removido la carga automática aquí para dejar que cada componente
    // decida cuándo cargar los datos
  })

  // ===== PERMISOS =====

  // Verificar si puede crear noticias (solo técnicos de prensa)
  const canCreateNews = computed(() => {
    if (!user.value) return false

    const allowedRoles = ['tecnico_prensa', 'admin']
    return allowedRoles.includes(userRole.value || '')
  })

  // Verificar tipos de contenido que puede crear según su rol
  const getAllowedContentTypes = computed(() => {
    if (!user.value) return []

    const role = userRole.value

    // Solo técnicos de prensa pueden crear noticias, avisos y comunicados
    if (role === 'tecnico_prensa' || role === 'admin') {
      return [NewsType.NOTICIA, NewsType.AVISO, NewsType.COMUNICADO]
    }

    // Jueces y presidentes de audiencia solo avisos y comunicados (envío desde juzgado)
    if (role === 'juez' || role === 'presidente_audiencia') {
      return [NewsType.AVISO, NewsType.COMUNICADO]
    }

    // Directores y presidentes NO pueden crear contenido, solo aprobar
    return []
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

    // Solo si está en borrador o rechazada
    const isEditableStatus = news.status === 'draft' || news.status === 'rejected'
    if (!isEditableStatus) return false

    // Obtener el ID del creador (puede venir como createdBy o authorId)
    const creatorId = (news as any).authorId || news.createdBy

    // Si no hay información del creador, no se puede editar
    if (!creatorId || creatorId === 'undefined') {
      return false
    }

    // Convertir a string para asegurar comparación correcta
    const newsCreatorId = String(creatorId)
    const currentUserId = String(user.value.id)

    // Solo el autor (creador) puede editar su propia noticia
    // NUNCA directores o presidentes pueden editar noticias que no crearon
    const isAuthor = newsCreatorId === currentUserId

    // Si es admin, puede editar cualquier noticia
    if (userRole.value === 'admin') return true

    // Solo el autor puede editar
    return isAuthor
  }

  // Verificar si puede eliminar una noticia
  const canDelete = (news: News) => {
    if (!user.value) return false

    // Solo se pueden eliminar noticias en borrador
    if (news.status !== 'draft') return false

    // Obtener el ID del creador (puede venir como createdBy o authorId)
    const creatorId = (news as any).authorId || news.createdBy

    // Si no hay información del creador, no se puede eliminar
    if (!creatorId || creatorId === 'undefined') {
      return false
    }

    // Convertir a string para asegurar comparación correcta
    const newsCreatorId = String(creatorId)
    const currentUserId = String(user.value.id)

    // Solo el autor (creador) puede eliminar su propia noticia
    // NUNCA directores o presidentes pueden eliminar noticias que no crearon
    const isAuthor = newsCreatorId === currentUserId

    // Si es admin, puede eliminar cualquier noticia
    if (userRole.value === 'admin') return true

    // Solo el autor puede eliminar
    return isAuthor
  }

  // Verificar si puede enviar al director
  const canSubmitToDirector = (news: News) => {
    if (!user.value) return false

    // Solo si está en borrador o rechazada
    const canSubmitStatus = news.status === 'draft' || news.status === 'rejected'
    if (!canSubmitStatus) return false

    // Obtener el ID del creador (puede venir como createdBy o authorId)
    const creatorId = (news as any).authorId || news.createdBy

    // Si no hay información del creador, no se puede enviar
    if (!creatorId || creatorId === 'undefined') {
      return false
    }

    // Convertir a string para asegurar comparación correcta
    const newsCreatorId = String(creatorId)
    const currentUserId = String(user.value.id)

    // Solo el autor (creador) puede enviar su propia noticia
    // NUNCA directores o presidentes pueden enviar noticias que no crearon
    const isAuthor = newsCreatorId === currentUserId

    // Si es admin, puede enviar cualquier noticia
    if (userRole.value === 'admin') return true

    // Solo el autor puede enviar
    return isAuthor
  }

  // Verificar si puede aprobar como director
  const canApproveAsDirector = (news: News) => {
    if (!user.value) return false

    // Solo director de prensa o admin
    if (userRole.value !== 'director_prensa' && userRole.value !== 'admin') return false

    // No puede aprobar su propia noticia
    const creatorId = (news as any).authorId || news.createdBy
    if (creatorId && creatorId !== 'undefined') {
      const newsCreatorId = String(creatorId)
      const currentUserId = String(user.value.id)
      if (newsCreatorId === currentUserId) return false
    }

    // Solo si está pendiente del director
    return news.status === NewsStatus.PENDING_DIRECTOR
  }

  // Verificar si puede aprobar como presidente
  const canApproveAsPresident = (news: News) => {
    if (!user.value) return false

    // Solo presidente CSPJ, vicepresidente CSPJ o admin
    if (!['presidente_cspj', 'vicepresidente_cspj', 'admin'].includes(userRole.value || ''))
      return false

    // No puede aprobar su propia noticia
    const creatorId = (news as any).authorId || news.createdBy
    if (creatorId && creatorId !== 'undefined') {
      const newsCreatorId = String(creatorId)
      const currentUserId = String(user.value.id)
      if (newsCreatorId === currentUserId) return false
    }

    // REGLA CLAVE: Solo puede aprobar NOTICIAS, nunca avisos ni comunicados
    // Solo si está pendiente del presidente y es tipo noticia
    return news.status === NewsStatus.PENDING_PRESIDENT && news.type === NewsType.NOTICIA
  }

  // Verificar si puede rechazar
  const canReject = (news: News) => {
    // Mismas reglas que aprobar según el nivel
    return canApproveAsDirector(news) || canApproveAsPresident(news)
  }

  // ===== FILTROS Y BÚSQUEDA =====

  const setTypeFilter = (type: NewsType | undefined) => {
    // Si el presidente filtra por tipo, mantener solo noticias cuando aplique
    if (
      (userRole.value === 'presidente_cspj' || userRole.value === 'vicepresidente_cspj') &&
      type
    ) {
      // Solo permitir filtrar por tipo noticia
      if (type === NewsType.NOTICIA) {
        newsStore.setFilters({ type, page: 1 })
      } else {
        // No aplicar filtro si no es noticia
        return
      }
    } else {
      newsStore.setFilters({ type, page: 1 })
    }

    // El backend ya filtra automáticamente según el rol
    newsStore.fetchNews()
  }

  const setStatusFilter = (status: NewsStatus | undefined) => {
    newsStore.setFilters({ status, page: 1 })
    // El backend ya filtra automáticamente según el rol
    newsStore.fetchNews()
  }

  const setSearchFilter = (search: string) => {
    // Cancelar el timer anterior si existe
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
    }

    // Actualizar el filtro inmediatamente
    newsStore.setFilters({ search, page: 1 })

    // Si la búsqueda está vacía o es muy corta, no hacer petición
    if (search.length > 0 && search.length < 3) {
      return
    }

    // Crear un nuevo timer para la búsqueda con más tiempo para evitar 429
    searchDebounceTimer = setTimeout(() => {
      // Verificar que no se esté cargando ya
      if (!newsStore.loading) {
        newsStore.fetchNews()
      }
    }, 1500) // Aumentar a 1.5 segundos para evitar demasiadas peticiones
  }

  const setPage = (page: number) => {
    newsStore.setFilters({ page })
    // El backend ya filtra automáticamente según el rol
    newsStore.fetchNews()
  }

  const refreshNews = () => {
    const now = Date.now()

    // Protección contra clicks repetidos
    if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
      return
    }

    // Verificar que no se esté cargando ya
    if (newsStore.loading) {
      return
    }

    lastRefreshTime = now
    newsStore.fetchNews()
  }

  // Función para forzar recarga sin importar el estado
  const forceRefreshNews = async () => {
    // Forzar recarga sin verificaciones usando el parámetro forceRefresh
    await newsStore.fetchNews(undefined, true)
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
    if (canApproveAsDirector(news)) {
      // Flujo diferenciado según tipo de contenido
      if (news.type === NewsType.NOTICIA) {
        return 'Aprobar y enviar al Presidente'
      } else {
        return 'Aprobar y publicar'
      }
    }
    if (canApproveAsPresident(news)) return 'Aprobar y publicar'
    if (canReject(news)) return 'Rechazar'
    return null
  }

  // Determinar el siguiente paso en el flujo según el tipo de contenido
  const getNextStepLabel = (news: News): string => {
    if (news.status === NewsStatus.DRAFT) {
      return 'Se enviará al Director de Prensa'
    }

    if (news.status === NewsStatus.PENDING_DIRECTOR) {
      if (news.type === NewsType.NOTICIA) {
        return 'Si se aprueba, irá al Presidente CSPJ'
      } else {
        return 'Si se aprueba, se publicará inmediatamente'
      }
    }

    if (news.status === NewsStatus.PENDING_PRESIDENT) {
      return 'Si se aprueba, se publicará inmediatamente'
    }

    return ''
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
      minute: '2-digit',
    })
  }

  // ===== ESTADÍSTICAS =====

  const newsStats = computed(() => {
    const stats = newsStore.statistics
    if (!stats) return null

    return {
      total: stats.total || 0,
      porTipo: [
        { tipo: 'Noticias', cantidad: stats.byType?.noticia || 0, color: 'blue' },
        { tipo: 'Avisos', cantidad: stats.byType?.aviso || 0, color: 'orange' },
        { tipo: 'Comunicados', cantidad: stats.byType?.comunicado || 0, color: 'purple' },
      ],
      porEstado: [
        { estado: 'Borrador', cantidad: stats.byStatus?.draft || 0, color: 'gray' },
        {
          estado: 'En Revisión',
          cantidad:
            (stats.byStatus?.pending_director || 0) + (stats.byStatus?.pending_president || 0),
          color: 'yellow',
        },
        { estado: 'Publicados', cantidad: stats.byStatus?.published || 0, color: 'green' },
        { estado: 'Rechazados', cantidad: stats.byStatus?.rejected || 0, color: 'red' },
      ],
      publicadasMes: stats.publishedThisMonth || 0,
      vistasMes: stats.viewsThisMonth || 0,
    }
  })

  // Filtrar noticias según el rol del usuario
  const filteredNewsList = computed(() => {
    const allNews = newsStore.newsList
    const role = userRole.value
    const userId = user.value?.id

    if (!userId || role === 'admin') {
      return allNews // Admin ve todo
    }

    const filtered = allNews.filter((news) => {
      const newsAuthorId = (news as any).authorId || news.createdBy
      const isAuthor = newsAuthorId === userId

      // Técnico de prensa: solo sus propias noticias
      if (role === 'tecnico_prensa') {
        return isAuthor
      }

      // Director de prensa: sus noticias + las pendientes de aprobación de director
      if (role === 'director_prensa') {
        const isPendingForDirector = news.status === NewsStatus.PENDING_DIRECTOR && !isAuthor
        const shouldShow = isAuthor || isPendingForDirector

        return shouldShow
      }

      // Presidente/Vicepresidente CSPJ: sus noticias + las pendientes de aprobación presidencial (SOLO noticias)
      if (role === 'presidente_cspj' || role === 'vicepresidente_cspj') {
        const isPendingForPresident =
          news.status === NewsStatus.PENDING_PRESIDENT &&
          news.type === NewsType.NOTICIA &&
          !isAuthor

        // REGLA CLAVE: Solo ven noticias, nunca avisos ni comunicados de otros
        const canSeeThisNews = isAuthor || (isPendingForPresident && news.type === NewsType.NOTICIA)

        // Si es su propia noticia, siempre puede verla independientemente del tipo
        // Si no es suya, solo si es una noticia pendiente de aprobación presidencial
        return canSeeThisNews
      }

      // Juez/Presidente audiencia: solo sus noticias
      if (role === 'juez' || role === 'presidente_audiencia') {
        return isAuthor
      }

      // Por defecto, solo noticias propias
      return isAuthor
    })
    return filtered
  })

  return {
    // Estado del store
    newsList: filteredNewsList, // Noticias filtradas según el rol
    currentNews: computed(() => newsStore.currentNews),
    loading: computed(() => newsStore.loading),
    error: computed(() => newsStore.error),
    needsRefresh: computed(() => newsStore.needsRefresh),
    pagination: computed(() => {
      const originalPagination = newsStore.pagination
      const filteredCount = filteredNewsList.value.length
      const originalCount = newsStore.newsList.length

      // Si se filtró, ajustar la paginación
      if (filteredCount !== originalCount) {
        return {
          ...originalPagination,
          total: filteredCount,
          totalPages: Math.ceil(filteredCount / (originalPagination.limit || 20)),
        }
      }

      return originalPagination
    }),

    // Estadísticas
    newsStats,

    // Permisos
    canCreateNews,
    canSubmitFromCourt,
    getAllowedContentTypes,
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
    getNextStepLabel,
    needsMyAction,
    formatPublishDate,

    // Filtros
    setTypeFilter,
    setStatusFilter,
    setSearchFilter,
    setPage,
    refreshNews,
    forceRefreshNews,

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
    checkAndRefreshIfNeeded: newsStore.checkAndRefreshIfNeeded,

    // Acciones públicas
    fetchPublicNews: newsStore.fetchPublicNews,
    fetchPublicNewsBySlug: newsStore.fetchPublicNewsBySlug,
    publicNewsList: computed(() => newsStore.publicNewsList),

    // Métodos basados en rol
    fetchMyNews: newsStore.fetchMyNews,
    fetchNewsPendingApproval: newsStore.fetchNewsPendingApproval,
    fetchNewsCreatedByMe: newsStore.fetchNewsCreatedByMe,
  }
}
