<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NewsType, NewsStatus, getNewsTypeLabel, getNewsStatusLabel } from '@/types/news'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Calendar from 'primevue/calendar'
import Button from 'primevue/button'
import Card from 'primevue/card'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

interface Props {
    modelValue: {
        search?: string
        type?: NewsType
        status?: NewsStatus
        dateFrom?: string
        dateTo?: string
        departmentId?: string
    }
    departments?: Array<{ id: string; name: string }>
    showAdvanced?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    departments: () => [],
    showAdvanced: false
})

const emit = defineEmits<{
    'update:modelValue': [value: typeof props.modelValue]
    'search': []
    'reset': []
}>()

// Estado local
const localFilters = ref({ ...props.modelValue })
const showAdvancedFilters = ref(false)

// Fix para el error de TypeScript: usar undefined en lugar de null
const dateFrom = ref<Date | undefined>(
    props.modelValue.dateFrom ? new Date(props.modelValue.dateFrom) : undefined
)
const dateTo = ref<Date | undefined>(
    props.modelValue.dateTo ? new Date(props.modelValue.dateTo) : undefined
)

// Opciones de filtros
const typeOptions = [
    { label: 'Todos los tipos', value: undefined },
    { label: getNewsTypeLabel(NewsType.NOTICIA), value: NewsType.NOTICIA },
    { label: getNewsTypeLabel(NewsType.AVISO), value: NewsType.AVISO },
    { label: getNewsTypeLabel(NewsType.COMUNICADO), value: NewsType.COMUNICADO }
]

const statusOptions = [
    { label: 'Todos los estados', value: undefined },
    { label: getNewsStatusLabel(NewsStatus.DRAFT), value: NewsStatus.DRAFT },
    { label: getNewsStatusLabel(NewsStatus.PENDING_DIRECTOR), value: NewsStatus.PENDING_DIRECTOR },
    { label: getNewsStatusLabel(NewsStatus.PENDING_PRESIDENT), value: NewsStatus.PENDING_PRESIDENT },
    { label: getNewsStatusLabel(NewsStatus.PUBLISHED), value: NewsStatus.PUBLISHED },
    { label: getNewsStatusLabel(NewsStatus.REJECTED), value: NewsStatus.REJECTED }
]

const departmentOptions = computed(() => [
    { label: 'Todos los departamentos', value: undefined },
    ...props.departments.map(dept => ({ label: dept.name, value: dept.id }))
])

// Watchers
watch(() => props.modelValue, (newVal) => {
    localFilters.value = { ...newVal }
    dateFrom.value = newVal.dateFrom ? new Date(newVal.dateFrom) : undefined
    dateTo.value = newVal.dateTo ? new Date(newVal.dateTo) : undefined
}, { deep: true })

watch([dateFrom, dateTo], () => {
    updateDates()
})

// Métodos
const updateDates = () => {
    localFilters.value.dateFrom = dateFrom.value ? dateFrom.value.toISOString() : undefined
    localFilters.value.dateTo = dateTo.value ? dateTo.value.toISOString() : undefined
}

const handleSearch = () => {
    emit('update:modelValue', { ...localFilters.value })
    emit('search')
}

const handleReset = () => {
    localFilters.value = {
        search: '',
        type: undefined,
        status: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        departmentId: undefined
    }
    dateFrom.value = undefined
    dateTo.value = undefined
    emit('update:modelValue', { ...localFilters.value })
    emit('reset')
}

const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
        handleSearch()
    }
}

// Computed
const hasActiveFilters = computed(() => {
    return !!(
        localFilters.value.search ||
        localFilters.value.type ||
        localFilters.value.status ||
        localFilters.value.dateFrom ||
        localFilters.value.dateTo ||
        localFilters.value.departmentId
    )
})
</script>

<template>
    <Card class="news-filters">
        <template #content>
            <div class="space-y-4">
                <!-- Filtros principales -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- Búsqueda -->
                    <div class="lg:col-span-2">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="localFilters.search" placeholder="Buscar por título o contenido..."
                                class="w-full" @keypress="handleKeyPress" />
                        </IconField>
                    </div>

                    <!-- Tipo -->
                    <Select v-model="localFilters.type" :options="typeOptions" optionLabel="label" optionValue="value"
                        placeholder="Tipo de publicación" class="w-full" />

                    <!-- Estado -->
                    <Select v-model="localFilters.status" :options="statusOptions" optionLabel="label"
                        optionValue="value" placeholder="Estado" class="w-full" />
                </div>

                <!-- Botón de filtros avanzados -->
                <div v-if="props.showAdvanced" class="flex justify-between items-center">
                    <Button label="Filtros avanzados" icon="pi pi-filter"
                        @click="showAdvancedFilters = !showAdvancedFilters" text size="small"
                        :severity="showAdvancedFilters ? 'primary' : 'secondary'" />

                    <div v-if="hasActiveFilters" class="text-sm text-gray-500">
                        <i class="pi pi-filter-fill mr-1"></i>
                        Filtros activos
                    </div>
                </div>

                <!-- Filtros avanzados -->
                <div v-if="showAdvancedFilters && props.showAdvanced"
                    class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    <!-- Fecha desde -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Desde
                        </label>
                        <Calendar v-model="dateFrom" dateFormat="dd/mm/yy" :maxDate="dateTo" showIcon showButtonBar
                            class="w-full" placeholder="Fecha inicial" />
                    </div>

                    <!-- Fecha hasta -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Hasta
                        </label>
                        <Calendar v-model="dateTo" dateFormat="dd/mm/yy" :minDate="dateFrom" showIcon showButtonBar
                            class="w-full" placeholder="Fecha final" />
                    </div>

                    <!-- Departamento -->
                    <div v-if="departments.length > 0">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Departamento
                        </label>
                        <Select v-model="localFilters.departmentId" :options="departmentOptions" optionLabel="label"
                            optionValue="value" placeholder="Seleccionar departamento" class="w-full" />
                    </div>
                </div>

                <!-- Botones de acción -->
                <div class="flex justify-end gap-2 pt-4">
                    <Button label="Limpiar" icon="pi pi-times" @click="handleReset" severity="secondary" outlined
                        :disabled="!hasActiveFilters" />
                    <Button label="Buscar" icon="pi pi-search" @click="handleSearch" />
                </div>
            </div>
        </template>
    </Card>
</template>

<style scoped>
.news-filters :deep(.p-card-content) {
    padding: 1.25rem;
}

/* Animación para filtros avanzados */
.news-filters {
    transition: all 0.3s ease;
}
</style>