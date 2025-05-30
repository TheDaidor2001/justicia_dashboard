<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useExpedientes } from '@/composables/useExpedientes'
import { useVuelidate } from '@vuelidate/core'
import { required, minLength, maxLength } from '@vuelidate/validators'
import type { CreateExpedienteDto, UpdateExpedienteDto } from '@/types/expediente'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { createExpediente, updateExpediente, fetchExpedienteById } = useExpedientes()

// Estado del formulario
const isEditMode = computed(() => !!route.params.id)
const expedienteId = computed(() => route.params.id as string)
const loading = ref(false)
const submitting = ref(false)

// Datos del formulario
const formData = ref({
    title: '',
    description: '',
    departmentId: ''
})

// Departamentos mock (después lo traeremos del backend)
const departments = ref([
    { id: 'dep_aud001', name: 'Audiencia Provincial de Malabo' },
    { id: 'dep_aud002', name: 'Audiencia Provincial de Bata' },
    { id: 'dep_aud003', name: 'Audiencia Provincial de Centro-Sur' },
    { id: 'dep_aud004', name: 'Audiencia Provincial de Kie-Ntem' },
    { id: 'dep_aud005', name: 'Audiencia Provincial de Wele-Nzas' }
])

// Reglas de validación
const rules = {
    title: {
        required,
        minLength: minLength(5),
        maxLength: maxLength(200)
    },
    description: {
        maxLength: maxLength(1000)
    },
    departmentId: {
        required
    }
}

const v$ = useVuelidate(rules, formData)

// Cargar expediente si es modo edición
onMounted(async () => {
    if (isEditMode.value) {
        loading.value = true
        try {
            const result = await fetchExpedienteById(expedienteId.value)
            if (result.success && result.data) {
                formData.value = {
                    title: result.data.title,
                    description: result.data.description || '',
                    departmentId: result.data.departmentId
                }
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar el expediente',
                    life: 3000
                })
                router.push('/expedientes')
            }
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al cargar el expediente',
                life: 3000
            })
            router.push('/expedientes')
        } finally {
            loading.value = false
        }
    }
})

// Métodos
const handleSubmit = async () => {
    const isValid = await v$.value.$validate()

    if (!isValid) {
        toast.add({
            severity: 'error',
            summary: 'Error de validación',
            detail: 'Por favor, corrije los errores en el formulario',
            life: 3000
        })
        return
    }

    submitting.value = true

    try {
        let result

        if (isEditMode.value) {
            // Modo edición
            const updateData: UpdateExpedienteDto = {
                title: formData.value.title,
                description: formData.value.description
            }
            result = await updateExpediente(expedienteId.value, updateData)
        } else {
            // Modo creación
            const createData: CreateExpedienteDto = {
                title: formData.value.title,
                description: formData.value.description,
                departmentId: formData.value.departmentId
            }
            result = await createExpediente(createData)
        }

        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: isEditMode.value ? 'Expediente actualizado correctamente' : 'Expediente creado correctamente',
                life: 3000
            })

            // Redirigir a la lista
            setTimeout(() => {
                router.push('/expedientes')
            }, 1000)
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message || 'Error al guardar el expediente',
                life: 3000
            })
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error inesperado al guardar el expediente',
            life: 3000
        })
    } finally {
        submitting.value = false
    }
}

const handleCancel = () => {
    router.push('/expedientes')
}

// Helpers para mensajes de error
const getErrorMessage = (field: string) => {
    const errors = v$.value[field].$errors
    if (errors.length > 0) {
        const error = errors[0]
        switch (error.$validator) {
            case 'required':
                return 'Este campo es obligatorio'
            case 'minLength':
                return `Mínimo ${error.$params.min} caracteres`
            case 'maxLength':
                return `Máximo ${error.$params.max} caracteres`
            default:
                return 'Campo inválido'
        }
    }
    return ''
}
</script>

<template>
    <div class="p-6 max-w-4xl mx-auto">
        <Toast />

        <!-- Header -->
        <div class="mb-6">
            <div class="flex items-center gap-2 text-gray-600 mb-2">
                <i class="pi pi-arrow-left cursor-pointer" @click="handleCancel"></i>
                <span>Volver a expedientes</span>
            </div>
            <h1 class="text-3xl font-bold text-gray-900">
                {{ isEditMode ? 'Editar Expediente' : 'Nuevo Expediente' }}
            </h1>
            <p class="text-gray-600 mt-2">
                {{ isEditMode ? 'Modifica los datos del expediente' : 'Completa el formulario para crear un nuevo expediente judicial' }}
            </p>
        </div>

        <!-- Formulario -->
        <Card>
            <template #content>
                <form @submit.prevent="handleSubmit" class="space-y-6">
                    <!-- Título -->
                    <div>
                        <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                            Título del Expediente <span class="text-red-500">*</span>
                        </label>
                        <InputText id="title" v-model="formData.title" class="w-full"
                            :class="{ 'p-invalid': v$.title.$error }"
                            placeholder="Ej: Demanda Civil - Incumplimiento de Contrato"
                            :disabled="loading || submitting" />
                        <small v-if="v$.title.$error" class="p-error">
                            {{ getErrorMessage('title') }}
                        </small>
                    </div>

                    <!-- Descripción -->
                    <div>
                        <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                            Descripción
                        </label>
                        <Textarea id="description" v-model="formData.description" rows="4" class="w-full"
                            :class="{ 'p-invalid': v$.description.$error }"
                            placeholder="Descripción detallada del caso (opcional)" :disabled="loading || submitting" />
                        <small v-if="v$.description.$error" class="p-error">
                            {{ getErrorMessage('description') }}
                        </small>
                        <small class="text-gray-500">
                            {{ formData.description.length }}/1000 caracteres
                        </small>
                    </div>

                    <!-- Departamento (solo en modo creación) -->
                    <div v-if="!isEditMode">
                        <label for="department" class="block text-sm font-medium text-gray-700 mb-2">
                            Departamento <span class="text-red-500">*</span>
                        </label>
                        <Dropdown id="department" v-model="formData.departmentId" :options="departments"
                            optionLabel="name" optionValue="id" placeholder="Selecciona un departamento" class="w-full"
                            :class="{ 'p-invalid': v$.departmentId.$error }" :disabled="loading || submitting" />
                        <small v-if="v$.departmentId.$error" class="p-error">
                            {{ getErrorMessage('departmentId') }}
                        </small>
                    </div>

                    <!-- Nota informativa -->
                    <Message severity="info" :closable="false">
                        <i class="pi pi-info-circle mr-2"></i>
                        {{ isEditMode
                            ? 'Solo puedes editar expedientes en estado borrador o rechazados.'
                            : 'Una vez creado, el expediente quedará en estado borrador hasta que lo envíes para aprobación.'
                        }}
                    </Message>

                    <!-- Botones -->
                    <div class="flex justify-end gap-2 pt-4 border-t">
                        <Button label="Cancelar" severity="secondary" outlined @click="handleCancel"
                            :disabled="submitting" />
                        <Button type="submit" :label="isEditMode ? 'Guardar Cambios' : 'Crear Expediente'"
                            :icon="submitting ? 'pi pi-spinner pi-spin' : 'pi pi-save'"
                            :disabled="loading || submitting" />
                    </div>
                </form>
            </template>
        </Card>
    </div>
</template>

<style scoped>
:deep(.p-invalid) {
    border-color: #e24c4c;
}

:deep(.p-error) {
    color: #e24c4c;
    font-size: 0.875rem;
    margin-top: 0.25rem;
    display: block;
}
</style>