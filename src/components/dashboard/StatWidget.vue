<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'

interface Props {
    title: string
    value: number | string
    icon?: string
    color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray'
    subtitle?: string
    change?: number
    changeType?: 'increase' | 'decrease'
    loading?: boolean
    clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    icon: 'pi-chart-line',
    color: 'blue',
    loading: false,
    clickable: false
})

const emit = defineEmits<{
    click: []
}>()

// Clases de color para el fondo
const bgColorClass = computed(() => {
    const colors = {
        blue: 'bg-blue-100',
        green: 'bg-green-100',
        orange: 'bg-orange-100',
        red: 'bg-red-100',
        purple: 'bg-purple-100',
        gray: 'bg-gray-100'
    }
    return colors[props.color]
})

// Clases de color para el icono
const iconColorClass = computed(() => {
    const colors = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        orange: 'text-orange-600',
        red: 'text-red-600',
        purple: 'text-purple-600',
        gray: 'text-gray-600'
    }
    return colors[props.color]
})

// Formatear el valor si es un número grande
const formattedValue = computed(() => {
    if (typeof props.value === 'number' && props.value >= 1000) {
        if (props.value >= 1000000) {
            return (props.value / 1000000).toFixed(1) + 'M'
        }
        return (props.value / 1000).toFixed(1) + 'K'
    }
    return props.value
})

const handleClick = () => {
    if (props.clickable) {
        emit('click')
    }
}
</script>

<template>
    <Card class="stat-widget" :class="{ 'cursor-pointer hover:shadow-lg transition-shadow': clickable }"
        @click="handleClick">
        <template #content>
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-600 mb-1">{{ title }}</p>

                    <div class="flex items-baseline gap-2">
                        <h3 class="text-2xl font-bold text-gray-900">
                            <span v-if="loading" class="inline-block w-16 h-6 bg-gray-200 animate-pulse rounded"></span>
                            <span v-else>{{ formattedValue }}</span>
                        </h3>

                        <!-- Indicador de cambio -->
                        <div v-if="change !== undefined && !loading" class="flex items-center text-sm">
                            <i :class="[
                                'pi',
                                changeType === 'increase' ? 'pi-arrow-up text-green-600' : 'pi-arrow-down text-red-600'
                            ]"></i>
                            <span :class="changeType === 'increase' ? 'text-green-600' : 'text-red-600'">
                                {{ Math.abs(change) }}%
                            </span>
                        </div>
                    </div>

                    <p v-if="subtitle" class="text-xs text-gray-500 mt-1">{{ subtitle }}</p>
                </div>

                <!-- Icono -->
                <div class="w-12 h-12 rounded-full flex items-center justify-center" :class="bgColorClass">
                    <i :class="[icon, iconColorClass, 'text-xl', 'pi']"></i>
                </div>
            </div>
        </template>
    </Card>
</template>

<style scoped>
.stat-widget :deep(.p-card-content) {
    padding: 1.25rem;
}

.stat-widget:hover {
    transform: translateY(-2px);
}
</style>