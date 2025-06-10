<template>
  <Tag :value="roleLabel" :severity="roleSeverity" class="text-xs" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'
import type { UserRole } from '@/types/user'
import { USER_ROLE_LABELS, USER_ROLE_COLORS } from '@/types/user'

interface Props {
  role: UserRole
  userId?: string
}

const props = defineProps<Props>()

const roleLabel = computed(() => USER_ROLE_LABELS[props.role] || props.role)

const roleSeverity = computed(() => USER_ROLE_COLORS[props.role] || 'secondary')
</script>
