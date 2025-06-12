<template>
  <div :class="cardClasses">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
          {{ title }}
        </p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {{ formatValue(value) }}
        </p>
      </div>
      <div :class="iconClasses">
        <i :class="icon" class="text-xl"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value: number
  icon: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue',
})

const cardClasses = computed(() => {
  const baseClasses = 'p-6 rounded-lg border'
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    green: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    red: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    purple: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
    gray: 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800',
  }

  return `${baseClasses} ${colorClasses[props.color]}`
})

const iconClasses = computed(() => {
  const baseClasses = 'w-12 h-12 rounded-lg flex items-center justify-center'
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300',
    green: 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-800 dark:text-yellow-300',
    red: 'bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-300',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-300',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  }

  return `${baseClasses} ${colorClasses[props.color]}`
})

function formatValue(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  }
  return value.toString()
}
</script>
