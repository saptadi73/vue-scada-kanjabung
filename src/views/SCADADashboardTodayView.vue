<template>
  <div>
    <ScadaNavbar />
    <div
      class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 font-poppins"
    >
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
            <span class="material-symbols-outlined text-white text-2xl">today</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-white">Dashboard Harian (Today)</h1>
            <p class="text-sm text-gray-400">Ringkasan produksi & kualitas hari ini</p>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            v-model="selectedDate"
            class="bg-slate-700 border border-slate-500 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
          />
          <button
            @click="loadData"
            :disabled="loading"
            class="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition disabled:opacity-50"
          >
            <span class="material-symbols-outlined text-base">refresh</span>
            {{ loading ? 'Memuat...' : 'Refresh' }}
          </button>
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="errorMsg"
        class="mb-4 rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-300"
      >
        {{ errorMsg }}
      </div>

      <!-- Last Update -->
      <div class="mb-6 text-xs text-gray-500">
        Terakhir update: <span class="text-cyan-400">{{ lastUpdated }}</span>
      </div>

      <div v-if="loading" class="text-center text-gray-400 py-16">Memuat data...</div>

      <template v-else>
        <!-- KPI Row 1: Batch Status -->
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <div
            v-for="kpi in kpiCards"
            :key="kpi.label"
            class="rounded-xl border border-slate-600/60 p-4"
            :class="kpi.bg"
          >
            <p class="text-xs font-semibold uppercase tracking-wide mb-2" :class="kpi.labelColor">
              {{ kpi.label }}
            </p>
            <p class="text-3xl font-bold text-white">{{ kpi.value }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ kpi.sub }}</p>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <!-- Batch-to-Batch Deviation Chart -->
          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-purple-400">analytics</span>
              Batch-to-Batch Deviation
            </h2>
            <div
              v-if="!deviationSeries[0].data.length"
              class="py-10 text-center text-gray-500 text-sm"
            >
              Belum ada data batch hari ini
            </div>
            <apexchart
              v-else
              type="line"
              height="300"
              :options="deviationChartOpts"
              :series="deviationSeries"
            />
          </div>

          <!-- OEE by Equipment -->
          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-cyan-400">precision_manufacturing</span>
              OEE Quality per Equipment
            </h2>
            <div
              v-if="!byEquipmentSeries[0].data.length"
              class="py-10 text-center text-gray-500 text-sm"
            >
              Belum ada data OEE hari ini
            </div>
            <apexchart
              v-else
              type="bar"
              height="300"
              :options="byEquipmentChartOpts"
              :series="byEquipmentSeries"
            />
          </div>
        </div>

        <!-- By Equipment Detail Table -->
        <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
          <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-400">table_chart</span>
            Detail OEE per Equipment Hari Ini
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-600 text-left text-gray-300">
                  <th class="px-3 py-2">Equipment</th>
                  <th class="px-3 py-2 text-right">Records</th>
                  <th class="px-3 py-2 text-right">Yield %</th>
                  <th class="px-3 py-2 text-right">Consumption Ratio</th>
                  <th class="px-3 py-2 text-right">Qty Finished</th>
                  <th class="px-3 py-2 text-right">Deviation Alerts</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(eq, i) in byEquipmentRows"
                  :key="i"
                  class="border-b border-slate-700/50 hover:bg-slate-700/30"
                >
                  <td class="px-3 py-2 text-white font-medium">
                    {{ eq.equipment_name || eq.equipment || '-' }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-300">
                    {{ fmt(eq.oee_records_count) }}
                  </td>
                  <td
                    class="px-3 py-2 text-right"
                    :class="
                      eq.avg_yield_percent >= 95
                        ? 'text-green-400'
                        : eq.avg_yield_percent >= 80
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    "
                  >
                    {{ fmtDec(eq.avg_yield_percent) }}%
                  </td>
                  <td class="px-3 py-2 text-right text-gray-300">
                    {{ fmtDec(eq.avg_consumption_ratio) }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-300">{{ fmtDec(eq.qty_finished) }}</td>
                  <td
                    class="px-3 py-2 text-right"
                    :class="eq.deviation_alerts > 0 ? 'text-red-400' : 'text-green-400'"
                  >
                    {{ fmt(eq.deviation_alerts) }}
                  </td>
                </tr>
                <tr v-if="!byEquipmentRows.length">
                  <td colspan="6" class="px-3 py-8 text-center text-gray-500">
                    Belum ada data hari ini
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import ScadaNavbar from '../components/ScadaNavbar.vue'
import { authenticateScadaSession, callScadaJsonRpc } from '../services/scadaApi'

const loading = ref(true)
const errorMsg = ref('')
const lastUpdated = ref('-')
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const data = ref({})

function fmt(v) {
  return new Intl.NumberFormat('id-ID').format(Number(v) || 0)
}
function fmtDec(v) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(v) || 0)
}

const r = computed(() => data.value)

const kpiCards = computed(() => [
  {
    label: 'Batch Terjadwal',
    value: fmt(r.value?.batch_status?.scheduled_total),
    sub: 'hari ini',
    bg: 'bg-slate-800/70',
    labelColor: 'text-gray-400',
  },
  {
    label: 'Batch Selesai',
    value: fmt(r.value?.batch_status?.completed),
    sub: 'completed',
    bg: 'bg-green-500/10 border-green-500/30',
    labelColor: 'text-green-400',
  },
  {
    label: 'Batch Belum Selesai',
    value: fmt(r.value?.batch_status?.unfinished),
    sub: 'unfinished',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    labelColor: 'text-yellow-400',
  },
  {
    label: 'Qty Finished',
    value: fmtDec(r.value?.total_production_today?.qty_finished),
    sub: 'dari batch selesai',
    bg: 'bg-cyan-500/10 border-cyan-500/30',
    labelColor: 'text-cyan-400',
  },
  {
    label: 'Avg Yield %',
    value: fmtDec(r.value?.oee_quality_today?.avg_yield_percent) + '%',
    sub: 'kualitas OEE',
    bg: 'bg-blue-500/10 border-blue-500/30',
    labelColor: 'text-blue-400',
  },
  {
    label: 'Deviation Alerts',
    value: fmt(r.value?.oee_quality_today?.total_deviation_alerts),
    sub: 'alert total',
    bg:
      r.value?.oee_quality_today?.total_deviation_alerts > 0
        ? 'bg-red-500/10 border-red-500/30'
        : 'bg-slate-800/70',
    labelColor:
      r.value?.oee_quality_today?.total_deviation_alerts > 0 ? 'text-red-400' : 'text-gray-400',
  },
])

const deviationRows = computed(() => r.value?.batch_to_batch_deviation_chart?.data || [])
const deviationChartOpts = computed(() => ({
  chart: { toolbar: { show: false }, background: 'transparent' },
  stroke: { curve: 'smooth', width: 3 },
  colors: ['#a855f7'],
  grid: { borderColor: '#475569', strokeDashArray: 3 },
  xaxis: {
    categories: deviationRows.value.map((d, i) => d.batch || d.mo_id || d.name || `#${i + 1}`),
    labels: { style: { colors: '#cbd5e1' } },
  },
  yaxis: { labels: { style: { colors: '#cbd5e1' } } },
  dataLabels: { enabled: false },
  tooltip: { theme: 'dark' },
  annotations: { yaxis: [{ y: 0, borderColor: '#64748b', strokeDashArray: 4 }] },
}))
const deviationSeries = computed(() => [
  {
    name: 'Deviation %',
    data: deviationRows.value.map(
      (d) => Number(d.deviation_percent ?? d.deviation ?? d.yield_deviation) || 0,
    ),
  },
])

const byEquipmentRows = computed(() => r.value?.oee_quality_today?.by_equipment || [])
const byEquipmentChartOpts = computed(() => ({
  chart: { toolbar: { show: false }, background: 'transparent' },
  plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
  colors: ['#06b6d4'],
  grid: { borderColor: '#475569', strokeDashArray: 3 },
  xaxis: { labels: { style: { colors: '#cbd5e1' } } },
  yaxis: {
    categories: byEquipmentRows.value.map((e) => e.equipment_name || e.equipment || '-'),
    labels: { style: { colors: '#cbd5e1' } },
  },
  dataLabels: { enabled: false },
  tooltip: { theme: 'dark' },
}))
const byEquipmentSeries = computed(() => [
  {
    name: 'Yield %',
    data: byEquipmentRows.value.map((e) => Number(e.avg_yield_percent) || 0),
  },
])

async function loadData() {
  loading.value = true
  errorMsg.value = ''
  try {
    await authenticateScadaSession()
    const res = await callScadaJsonRpc('today-reports', { date: selectedDate.value, limit: 200 })
    data.value = res || {}
    lastUpdated.value = new Date().toLocaleString('id-ID')
  } catch (e) {
    errorMsg.value = e?.message || 'Gagal memuat data'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
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
