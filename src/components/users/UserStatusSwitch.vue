<template>
  <div class="flex items-center gap-2">
    <InputSwitch
      v-model="localStatus"
      :disabled="loading"
      @change="handleStatusChange"
    />
    <span v-if="showLabel" class="text-sm" :class="statusTextClass">
      {{ statusLabel }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import InputSwitch from 'primevue/inputswitch'

interface Props {
  userId: string
  initialStatus: 'activo' | 'inactivo'
  showLabel?: boolean
}

interface Emits {
  (e: 'statusChanged', status: 'activo' | 'inactivo'): void
  (e: 'error', error: string): void
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: true
})

const emit = defineEmits<Emits>()

const localStatus = ref(props.initialStatus === 'activo')
const loading = ref(false)

const statusLabel = computed(() => {
  return localStatus.value ? 'Activo' : 'Inactivo'
})

const statusTextClass = computed(() => {
  return localStatus.value ? 'text-green-600' : 'text-gray-500'
})

const handleStatusChange = async () => {
  const newStatus = localStatus.value ? 'activo' : 'inactivo'
  emit('statusChanged', newStatus)
}

// Sincronizar con el prop inicial cuando cambie
watch(
  () => props.initialStatus,
  (newStatus) => {
    localStatus.value = newStatus === 'activo'
  }
)
</script>