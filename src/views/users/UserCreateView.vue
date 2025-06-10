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
      <span>Nuevo</span>
    </div>

    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Nuevo Usuario</h1>
        <p class="text-gray-600 mt-1">Crear un nuevo usuario del sistema</p>
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
          :disabled="$v.$invalid"
          class="bg-blue-600 text-white hover:bg-blue-700"
          @click="createUser"
        />
      </div>
    </div>

    <!-- Formulario -->
    <Card>
      <template #content>
        <form @submit.prevent="createUser" class="space-y-6">
          <!-- Información Personal -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label for="email" class="text-sm font-medium text-gray-700"> Email * </label>
              <InputText
                id="email"
                v-model="userForm.email"
                :class="{ 'p-invalid': $v.email.$error }"
                placeholder="correo@ejemplo.com"
                class="w-full"
              />
              <small v-if="$v.email.$error" class="text-red-500">
                {{ $v.email.$errors[0]?.$message }}
              </small>
            </div>

            <div class="space-y-2">
              <label for="dni" class="text-sm font-medium text-gray-700"> DNI * </label>
              <InputText
                id="dni"
                v-model="userForm.dni"
                :class="{ 'p-invalid': $v.dni.$error }"
                placeholder="123456"
                class="w-full"
              />
              <small v-if="$v.dni.$error" class="text-red-500">
                {{ $v.dni.$errors[0]?.$message }}
              </small>
            </div>

            <div class="space-y-2">
              <label for="nombre" class="text-sm font-medium text-gray-700">
                Nombre Completo *
              </label>
              <InputText
                id="nombre"
                v-model="userForm.nombre"
                :class="{ 'p-invalid': $v.nombre.$error }"
                placeholder="Juan Pérez García"
                class="w-full"
              />
              <small v-if="$v.nombre.$error" class="text-red-500">
                {{ $v.nombre.$errors[0]?.$message }}
              </small>
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
                :class="{ 'p-invalid': $v.rol.$error }"
                placeholder="Seleccionar rol"
                class="w-full"
              />
              <small v-if="$v.rol.$error" class="text-red-500">
                {{ $v.rol.$errors[0]?.$message }}
              </small>
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
                :class="{ 'p-invalid': $v.departamento_id.$error }"
                placeholder="Seleccionar departamento"
                class="w-full"
                :loading="loadingDepartments"
              />
              <small v-if="$v.departamento_id.$error" class="text-red-500">
                {{ $v.departamento_id.$errors[0]?.$message }}
              </small>
            </div>
            <div v-else class="space-y-2">
              <label class="text-sm font-medium text-gray-500"> Departamento </label>
              <p class="text-sm text-gray-400 italic">
                Este rol no requiere departamento específico
              </p>
            </div>
          </div>

          <!-- Contraseña -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label for="password" class="text-sm font-medium text-gray-700"> Contraseña * </label>
              <Password
                id="password"
                v-model="userForm.password"
                :class="{ 'p-invalid': $v.password.$error }"
                placeholder="Contraseña"
                toggle-mask
                class="w-full"
                :feedback="false"
              />
              <small v-if="$v.password.$error" class="text-red-500">
                {{ $v.password.$errors[0]?.$message }}
              </small>
            </div>

            <div class="space-y-2">
              <label for="confirmPassword" class="text-sm font-medium text-gray-700">
                Confirmar Contraseña *
              </label>
              <Password
                id="confirmPassword"
                v-model="userForm.confirmPassword"
                :class="{ 'p-invalid': $v.confirmPassword.$error }"
                placeholder="Confirmar contraseña"
                toggle-mask
                class="w-full"
                :feedback="false"
              />
              <small v-if="$v.confirmPassword.$error" class="text-red-500">
                {{ $v.confirmPassword.$errors[0]?.$message }}
              </small>
            </div>
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength, sameAs, helpers } from '@vuelidate/validators'
import { useUserStore } from '@/stores/users'
import { useToast } from 'primevue/usetoast'
import type { UserRole } from '@/types/user'
import { USER_ROLE_LABELS } from '@/types/user'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Password from 'primevue/password'
import Divider from 'primevue/divider'

const router = useRouter()
const userStore = useUserStore()
const toast = useToast()

const loading = ref(false)
const loadingDepartments = ref(false)

const userForm = ref({
  email: '',
  dni: '',
  nombre: '',
  telefono: '',
  rol: '' as UserRole | '',
  departamento_id: '',
  password: '',
  confirmPassword: '',
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

// Activar validaciones cuando los campos cambien
watch(
  () => userForm.value.email,
  () => $v.value.email.$touch(),
  { flush: 'post' },
)
watch(
  () => userForm.value.dni,
  () => $v.value.dni.$touch(),
  { flush: 'post' },
)
watch(
  () => userForm.value.nombre,
  () => $v.value.nombre.$touch(),
  { flush: 'post' },
)
watch(
  () => userForm.value.rol,
  () => $v.value.rol.$touch(),
  { flush: 'post' },
)
watch(
  () => userForm.value.departamento_id,
  () => {
    if ($v.value.departamento_id) {
      $v.value.departamento_id.$touch()
    }
  },
  { flush: 'post' },
)
watch(
  () => userForm.value.password,
  () => $v.value.password.$touch(),
  { flush: 'post' },
)
watch(
  () => userForm.value.confirmPassword,
  () => $v.value.confirmPassword.$touch(),
  { flush: 'post' },
)

const dniValidator = helpers.withMessage(
  'El DNI debe tener mínimo 6 caracteres',
  (value: string) => !value || value.length >= 6,
)

const validationRules = computed(() => {
  const baseRules = {
    email: { required, email },
    dni: { required, dniValidator },
    nombre: { required, minLength: minLength(3) },
    telefono: {},
    rol: { required },
    password: { required, minLength: minLength(8) },
    confirmPassword: {
      required,
      sameAs: sameAs(
        computed(() => userForm.value.password),
        'contraseña',
      ),
    },
  }

  // Solo agregar validación de departamento si es requerido
  if (requiresDepartment.value) {
    baseRules.departamento_id = { required }
  }

  return baseRules
})

const $v = useVuelidate(validationRules, userForm)

const departments = computed(() => {
  return (
    userStore.departments?.map((dept) => ({
      id: dept.id,
      name: dept.nombre || dept.name || `Departamento ${dept.id}`,
      label: dept.nombre || dept.name || `Departamento ${dept.id}`,
    })) || []
  )
})

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

const createUser = async () => {
  const isValid = await $v.value.$validate()

  if (!isValid) {
    toast.add({
      severity: 'warn',
      summary: 'Formulario incompleto',
      detail: 'Por favor complete todos los campos requeridos',
      life: 3000,
    })
    return
  }

  loading.value = true
  try {
    const createData = {
      email: userForm.value.email,
      dni: userForm.value.dni,
      fullName: userForm.value.nombre,
      phone: userForm.value.telefono || undefined,
      role: userForm.value.rol as UserRole,
      departmentId: userForm.value.departamento_id,
      password: userForm.value.password,
    }

    await userStore.createUser(createData)

    toast.add({
      severity: 'success',
      summary: 'Usuario creado',
      detail: 'El usuario se ha creado correctamente',
      life: 3000,
    })

    goBack()
  } catch (error: any) {
    console.error('Error al crear usuario:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Error al crear usuario',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    await loadDepartments()
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
