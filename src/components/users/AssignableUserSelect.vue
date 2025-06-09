<template>
  <div class="assignable-user-select">
    <Select
      v-model="selectedUser"
      :options="groupedUsers"
      option-label="label"
      option-value="value"
      option-group-label="label"
      option-group-children="items"
      :placeholder="placeholder"
      :loading="loading"
      :disabled="disabled"
      :filter="filter"
      filter-placeholder="Buscar usuario..."
      :empty-filter-message="emptyFilterMessage"
      :empty-message="emptyMessage"
      class="w-full"
      @change="handleUserChange"
    >
      <!-- Template para grupos (departamentos) -->
      <template #optiongroup="{ option }">
        <div class="flex items-center gap-2 font-medium text-gray-700">
          <i class="pi pi-building text-sm"></i>
          <span>{{ option.label }}</span>
          <Badge :value="option.count" severity="secondary" size="small" />
        </div>
      </template>
      
      <!-- Template para usuarios individuales -->
      <template #option="{ option }">
        <div class="flex items-center gap-3 py-2">
          <!-- Avatar -->
          <Avatar
            :image="option.user.foto_perfil || undefined"
            :label="getAvatarLabel(option.user)"
            size="small"
            shape="circle"
            :class="{ 'opacity-60': option.user.estado !== 'activo' }"
          />
          
          <!-- Información del usuario -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900 truncate">{{ option.user.nombre }}</span>
              <UserRoleBadge 
                :role="option.user.rol"
                :user-id="option.user.id"
                size="small"
                :show-tooltip="false"
              />
            </div>
            <div class="text-sm text-gray-600 truncate">{{ option.user.email }}</div>
          </div>
          
          <!-- Indicadores -->
          <div class="flex items-center gap-2">
            <!-- Carga de trabajo -->
            <div v-if="showWorkload && option.user.carga_trabajo !== undefined" class="text-center">
              <div class="text-xs" :class="getWorkloadColorClass(option.user.carga_trabajo)">
                {{ option.user.carga_trabajo }}%
              </div>
              <div class="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  class="h-full"
                  :class="getWorkloadBarClass(option.user.carga_trabajo)"
                  :style="{ width: `${Math.min(option.user.carga_trabajo, 100)}%` }"
                ></div>
              </div>
            </div>
            
            <!-- Usuario asignable -->
            <div v-if="option.user.es_asignable" class="flex items-center justify-center w-5 h-5 bg-green-100 rounded-full">
              <i class="pi pi-check text-xs text-green-600"></i>
            </div>
            
            <!-- Tareas pendientes -->
            <div v-if="option.user.tareas_pendientes && option.user.tareas_pendientes > 0" 
                 class="flex items-center justify-center w-5 h-5 bg-orange-100 rounded-full">
              <span class="text-xs font-medium text-orange-600">{{ option.user.tareas_pendientes }}</span>
            </div>
          </div>
        </div>
      </template>
      
      <!-- Template para el valor seleccionado -->
      <template #value="{ value }">
        <div v-if="selectedUserData" class="flex items-center gap-2">
          <Avatar
            :image="selectedUserData.foto_perfil || undefined"
            :label="getAvatarLabel(selectedUserData)"
            size="small"
            shape="circle"
          />
          <span class="font-medium">{{ selectedUserData.nombre }}</span>
          <UserRoleBadge 
            :role="selectedUserData.rol"
            :user-id="selectedUserData.id"
            size="small"
            :show-tooltip="false"
          />
        </div>
        <span v-else class="text-gray-500">{{ placeholder }}</span>
      </template>
    </Select>
    
    <!-- Información adicional del usuario seleccionado -->
    <div v-if="selectedUserData && showUserInfo" class="mt-3 p-3 bg-gray-50 rounded-lg">
      <UserQuickInfo
        :user="selectedUserData"
        :expanded="false"
        :show-indicators="true"
        :show-workload="true"
        :show-actions="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Select from 'primevue/select'
import Avatar from 'primevue/avatar'
import Badge from 'primevue/badge'
import UserRoleBadge from '@/components/users/UserRoleBadge.vue'
import UserQuickInfo from '@/components/users/UserQuickInfo.vue'
import { useUsers } from '@/composables/useUsers'
import type { User } from '@/types/user'
import { formatDepartmentForDisplay } from '@/utils'

interface Props {
  modelValue?: string
  forModule?: 'contactos' | 'expedientes' | 'noticias'
  placeholder?: string
  disabled?: boolean
  filter?: boolean
  showWorkload?: boolean
  showUserInfo?: boolean
  departmentId?: string
  excludeUsers?: string[]
}

interface Emits {
  (e: 'update:modelValue', value: string | undefined): void
  (e: 'userSelected', user: User | null): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Seleccionar usuario...',
  disabled: false,
  filter: true,
  showWorkload: true,
  showUserInfo: false,
  excludeUsers: () => []
})

const emit = defineEmits<Emits>()

const { 
  assignableUsers, 
  departments, 
  loading, 
  fetchAssignableUsers, 
  fetchDepartments,
  isUserAssignable 
} = useUsers()

const selectedUser = ref<string | undefined>(props.modelValue)

const filteredUsers = computed(() => {
  let users = assignableUsers.value.filter(user => {
    // Filtrar por módulo
    if (props.forModule && !isUserAssignable(user, props.forModule)) {
      return false
    }
    
    // Filtrar por departamento
    if (props.departmentId && user.departamento_id !== props.departmentId) {
      return false
    }
    
    // Excluir usuarios específicos
    if (props.excludeUsers.includes(user.id)) {
      return false
    }
    
    return true
  })
  
  // Ordenar por carga de trabajo (menor a mayor) y luego por nombre
  return users.sort((a, b) => {
    const workloadA = a.carga_trabajo || 0
    const workloadB = b.carga_trabajo || 0
    
    if (workloadA !== workloadB) {
      return workloadA - workloadB
    }
    
    return a.nombre.localeCompare(b.nombre)
  })
})

const groupedUsers = computed(() => {
  const groups = new Map<string, { department: any, users: User[] }>()
  
  // Agrupar usuarios por departamento
  filteredUsers.value.forEach(user => {
    const deptId = user.departamento_id
    const department = departments.value.find(d => d.id === deptId)
    
    if (!groups.has(deptId)) {
      const departmentName = department ? 
        (department.nombre || department.name || 'Sin nombre') : 
        'Sin departamento'
      
      groups.set(deptId, {
        department: department || { id: deptId, nombre: departmentName },
        users: []
      })
    }
    
    groups.get(deptId)!.users.push(user)
  })
  
  // Convertir a formato esperado por PrimeVue
  return Array.from(groups.values())
    .sort((a, b) => a.department.nombre.localeCompare(b.department.nombre))
    .map(group => ({
      label: group.department.nombre,
      count: group.users.length,
      items: group.users.map(user => ({
        label: user.nombre,
        value: user.id,
        user
      }))
    }))
})

const selectedUserData = computed(() => {
  if (!selectedUser.value) return null
  return assignableUsers.value.find(user => user.id === selectedUser.value) || null
})

const emptyMessage = computed(() => {
  if (props.forModule) {
    return `No hay usuarios asignables para ${props.forModule}`
  }
  return 'No hay usuarios asignables'
})

const emptyFilterMessage = computed(() => {
  return 'No se encontraron usuarios con ese criterio'
})

const getAvatarLabel = (user: User) => {
  const names = user.nombre.split(' ')
  return names.length > 1 
    ? `${names[0][0]}${names[1][0]}`.toUpperCase()
    : names[0].substring(0, 2).toUpperCase()
}

const getWorkloadColorClass = (workload: number) => {
  if (workload >= 90) return 'text-red-600'
  if (workload >= 70) return 'text-orange-600'
  return 'text-green-600'
}

const getWorkloadBarClass = (workload: number) => {
  if (workload >= 90) return 'bg-red-500'
  if (workload >= 70) return 'bg-orange-500'
  return 'bg-green-500'
}

const handleUserChange = () => {
  emit('update:modelValue', selectedUser.value)
  emit('userSelected', selectedUserData.value)
}

// Cargar datos al montar el componente
onMounted(async () => {
  try {
    await Promise.all([
      fetchAssignableUsers(props.forModule),
      fetchDepartments()
    ])
  } catch (error) {
    console.error('Error loading assignable users:', error)
  }
})

// Sincronizar con el modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    selectedUser.value = newValue
  }
)

// Recargar usuarios cuando cambie el módulo
watch(
  () => props.forModule,
  (newModule) => {
    fetchAssignableUsers(newModule)
  }
)
</script>

<style scoped>
.assignable-user-select :deep(.p-select-panel) {
  max-width: 400px;
}

.assignable-user-select :deep(.p-select-items-wrapper) {
  max-height: 300px;
}
</style>