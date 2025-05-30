<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'

const { user, userName, userRole, logout, canCreateExpedientes, canApproveExpedientes } = useAuth()
const router = useRouter()

const handleLogout = async () => {
    await logout()
}

const navigateToExpedientes = () => {
    router.push('/expedientes')
}
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b border-gray-200">
            <div class="px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-4">
                    <div>
                        <h1 class="text-2xl font-semibold text-gray-900">Dashboard - Sistema Judicial</h1>
                    </div>

                    <div class="flex items-center gap-4">
                        <div class="text-right">
                            <p class="text-sm font-medium text-gray-900">{{ userName }}</p>
                            <p class="text-xs text-gray-500">{{ userRole }}</p>
                        </div>

                        <Button label="Cerrar Sesión" icon="pi pi-sign-out" severity="danger" outlined
                            @click="handleLogout" />
                    </div>
                </div>
            </div>
        </header>

        <!-- Contenido -->
        <main class="px-4 sm:px-6 lg:px-8 py-8">
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <h2 class="text-xl font-semibold mb-4">¡Bienvenido al Sistema Judicial!</h2>

                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p class="text-blue-800">
                        <strong>Login exitoso!</strong> Has iniciado sesión correctamente.
                    </p>
                </div>

                <div class="space-y-2">
                    <p><strong>Usuario:</strong> {{ user?.fullName }}</p>
                    <p><strong>Email:</strong> {{ user?.email }}</p>
                    <p><strong>Rol:</strong> {{ user?.role }}</p>
                    <p><strong>Departamento ID:</strong> {{ user?.departmentId }}</p>
                </div>
            </div>

            <!-- Accesos rápidos -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <!-- Card Expedientes -->
                <Card v-if="canCreateExpedientes || canApproveExpedientes">
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-folder-open text-2xl text-primary"></i>
                            <span>Expedientes</span>
                        </div>
                    </template>
                    <template #content>
                        <p class="text-gray-600 mb-4">
                            Gestiona expedientes judiciales, crea nuevos casos y revisa aprobaciones pendientes.
                        </p>
                        <Button label="Ir a Expedientes" icon="pi pi-arrow-right" iconPos="right"
                            @click="navigateToExpedientes" class="w-full" />
                    </template>
                </Card>

                <!-- Card Placeholder 1 -->
                <Card>
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-megaphone text-2xl text-gray-400"></i>
                            <span>Noticias</span>
                        </div>
                    </template>
                    <template #content>
                        <p class="text-gray-600 mb-4">
                            Gestión de noticias, avisos y comunicados institucionales.
                        </p>
                        <Button label="Próximamente" disabled class="w-full" />
                    </template>
                </Card>

                <!-- Card Placeholder 2 -->
                <Card>
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-users text-2xl text-gray-400"></i>
                            <span>Contactos</span>
                        </div>
                    </template>
                    <template #content>
                        <p class="text-gray-600 mb-4">
                            Mensajes y consultas de ciudadanos.
                        </p>
                        <Button label="Próximamente" disabled class="w-full" />
                    </template>
                </Card>
            </div>
        </main>
    </div>
</template>