<template>
  <div class="space-y-6 px-4 py-5 lg:px-6 xl:px-8">
    <!-- Navegación -->
    <div class="flex items-center gap-2 text-gray-600 mb-4">
      <Button icon="pi pi-home" severity="contrast" text @click="router.push('/dashboard')"
        v-tooltip.top="'Volver al Dashboard'" />
      <i class="pi pi-chevron-right text-sm"></i>
      <span>Usuarios</span>
    </div>

    <!-- Header con título y acciones -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p class="text-gray-600 mt-1">Administración y control de usuarios del sistema</p>
      </div>

      <div class="flex gap-2">
        <Button v-if="canCreateUsers" label="Nuevo Usuario" icon="pi pi-plus"
          class="bg-blue-600 text-white hover:bg-blue-700" @click="navigateToCreate" />
      </div>
    </div>

    <!-- Filtros -->
    <Card>
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Búsqueda -->
          <div class="flex flex-col">
            <label class="text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText v-model="searchQuery" placeholder="Nombre, email o DNI..." class="w-full" />
            </IconField>
          </div>

          <!-- Filtro por rol -->
          <div class="flex flex-col">
            <label class="text-sm font-medium text-gray-700 mb-1">Rol</label>
            <Select v-model="filters.rol" :options="roleOptions" option-label="label" option-value="value"
              placeholder="Todos los roles" class="w-full" show-clear />
          </div>

        </div>

        <div class="flex justify-end mt-4">
          <Button label="Limpiar Filtros" severity="secondary" outlined size="small"
            class="!text-white border-gray-300 hover:!bg-gray-100 hover:!text-gray-700" @click="clearFilters" />
        </div>
      </template>
    </Card>

    <!-- Tabla de usuarios -->
    <Card>
      <template #content>
        <!-- Mensaje cuando no hay usuarios -->
        <div v-if="!loading && users.length === 0" class="text-center py-8">
          <i class="pi pi-users text-4xl text-gray-400 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No hay usuarios disponibles</h3>
          <p class="text-gray-600 mb-4">
            {{ canViewUsers ? 'No se encontraron usuarios en el sistema' : 'No tienes permisos para ver usuarios' }}
          </p>
          <Button v-if="canCreateUsers" label="Crear primer usuario" icon="pi pi-plus"
            class="bg-blue-600 text-white hover:bg-blue-700" @click="navigateToCreate" />
        </div>

        <DataTable v-else :value="filteredUsers" :loading="loading" paginator :rows="10" class="p-datatable-sm"
          @row-click="handleRowClick" selectionMode="single" dataKey="id">
          <Column field="nombre" header="Usuario" sortable>
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <Avatar :image="data.foto_perfil || undefined" :label="getAvatarLabel(data)" size="normal"
                  shape="circle" />
                <div>
                  <div class="font-medium text-gray-900">{{ data.nombre || data.fullName }}</div>
                  <div class="text-sm text-gray-600">{{ data.email }}</div>
                </div>
              </div>
            </template>
          </Column>

          <Column field="dni" header="DNI" sortable>
            <template #body="{ data }">
              <code class="bg-gray-100 px-2 py-1 rounded text-sm">{{ data.dni }}</code>
            </template>
          </Column>

          <Column field="rol" header="Rol" sortable>
            <template #body="{ data }">
              <UserRoleBadge v-if="data.rol || data.role || data.userRole"
                :role="data.rol || data.role || data.userRole" :user-id="data.id" />
              <span v-else class="text-gray-500">Sin rol</span>
            </template>
          </Column>

          <Column field="phone" header="Teléfono" sortable>
            <template #body="{ data }">
              <span v-if="data.phone" class="text-sm">{{ data.phone }}</span>
              <span v-else class="text-gray-400 text-sm">Sin teléfono</span>
            </template>
          </Column>






          <Column header="Acciones">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button icon="pi pi-eye" severity="info" text rounded size="small" @click.stop="viewUser(data.id)"
                  title="Ver detalle" />
                <Button v-if="canEditUser(data)" icon="pi pi-pencil" severity="warn" text rounded size="small"
                  @click.stop="editUser(data.id)" title="Editar usuario" />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuth } from '@/composables/useAuth'
import Card from 'primevue/card'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Select from 'primevue/select'
import Avatar from 'primevue/avatar'
import UserRoleBadge from '@/components/users/UserRoleBadge.vue'
import { useUsers } from '@/composables/useUsers'
import { USER_ROLE_LABELS } from '@/types/user'
import type { UserRole } from '@/types/user'

const router = useRouter()
const toast = useToast()
const { userRole } = useAuth()

const {
  users,
  departments,
  filters,
  pagination,
  loading,
  canCreateUsers,
  canEditUser,
  canViewUsers,
  fetchUsers,
  fetchDepartments,
  setFilters,
  resetFilters,
  setPagination
} = useUsers()

// Estado local
const searchQuery = ref('')


// Opciones para filtros
const roleOptions = computed(() => {
  return Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({
    value: value as UserRole,
    label
  }))
})


// Filtrado local
const filteredUsers = computed(() => {
  let filtered = users.value || []

  // Filtro de búsqueda
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    filtered = filtered.filter(user =>
      (user.nombre || '').toLowerCase().includes(search) ||
      (user.email || '').toLowerCase().includes(search) ||
      (user.dni || '').includes(search)
    )
  }

  // Filtro por rol
  if (filters.value.rol) {
    filtered = filtered.filter(user =>
      (user.rol) === filters.value.rol
    )
  }


  return filtered
})

// Utilidades
const getAvatarLabel = (user: any) => {
  const name = user.nombre || user.fullName || ''
  if (!name) return 'U'

  const names = name.split(' ')
  return names.length > 1
    ? `${names[0][0]}${names[1][0]}`.toUpperCase()
    : names[0].substring(0, 2).toUpperCase()
}


// Handlers
const handlePageChange = (event: any) => {
  // Paginación local manejada por PrimeVue
}

const handleSort = (event: any) => {
  // Ordenamiento local manejado por PrimeVue
}

const handleRowClick = (event: any) => {
  viewUser(event.data.id)
}


const viewUser = (userId: string) => {
  router.push(`/admin/usuarios/${userId}`)
}

const editUser = (userId: string) => {
  router.push(`/admin/usuarios/${userId}/editar`)
}

const navigateToCreate = () => {
  router.push('/admin/usuarios/nuevo')
}

const clearFilters = () => {
  searchQuery.value = ''
  filters.value.rol = undefined
}

// Los filtros ahora son locales, no necesitamos watchers


// Ciclo de vida
onMounted(async () => {
  try {
    await Promise.all([
      fetchUsers(),
      fetchDepartments()
    ])
    // Usuarios y departamentos cargados correctamente
  } catch (error: any) {
    console.error('Error al cargar datos:', error)
    console.error('Detalles del error:', error.response?.data || error.message)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || error.message || 'Error al cargar los datos',
      life: 5000
    })
  }
})
</script>

<style scoped>
:deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

:deep(.p-datatable-tbody > tr:hover) {
  background-color: #f8fafc;
}
</style>