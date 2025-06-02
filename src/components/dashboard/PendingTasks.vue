<script setup lang="ts">
import { computed } from 'vue'
import type { PendingTask } from '@/types/dashboard'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useRouter } from 'vue-router'

interface Props {
    tasks: PendingTask[]
    loading?: boolean
    maxItems?: number
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    maxItems: 5
})

const router = useRouter()

// Limitar tareas mostradas
const displayedTasks = computed(() =>
    props.tasks.slice(0, props.maxItems)
)

// Obtener configuración visual por tipo
const getTaskConfig = (task: PendingTask) => {
    const configs = {
        expediente: {
            icon: 'pi-folder',
            color: 'info'
        },
        news: {
            icon: 'pi-megaphone',
            color: 'success'
        },
        contact: {
            icon: 'pi-envelope',
            color: 'warning'
        }
    }
    return configs[task.type] || { icon: 'pi-file', color: 'secondary' }
}

// Obtener severidad de prioridad
const getPrioritySeverity = (priority: string) => {
    const severities: Record<string, any> = {
        alta: 'danger',
        media: 'warning',
        baja: 'info'
    }
    return severities[priority] || 'secondary'
}

// Navegar a tarea
const navigateToTask = (task: PendingTask) => {
    if (task.url) {
        router.push(task.url)
    } else {
        // Navegación por defecto según tipo
        switch (task.type) {
            case 'expediente':
                router.push(`/expedientes/${task.id}`)
                break
            case 'news':
                router.push(`/noticias/${task.id}`)
                break
            case 'contact':
                router.push(`/contactos/${task.id}`)
                break
        }
    }
}

// Formatear fecha
const formatDate = (date: string) => {
    const now = new Date()
    const taskDate = new Date(date)
    const diffMs = now.getTime() - taskDate.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        return `Hace ${diffMinutes} minutos`
    } else if (diffHours < 24) {
        return `Hace ${diffHours} horas`
    } else {
        const diffDays = Math.floor(diffHours / 24)
        return `Hace ${diffDays} días`
    }
}
</script>

<template>
    <Card>
        <template #title>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <i class="pi pi-clock text-xl"></i>
                    <span>Tareas Pendientes</span>
                </div>
                <Tag v-if="tasks.length > 0" :value="tasks.length.toString()" severity="warning" rounded />
            </div>
        </template>

        <template #content>
            <!-- Loading -->
            <div v-if="loading" class="space-y-3">
                <div v-for="i in 3" :key="i" class="animate-pulse">
                    <div class="h-16 bg-gray-200 rounded"></div>
                </div>
            </div>

            <!-- Lista de tareas -->
            <div v-else-if="displayedTasks.length > 0" class="space-y-3">
                <div v-for="task in displayedTasks" :key="task.id"
                    class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    @click="navigateToTask(task)">
                    <div class="flex items-start gap-3">
                        <!-- Icono -->
                        <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            :class="`bg-${getTaskConfig(task).color}-100`">
                            <i :class="[getTaskConfig(task).icon, 'pi', 'text-lg']"></i>
                        </div>

                        <!-- Contenido -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between gap-2 mb-1">
                                <h4 class="font-medium text-gray-900 truncate">{{ task.title }}</h4>
                                <Tag :value="task.priority" :severity="getPrioritySeverity(task.priority)"
                                    class="text-xs" />
                            </div>

                            <p v-if="task.description" class="text-sm text-gray-600 line-clamp-2 mb-1">
                                {{ task.description }}
                            </p>

                            <div class="flex items-center gap-3 text-xs text-gray-500">
                                <span>{{ formatDate(task.createdAt) }}</span>
                                <span>•</span>
                                <span class="font-medium">{{ task.action }}</span>
                            </div>
                        </div>

                        <!-- Acción -->
                        <Button icon="pi pi-arrow-right" severity="secondary" text rounded size="small"
                            @click.stop="navigateToTask(task)" />
                    </div>
                </div>
            </div>

            <!-- Sin tareas -->
            <div v-else class="text-center py-8">
                <i class="pi pi-check-circle text-4xl text-green-500 mb-3"></i>
                <p class="text-gray-500">¡No tienes tareas pendientes!</p>
            </div>
        </template>

        <template #footer v-if="tasks.length > maxItems">
            <div class="text-center">
                <Button label="Ver todas las tareas" link @click="router.push('/tareas')" />
            </div>
        </template>
    </Card>
</template>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>