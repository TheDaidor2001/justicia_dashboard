import { computed, onMounted, watch } from 'vue'
import { useExpedientesStore } from '@/stores/expedientes'
import { useAuth } from '@/composables/useAuth'
import type { ExpedienteFilters, ExpedienteStatus, Expediente } from '@/types/expediente'

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
    const canEdit = (expediente: Expediente) => {
        if (!user.value) return false

        // Solo el creador puede editar y solo si está en borrador o rechazado
        return (
            expediente.createdBy === user.value.id &&
            (expediente.status === 'draft' || expediente.status === 'rejected')
        )
    }

    // Verificar si puede enviar para aprobación
    const canSubmit = (expediente: Expediente) => {
        if (!user.value) return false

        // Solo el creador puede enviar y solo si está en borrador
        return (
            expediente.createdBy === user.value.id &&
            expediente.status === 'draft'
        )
    }

    // Verificar si puede aprobar
    const canApprove = (expediente: any) => {
        console.log('=== DEBUG canApprove ===')
        console.log('User:', user.value?.email, user.value?.role)
        console.log('User Department:', user.value?.departmentId)
        console.log('Expediente Status:', expediente.status)
        console.log('Expediente Level:', expediente.currentLevel)
        console.log('Expediente Department:', expediente.departmentId)
        console.log('Expediente Created By:', expediente.createdBy)
        console.log('Is Presidente Audiencia:', isPresidenteAudiencia.value)
        console.log('Is Secretario General:', isSecretarioGeneral.value)

        if (!user.value) {
            console.log('No puede aprobar: usuario no autenticado')
            return false
        }

        // Verificar que el expediente esté pendiente de aprobación
        if (expediente.status !== 'pending_approval') {
            console.log('No puede aprobar: expediente no está pending_approval')
            return false
        }

        // FLUJO DE APROBACIÓN:
        // 1. Nivel "juez" → Solo presidente de audiencia puede aprobar
        // 2. Nivel "presidente_audiencia" → Solo secretario general puede aprobar
        // 3. Nivel "secretario_general" → Nadie (ya está aprobado)

        // CASO 1: Presidente de audiencia puede aprobar cuando está en nivel "juez"
        if (isPresidenteAudiencia.value && expediente.currentLevel === 'juez') {
            // Verificar que sea del mismo departamento
            if (expediente.departmentId === user.value.departmentId) {
                // Verificar que no sea el creador
                if (expediente.createdBy !== user.value.id) {
                    console.log('✅ Presidente puede aprobar: expediente en nivel juez de su departamento')
                    return true
                } else {
                    console.log('❌ Presidente no puede aprobar: es el creador del expediente')
                    return false
                }
            } else {
                console.log('❌ Presidente no puede aprobar: expediente de otro departamento')
                return false
            }
        }

        // CASO 2: Secretario general puede aprobar cuando está en nivel "presidente_audiencia"
        if (isSecretarioGeneral.value && expediente.currentLevel === 'presidente_audiencia') {
            console.log('✅ Secretario puede aprobar: expediente en nivel presidente_audiencia')
            return true
        }

        // CASO 3: Admin puede aprobar cualquier expediente pendiente
        if (user.value.role === 'admin') {
            console.log('✅ Admin puede aprobar cualquier expediente')
            return true
        }

        // No cumple ninguna condición
        console.log('❌ No puede aprobar')
        console.log('Resumen del flujo:')
        console.log('- Nivel "juez" → Solo presidente de audiencia del mismo depto puede aprobar')
        console.log('- Nivel "presidente_audiencia" → Solo secretario general puede aprobar')
        console.log('- Tu rol:', user.value.role)
        console.log('- Nivel actual del expediente:', expediente.currentLevel)
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
        const levels: Record<string, string> = {
            juez: 'Juez',
            presidente_audiencia: 'Presidente de Audiencia',
            secretario_general: 'Secretario General'
        }

        return levels[level] || level
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