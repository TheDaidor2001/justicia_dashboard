<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { News } from '@/types/news'
import { getNewsTypeLabel, getNewsTypeColor, getNewsStatusBadge } from '@/types/news'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'

interface Props {
    news: News
    showStatus?: boolean
    showActions?: boolean
    clickable?: boolean
    layout?: 'vertical' | 'horizontal'
}

const props = withDefaults(defineProps<Props>(), {
    showStatus: false,
    showActions: false,
    clickable: true,
    layout: 'vertical'
})

const emit = defineEmits<{
    click: [news: News]
    edit: [news: News]
    delete: [news: News]
}>()

const router = useRouter()

// Obtener imagen o placeholder
const imageUrl = computed(() => {
    if (props.news.imageUrl) return props.news.imageUrl

    const placeholders: Record<string, string> = {
        noticia: 'https://placehold.co/600x400/3B82F6/FFFFFF?text=Noticia',
        aviso: 'https://placehold.co/600x400/F59E0B/FFFFFF?text=Aviso',
        comunicado: 'https://placehold.co/600x400/8B5CF6/FFFFFF?text=Comunicado'
    }

    return placeholders[props.news.type] || 'https://placehold.co/600x400/6B7280/FFFFFF?text=Noticia'
})

// Resumen del contenido
const contentSummary = computed(() => {
    // Eliminar tags HTML
    const text = props.news.content.replace(/<[^>]*>/g, '')
    // Limitar a 150 caracteres
    return text.length > 150 ? text.substring(0, 150) + '...' : text
})

// Formatear fecha
const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })
}

// Manejar clic
const handleClick = () => {
    if (props.clickable) {
        emit('click', props.news)
        // Si es una noticia publicada, ir a la vista pública
        if (props.news.status === 'published') {
            router.push(`/noticias/p/${props.news.slug}`)
        } else {
            router.push(`/noticias/${props.news.id}`)
        }
    }
}

// Estilos dinámicos
const cardClass = computed(() => {
    return {
        'cursor-pointer hover:shadow-lg transition-shadow': props.clickable,
        'news-card-horizontal': props.layout === 'horizontal'
    }
})
</script>

<template>
    <Card :class="cardClass" @click="handleClick">
        <template #header v-if="layout === 'vertical'">
            <div class="relative h-48 overflow-hidden">
                <img :src="imageUrl" :alt="news.title" class="w-full h-full object-cover"
                    @error="(e: any) => e.target.src = 'https://placehold.co/600x400/94A3B8/FFFFFF?text=Sin+Imagen'">

                <!-- Badge de tipo -->
                <div class="absolute top-3 left-3">
                    <Tag :value="getNewsTypeLabel(news.type)" :severity="getNewsTypeColor(news.type) as any" rounded />
                </div>

                <!-- Badge de estado si se muestra -->
                <div v-if="showStatus" class="absolute top-3 right-3">
                    <Tag :value="getNewsStatusBadge(news.status).label"
                        :severity="getNewsStatusBadge(news.status).severity as any"
                        :icon="`pi ${getNewsStatusBadge(news.status).icon}`" rounded />
                </div>
            </div>
        </template>

        <template #content>
            <div :class="{ 'flex gap-4': layout === 'horizontal' }">
                <!-- Imagen horizontal -->
                <div v-if="layout === 'horizontal'" class="w-48 h-32 flex-shrink-0 overflow-hidden rounded">
                    <img :src="imageUrl" :alt="news.title" class="w-full h-full object-cover"
                        @error="(e: any) => e.target.src = 'https://placehold.co/600x400/94A3B8/FFFFFF?text=Sin+Imagen'">
                </div>

                <!-- Contenido -->
                <div class="flex-1">
                    <!-- Badges en layout horizontal -->
                    <div v-if="layout === 'horizontal'" class="flex gap-2 mb-2">
                        <Tag :value="getNewsTypeLabel(news.type)" :severity="getNewsTypeColor(news.type) as any"
                            class="text-xs rounded" />

                        <Tag v-if="showStatus" :value="getNewsStatusBadge(news.status).label"
                            :severity="getNewsStatusBadge(news.status).severity as any"
                            :icon="`pi ${getNewsStatusBadge(news.status).icon}`" rounded class="text-xs" />
                    </div>

                    <!-- Título -->
                    <h3 class="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                        {{ news.title }}
                    </h3>

                    <!-- Subtítulo si existe -->
                    <p v-if="news.subtitle" class="text-sm text-gray-600 mb-2 line-clamp-1">
                        {{ news.subtitle }}
                    </p>

                    <!-- Resumen del contenido -->
                    <p class="text-sm text-gray-700 mb-3 line-clamp-3">
                        {{ contentSummary }}
                    </p>

                    <!-- Meta información -->
                    <div class="flex items-center justify-between text-xs text-gray-500">
                        <div class="flex items-center gap-3">
                            <!-- Autor -->
                            <div v-if="news.creator" class="flex items-center gap-1">
                                <Avatar :label="news.creator.fullName.charAt(0)" shape="circle" size="small"
                                    class="w-5 h-5 text-xs" />
                                <span>{{ news.creator.fullName }}</span>
                            </div>

                            <!-- Fecha -->
                            <span>{{ formatDate(news.publishedAt || news.createdAt) }}</span>

                            <!-- Vistas -->
                            <div class="flex items-center gap-1">
                                <i class="pi pi-eye"></i>
                                <span>{{ news.viewCount }}</span>
                            </div>
                        </div>

                        <!-- Acciones -->
                        <div v-if="showActions" class="flex gap-1" @click.stop>
                            <Button icon="pi pi-pencil" severity="secondary" text rounded size="small"
                                @click="emit('edit', news)" v-tooltip.top="'Editar'" />

                            <Button icon="pi pi-trash" severity="danger" text rounded size="small"
                                @click="emit('delete', news)" v-tooltip.top="'Eliminar'" />
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </Card>
</template>

<style scoped>
:deep(.p-card) {
    height: 100%;
    display: flex;
    flex-direction: column;
}

:deep(.p-card-body) {
    flex: 1;
    display: flex;
    flex-direction: column;
}

:deep(.p-card-content) {
    flex: 1;
}

.news-card-horizontal :deep(.p-card-body) {
    padding: 0;
}

.news-card-horizontal :deep(.p-card-content) {
    padding: 1rem;
}

.line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>