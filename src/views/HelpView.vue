<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <!-- Professional header with gradient -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-12">
      <div class="max-w-7xl mx-auto">
        <div class="text-center">
          <h1 class="text-4xl font-bold mb-4">Centro de Ayuda</h1>
          <p class="text-xl text-blue-100 mb-6">Guía completa para usar el Sistema Judicial</p>

          <!-- User role info -->
          <div
            class="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3"
          >
            <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <i class="pi pi-user text-white"></i>
            </div>
            <div class="text-left">
              <div class="font-medium capitalize">{{ userRole?.replace('_', ' ') }}</div>
              <div class="text-sm text-blue-100">{{ getRoleDescription(userRole) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-6">
        <nav class="flex gap-1 overflow-x-auto py-3">
          <Button
            v-for="section in availableSections"
            :key="section.id"
            :label="section.title"
            :icon="section.icon"
            :class="{ 'bg-blue-50 text-blue-600': activeSection === section.id }"
            text
            @click="activeSection = section.id"
            class="flex-shrink-0"
          />
        </nav>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-6 py-8">
      <div class="space-y-8">
        <!-- Introducción -->
        <Card v-if="activeSection === 'introduccion'">
          <template #content>
            <div class="space-y-6">
              <div class="text-center">
                <div
                  class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                >
                  <i class="pi pi-info-circle text-2xl text-white"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">
                  Bienvenido al Sistema Judicial
                </h2>
                <p class="text-gray-600 max-w-2xl mx-auto">
                  Esta guía te ayudará a aprovechar al máximo las funcionalidades disponibles según
                  tu rol en el sistema.
                </p>
              </div>

              <div class="grid md:grid-cols-2 gap-6">
                <div class="p-4 bg-blue-50 rounded-lg">
                  <h3 class="font-medium text-gray-900 mb-2">Tu Rol Actual</h3>
                  <p class="text-sm text-gray-600 mb-3 capitalize">
                    {{ userRole?.replace('_', ' ') }}
                  </p>
                  <p class="text-sm text-gray-600">{{ getRoleDescription(userRole) }}</p>
                </div>

                <div class="p-4 bg-green-50 rounded-lg">
                  <h3 class="font-medium text-gray-900 mb-2">Acceso a Módulos</h3>
                  <p class="text-sm text-gray-600">
                    Tienes acceso a {{ availableSections.length - 1 }} módulos del sistema
                  </p>
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900">Información General</h3>
                <div class="prose prose-sm text-gray-600">
                  <ul class="space-y-2">
                    <li>El sistema está diseñado para optimizar los procesos judiciales</li>
                    <li>Cada rol tiene permisos específicos según sus responsabilidades</li>
                    <li>Los datos están protegidos y auditados automáticamente</li>
                    <li>Puedes cambiar tu contraseña desde tu perfil de usuario</li>
                  </ul>
                </div>
              </div>

              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                  <i class="pi pi-exclamation-triangle text-yellow-600 mt-1"></i>
                  <div>
                    <h4 class="font-medium text-yellow-800">Importante</h4>
                    <p class="text-sm text-yellow-700 mt-1">
                      Siempre cierra sesión cuando termines de usar el sistema, especialmente en
                      computadoras compartidas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Expedientes -->
        <Card v-if="activeSection === 'expedientes'">
          <template #content>
            <div class="space-y-6">
              <div class="flex items-center gap-3 mb-6">
                <i class="pi pi-folder text-2xl text-blue-500"></i>
                <h2 class="text-2xl font-bold text-gray-900">Gestión de Expedientes</h2>
              </div>

              <div class="space-y-4">
                <div v-if="userRole === 'juez'" class="p-4 border rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-2">📝 Crear Expedientes</h4>
                  <p class="text-sm text-gray-600 mb-2">
                    Puedes crear nuevos expedientes judiciales:
                  </p>
                  <ul class="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Completa la información de las partes</li>
                    <li>• Selecciona el tipo de proceso</li>
                    <li>• Adjunta documentos necesarios</li>
                    <li>• Envía para revisión</li>
                  </ul>
                </div>

                <div
                  v-if="
                    userRole && ['presidente_audiencia', 'secretario_general'].includes(userRole)
                  "
                  class="p-4 border rounded-lg"
                >
                  <h4 class="font-medium text-gray-900 mb-2">✅ Revisar Expedientes</h4>
                  <p class="text-sm text-gray-600 mb-2">Revisa y aprueba expedientes pendientes:</p>
                  <ul class="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Verifica la información completa</li>
                    <li>• Evalúa la documentación</li>
                    <li>• Aprueba o solicita correcciones</li>
                    <li>• Agrega comentarios cuando sea necesario</li>
                  </ul>
                </div>

                <div v-if="userRole === 'admin'" class="p-4 border rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-2">⚙️ Administrar Sistema</h4>
                  <p class="text-sm text-gray-600 mb-2">Gestión completa del sistema:</p>
                  <ul class="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Acceso a todos los expedientes</li>
                    <li>• Modificar estados y asignaciones</li>
                    <li>• Generar reportes detallados</li>
                    <li>• Configurar parámetros del sistema</li>
                  </ul>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Noticias -->
        <Card v-if="activeSection === 'noticias'">
          <template #content>
            <div class="space-y-6">
              <div class="flex items-center gap-3 mb-6">
                <i class="pi pi-megaphone text-2xl text-purple-500"></i>
                <h2 class="text-2xl font-bold text-gray-900">Gestión de Noticias</h2>
              </div>

              <div class="space-y-4">
                <div v-if="userRole === 'tecnico_prensa'" class="p-4 border rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-2">✍️ Crear Noticias</h4>
                  <p class="text-sm text-gray-600 mb-2">Redacta y gestiona contenido:</p>
                  <ul class="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Usa el editor de texto enriquecido</li>
                    <li>• Agrega imágenes y multimedia</li>
                    <li>• Establece categorías y prioridades</li>
                    <li>• Envía para revisión</li>
                  </ul>
                </div>

                <div v-if="userRole === 'director_prensa'" class="p-4 border rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-2">🔍 Revisar Contenido</h4>
                  <p class="text-sm text-gray-600 mb-2">Supervisa la calidad editorial:</p>
                  <ul class="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Revisa calidad y coherencia</li>
                    <li>• Verifica cumplimiento de políticas</li>
                    <li>• Aprueba para publicación</li>
                    <li>• Solicita correcciones si es necesario</li>
                  </ul>
                </div>

                <div
                  v-if="userRole && ['presidente_cspj', 'vicepresidente_cspj'].includes(userRole)"
                  class="p-4 border rounded-lg"
                >
                  <h4 class="font-medium text-gray-900 mb-2">🏛️ Aprobación Presidencial</h4>
                  <p class="text-sm text-gray-600 mb-2">Autoriza comunicados institucionales:</p>
                  <ul class="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Revisa contenido estratégico</li>
                    <li>• Evalúa impacto institucional</li>
                    <li>• Autoriza publicación oficial</li>
                    <li>• Define mensaje institucional</li>
                  </ul>
                </div>

                <div
                  v-if="userRole && ['juez', 'presidente_audiencia'].includes(userRole)"
                  class="p-4 border rounded-lg"
                >
                  <h4 class="font-medium text-gray-900 mb-2">📢 Comunicados Jurisdiccionales</h4>
                  <p class="text-sm text-gray-600 mb-2">Envía información desde tu despacho:</p>
                  <ul class="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Comunica eventos públicos</li>
                    <li>• Anuncia capacitaciones</li>
                    <li>• Informa mejoras en servicios</li>
                    <li>• Mantén tono institucional</li>
                  </ul>
                </div>

                <div v-if="userRole === 'admin'" class="p-4 border rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-2">⚡ Gestión Completa</h4>
                  <p class="text-sm text-gray-600 mb-2">Administra todo el sistema de noticias:</p>
                  <ul class="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Acceso a todas las publicaciones</li>
                    <li>• Modifica flujos de aprobación</li>
                    <li>• Genera reportes de impacto</li>
                    <li>• Configura políticas editoriales</li>
                  </ul>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Usuarios (solo admin) -->
        <Card v-if="activeSection === 'usuarios' && userRole === 'admin'">
          <template #content>
            <div class="space-y-6">
              <div class="flex items-center gap-3 mb-6">
                <i class="pi pi-users text-2xl text-green-500"></i>
                <h2 class="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
              </div>

              <div class="space-y-4">
                <div class="p-4 border rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-2">👥 Crear Usuarios</h4>
                  <p class="text-sm text-gray-600 mb-2">Registra nuevos usuarios:</p>
                  <ul class="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Completa información personal</li>
                    <li>• Asigna rol apropiado</li>
                    <li>• Define departamento</li>
                    <li>• Establece credenciales seguras</li>
                  </ul>
                </div>

                <div class="p-4 border rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-2">⚙️ Gestionar Usuarios</h4>
                  <p class="text-sm text-gray-600 mb-2">Administra usuarios existentes:</p>
                  <ul class="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Edita información de perfil</li>
                    <li>• Cambia roles y permisos</li>
                    <li>• Activa o desactiva cuentas</li>
                    <li>• Restablece contraseñas</li>
                  </ul>
                </div>

                <div class="p-4 border rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-2">🎭 Roles Disponibles</h4>
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <UserRoleBadge role="juez" size="small" />
                      <span class="text-sm">- Crear y gestionar expedientes</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <UserRoleBadge role="presidente_audiencia" size="small" />
                      <span class="text-sm">- Aprobar expedientes</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <UserRoleBadge role="secretario_general" size="small" />
                      <span class="text-sm">- Aprobación final</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <UserRoleBadge role="tecnico_prensa" size="small" />
                      <span class="text-sm">- Crear noticias</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <UserRoleBadge role="director_prensa" size="small" />
                      <span class="text-sm">- Aprobar noticias</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Biblioteca (solo admin) -->
        <Card v-if="activeSection === 'biblioteca' && userRole === 'admin'">
          <template #content>
            <div class="space-y-6">
              <div class="flex items-center gap-3 mb-6">
                <i class="pi pi-book text-2xl text-indigo-500"></i>
                <h2 class="text-2xl font-bold text-gray-900">Biblioteca Digital</h2>
              </div>

              <div class="space-y-4">
                <div class="p-4 border rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-2">📚 Subir Libros</h4>
                  <p class="text-sm text-gray-600 mb-2">Agrega documentos a la biblioteca:</p>
                  <ul class="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Formatos: PDF, EPUB, DOC, DOCX</li>
                    <li>• Tamaño máximo: 50MB</li>
                    <li>• Completa información del libro</li>
                    <li>• Agrega portada si disponible</li>
                  </ul>
                </div>

                <div class="p-4 border rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-2">🗂️ Organizar Contenido</h4>
                  <p class="text-sm text-gray-600 mb-2">Mantén la biblioteca organizada:</p>
                  <ul class="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Usa tags para búsquedas</li>
                    <li>• Categoriza por tipo</li>
                    <li>• Define visibilidad</li>
                    <li>• Actualiza metadatos</li>
                  </ul>
                </div>

                <div class="p-4 border rounded-lg">
                  <h4 class="font-medium text-gray-900 mb-2">📖 Tipos de Documentos</h4>
                  <div class="space-y-1 text-sm text-gray-600">
                    <div>• <strong>Código Legal:</strong> Leyes y códigos oficiales</div>
                    <div>• <strong>Tratado:</strong> Documentos internacionales</div>
                    <div>• <strong>Manual:</strong> Guías de procedimientos</div>
                    <div>• <strong>Libro:</strong> Literatura jurídica general</div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import Card from 'primevue/card'
import Button from 'primevue/button'
import UserRoleBadge from '@/components/users/UserRoleBadge.vue'

const { userRole } = useAuth()

const activeSection = ref('introduccion')

// Secciones disponibles según el rol
const availableSections = computed(() => {
  const sections = [
    {
      id: 'introduccion',
      title: 'Introducción',
      icon: 'pi pi-info-circle',
      roles: ['all'],
    },
    {
      id: 'expedientes',
      title: 'Expedientes',
      icon: 'pi pi-folder',
      roles: [
        'juez',
        'presidente_audiencia',
        'secretario_general',
        'presidente_cspj',
        'vicepresidente_cspj',
        'admin',
      ],
    },
    {
      id: 'noticias',
      title: 'Noticias',
      icon: 'pi pi-megaphone',
      roles: [
        'juez',
        'presidente_audiencia',
        'tecnico_prensa',
        'director_prensa',
        'presidente_cspj',
        'vicepresidente_cspj',
        'admin',
      ],
    },
    {
      id: 'usuarios',
      title: 'Usuarios',
      icon: 'pi pi-users',
      roles: ['admin'],
    },
    {
      id: 'biblioteca',
      title: 'Biblioteca',
      icon: 'pi pi-book',
      roles: ['admin'],
    },
  ]

  return sections.filter(
    (section) =>
      section.roles.includes('all') || (userRole.value && section.roles.includes(userRole.value)),
  )
})

const getRoleDescription = (role: string | null): string => {
  if (!role) return 'Acceso básico al sistema'

  const descriptions: Record<string, string> = {
    juez: 'Crear y gestionar expedientes judiciales',
    presidente_audiencia: 'Supervisar y aprobar expedientes',
    secretario_general: 'Aprobación final de expedientes',
    secretario_adjunto: 'Gestionar consultas ciudadanas',
    tecnico_prensa: 'Crear y gestionar noticias',
    director_prensa: 'Supervisar y aprobar publicaciones',
    presidente_cspj: 'Supervisión general del sistema',
    vicepresidente_cspj: 'Supervisión general del sistema',
    admin: 'Administración completa del sistema',
  }
  return descriptions[role] || 'Acceso básico al sistema'
}
</script>

<style scoped>
.prose ul {
  list-style-type: disc;
  padding-left: 1rem;
}

.prose li {
  margin-bottom: 0.25rem;
}
</style>
