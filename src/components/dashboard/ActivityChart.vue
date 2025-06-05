<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import Select from 'primevue/select'

interface Props {
  data?: {
    labels: string[]
    datasets: any[]
  }
  type?: 'line' | 'bar' | 'doughnut'
  title?: string
  height?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'line',
  title: 'Actividad',
  height: '300px',
  loading: false,
})

// Estado local
const selectedPeriod = ref('week')
const chartData = ref<any>(null)
const chartOptions = ref<any>(null)

// Opciones de período
const periodOptions = [
  { label: 'Última semana', value: 'week' },
  { label: 'Último mes', value: 'month' },
  { label: 'Último año', value: 'year' },
]

// Datos de ejemplo si no se proporcionan
const defaultData = computed(() => ({
  week: {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Expedientes Creados',
        data: [12, 19, 15, 25, 22, 30, 18],
        fill: false,
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6',
        tension: 0.4,
      },
      {
        label: 'Expedientes Aprobados',
        data: [8, 12, 10, 18, 15, 20, 12],
        fill: false,
        borderColor: '#10B981',
        backgroundColor: '#10B981',
        tension: 0.4,
      },
    ],
  },
  month: {
    labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
    datasets: [
      {
        label: 'Expedientes Creados',
        data: [65, 78, 90, 85],
        fill: false,
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6',
        tension: 0.4,
      },
      {
        label: 'Expedientes Aprobados',
        data: [45, 55, 70, 60],
        fill: false,
        borderColor: '#10B981',
        backgroundColor: '#10B981',
        tension: 0.4,
      },
    ],
  },
  year: {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [
      {
        label: 'Expedientes Creados',
        data: [180, 200, 195, 220, 240, 280, 300, 285, 310, 320, 340, 360],
        fill: false,
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6',
        tension: 0.4,
      },
      {
        label: 'Expedientes Aprobados',
        data: [150, 165, 170, 190, 200, 235, 250, 240, 265, 275, 290, 310],
        fill: false,
        borderColor: '#10B981',
        backgroundColor: '#10B981',
        tension: 0.4,
      },
    ],
  },
}))

// Configurar opciones del gráfico
const setupChartOptions = () => {
  const documentStyle = getComputedStyle(document.documentElement)
  const textColor = documentStyle.getPropertyValue('--p-text-color')
  const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color')
  const surfaceBorder = documentStyle.getPropertyValue('--p-border-color')

  chartOptions.value = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: textColor,
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#ddd',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.raw}`
          },
        },
      },
    },
    scales:
      props.type !== 'doughnut'
        ? {
            x: {
              ticks: {
                color: textColorSecondary,
              },
              grid: {
                color: surfaceBorder,
                drawBorder: false,
              },
            },
            y: {
              ticks: {
                color: textColorSecondary,
              },
              grid: {
                color: surfaceBorder,
                drawBorder: false,
              },
              beginAtZero: true,
            },
          }
        : undefined,
  }
}

// Actualizar datos del gráfico
const updateChartData = () => {
  if (props.data) {
    chartData.value = props.data
  } else {
    // Usar datos de ejemplo según el período seleccionado
    chartData.value = defaultData.value[selectedPeriod.value as keyof typeof defaultData.value]
  }
}

// Watch para cambios en el período
watch(selectedPeriod, () => {
  updateChartData()
})

// Watch para cambios en los datos
watch(
  () => props.data,
  () => {
    updateChartData()
  },
  { deep: true },
)

onMounted(() => {
  setupChartOptions()
  updateChartData()
})
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="pi pi-chart-line text-xl"></i>
          <span>{{ title }}</span>
        </div>
        <Select
          v-model="selectedPeriod"
          :options="periodOptions"
          optionLabel="label"
          optionValue="value"
          class="w-40"
          size="small"
        />
      </div>
    </template>

    <template #content>
      <div :style="{ height: height }" class="relative">
        <!-- Loading overlay -->
        <div
          v-if="loading"
          class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10"
        >
          <i class="pi pi-spin pi-spinner text-3xl text-primary"></i>
        </div>

        <!-- Chart -->
        <Chart :type="type" :data="chartData" :options="chartOptions" class="h-full" />
      </div>
    </template>
  </Card>
</template>

<style scoped>
:deep(.p-chart) {
  height: 100% !important;
}
</style>
