import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  type Expediente,
  type ExpedienteFilters,
  type ExpedientesResponse,
  type CreateExpedienteDto,
  type UpdateExpedienteDto,
  type SubmitExpedienteDto,
  type ApproveExpedienteDto,
  type RejectExpedienteDto,
  type ExpedienteStatistics,
  ExpedienteStatus,
} from '@/types/expediente'
import { expedientesService } from '@/services/expedientes.service'

export const useExpedientesStore = defineStore('expedientes', () => {
  // State
  const expedientes = ref<Expediente[]>([])
  const currentExpediente = ref<Expediente | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<ExpedienteFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined,
    departmentId: undefined,
  })
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const statistics = ref<ExpedienteStatistics | null>(null)

  // Getters
  const totalExpedientes = computed(() => pagination.value.total)

  const expedientesPendientes = computed(() =>
    expedientes.value.filter((e) => e.status === ExpedienteStatus.PENDING_APPROVAL),
  )

  const expedientesAprobados = computed(() =>
    expedientes.value.filter((e) => e.status === ExpedienteStatus.APPROVED),
  )

  const expedientesRechazados = computed(() =>
    expedientes.value.filter((e) => e.status === ExpedienteStatus.REJECTED),
  )

  // Actions
  const fetchExpedientes = async (customFilters?: ExpedienteFilters) => {
    loading.value = true
    error.value = null

    try {
      const finalFilters = { ...filters.value, ...customFilters }
      const response = await expedientesService.getExpedientes(finalFilters)

      if (response.success) {
        expedientes.value = response.data
        pagination.value = response.pagination

        // Debug: verificar datos de paginación
        console.log('=== DEBUG Paginación ===')
        console.log('Filtros enviados:', finalFilters)
        console.log('Expedientes recibidos:', response.data.length)
        console.log('Paginación recibida:', response.pagination)
        console.log('Total calculado de páginas:', Math.ceil(response.pagination.total / response.pagination.limit))

        return { success: true }
      }

      return { success: false, message: response.message || 'Error al cargar expedientes' }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar expedientes'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const fetchExpedienteById = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      console.log('Store: Fetching expediente:', id)
      const response = await expedientesService.getExpedienteById(id)

      if (response.success && response.data) {
        currentExpediente.value = response.data
        console.log('Store: Expediente fetched:', {
          id: response.data.id,
          status: response.data.status,
          currentLevel: response.data.currentLevel,
          departmentId: response.data.departmentId,
        })
        return { success: true, data: response.data }
      }

      return { success: false, message: response.message }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar expediente'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const createExpediente = async (data: CreateExpedienteDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await expedientesService.createExpediente(data)

      if (response.success && response.data) {
        // Agregar el nuevo expediente a la lista
        expedientes.value.unshift(response.data)
        return { success: true, data: response.data }
      }

      return { success: false, message: response.message || 'Error al crear expediente' }
    } catch (err: any) {
      error.value = err.message || 'Error al crear expediente'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateExpediente = async (id: string, data: UpdateExpedienteDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await expedientesService.updateExpediente(id, data)

      if (response.success && response.data) {
        // Actualizar en la lista
        const index = expedientes.value.findIndex((e) => e.id === id)
        if (index !== -1) {
          expedientes.value[index] = response.data
        }

        // Actualizar el expediente actual si es el mismo
        if (currentExpediente.value?.id === id) {
          currentExpediente.value = response.data
        }

        return { success: true, data: response.data }
      }

      return { success: false, message: response.message || 'Error al actualizar expediente' }
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar expediente'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const submitExpediente = async (id: string, data?: SubmitExpedienteDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await expedientesService.submitExpediente(id, data)

      if (response.success) {
        // Actualizar el estado del expediente
        await fetchExpedienteById(id)
        return { success: true, message: 'Expediente enviado para aprobación' }
      }

      return { success: false, message: response.message }
    } catch (err: any) {
      error.value = err.message || 'Error al enviar expediente'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const approveExpediente = async (id: string, data?: ApproveExpedienteDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await expedientesService.approveExpediente(id, data)

      if (response.success) {
        // Actualizar el estado del expediente
        await fetchExpedienteById(id)
        return { success: true, message: 'Expediente aprobado exitosamente' }
      }

      return { success: false, message: response.message }
    } catch (err: any) {
      error.value = err.message || 'Error al aprobar expediente'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const rejectExpediente = async (id: string, data: RejectExpedienteDto) => {
    loading.value = true
    error.value = null

    try {
      const response = await expedientesService.rejectExpediente(id, data)

      if (response.success) {
        // Actualizar el estado del expediente
        await fetchExpedienteById(id)
        return { success: true, message: 'Expediente rechazado' }
      }

      return { success: false, message: response.message }
    } catch (err: any) {
      error.value = err.message || 'Error al rechazar expediente'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await expedientesService.getStatistics()

      if (response.success && response.data) {
        statistics.value = response.data
        return { success: true, data: response.data }
      }

      return { success: false, message: response.message }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  const setFilters = (newFilters: Partial<ExpedienteFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const resetFilters = () => {
    filters.value = {
      page: 1,
      limit: 10,
      search: '',
      status: undefined,
      departmentId: undefined,
    }
  }

  const clearCurrentExpediente = () => {
    currentExpediente.value = null
  }

  return {
    // State
    expedientes,
    currentExpediente,
    loading,
    error,
    filters,
    pagination,
    statistics,

    // Getters
    totalExpedientes,
    expedientesPendientes,
    expedientesAprobados,
    expedientesRechazados,

    // Actions
    fetchExpedientes,
    fetchExpedienteById,
    createExpediente,
    updateExpediente,
    submitExpediente,
    approveExpediente,
    rejectExpediente,
    fetchStatistics,
    setFilters,
    resetFilters,
    clearCurrentExpediente,
  }
})
