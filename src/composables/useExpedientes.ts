import { computed, onMounted, watch } from 'vue'
import { useExpedientesStore } from '@/stores/expedientes'
import { useAuth } from '@/composables/useAuth'
import type { ExpedienteFilters, ExpedienteStatus } from '@/types/expediente'

export const useExpedientes = () => {
    const expedientesStore = useExpedientesStore()
    const { user, isJuez, isPresidenteAudiencia, isSecretarioGeneral } = useAuth()

    // Cargar expedientes al montar
    onMounted(() => {
        expedientesStore.fetchExpedientes()
    })

    // Métodos para cambiar filtros
    const setStatusFilter = (status: ExpedienteStatus | undefined) => {
        expedientesStore.setFilters({ status, page: 1 })
        expedientesStore.fetchExpedientes()
    }

    const setSearchFilter = (search: string) => {
        expedientesStore.setFilters({ search, page: 1 })
        expedientesStore.fetchExpedientes()
    }

    const setPage = (page: number) => {
        expedientesStore.setFilters({ page })
        expedientesStore.fetchExpedientes()
    }

    const refreshExpedientes = () => {
        expedientesStore.fetchExpedientes()
    }

    // Verificar si puede editar un expediente
    const canEdit = (expediente: any) => {
        if (!user.value) return false

        // Solo el creador puede editar y solo si está en borrador o rechazado
        return (
            expediente.createdBy === user.value.id &&
            (expediente.status === 'draft' || expediente.status === 'rejected')
        )
    }

    // Verificar si puede enviar para aprobación
    const canSubmit = (expediente: any) => {
        if (!user.value) return false

        // Solo el creador puede enviar y solo si está en borrador
        return (
            expediente.createdBy === user.value.id &&
            expediente.status === 'draft'
        )
    }

    // Verificar si puede aprobar
    const canApprove = (expediente: any) => {
        if (!user.value) return false

        // Verificar según el nivel actual del expediente
        if (expediente.status !== 'pending_approval') return false

        if (expediente.currentLevel === 'juez' && isPresidenteAudiencia.value) {
            // Presidente puede aprobar expedientes en nivel juez
            return true
        }

        if (expediente.currentLevel === 'presidente_audiencia' && isSecretarioGeneral.value) {
            // Secretario puede aprobar expedientes en nivel presidente
            return true
        }

        return false
    }

    // Verificar si puede rechazar
    const canReject = (expediente: any) => {
        // Mismas reglas que aprobar
        return canApprove(expediente)
    }

    // Obtener badge de estado
    const getStatusBadge = (status: ExpedienteStatus) => {
        const badges = {
            draft: { severity: 'secondary', label: 'Borrador', icon: 'pi-pencil' },
            pending_approval: { severity: 'warning', label: 'Pendiente', icon: 'pi-clock' },
            approved: { severity: 'success', label: 'Aprobado', icon: 'pi-check' },
            rejected: { severity: 'danger', label: 'Rechazado', icon: 'pi-times' }
        }

        return badges[status] || badges.draft
    }

    // Obtener texto del nivel actual
    const getCurrentLevelText = (level: string) => {
        const levels = {
            juez: 'Juez',
            presidente_audiencia: 'Presidente de Audiencia',
            secretario_general: 'Secretario General'
        }

        return levels[level as keyof typeof levels] || level
    }

    return {
        // Estado del store
        expedientes: computed(() => expedientesStore.expedientes),
        loading: computed(() => expedientesStore.loading),
        error: computed(() => expedientesStore.error),
        pagination: computed(() => expedientesStore.pagination),
        filters: computed(() => expedientesStore.filters),

        // Estadísticas
        totalExpedientes: computed(() => expedientesStore.totalExpedientes),
        expedientesPendientes: computed(() => expedientesStore.expedientesPendientes),
        expedientesAprobados: computed(() => expedientesStore.expedientesAprobados),
        expedientesRechazados: computed(() => expedientesStore.expedientesRechazados),

        // Métodos
        setStatusFilter,
        setSearchFilter,
        setPage,
        refreshExpedientes,
        canEdit,
        canSubmit,
        canApprove,
        canReject,
        getStatusBadge,
        getCurrentLevelText,

        // Acciones del store
        createExpediente: expedientesStore.createExpediente,
        updateExpediente: expedientesStore.updateExpediente,
        submitExpediente: expedientesStore.submitExpediente,
        approveExpediente: expedientesStore.approveExpediente,
        rejectExpediente: expedientesStore.rejectExpediente,
        fetchExpedienteById: expedientesStore.fetchExpedienteById
    }
}