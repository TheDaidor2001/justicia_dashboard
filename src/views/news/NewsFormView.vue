<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNews } from '@/composables/useNews'
import { useVuelidate } from '@vuelidate/core'
import { required, minLength, maxLength } from '@vuelidate/validators'
import { NewsType, getNewsTypeLabel } from '@/types/news'
import type { CreateNewsDto, UpdateNewsDto } from '@/types/news'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Toast from 'primevue/toast'
import FileUpload from 'primevue/fileupload'
import Image from 'primevue/image'
import Editor from 'primevue/editor'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { createNews, updateNews, fetchNewsById } = useNews()

// Estado del formulario
const isEditMode = computed(() => !!route.params.id)
const newsId = computed(() => route.params.id as string)
const loading = ref(false)
const submitting = ref(false)

// Datos del formulario
const formData = ref({
    title: '',
    subtitle: '',
    content: '',
    type: NewsType.NOTICIA
})

// Imagen
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const existingImageUrl = ref<string | null>(null)

// Tipos de noticia disponibles
const newsTypes = [
    { value: NewsType.NOTICIA, label: 'Noticia', description: 'Requiere aprobación presidencial' },
    { value: NewsType.AVISO, label: 'Aviso', description: 'Solo requiere aprobación del director' },
    { value: NewsType.COMUNICADO, label: 'Comunicado', description: 'Solo requiere aprobación del director' }
]

// Reglas de validación
const rules = {
    title: {
        required,
        minLength: minLength(5),
        maxLength: maxLength(200)
    },
    subtitle: {
        maxLength: maxLength(300)
    },
    content: {
        required,
        minLength: minLength(10)
    },
    type: {
        required
    }
}

const v$ = useVuelidate(rules, formData)

// Cargar noticia si es modo edición
onMounted(async () => {
    if (isEditMode.value) {
        loading.value = true
        try {
            const result = await fetchNewsById(newsId.value)
            if (result.success && result.data) {
                formData.value = {
                    title: result.data.title,
                    subtitle: result.data.subtitle || '',
                    content: result.data.content,
                    type: result.data.type
                }
                existingImageUrl.value = result.data.imageUrl || null
            } else {
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar la noticia',
                    life: 3000
                })
                router.push('/noticias')
            }
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al cargar la noticia',
                life: 3000
            })
            router.push('/noticias')
        } finally {
            loading.value = false
        }
    }
})

// Manejar selección de imagen
const onImageSelect = (event: any) => {
    const file = event.files[0]
    if (file) {
        imageFile.value = file

        // Crear preview
        const reader = new FileReader()
        reader.onload = (e) => {
            imagePreview.value = e.target?.result as string
        }
        reader.readAsDataURL(file)
    }
}

// Remover imagen
const removeImage = () => {
    imageFile.value = null
    imagePreview.value = null
}

// Enviar formulario
const submitForm = async () => {
    const isValid = await v$.value.$validate()

    if (!isValid) {
        toast.add({
            severity: 'error',
            summary: 'Error de validación',
            detail: 'Por favor, corrija los errores en el formulario',
            life: 3000
        })
        return
    }

    submitting.value = true

    try {
        let result

        if (isEditMode.value) {
            // Modo edición
            const updateData: UpdateNewsDto = {
                title: formData.value.title,
                subtitle: formData.value.subtitle,
                content: formData.value.content
            }

            if (imageFile.value) {
                updateData.image = imageFile.value
            }

            result = await updateNews(newsId.value, updateData)
        } else {
            // Modo creación
            const createData: CreateNewsDto = {
                title: formData.value.title,
                subtitle: formData.value.subtitle,
                content: formData.value.content,
                type: formData.value.type,
                image: imageFile.value || undefined
            }

            result = await createNews(createData)
        }

        if (result.success) {
            toast.add({
                severity: 'success',
                summary: 'Éxito',
                detail: isEditMode.value ? 'Noticia actualizada correctamente' : 'Noticia creada correctamente',
                life: 3000
            })

            // Redirigir al detalle
            setTimeout(() => {
                if (result.data?.id) {
                    router.push(`/noticias/${result.data.id}`)
                } else {
                    router.push('/noticias')
                }
            }, 1000)
        } else {
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: result.message || 'Error al guardar la noticia',
                life: 3000
            })
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error inesperado al guardar la noticia',
            life: 3000
        })
    } finally {
        submitting.value = false
    }
}

// Cancelar
const handleCancel = () => {
    router.push('/noticias')
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

// Obtener imagen actual
const currentImage = computed(() => {
    if (imagePreview.value) return imagePreview.value
    if (existingImageUrl.value) return existingImageUrl.value
    return null
})
</script>

<template>
    <div class="p-6 max-w-5xl mx-auto">
        <Toast />

        <!-- Header -->
        <div class="mb-6">
            <div class="flex items-center gap-2 text-gray-600 mb-2">
                <i class="pi pi-arrow-left cursor-pointer" @click="handleCancel"></i>
                <span>Volver a noticias</span>
            </div>
            <h1 class="text-3xl font-bold text-gray-900">
                {{ isEditMode ? 'Editar Noticia' : 'Nueva Noticia' }}
            </h1>
            <p class="text-gray-600 mt-2">
                {{ isEditMode
                    ? 'Modifica los datos de la noticia'
                    : 'Completa el formulario para crear una nueva publicación'
                }}
            </p>
        </div>

        <!-- Formulario -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Columna principal (2/3) -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Información básica -->
                <Card>
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-info-circle text-xl"></i>
                            <span>Información Básica</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-6">
                            <!-- Título -->
                            <div>
                                <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                                    Título <span class="text-red-500">*</span>
                                </label>
                                <InputText id="title" v-model="formData.title" class="w-full"
                                    :class="{ 'p-invalid': v$.title.$error }"
                                    placeholder="Título principal de la noticia" :disabled="loading || submitting" />
                                <small v-if="v$.title.$error" class="p-error">
                                    {{ getErrorMessage('title') }}
                                </small>
                            </div>

                            <!-- Subtítulo -->
                            <div>
                                <label for="subtitle" class="block text-sm font-medium text-gray-700 mb-2">
                                    Subtítulo
                                </label>
                                <InputText id="subtitle" v-model="formData.subtitle" class="w-full"
                                    :class="{ 'p-invalid': v$.subtitle.$error }"
                                    placeholder="Subtítulo o resumen breve (opcional)"
                                    :disabled="loading || submitting" />
                                <small v-if="v$.subtitle.$error" class="p-error">
                                    {{ getErrorMessage('subtitle') }}
                                </small>
                            </div>

                            <!-- Tipo (solo en creación) -->
                            <div v-if="!isEditMode">
                                <label for="type" class="block text-sm font-medium text-gray-700 mb-2">
                                    Tipo de Publicación <span class="text-red-500">*</span>
                                </label>
                                <Select id="type" v-model="formData.type" :options="newsTypes" optionLabel="label"
                                    optionValue="value" class="w-full" :class="{ 'p-invalid': v$.type.$error }"
                                    :disabled="loading || submitting">
                                    <template #option="slotProps">
                                        <div>
                                            <div class="font-medium">{{ slotProps.option.label }}</div>
                                            <div class="text-xs text-gray-500">{{ slotProps.option.description }}</div>
                                        </div>
                                    </template>
                                </Select>
                                <small v-if="v$.type.$error" class="p-error">
                                    {{ getErrorMessage('type') }}
                                </small>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Contenido -->
                <Card>
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-file-edit text-xl"></i>
                            <span>Contenido</span>
                        </div>
                    </template>
                    <template #content>
                        <div>
                            <label for="content" class="block text-sm font-medium text-gray-700 mb-2">
                                Contenido de la Noticia <span class="text-red-500">*</span>
                            </label>
                            <Editor v-model="formData.content" editorStyle="height: 320px"
                                :class="{ 'p-invalid': v$.content.$error }">
                                <template #toolbar>
                                    <span class="ql-formats">
                                        <select class="ql-header">
                                            <option value="1">Título 1</option>
                                            <option value="2">Título 2</option>
                                            <option value="3">Título 3</option>
                                            <option selected>Normal</option>
                                        </select>
                                    </span>
                                    <span class="ql-formats">
                                        <button class="ql-bold"></button>
                                        <button class="ql-italic"></button>
                                        <button class="ql-underline"></button>
                                    </span>
                                    <span class="ql-formats">
                                        <button class="ql-list" value="ordered"></button>
                                        <button class="ql-list" value="bullet"></button>
                                        <select class="ql-align">
                                            <option selected></option>
                                            <option value="center"></option>
                                            <option value="right"></option>
                                            <option value="justify"></option>
                                        </select>
                                    </span>
                                    <span class="ql-formats">
                                        <button class="ql-link"></button>
                                        <button class="ql-clean"></button>
                                    </span>
                                </template>
                            </Editor>
                            <small v-if="v$.content.$error" class="p-error">
                                {{ getErrorMessage('content') }}
                            </small>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- Columna lateral (1/3) -->
            <div class="space-y-6">
                <!-- Imagen -->
                <Card>
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-image text-xl"></i>
                            <span>Imagen Destacada</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-4">
                            <!-- Preview de imagen -->
                            <div v-if="currentImage" class="relative">
                                <Image :src="currentImage" alt="Preview" class="w-full rounded" preview />
                                <Button v-if="!isEditMode || imagePreview" icon="pi pi-times" severity="danger" rounded
                                    text class="absolute top-2 right-2 bg-white shadow" @click="removeImage"
                                    v-tooltip.top="'Quitar imagen'" />
                            </div>

                            <!-- Upload de imagen -->
                            <FileUpload mode="basic" accept="image/*" :maxFileSize="5000000" @select="onImageSelect"
                                :chooseLabel="currentImage ? 'Cambiar imagen' : 'Seleccionar imagen'"
                                :disabled="loading || submitting" class="w-full" />

                            <p class="text-xs text-gray-500">
                                Formatos: JPG, PNG, GIF. Máximo 5MB.
                            </p>
                        </div>
                    </template>
                </Card>

                <!-- Información del tipo -->
                <Card v-if="!isEditMode">
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-info-circle text-xl"></i>
                            <span>Flujo de Aprobación</span>
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-3">
                            <div v-if="formData.type === NewsType.NOTICIA" class="text-sm">
                                <p class="font-semibold text-blue-600 mb-2">Noticia</p>
                                <ol class="list-decimal list-inside space-y-1 text-gray-600">
                                    <li>Enviar al Director de Prensa</li>
                                    <li>Aprobación del Director</li>
                                    <li>Aprobación del Presidente CSPJ</li>
                                    <li>Publicación automática</li>
                                </ol>
                            </div>

                            <div v-else-if="formData.type === NewsType.AVISO" class="text-sm">
                                <p class="font-semibold text-orange-600 mb-2">Aviso</p>
                                <ol class="list-decimal list-inside space-y-1 text-gray-600">
                                    <li>Enviar al Director de Prensa</li>
                                    <li>Aprobación del Director</li>
                                    <li>Publicación automática</li>
                                </ol>
                            </div>

                            <div v-else-if="formData.type === NewsType.COMUNICADO" class="text-sm">
                                <p class="font-semibold text-purple-600 mb-2">Comunicado</p>
                                <ol class="list-decimal list-inside space-y-1 text-gray-600">
                                    <li>Enviar al Director de Prensa</li>
                                    <li>Aprobación del Director</li>
                                    <li>Publicación automática</li>
                                </ol>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- Acciones -->
                <Card>
                    <template #content>
                        <div class="space-y-3">
                            <Button type="button" :label="isEditMode ? 'Guardar Cambios' : 'Crear Noticia'"
                                :icon="submitting ? 'pi pi-spinner pi-spin' : 'pi pi-save'"
                                :disabled="loading || submitting" @click="submitForm" class="w-full" />

                            <Button label="Cancelar" severity="secondary" outlined @click="handleCancel"
                                :disabled="submitting" class="w-full" />
                        </div>
                    </template>
                </Card>
            </div>
        </div>
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

:deep(.p-editor) {
    .p-editor-toolbar {
        background: #f8f9fa;
    }

    .p-editor-content {
        .ql-editor {
            min-height: 200px;
            font-size: 1rem;
            line-height: 1.6;
        }
    }
}
</style>