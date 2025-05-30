<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useAuth } from '@/composables/useAuth'
import type { LoginCredentials } from '@/types/auth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'

// Composables
const { login, loading, error: authError } = useAuth()

// Form state
const email = ref<string>('')
const password = ref<string>('')
const rememberMe = ref<boolean>(false)
const showErrors = ref<boolean>(false)

// Local validation errors
const errors = reactive({
    email: '',
    password: '',
    general: ''
})

// Validaciones
const validateEmail = (): boolean => {
    if (!email.value.trim()) {
        errors.email = 'El correo electrónico es obligatorio'
        return false
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email.value.trim())) {
        errors.email = 'Ingresa un correo electrónico válido'
        return false
    }

    errors.email = ''
    return true
}

const validatePassword = (): boolean => {
    if (!password.value) {
        errors.password = 'La contraseña es obligatoria'
        return false
    }
    if (password.value.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres'
        return false
    }
    errors.password = ''
    return true
}

// Event handlers
const onEmailBlur = (): void => {
    if (showErrors.value) validateEmail()
}

const onPasswordBlur = (): void => {
    if (showErrors.value) validatePassword()
}

const onEmailInput = (): void => {
    if (errors.email) errors.email = ''
    if (errors.general) errors.general = ''
}

const onPasswordInput = (): void => {
    if (errors.password) errors.password = ''
    if (errors.general) errors.general = ''
}

// Form validation
const isFormValid = computed<boolean>(() => {
    return email.value.trim() !== '' &&
        password.value !== '' &&
        !errors.email &&
        !errors.password
})

// Loading state
const isLoading = computed<boolean>(() => loading.value)

// Submit handler
const submitForm = async (): Promise<void> => {
    showErrors.value = true
    errors.general = ''

    // Validate locally first
    const isEmailValid = validateEmail()
    const isPasswordValid = validatePassword()

    if (!isEmailValid || !isPasswordValid) {
        return
    }

    try {
        const credentials: LoginCredentials = {
            email: email.value.trim(),
            password: password.value
        }

        const result = await login(credentials)

        if (result.success) {
            // Login successful - redirect handled by useAuth
            console.log('Login exitoso:', result.user)

            // Clear form
            email.value = ''
            password.value = ''
            rememberMe.value = false
            showErrors.value = false
        } else {
            // Show server error
            errors.general = result.message || 'Error al iniciar sesión'
        }
    } catch (error) {
        // Network or unexpected error
        errors.general = authError.value || 'Error de conexión. Inténtalo de nuevo.'
    }
}
</script>

<template>
    <div class="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <!-- Panel izquierdo con formulario -->
        <div class="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div class="w-full max-w-md">
                <!-- Logo para pantallas pequeñas -->
                <div class="lg:hidden text-center mb-8">
                    <div
                        class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto border-2 border-primary/20">
                        <svg class="w-8 h-8 text-secondary" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                        </svg>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800">Palacio de Justicia</h2>
                </div>

                <!-- Formulario -->
                <div class="bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
                    <div class="mb-8 text-center">
                        <h1 class="text-2xl font-bold text-gray-800 mb-2">Iniciar Sesión</h1>
                        <p class="text-gray-600">Ingresa tus credenciales para acceder al sistema</p>
                        <div class="w-12 h-1 bg-secondary mx-auto mt-3 rounded-full"></div>
                    </div>

                    <!-- Mensaje de error general -->
                    <div v-if="errors.general" class="mb-4">
                        <Message severity="error" :closable="false" class="!bg-red-50 !border-red-200 !text-red-800">
                            {{ errors.general }}
                        </Message>
                    </div>

                    <form @submit.prevent="submitForm" class="space-y-6">
                        <!-- Campo Email -->
                        <div class="space-y-2">
                            <label for="email" class="block text-sm font-semibold text-gray-700">
                                Correo Electrónico <span class="text-red-500">*</span>
                            </label>
                            <InputText id="email" v-model="email" type="email" placeholder="ejemplo@palaciojusticia.gov"
                                class="w-full h-12 !bg-white !text-gray-900 !border-gray-300 focus:!border-secondary hover:!border-gray-400"
                                :class="{ '!border-red-300 focus:!border-red-500': errors.email }" autocomplete="email"
                                @blur="onEmailBlur" @input="onEmailInput" :disabled="isLoading" />
                            <div v-if="errors.email" class="text-red-500 text-sm mt-1 flex items-center">
                                <i class="pi pi-exclamation-circle mr-1"></i>
                                {{ errors.email }}
                            </div>
                        </div>

                        <!-- Campo Contraseña -->
                        <div class="space-y-2">
                            <label for="password" class="block text-sm font-semibold text-gray-700">
                                Contraseña <span class="text-red-500">*</span>
                            </label>
                            <Password id="password" v-model="password" placeholder="Ingresa tu contraseña"
                                class="w-full" :feedback="false" toggleMask :inputClass="[
                                    'w-full h-12 !bg-white !text-gray-900 focus:!border-secondary hover:!border-gray-400',
                                    errors.password
                                        ? '!border-red-300 focus:!border-red-500'
                                        : '!border-gray-300'
                                ]" @blur="onPasswordBlur" @input="onPasswordInput" :disabled="isLoading" />
                            <div v-if="errors.password" class="text-red-500 text-sm mt-1 flex items-center">
                                <i class="pi pi-exclamation-circle mr-1"></i>
                                {{ errors.password }}
                            </div>
                        </div>

                        <!-- Checkbox Recordarme -->
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <Checkbox id="rememberMe" v-model="rememberMe" binary class="mr-3"
                                    :disabled="isLoading" />
                                <label for="rememberMe" class="text-sm text-gray-700 font-medium">
                                    Mantener sesión iniciada
                                </label>
                            </div>
                        </div>

                        <!-- Botón Submit -->
                        <Button type="submit" :label="isLoading ? 'Verificando...' : 'Iniciar Sesión'"
                            class="w-full h-12 !bg-secondary hover:!bg-secondary/90 !border-secondary font-semibold !text-white shadow-lg hover:shadow-xl transition-all duration-200"
                            :class="{ '!bg-gray-400 !border-gray-400 cursor-not-allowed': isLoading || !isFormValid }"
                            :icon="isLoading ? 'pi pi-spinner pi-spin' : 'pi pi-sign-in'" iconPos="right"
                            :disabled="isLoading || !isFormValid" />

                        <!-- Credenciales de demo -->
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                            <div class="font-semibold text-secondary mb-2">Credenciales de prueba:</div>
                            <div class="text-gray-700 space-y-1">
                                <div><strong>Sistema:</strong> <code
                                        class="bg-blue-100 px-1 rounded text-gray-800">usuario@poderjudicial.gq</code> |
                                    <code class="bg-blue-100 px-1 rounded text-gray-800">contraseña</code>
                                </div>
                                <div class="text-xs text-gray-600 mt-2">* Usar credenciales reales del sistema judicial
                                </div>
                            </div>
                        </div>

                        <div class="text-center pt-4">
                            <a href="#"
                                class="text-sm text-secondary hover:text-secondary/80 font-medium hover:underline transition-colors">
                                ¿Necesitas ayuda para acceder?
                            </a>
                        </div>
                    </form>
                </div>

                <!-- Footer -->
                <div class="text-center mt-8 text-sm text-gray-500">
                    <p>© 2024 Palacio de Justicia. Todos los derechos reservados.</p>
                    <p class="mt-1">Sistema seguro y confidencial</p>
                </div>
            </div>
        </div>

        <!-- Panel derecho con imagen -->
        <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden">
            <!-- Imagen de fondo -->
            <div class="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary">
                <!-- Puedes reemplazar este gradiente con una imagen real -->
                <!-- <img src="/path/to/your/image.jpg" alt="Palacio de Justicia" class="w-full h-full object-cover"> -->
            </div>

            <!-- Overlay -->
            <div class="absolute inset-0 bg-black/30 bg-opacity-40"></div>

            <!-- Patrón decorativo -->
            <div class="absolute inset-0 opacity-20">
                <div class="absolute top-10 right-10 w-32 h-32 border-2 border-white rounded-full"></div>
                <div class="absolute top-40 left-20 w-24 h-24 border-2 border-secondary/70 rounded-full"></div>
                <div class="absolute bottom-32 right-20 w-20 h-20 border-2 border-secondary/50 rounded-full"></div>
                <div class="absolute bottom-10 left-10 w-16 h-16 border-2 border-white rounded-full"></div>
            </div>

            <!-- Contenido del panel -->
            <div class="relative z-10 flex flex-col justify-center items-center text-center px-12 text-white">
                <div class="mb-8">
                    <!-- Logo -->
                    <div
                        class="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-6 mx-auto backdrop-blur-sm border border-white border-opacity-30">
                        <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                        </svg>
                    </div>
                    <h2 class="text-3xl font-bold mb-4">Palacio de Justicia</h2>
                    <p class="text-xl text-white/90">Sistema de Gestión Judicial</p>
                </div>

                <div class="text-center">
                    <p class="text-white/80 text-lg leading-relaxed">
                        Acceso seguro al sistema administrativo institucional
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
/* Variables CSS para sobrescribir PrimeVue */
:root {
    --p-primary-color: oklch(0.681 0.162 75.834);
    --p-primary-contrast-color: #ffffff;
    --p-primary-hover-color: oklch(0.6 0.162 75.834);
    --p-primary-active-color: oklch(0.55 0.162 75.834);

    --p-surface-0: #ffffff;
    --p-surface-50: #fafafa;
    --p-surface-100: #f5f5f5;
    --p-surface-200: #eeeeee;
    --p-surface-300: #e0e0e0;

    --p-text-color: #212121;
    --p-text-muted-color: #757575;
    --p-border-color: #e0e0e0;
}

/* Estilos específicos para PrimeVue */
.p-inputtext {
    background: white !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
}

.p-inputtext:focus {
    border-color: oklch(0.681 0.162 75.834) !important;
    box-shadow: 0 0 0 2px oklch(0.681 0.162 75.834 / 0.2) !important;
}

.p-password .p-inputtext {
    background: white !important;
    color: #374151 !important;
    border-color: #d1d5db !important;
}

.p-password:not(.p-disabled).p-focus .p-inputtext {
    border-color: oklch(0.681 0.162 75.834) !important;
    box-shadow: 0 0 0 2px oklch(0.681 0.162 75.834 / 0.2) !important;
}

.p-checkbox .p-checkbox-box {
    background: white !important;
    border-color: #d1d5db !important;
}

.p-checkbox:not(.p-disabled):has(.p-checkbox-input:checked) .p-checkbox-box {
    background: oklch(0.681 0.162 75.834) !important;
    border-color: oklch(0.681 0.162 75.834) !important;
}

.p-button {
    background: oklch(0.681 0.162 75.834) !important;
    border-color: oklch(0.681 0.162 75.834) !important;
}

.p-button:enabled:hover {
    background: oklch(0.6 0.162 75.834) !important;
    border-color: oklch(0.6 0.162 75.834) !important;
}

.p-message.p-message-error {
    background: #fef2f2 !important;
    border: 1px solid #fecaca !important;
    color: #b91c1c !important;
}
</style>