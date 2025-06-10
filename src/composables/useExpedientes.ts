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

  // Filtrar expedientes según el rol del usuario
  const filteredExpedientes = computed(() => {
    if (!user.value) return []

    let filtered = [...expedientesStore.expedientes]

    // FILTRADO POR ROL
    if (isJuez.value) {
      // Los jueces solo ven sus propios expedientes
      filtered = filtered.filter((exp) => exp.createdBy === user.value!.id)
    } else if (isPresidenteAudiencia.value) {
      // Los presidentes solo ven expedientes pendientes de su departamento
      filtered = filtered.filter(
        (exp) =>
          exp.status === 'pending_approval' &&
          exp.currentLevel === 'presidente_audiencia' &&
          exp.departmentId === user.value!.departmentId &&
          exp.createdBy !== user.value!.id, // No puede ver los que él creó
      )
    } else if (isSecretarioGeneral.value) {
      // El secretario solo ve expedientes pendientes en su nivel
      filtered = filtered.filter(
        (exp) => exp.status === 'pending_approval' && exp.currentLevel === 'secretario_general',
      )
    }
    // Los admin ven todo sin filtros

    return filtered
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

    // Solo el creador puede enviar y debe estar en borrador O rechazado
    return (
      expediente.createdBy === user.value.id &&
      (expediente.status === 'draft' || expediente.status === 'rejected')
    )
  }

  // Verificar si puede aprobar
  const canApprove = (expediente: any) => {
    if (!user.value) {
      return false
    }

    // Verificar que el expediente esté pendiente de aprobación
    if (expediente.status !== 'pending_approval') {
      return false
    }

    // NUEVO FLUJO DE APROBACIÓN ESTRICTO:
    // El nivel indica QUIÉN debe aprobar, no de dónde viene

    // CASO 1: Si el nivel es "presidente_audiencia", SOLO el presidente de audiencia puede aprobar
    if (expediente.currentLevel === 'presidente_audiencia' && isPresidenteAudiencia.value) {
      // Verificar que sea del mismo departamento
      if (expediente.departmentId === user.value.departmentId) {
        // Verificar que no sea el creador
        if (expediente.createdBy !== user.value.id) {
          return true
        } else {
          return false
        }
      } else {
        return false
      }
    }

    // CASO 2: Si el nivel es "secretario_general", SOLO el secretario general puede aprobar
    if (expediente.currentLevel === 'secretario_general' && isSecretarioGeneral.value) {
      return true
    }

    // CASO 3: Admin puede aprobar cualquier expediente pendiente
    if (user.value.role === 'admin') {
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
      rejected: { severity: 'danger', label: 'Rechazado', icon: 'pi-times' },
    }

    return badges[status] || badges.draft
  }

  // Obtener texto del nivel actual
  const getCurrentLevelText = (level: string) => {
    const levels: Record<string, string> = {
      juez: 'Juez',
      presidente_audiencia: 'Presidente de Audiencia',
      secretario_general: 'Secretario General',
    }

    return levels[level] || level
  }

  return {
    // Estado del store
    expedientes: computed(() => expedientesStore.expedientes),
    filteredExpedientes, // Expedientes filtrados por rol
    loading: computed(() => expedientesStore.loading),
    error: computed(() => expedientesStore.error),
    pagination: computed(() => expedientesStore.pagination),
    filters: computed(() => expedientesStore.filters),

    // Estadísticas usando expedientes filtrados
    totalExpedientes: computed(() => filteredExpedientes.value.length),
    expedientesPendientes: computed(() =>
      filteredExpedientes.value.filter((e) => e.status === 'pending_approval'),
    ),
    expedientesAprobados: computed(() =>
      filteredExpedientes.value.filter((e) => e.status === 'approved'),
    ),
    expedientesRechazados: computed(() =>
      filteredExpedientes.value.filter((e) => e.status === 'rejected'),
    ),
    expedientesBorrador: computed(() =>
      filteredExpedientes.value.filter((e) => e.status === 'draft'),
    ),

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
    fetchExpedienteById: expedientesStore.fetchExpedienteById,
  }
}
