<template>
  <div class="space-y-6 px-4 py-5 lg:px-6 xl:px-8">
    <!-- Navegación -->
    <div class="flex items-center gap-2 text-gray-600 mb-4">
      <Button
        icon="pi pi-home"
        severity="contrast"
        text
        @click="router.push('/dashboard')"
        v-tooltip.top="'Volver al Dashboard'"
      />
      <i class="pi pi-chevron-right text-sm"></i>
      <span>Usuarios</span>
      <i class="pi pi-chevron-right text-sm"></i>
      <span>Editar</span>
    </div>

    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Editar Usuario</h1>
        <p class="text-gray-600 mt-1">Modificar información del usuario</p>
      </div>

      <div class="flex gap-2">
        <Button
          label="Cancelar"
          severity="secondary"
          outlined
          class="!bg-white !text-gray-700 !border-gray-300 hover:!bg-gray-50"
          @click="goBack"
        />
        <Button
          label="Guardar"
          icon="pi pi-save"
          :loading="loading"
          class="bg-blue-600 text-white hover:bg-blue-700"
          @click="saveUser"
        />
      </div>
    </div>

    <!-- Formulario -->
    <Card>
      <template #content>
        <form @submit.prevent="saveUser" class="space-y-6">
          <!-- Información Personal -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label for="email" class="text-sm font-medium text-gray-700"> Email </label>
              <InputText
                id="email"
                v-model="userForm.email"
                disabled
                placeholder="correo@ejemplo.com"
                class="w-full"
              />
              <small class="text-gray-500">El email no puede modificarse</small>
            </div>

            <div class="space-y-2">
              <label for="dni" class="text-sm font-medium text-gray-700"> DNI </label>
              <InputText
                id="dni"
                v-model="userForm.dni"
                disabled
                placeholder="12345678"
                class="w-full"
              />
              <small class="text-gray-500">El DNI no puede modificarse</small>
            </div>

            <div class="space-y-2">
              <label for="nombre" class="text-sm font-medium text-gray-700">
                Nombre Completo *
              </label>
              <InputText
                id="nombre"
                v-model="userForm.nombre"
                placeholder="Juan Pérez García"
                class="w-full"
                required
              />
            </div>

            <div class="space-y-2">
              <label for="telefono" class="text-sm font-medium text-gray-700"> Teléfono </label>
              <InputText
                id="telefono"
                v-model="userForm.telefono"
                placeholder="+503 7000-0000"
                class="w-full"
              />
            </div>
          </div>

          <!-- Información del Sistema -->
          <Divider />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label for="rol" class="text-sm font-medium text-gray-700"> Rol * </label>
              <Select
                id="rol"
                v-model="userForm.rol"
                :options="roleOptions"
                option-label="label"
                option-value="value"
                placeholder="Seleccionar rol"
                class="w-full"
              />
            </div>

            <div v-if="requiresDepartment" class="space-y-2">
              <label for="departamento" class="text-sm font-medium text-gray-700">
                Departamento *
              </label>
              <Select
                id="departamento"
                v-model="userForm.departamento_id"
                :options="departments"
                optionLabel="name"
                optionValue="id"
                placeholder="Seleccionar departamento"
                class="w-full"
                :loading="loadingDepartments"
              />
            </div>
            <div v-else class="space-y-2">
              <label class="text-sm font-medium text-gray-500"> Departamento </label>
              <p class="text-sm text-gray-400 italic">
                Este rol no requiere departamento específico
              </p>
            </div>
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/users'
import { userService } from '@/services/user.service'
import { useToast } from 'primevue/usetoast'
import type { UserRoleType, UpdateUserRequest, Department } from '@/types/user'
import { USER_ROLE_LABELS } from '@/types/user'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Divider from 'primevue/divider'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const toast = useToast()

const loading = ref(false)
const loadingDepartments = ref(false)
const userId = computed(() => route.params.id as string)

const userForm = ref({
  email: '',
  dni: '',
  nombre: '',
  telefono: '',
  rol: '' as UserRoleType | '',
  departamento_id: '',
})

const roleOptions = computed(() =>
  Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
)

// Roles que requieren departamento
const rolesWithDepartment = ['juez', 'presidente_audiencia', 'secretario_general']

// Verificar si el rol seleccionado requiere departamento
const requiresDepartment = computed(() => {
  return rolesWithDepartment.includes(userForm.value.rol)
})

// Limpiar departamento cuando se cambia a un rol que no lo requiere
watch(
  () => userForm.value.rol,
  (newRole) => {
    if (!rolesWithDepartment.includes(newRole)) {
      userForm.value.departamento_id = ''
    }
  },
)

const departments = computed(() => {
  return (
    userStore.departments?.map((dept: Department) => ({
      id: dept.id,
      name: dept.nombre || dept.name || `Departamento ${dept.id}`,
      label: dept.nombre || dept.name || `Departamento ${dept.id}`,
    })) || []
  )
})

const loadUser = async () => {
  try {
    loading.value = true
    const response = await userService.getUserById(userId.value)

    // Extraer el usuario de la respuesta
    const userData = response

    console.log('User data loaded:', userData)

    userForm.value.email = userData.email
    userForm.value.dni = userData.dni
    userForm.value.nombre = userData.nombre || ''
    userForm.value.telefono = userData.telefono || ''
    userForm.value.rol = userData.rol || ''
    userForm.value.departamento_id = userData.departamento_id || ''
  } catch (error: any) {
    console.error('Error al cargar usuario:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al cargar usuario',
      life: 3000,
    })
    goBack()
  } finally {
    loading.value = false
  }
}

const loadDepartments = async () => {
  try {
    loadingDepartments.value = true
    await userStore.fetchDepartments()
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar departamentos',
      life: 3000,
    })
  } finally {
    loadingDepartments.value = false
  }
}

const goBack = () => {
  router.push('/admin/usuarios')
}

const saveUser = async () => {
  loading.value = true
  try {
    const updateData: UpdateUserRequest = {
      nombre: userForm.value.nombre,
      telefono: userForm.value.telefono || undefined,
      rol: userForm.value.rol as UserRoleType,
      departamento_id: userForm.value.departamento_id,
    }

    await userStore.updateUser(userId.value, updateData)

    toast.add({
      severity: 'success',
      summary: 'Usuario actualizado',
      detail: 'Los datos del usuario se han actualizado correctamente',
      life: 3000,
    })

    goBack()
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al actualizar usuario',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadDepartments(), loadUser()])
  } catch (error) {
    console.error('Error en onMounted:', error)
  }
})
</script>

<style scoped>
.p-invalid {
  border-color: rgb(239 68 68) !important;
}
</style>
