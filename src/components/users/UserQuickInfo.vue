<template>
  <Card class="user-quick-info">
    <template #content>
      <div class="flex items-center gap-3">
        <!-- Foto de perfil -->
        <div class="flex-shrink-0">
          <Avatar
            :image="user.foto_perfil || undefined"
            :label="avatarLabel"
            :class="avatarClass"
            size="large"
            shape="circle"
          />

          <!-- Indicador de estado -->
          <div
            :class="statusIndicatorClass"
            class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
          ></div>
        </div>

        <!-- Información del usuario -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="font-medium text-gray-900 truncate">{{ user.nombre }}</h3>

            <!-- Badge de rol -->
            <UserRoleBadge :role="user.rol" :user-id="user.id" size="small" :show-tooltip="false" />
          </div>

          <p class="text-sm text-gray-600 truncate mb-1">{{ user.email }}</p>

          <div class="flex items-center gap-2 text-xs text-gray-500">
            <i class="pi pi-building"></i>
            <span class="truncate">{{ departmentName }}</span>
          </div>
        </div>

        <!-- Indicadores adicionales -->
        <div v-if="showIndicators" class="flex-shrink-0 flex flex-col items-center gap-1">
          <!-- Usuario asignable -->
          <div
            v-if="user.es_asignable"
            class="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full"
          >
            <i class="pi pi-check text-xs text-green-600"></i>
          </div>

          <!-- Carga de trabajo -->
          <div v-if="showWorkload && user.carga_trabajo !== undefined" class="text-center">
            <div class="text-xs font-medium" :class="workloadColorClass">
              {{ user.carga_trabajo }}%
            </div>
            <div class="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full transition-all duration-300"
                :class="workloadBarClass"
                :style="{ width: `${Math.min(user.carga_trabajo, 100)}%` }"
              ></div>
            </div>
          </div>

          <!-- Tareas pendientes -->
          <div
            v-if="user.tareas_pendientes && user.tareas_pendientes > 0"
            class="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full"
          >
            <span class="text-xs font-medium text-orange-600">{{ user.tareas_pendientes }}</span>
          </div>
        </div>
      </div>

      <!-- Información adicional (expandible) -->
      <div v-if="expanded" class="mt-3 pt-3 border-t border-gray-200">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-gray-500">DNI:</span>
            <span class="ml-2 font-medium">{{ user.dni }}</span>
          </div>

          <div v-if="user.telefono">
            <span class="text-gray-500">Teléfono:</span>
            <span class="ml-2 font-medium">{{ user.telefono }}</span>
          </div>

          <div>
            <span class="text-gray-500">Estado:</span>
            <span class="ml-2" :class="statusTextClass">{{ user.estado }}</span>
          </div>

          <div v-if="user.ultima_actividad">
            <span class="text-gray-500">Última actividad:</span>
            <span class="ml-2 font-medium">{{ formatLastActivity }}</span>
          </div>
        </div>

        <!-- Acciones rápidas -->
        <div v-if="showActions" class="flex gap-2 mt-3">
          <Button
            label="Ver perfil"
            severity="info"
            size="small"
            outlined
            @click="$emit('viewProfile')"
          />
          <Button
            v-if="canEdit"
            label="Editar"
            severity="secondary"
            size="small"
            outlined
            @click="$emit('editUser')"
          />
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import UserRoleBadge from '@/components/users/UserRoleBadge.vue'
import { useUsers } from '@/composables/useUsers'
import type { User } from '@/types/user'
import { formatDepartmentForDisplay } from '@/utils'

interface Props {
  user: User
  expanded?: boolean
  showIndicators?: boolean
  showWorkload?: boolean
  showActions?: boolean
  clickable?: boolean
}

interface Emits {
  (e: 'click'): void
  (e: 'viewProfile'): void
  (e: 'editUser'): void
}

const props = withDefaults(defineProps<Props>(), {
  expanded: false,
  showIndicators: true,
  showWorkload: true,
  showActions: false,
  clickable: false,
})

const emit = defineEmits<Emits>()

const { canEditUser, departments } = useUsers()

const avatarLabel = computed(() => {
  const names = props.user.nombre.split(' ')
  return names.length > 1
    ? `${names[0][0]}${names[1][0]}`.toUpperCase()
    : names[0].substring(0, 2).toUpperCase()
})

const avatarClass = computed(() => {
  const baseClass = 'relative'
  return props.user.estado === 'activo' ? baseClass : `${baseClass} opacity-60`
})

const statusIndicatorClass = computed(() => {
  return props.user.estado === 'activo' ? 'bg-green-500' : 'bg-gray-400'
})

const departmentName = computed(() => {
  return formatDepartmentForDisplay(props.user, departments.value || [])
})

const statusTextClass = computed(() => {
  return props.user.estado === 'activo' ? 'text-green-600' : 'text-gray-500'
})

const workloadColorClass = computed(() => {
  if (!props.user.carga_trabajo) return 'text-gray-500'

  if (props.user.carga_trabajo >= 90) return 'text-red-600'
  if (props.user.carga_trabajo >= 70) return 'text-orange-600'
  return 'text-green-600'
})

const workloadBarClass = computed(() => {
  if (!props.user.carga_trabajo) return 'bg-gray-300'

  if (props.user.carga_trabajo >= 90) return 'bg-red-500'
  if (props.user.carga_trabajo >= 70) return 'bg-orange-500'
  return 'bg-green-500'
})

const formatLastActivity = computed(() => {
  if (!props.user.ultima_actividad) return 'Nunca'

  const date = new Date(props.user.ultima_actividad)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
})

const canEdit = computed(() => {
  return canEditUser.value(props.user)
})

const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<style scoped>
.user-quick-info {
  transition: all 0.2s ease;
}

.user-quick-info:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-quick-info.clickable {
  cursor: pointer;
}
</style>
