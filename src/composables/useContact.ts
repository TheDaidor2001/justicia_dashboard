import { computed } from 'vue'
import { useContactStore } from '@/stores/contact'
import { useAuthStore } from '@/stores/auth'
import type { ContactStatus } from '@/types/contact'
import type { UserRoleType } from '@/types/user'

export function useContact() {
  const contactStore = useContactStore()
  const authStore = useAuthStore()

  // Permission checks
  const canViewAllMessages = computed(() => {
    const allowedRoles: UserRoleType[] = [
      'secretario_adjunto',
      'secretario_general',
      'presidente_cspj',
      'vicepresidente_cspj',
      'admin',
    ]
    return allowedRoles.includes(authStore.user?.role as UserRoleType)
  })

  const canAssignMessages = computed(() => {
    const allowedRoles: UserRoleType[] = ['secretario_adjunto', 'admin']
    return allowedRoles.includes(authStore.user?.role as UserRoleType)
  })

  const canRespondToMessage = computed(() => (assignedTo?: string) => {
    // Admin can respond to any message
    if (authStore.user?.role === 'admin') {
      return true
    }
    // User can respond if the message is assigned to them
    return assignedTo === authStore.user?.id
  })

  const canViewStatistics = computed(() => canViewAllMessages.value)

  // Status utilities
  const getStatusLabel = (status: ContactStatus): string => {
    const labels = {
      pending: 'Pendiente',
      in_progress: 'En Proceso',
      resolved: 'Resuelto',
    }
    return labels[status]
  }

  const getStatusSeverity = (status: ContactStatus): 'warn' | 'info' | 'success' => {
    const severities = {
      pending: 'warn' as const,
      in_progress: 'info' as const,
      resolved: 'success' as const,
    }
    return severities[status]
  }

  const getStatusIcon = (status: ContactStatus): string => {
    const icons = {
      pending: 'pi pi-clock',
      in_progress: 'pi pi-sync',
      resolved: 'pi pi-check-circle',
    }
    return icons[status]
  }

  // Action availability
  const canViewDetails = computed(() => canViewAllMessages.value)

  const canAssign = computed(() => (status: ContactStatus) => {
    return canAssignMessages.value && status === 'pending'
  })

  const canRespond = computed(() => (status: ContactStatus, assignedTo?: string) => {
    return status === 'in_progress' && canRespondToMessage.value(assignedTo)
  })

  // Date formatting
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateLong = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Time calculations
  const getTimeAgo = (dateString: string): string => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInDays === 0) {
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
        return diffInMinutes <= 1 ? 'Hace un momento' : `Hace ${diffInMinutes} minutos`
      }
      return diffInHours === 1 ? 'Hace 1 hora' : `Hace ${diffInHours} horas`
    } else if (diffInDays === 1) {
      return 'Ayer'
    } else if (diffInDays < 7) {
      return `Hace ${diffInDays} días`
    } else {
      return formatDate(dateString)
    }
  }

  // Format response time
  const formatResponseTime = (hours: number): string => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60)
      return `${minutes} min`
    } else if (hours < 24) {
      return `${Math.round(hours)} h`
    } else {
      const days = Math.round(hours / 24)
      return `${days} días`
    }
  }

  return {
    // Store
    store: contactStore,

    // Permissions
    canViewAllMessages,
    canAssignMessages,
    canRespondToMessage,
    canViewStatistics,
    canViewDetails,
    canAssign,
    canRespond,

    // Utilities
    getStatusLabel,
    getStatusSeverity,
    getStatusIcon,
    formatDate,
    formatDateLong,
    getTimeAgo,
    formatResponseTime,
  }
}
