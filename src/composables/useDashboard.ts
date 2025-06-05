// src/composables/useDashboard.ts

import { computed, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

export const useDashboard = () => {
  const dashboardStore = useDashboardStore()
  const { user, userRole } = useAuth()
  const router = useRouter()

  // Cargar datos al montar
  onMounted(() => {
    dashboardStore.fetchDashboardData()
  })

  // Navegación a tareas
  const navigateToTask = (task: any) => {
    switch (task.type) {
      case 'expediente':
        router.push(`/expedientes/${task.id}`)
        break
      case 'news':
        router.push(`/noticias/${task.id}`)
        break
      case 'contact':
        router.push(`/contactos/${task.id}`)
        break
      default:
        if (task.url) {
          router.push(task.url)
        }
    }
  }

  // Obtener color según el tipo de tarea
  const getTaskColor = (type: string) => {
    const colors: Record<string, string> = {
      expediente: 'blue',
      news: 'green',
      contact: 'orange',
    }
    return colors[type] || 'gray'
  }

  // Obtener icono según el tipo de tarea
  const getTaskIcon = (type: string) => {
    const icons: Record<string, string> = {
      expediente: 'pi-folder',
      news: 'pi-megaphone',
      contact: 'pi-envelope',
    }
    return icons[type] || 'pi-file'
  }

  // Formatear números grandes
  const formatNumber = (num: number | string | null | undefined): string => {
    // Validar entrada
    if (num === null || num === undefined) {
      return '0'
    }

    // Convertir a número si es string
    const numValue = typeof num === 'string' ? parseFloat(num) : num

    // Verificar si es un número válido
    if (isNaN(numValue)) {
      return '0'
    }

    if (numValue >= 1000000) {
      return (numValue / 1000000).toFixed(1) + 'M'
    }
    if (numValue >= 1000) {
      return (numValue / 1000).toFixed(1) + 'K'
    }
    return numValue.toString()
  }

  // Widgets específicos por rol
  const roleWidgets = computed(() => {
    const widgets = []

    // Widgets comunes
    if (dashboardStore.expedienteStats) {
      widgets.push({
        id: 'expedientes-total',
        title: 'Total Expedientes',
        value: dashboardStore.expedienteStats.total,
        icon: 'pi-folder',
        color: 'blue',
        change: null,
      })
    }

    // Widgets específicos por rol
    switch (userRole.value) {
      case 'juez':
        widgets.push({
          id: 'mis-expedientes',
          title: 'Mis Expedientes',
          value: dashboardStore.expedienteStats?.draft || 0,
          icon: 'pi-file-edit',
          color: 'purple',
          subtitle: 'En borrador',
        })
        break

      case 'presidente_audiencia':
        widgets.push({
          id: 'pendientes-aprobar',
          title: 'Pendientes de Aprobación',
          value: dashboardStore.expedienteStats?.pending || 0,
          icon: 'pi-clock',
          color: 'orange',
          action: () => router.push('/expedientes?status=pending_approval'),
        })
        break

      case 'secretario_general':
        widgets.push({
          id: 'aprobacion-final',
          title: 'Aprobación Final',
          value: dashboardStore.highPriorityTasks.length,
          icon: 'pi-check-circle',
          color: 'green',
        })
        break
    }

    return widgets
  })

  return {
    // Estado
    summary: computed(() => dashboardStore.summary),
    pendingTasks: computed(() => dashboardStore.pendingTasks),
    stats: computed(() => dashboardStore.stats),
    loading: computed(() => dashboardStore.loading),
    error: computed(() => dashboardStore.error),

    // Widgets por rol
    roleWidgets,

    // Métodos
    navigateToTask,
    getTaskColor,
    getTaskIcon,
    formatNumber,
    refreshDashboard: dashboardStore.refreshDashboard,
    setFilters: dashboardStore.setFilters,
  }
}
