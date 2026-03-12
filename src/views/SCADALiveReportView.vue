<template>
  <div>
    <ScadaNavbar />

    <div
      class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 font-poppins"
    >
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-white">SCADA Live Report Dashboard</h1>
          <p class="mt-1 text-sm text-gray-400">
            Data langsung dari endpoint Odoo SCADA Manufacturing
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center gap-2 rounded-full border border-cyan-500/50 bg-cyan-500/10 px-3 py-1"
          >
            <span class="h-2 w-2 rounded-full bg-cyan-400"></span>
            <span class="text-xs font-semibold text-cyan-300">LIVE JSON-RPC</span>
          </span>
          <button
            class="inline-flex items-center gap-2 rounded-lg border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-white transition hover:border-cyan-500"
            :disabled="refreshing"
            @click="refreshDashboard"
          >
            <span class="material-symbols-outlined text-base">refresh</span>
            {{ refreshing ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </div>

      <div
        class="mb-6 rounded-xl border border-slate-600 bg-slate-800/70 p-4 text-sm text-gray-300"
      >
        <p>
          Terakhir update: <span class="font-semibold text-cyan-300">{{ lastUpdated }}</span>
        </p>
        <p v-if="errorMessage" class="mt-2 text-red-300">{{ errorMessage }}</p>
      </div>

      <div
        v-if="loading"
        class="rounded-xl border border-slate-600 bg-slate-800/70 p-8 text-center text-gray-300"
      >
        Memuat data dashboard live...
      </div>

      <template v-else>
        <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <p class="text-xs text-gray-400">BATCH COMPLETED (TODAY)</p>
            <p class="mt-2 text-3xl font-bold text-white">{{ formatNumber(batchCompleted) }}</p>
            <p class="mt-1 text-xs text-gray-400">
              Total terjadwal: {{ formatNumber(batchScheduled) }}
            </p>
          </div>

          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <p class="text-xs text-gray-400">PRODUKSI HARI INI</p>
            <p class="mt-2 text-3xl font-bold text-white">
              {{ formatDecimal(totalProductionToday) }}
            </p>
            <p class="mt-1 text-xs text-gray-400">Qty finished</p>
          </div>

          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <p class="text-xs text-gray-400">AVG OEE QUALITY TODAY</p>
            <p class="mt-2 text-3xl font-bold text-white">{{ formatDecimal(avgYieldToday) }}%</p>
            <p class="mt-1 text-xs text-gray-400">Yield percent</p>
          </div>

          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <p class="text-xs text-gray-400">ACHIEVEMENT THIS MONTH</p>
            <p class="mt-2 text-3xl font-bold text-white">{{ formatDecimal(monthAchievement) }}%</p>
            <p class="mt-1 text-xs text-gray-400">Target vs Actual</p>
          </div>
        </div>

        <div class="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <h2 class="mb-4 text-lg font-semibold text-white">Batch-to-Batch Deviation</h2>
            <apexchart
              type="line"
              height="300"
              :options="deviationChartOptions"
              :series="deviationChartSeries"
            />
          </div>

          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <h2 class="mb-4 text-lg font-semibold text-white">Daily Target vs Actual</h2>
            <apexchart
              type="bar"
              height="300"
              :options="targetActualChartOptions"
              :series="targetActualChartSeries"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <h2 class="mb-4 text-lg font-semibold text-white">KPI Product Report</h2>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-600 text-left text-gray-300">
                    <th class="px-2 py-2">Product</th>
                    <th class="px-2 py-2 text-right">Yield %</th>
                    <th class="px-2 py-2 text-right">Consumption Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, index) in productRows"
                    :key="`product-${index}`"
                    class="border-b border-slate-700/60 text-gray-200"
                  >
                    <td class="px-2 py-2">{{ row.product_name || '-' }}</td>
                    <td class="px-2 py-2 text-right">
                      {{ formatDecimal(row?.avg_kpi?.yield_percent) }}
                    </td>
                    <td class="px-2 py-2 text-right">
                      {{ formatDecimal(row?.avg_kpi?.consumption_ratio) }}
                    </td>
                  </tr>
                  <tr v-if="!productRows.length">
                    <td colspan="3" class="px-2 py-4 text-center text-gray-400">
                      Data tidak tersedia
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <h2 class="mb-4 text-lg font-semibold text-white">Equipment Failure Summary</h2>
            <div
              class="mb-3 rounded-lg border border-slate-600 bg-slate-700/40 p-3 text-sm text-gray-200"
            >
              Total Failure: {{ formatNumber(failureTotal) }} | Equipment Count:
              {{ formatNumber(failureEquipmentCount) }}
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-600 text-left text-gray-300">
                    <th class="px-2 py-2">Equipment</th>
                    <th class="px-2 py-2 text-right">Failure Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, index) in failureRows"
                    :key="`failure-${index}`"
                    class="border-b border-slate-700/60 text-gray-200"
                  >
                    <td class="px-2 py-2">{{ row.equipment_name || row.equipment || '-' }}</td>
                    <td class="px-2 py-2 text-right">{{ formatNumber(row.failure_count) }}</td>
                  </tr>
                  <tr v-if="!failureRows.length">
                    <td colspan="2" class="px-2 py-4 text-center text-gray-400">
                      Data tidak tersedia
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import ScadaNavbar from '../components/ScadaNavbar.vue'
import { authenticateScadaSession, callScadaJsonRpc } from '../services/scadaApi'

const loading = ref(true)
const refreshing = ref(false)
const errorMessage = ref('')
const lastUpdated = ref('-')

const todayReport = ref({})
const periodicReport = ref({})
const productReport = ref({})
const equipmentFailureReport = ref({})

let refreshInterval = null

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(toNumber(value))
}

function formatDecimal(value) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(toNumber(value))
}

const today = computed(() => todayReport.value || {})
const periodic = computed(() => periodicReport.value || {})

const batchCompleted = computed(() => today.value?.batch_status?.completed)
const batchScheduled = computed(() => today.value?.batch_status?.scheduled_total)
const totalProductionToday = computed(() => today.value?.total_production_today?.qty_finished)
const avgYieldToday = computed(() => today.value?.oee_quality_today?.avg_yield_percent)
const monthAchievement = computed(
  () => periodic.value?.metrics_total_production?.achievement_percent,
)

const deviationRows = computed(() => today.value?.batch_to_batch_deviation_chart?.data || [])
const deviationCategories = computed(() =>
  deviationRows.value.map(
    (item, index) => item.batch || item.mo_id || item.name || `#${index + 1}`,
  ),
)
const deviationValues = computed(() =>
  deviationRows.value.map((item) =>
    toNumber(
      item.max_abs_deviation_percent ??
        item.deviation_percent ??
        item.deviation ??
        item.yield_deviation,
    ),
  ),
)

const targetActualRows = computed(() => periodic.value?.chart_daily_target_vs_actual?.data || [])
const targetCategories = computed(() =>
  targetActualRows.value.map(
    (item, index) => item.date || item.day || item.label || `${index + 1}`,
  ),
)
const targetValues = computed(() =>
  targetActualRows.value.map((item) => toNumber(item.target_qty ?? item.target)),
)
const actualValues = computed(() =>
  targetActualRows.value.map((item) => toNumber(item.actual_qty ?? item.actual)),
)

const productRows = computed(() => {
  if (Array.isArray(productReport.value?.data)) {
    return productReport.value.data.slice(0, 8)
  }
  return []
})

const failureSummary = computed(() => equipmentFailureReport.value?.summary || {})
const failureRows = computed(() => failureSummary.value?.by_equipment || [])
const failureTotal = computed(() => failureSummary.value?.total_failures)
const failureEquipmentCount = computed(() => failureSummary.value?.equipment_count)

const deviationChartOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    background: 'transparent',
  },
  colors: ['#a855f7'],
  stroke: { curve: 'smooth', width: 3 },
  grid: { borderColor: '#475569', strokeDashArray: 3 },
  xaxis: {
    categories: deviationCategories.value,
    labels: { style: { colors: '#cbd5e1' } },
  },
  yaxis: {
    labels: { style: { colors: '#cbd5e1' } },
    max: undefined,
  },
  dataLabels: { enabled: false },
  tooltip: { theme: 'dark' },
}))

const deviationChartSeries = computed(() => [
  {
    name: 'Deviation',
    data: deviationValues.value,
  },
])

const targetActualChartOptions = computed(() => ({
  chart: {
    stacked: false,
    toolbar: { show: false },
    background: 'transparent',
  },
  colors: ['#06b6d4', '#f97316'],
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '45%',
      borderRadius: 4,
    },
  },
  grid: { borderColor: '#475569', strokeDashArray: 3 },
  xaxis: {
    categories: targetCategories.value,
    labels: { style: { colors: '#cbd5e1' } },
  },
  yaxis: {
    labels: { style: { colors: '#cbd5e1' } },
  },
  dataLabels: { enabled: false },
  legend: { labels: { colors: '#cbd5e1' } },
  tooltip: { theme: 'dark' },
}))

const targetActualChartSeries = computed(() => [
  {
    name: 'Target',
    data: targetValues.value,
  },
  {
    name: 'Actual',
    data: actualValues.value,
  },
])

async function syncDashboard(silent = false) {
  if (silent) {
    refreshing.value = true
  } else {
    loading.value = true
  }

  errorMessage.value = ''

  try {
    await authenticateScadaSession()

    const [todayPayload, periodicPayload, productPayload, equipmentFailurePayload] =
      await Promise.all([
        callScadaJsonRpc('today-reports', {
          date: new Date().toISOString().slice(0, 10),
          limit: 200,
        }),
        callScadaJsonRpc('periodic-report', {
          period: 'this_month',
          limit: 1000,
        }),
        callScadaJsonRpc('kpi-product-report', {
          period: 'this_month',
          limit: 100,
          offset: 0,
        }),
        callScadaJsonRpc('equipment-failure-report', {
          period: 'this_month',
          limit: 100,
          offset: 0,
        }),
      ])

    todayReport.value = todayPayload || {}
    periodicReport.value = periodicPayload || {}
    productReport.value = productPayload || {}
    equipmentFailureReport.value = equipmentFailurePayload || {}

    lastUpdated.value = new Date().toLocaleString('id-ID')
  } catch (error) {
    errorMessage.value = error?.message || 'Gagal mengambil data dashboard live'
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function refreshDashboard() {
  syncDashboard(true)
}

onMounted(() => {
  syncDashboard()
  refreshInterval = setInterval(() => {
    syncDashboard(true)
  }, 60000)
})

onUnmounted(() => {
  clearInterval(refreshInterval)
})
</script>

<style scoped>
.material-symbols-outlined {
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
</style>
