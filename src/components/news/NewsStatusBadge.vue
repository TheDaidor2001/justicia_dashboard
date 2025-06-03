<script setup lang="ts">
import { computed } from 'vue'
import { NewsStatus, getNewsStatusLabel, getNewsStatusBadge } from '@/types/news'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'

interface Props {
    status: NewsStatus
    size?: 'small' | 'normal' | 'large'
    showIcon?: boolean
    rounded?: boolean
    asTag?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    size: 'normal',
    showIcon: true,
    rounded: true,
    asTag: true
})

// Computed
const badgeConfig = computed(() => getNewsStatusBadge(props.status))

const label = computed(() => getNewsStatusLabel(props.status))

const sizeClass = computed(() => {
    const sizes = {
        small: 'text-xs',
        normal: 'text-sm',
        large: 'text-base'
    }
    return sizes[props.size]
})

const iconClass = computed(() => {
    if (!props.showIcon) return ''
    return `pi ${badgeConfig.value.icon}`
})

// Para personalización adicional según el estado
const customClass = computed(() => {
    const classes: Record<NewsStatus, string> = {
        [NewsStatus.DRAFT]: 'opacity-90',
        [NewsStatus.PENDING_DIRECTOR]: 'animate-pulse-subtle',
        [NewsStatus.PENDING_PRESIDENT]: 'animate-pulse-subtle',
        [NewsStatus.PUBLISHED]: 'font-semibold',
        [NewsStatus.REJECTED]: 'opacity-90'
    }
    return classes[props.status] || ''
})

// Tooltip con información adicional
const tooltipText = computed(() => {
    const tooltips: Record<NewsStatus, string> = {
        [NewsStatus.DRAFT]: 'Borrador - Pendiente de envío',
        [NewsStatus.PENDING_DIRECTOR]: 'Esperando aprobación del Director de Prensa',
        [NewsStatus.PENDING_PRESIDENT]: 'Esperando aprobación del Presidente CSPJ',
        [NewsStatus.PUBLISHED]: 'Publicado y visible al público',
        [NewsStatus.REJECTED]: 'Rechazado - Requiere correcciones'
    }
    return tooltips[props.status]
})
</script>

<template>
    <!-- Versión Tag (por defecto) -->
    <Tag v-if="asTag" :value="label" :severity="badgeConfig.severity as any" :icon="iconClass" :rounded="rounded"
        :class="[sizeClass, customClass]" v-tooltip.top="tooltipText" />

    <!-- Versión Badge (alternativa) -->
    <Badge v-else :value="label" :severity="badgeConfig.severity as any" :class="[sizeClass, customClass]"
        v-tooltip.top="tooltipText" />
</template>

<style scoped>
/* Animación sutil para estados pendientes */
@keyframes pulse-subtle {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.8;
    }
}

.animate-pulse-subtle {
    animation: pulse-subtle 2s ease-in-out infinite;
}

/* Ajustes de tamaño específicos si es necesario */
:deep(.p-tag.text-xs) {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
}

:deep(.p-tag.text-base) {
    font-size: 1rem;
    padding: 0.5rem 1rem;
}

/* Estilos específicos por estado */
:deep(.p-tag-secondary) {
    background-color: #6b7280;
    color: white;
}

:deep(.p-tag-warning) {
    background-color: #f59e0b;
    color: white;
}

:deep(.p-tag-info) {
    background-color: #3b82f6;
    color: white;
}

:deep(.p-tag-success) {
    background-color: #10b981;
    color: white;
}

:deep(.p-tag-danger) {
    background-color: #ef4444;
    color: white;
}
</style>