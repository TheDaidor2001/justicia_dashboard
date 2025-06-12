<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import { useNews } from '@/composables/useNews'
import { useAuth } from '@/composables/useAuth'
import type { News } from '@/types/news'

interface Props {
  news: News
  loading?: boolean
}

interface Emits {
  (e: 'edit'): void
  (e: 'submit-to-director'): void
  (e: 'approve-director'): void
  (e: 'approve-president'): void
  (e: 'reject'): void
  (e: 'delete'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<Emits>()

const { user, userRole } = useAuth()
const {
  canEdit,
  canDelete,
  canSubmitToDirector,
  canApproveAsDirector,
  canApproveAsPresident,
  canReject,
} = useNews()

// Acciones disponibles
const availableActions = computed(() => {
  const actions = []

  // Editar (siempre visible si tiene permisos, implementación en fase 4)
  if (canEdit(props.news)) {
    actions.push({
      key: 'edit',
      label: 'Editar',
      icon: 'pi pi-pencil',
      severity: 'secondary',
      outlined: true,
      action: () => emit('edit'),
    })
  }

  // Enviar al Director
  if (canSubmitToDirector(props.news)) {
    actions.push({
      key: 'submit-to-director',
      label: 'Enviar para Revisión',
      icon: 'pi pi-send',
      severity: 'info',
      action: () => emit('submit-to-director'),
    })
  }

  // Aprobar como Director
  if (canApproveAsDirector(props.news)) {
    actions.push({
      key: 'approve-director',
      label:
        props.news.type === 'noticia' ? 'Aprobar y Enviar al Presidente' : 'Aprobar y Publicar',
      icon: 'pi pi-check',
      severity: 'success',
      action: () => emit('approve-director'),
    })
  }

  // Aprobar como Presidente
  if (canApproveAsPresident(props.news)) {
    actions.push({
      key: 'approve-president',
      label: 'Aprobar y Publicar',
      icon: 'pi pi-verified',
      severity: 'success',
      action: () => emit('approve-president'),
    })
  }

  // Rechazar
  if (canReject(props.news)) {
    actions.push({
      key: 'reject',
      label: 'Rechazar',
      icon: 'pi pi-times',
      severity: 'danger',
      outlined: true,
      action: () => emit('reject'),
    })
  }

  // Eliminar
  if (canDelete(props.news)) {
    actions.push({
      key: 'delete',
      label: 'Eliminar',
      icon: 'pi pi-trash',
      severity: 'danger',
      outlined: true,
      action: () => emit('delete'),
    })
  }

  return actions
})

// Separar acciones primarias y secundarias
const primaryActions = computed(() => {
  return availableActions.value.filter((action) =>
    ['submit-to-director', 'approve-director', 'approve-president'].includes(action.key),
  )
})

const secondaryActions = computed(() => {
  return availableActions.value.filter((action) =>
    ['edit', 'reject', 'delete'].includes(action.key),
  )
})

// Obtener contexto de la acción principal
const getPrimaryActionContext = computed(() => {
  if (canSubmitToDirector(props.news)) {
    return {
      title: 'Enviar para Revisión',
      description: 'La noticia será enviada al Director de Prensa para su revisión',
      icon: 'pi pi-send',
      color: 'info',
    }
  }

  if (canApproveAsDirector(props.news)) {
    if (props.news.type === 'noticia') {
      return {
        title: 'Aprobar y Enviar al Presidente',
        description: 'La noticia será enviada al Presidente CSPJ para aprobación final',
        icon: 'pi pi-check',
        color: 'success',
      }
    } else {
      return {
        title: 'Aprobar y Publicar',
        description: `El ${props.news.type} será publicado inmediatamente (flujo simplificado)`,
        icon: 'pi pi-check',
        color: 'success',
      }
    }
  }

  if (canApproveAsPresident(props.news)) {
    return {
      title: 'Aprobar y Publicar',
      description: 'La noticia será publicada inmediatamente tras la aprobación',
      icon: 'pi pi-verified',
      color: 'success',
    }
  }

  return null
})
</script>

<template>
  <div class="news-action-buttons">
    <!-- Acciones primarias -->
    <div v-if="primaryActions.length > 0" class="space-y-4">
      <!-- Contexto de la acción principal -->
      <div v-if="getPrimaryActionContext" class="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <i
              :class="`pi ${getPrimaryActionContext.icon} text-xl`"
              :style="{ color: getPrimaryActionContext.color === 'info' ? '#3b82f6' : '#10b981' }"
            ></i>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 mb-1">{{ getPrimaryActionContext.title }}</h4>
            <p class="text-sm text-gray-600">{{ getPrimaryActionContext.description }}</p>
          </div>
        </div>
      </div>

      <!-- Botones primarios -->
      <div class="space-y-2">
        <Button
          v-for="action in primaryActions"
          :key="action.key"
          :label="action.label"
          :icon="action.icon"
          :severity="action.severity"
          :outlined="action.outlined"
          :disabled="loading"
          @click="action.action"
          class="w-full"
        />
      </div>
    </div>

    <!-- Separador -->
    <div
      v-if="primaryActions.length > 0 && secondaryActions.length > 0"
      class="my-4 border-t"
    ></div>

    <!-- Acciones secundarias -->
    <div v-if="secondaryActions.length > 0" class="space-y-2">
      <Button
        v-for="action in secondaryActions"
        :key="action.key"
        :label="action.label"
        :icon="action.icon"
        :severity="action.severity"
        :outlined="action.outlined"
        :disabled="loading"
        @click="action.action"
        class="w-full"
        size="small"
      />
    </div>

    <!-- Estado sin acciones -->
    <div v-if="availableActions.length === 0" class="text-center py-6 text-gray-500">
      <i class="pi pi-lock text-2xl mb-2 block"></i>
      <p class="text-sm">No hay acciones disponibles para esta noticia</p>

      <div
        v-if="!((props.news as any).authorId || props.news.createdBy)"
        class="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg"
      >
        <div class="flex items-start gap-2">
          <i class="pi pi-exclamation-triangle text-orange-500 mt-0.5"></i>
          <div class="text-left">
            <p class="text-sm text-orange-800 font-medium">Problema de autoría</p>
            <p class="text-xs text-orange-700 mt-1">
              Esta noticia no tiene asignado un autor. Contacta al administrador para resolverlo.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.news-action-buttons {
  min-height: 100px;
}

/* Estilos para asegurar que los botones tengan texto blanco visible */
:deep(.p-button) {
  &.p-button-secondary {
    color: white !important;
    background-color: #6c757d !important;
    border-color: #6c757d !important;

    &:hover {
      color: white !important;
      background-color: #5a6268 !important;
      border-color: #545b62 !important;
    }

    &:focus {
      color: white !important;
      background-color: #5a6268 !important;
      border-color: #545b62 !important;
    }

    &:disabled {
      color: white !important;
      background-color: #6c757d !important;
      opacity: 0.6;
    }
  }

  &.p-button-info {
    color: white !important;

    &:hover {
      color: white !important;
    }

    &:focus {
      color: white !important;
    }

    &:disabled {
      color: white !important;
      opacity: 0.6;
    }
  }

  &.p-button-success {
    color: white !important;

    &:hover {
      color: white !important;
    }

    &:focus {
      color: white !important;
    }

    &:disabled {
      color: white !important;
      opacity: 0.6;
    }
  }

  &.p-button-danger {
    color: white !important;

    &:hover {
      color: white !important;
    }

    &:focus {
      color: white !important;
    }

    &:disabled {
      color: white !important;
      opacity: 0.6;
    }
  }

  &.p-button-outlined {
    &.p-button-secondary {
      color: #6c757d !important;
      background-color: transparent !important;
      border-color: #6c757d !important;

      &:hover {
        color: white !important;
        background-color: #6c757d !important;
        border-color: #6c757d !important;
      }

      &:focus {
        color: white !important;
        background-color: #6c757d !important;
        border-color: #6c757d !important;
      }

      &:disabled {
        color: #6c757d !important;
        background-color: transparent !important;
        opacity: 0.6;
      }
    }

    &.p-button-danger {
      color: #dc3545 !important;
      background-color: transparent !important;
      border-color: #dc3545 !important;

      &:hover {
        color: white !important;
        background-color: #dc3545 !important;
        border-color: #dc3545 !important;
      }

      &:focus {
        color: white !important;
        background-color: #dc3545 !important;
        border-color: #dc3545 !important;
      }

      &:disabled {
        color: #dc3545 !important;
        background-color: transparent !important;
        opacity: 0.6;
      }
    }
  }
}
</style>
