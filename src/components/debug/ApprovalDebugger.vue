<template>
  <Card>
    <template #title>🔍 Debug Approval Issue</template>
    <template #content>
      <div class="space-y-4">
        <!-- User Info -->
        <div class="p-3 bg-blue-50 rounded">
          <h4 class="font-semibold mb-2">User Information</h4>
          <ul class="text-sm space-y-1">
            <li><strong>ID:</strong> {{ user?.id }}</li>
            <li><strong>Role:</strong> {{ userRole }}</li>
            <li><strong>Name:</strong> {{ user?.fullName }}</li>
            <li><strong>Email:</strong> {{ user?.email }}</li>
          </ul>
        </div>

        <!-- News Info -->
        <div v-if="news" class="p-3 bg-yellow-50 rounded">
          <h4 class="font-semibold mb-2">News Information</h4>
          <ul class="text-sm space-y-1">
            <li><strong>ID:</strong> {{ news.id }}</li>
            <li><strong>Title:</strong> {{ news.title }}</li>
            <li><strong>Status:</strong> {{ news.status }}</li>
            <li><strong>Type:</strong> {{ news.type }}</li>
            <li><strong>Created By:</strong> {{ news.createdBy || 'EMPTY/NULL' }}</li>
            <li><strong>Author ID:</strong> {{ (news as any).authorId || 'EMPTY/NULL' }}</li>
            <li><strong>Creator Object:</strong> {{ JSON.stringify(news.creator) }}</li>
            <li><strong>Full News Object:</strong> <pre class="text-xs mt-1 bg-white p-1 rounded">{{ JSON.stringify(news, null, 2) }}</pre></li>
          </ul>
        </div>

        <!-- Permission Check -->
        <div class="p-3 bg-green-50 rounded">
          <h4 class="font-semibold mb-2">Permission Check</h4>
          <ul class="text-sm space-y-1">
            <li><strong>Can Approve as Director:</strong> {{ news ? canApproveAsDirector(news) : 'N/A' }}</li>
            <li><strong>User Role Valid:</strong> {{ userRole === 'director_prensa' }}</li>
            <li>
              <strong>News Status Valid:</strong> {{ news?.status === 'pending_director_approval' }}
            </li>
            <li><strong>Not Own News:</strong> {{ !isOwnNews }}</li>
          </ul>
        </div>

        <!-- Test Buttons -->
        <div class="space-y-2">
          <Button
            label="Test Direct API Call"
            icon="pi pi-play"
            severity="info"
            @click="testDirectApiCall"
            :loading="testing"
            class="w-full"
          />

          <Button
            label="Test with Service"
            icon="pi pi-cog"
            severity="warning"
            @click="testWithService"
            :loading="testing"
            class="w-full"
          />

          <Button
            label="Test Simple GET"
            icon="pi pi-refresh"
            severity="secondary"
            @click="testGetNews"
            :loading="testing"
            class="w-full"
          />

          <Button
            label="Test with Empty Body"
            icon="pi pi-send"
            severity="info"
            @click="testWithEmptyBody"
            :loading="testing"
            class="w-full"
          />

          <Button
            label="Test with Minimal Data"
            icon="pi pi-cog"
            severity="warning"
            @click="testWithMinimalData"
            :loading="testing"
            class="w-full"
          />

          <Button
            label="Check Backend Logs"
            icon="pi pi-search"
            severity="help"
            @click="suggestBackendCheck"
            class="w-full"
          />
        </div>

        <!-- Results -->
        <div v-if="lastResult" class="p-3 bg-gray-50 rounded">
          <h4 class="font-semibold mb-2">Last Test Result</h4>
          <pre class="text-xs bg-white p-2 rounded border overflow-auto">{{
            JSON.stringify(lastResult, null, 2)
          }}</pre>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useNews } from '@/composables/useNews'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import axiosInstance from '@/api/axios'
import { API_ENDPOINTS } from '@/api/config'
import type { News } from '@/types/news'

interface Props {
  news: News | null
}

const props = defineProps<Props>()

const { user, userRole } = useAuth()
const { canApproveAsDirector, approveAsDirector } = useNews()
const toast = useToast()

const testing = ref(false)
const lastResult = ref<any>(null)

const isOwnNews = computed(() => {
  if (!props.news || !user.value) return false
  const creatorId = (props.news as any).authorId || props.news.createdBy
  return String(creatorId) === String(user.value.id)
})

const testDirectApiCall = async () => {
  if (!props.news) return

  testing.value = true
  try {
    const endpoint = API_ENDPOINTS.NEWS_APPROVE_DIRECTOR(props.news.id)
    console.log('🔍 Testing direct API call to:', endpoint)

    const response = await axiosInstance.post(endpoint, {
      comments: 'Debug test approval',
    })

    lastResult.value = {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    }

    toast.add({
      severity: 'success',
      summary: 'Direct API Success',
      detail: 'Direct API call worked!',
      life: 3000,
    })
  } catch (error: any) {
    console.error('🔍 Direct API call failed:', error)

    lastResult.value = {
      success: false,
      error: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    }

    // Log completo del error 500
    if (error.response?.status === 500) {
      console.error('🔥 ERROR 500 DETAILS:')
      console.error('Response data:', error.response.data)
      console.error('Response headers:', error.response.headers)
      console.error('Request config:', error.config)
    }

    toast.add({
      severity: 'error',
      summary: 'Direct API Failed',
      detail: `Status: ${error.response?.status}, Message: ${error.response?.data?.message || error.message}`,
      life: 5000,
    })
  } finally {
    testing.value = false
  }
}

const testWithService = async () => {
  if (!props.news) return

  testing.value = true
  try {
    console.log('🔍 Testing with service method')

    const result = await approveAsDirector(props.news.id, {
      comments: 'Debug test approval via service',
    })

    lastResult.value = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    }

    toast.add({
      severity: 'success',
      summary: 'Service Success',
      detail: 'Service method worked!',
      life: 3000,
    })
  } catch (error: any) {
    console.error('🔍 Service method failed:', error)

    lastResult.value = {
      success: false,
      error: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    }

    toast.add({
      severity: 'error',
      summary: 'Service Failed',
      detail: `Status: ${error.response?.status}, Message: ${error.response?.data?.message || error.message}`,
      life: 5000,
    })
  } finally {
    testing.value = false
  }
}

const testGetNews = async () => {
  if (!props.news) return

  testing.value = true
  try {
    const endpoint = `/news/${props.news.id}`
    console.log('🔍 Testing GET news to verify data:', endpoint)

    const response = await axiosInstance.get(endpoint)

    console.log('📰 Full news object from API:', response.data)

    lastResult.value = {
      success: true,
      action: 'GET_NEWS',
      data: response.data,
      timestamp: new Date().toISOString(),
    }

    toast.add({
      severity: 'success',
      summary: 'GET News Success',
      detail: 'News data retrieved successfully',
      life: 3000,
    })
  } catch (error: any) {
    console.error('🔍 GET news failed:', error)

    lastResult.value = {
      success: false,
      action: 'GET_NEWS',
      error: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    }

    toast.add({
      severity: 'error',
      summary: 'GET News Failed',
      detail: `Status: ${error.response?.status}`,
      life: 5000,
    })
  } finally {
    testing.value = false
  }
}

const testWithEmptyBody = async () => {
  if (!props.news) return

  testing.value = true
  try {
    const endpoint = API_ENDPOINTS.NEWS_APPROVE_DIRECTOR(props.news.id)
    console.log('🔍 Testing with empty body:', endpoint)

    const response = await axiosInstance.post(endpoint)

    lastResult.value = {
      success: true,
      action: 'EMPTY_BODY',
      data: response.data,
      timestamp: new Date().toISOString(),
    }

    toast.add({
      severity: 'success',
      summary: 'Empty Body Success',
      detail: 'API call with empty body worked!',
      life: 3000,
    })
  } catch (error: any) {
    console.error('🔍 Empty body test failed:', error)

    if (error.response?.status === 500) {
      console.error('🔥 ERROR 500 DETAILS (Empty Body):')
      console.error('Response data:', error.response.data)
      console.error('Response headers:', error.response.headers)
    }

    lastResult.value = {
      success: false,
      action: 'EMPTY_BODY',
      error: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    }

    toast.add({
      severity: 'error',
      summary: 'Empty Body Failed',
      detail: `Status: ${error.response?.status}`,
      life: 5000,
    })
  } finally {
    testing.value = false
  }
}

const testWithMinimalData = async () => {
  if (!props.news) return

  testing.value = true
  try {
    const endpoint = API_ENDPOINTS.NEWS_APPROVE_DIRECTOR(props.news.id)
    console.log('🔍 Testing with minimal data:', endpoint)

    const response = await axiosInstance.post(endpoint, {
      action: 'approve',
    })

    lastResult.value = {
      success: true,
      action: 'MINIMAL_DATA',
      data: response.data,
      timestamp: new Date().toISOString(),
    }

    toast.add({
      severity: 'success',
      summary: 'Minimal Data Success',
      detail: 'API call with minimal data worked!',
      life: 3000,
    })
  } catch (error: any) {
    console.error('🔍 Minimal data test failed:', error)

    if (error.response?.status === 500) {
      console.error('🔥 ERROR 500 DETAILS (Minimal Data):')
      console.error('Response data:', error.response.data)
      console.error('Response headers:', error.response.headers)
    }

    lastResult.value = {
      success: false,
      action: 'MINIMAL_DATA',
      error: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    }

    toast.add({
      severity: 'error',
      summary: 'Minimal Data Failed',
      detail: `Status: ${error.response?.status}`,
      life: 5000,
    })
  } finally {
    testing.value = false
  }
}

const suggestBackendCheck = () => {
  const suggestions = [
    '1. Verificar logs del backend para el endpoint: POST /news/:id/approve-director',
    '2. Comprobar middleware de autenticación',
    '3. Verificar que el rol "director_prensa" está permitido',
    '4. Revisar validaciones de la noticia (estado, permisos, etc.)',
    '5. Verificar que el ID de la noticia existe y es válido',
    '6. Comprobar si hay validaciones específicas para el creador/autor',
  ]

  toast.add({
    severity: 'info',
    summary: 'Backend Check Suggestions',
    detail: suggestions.join('\n'),
    life: 10000,
  })

  console.log('🔍 Backend debugging suggestions:')
  suggestions.forEach((suggestion) => console.log(suggestion))
}
</script>
