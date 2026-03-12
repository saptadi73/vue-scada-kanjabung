<template>
  <div>
    <ScadaNavbar />
    <div
      class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 font-poppins"
    >
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
            <span class="material-symbols-outlined text-white text-2xl">calendar_month</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-white">Laporan Periodik</h1>
            <p class="text-sm text-gray-400">Produksi &amp; kualitas periode terpilih</p>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <select
            v-model="period"
            class="bg-slate-700 border border-slate-500 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="this_week">Minggu Ini</option>
            <option value="this_month">Bulan Ini</option>
            <option value="last_month">Bulan Lalu</option>
            <option value="this_year">Tahun Ini</option>
          </select>
          <button
            @click="loadData"
            :disabled="loading"
            class="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition disabled:opacity-50"
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
      <div class="mb-6 text-xs text-gray-500">
        Terakhir update: <span class="text-emerald-400">{{ lastUpdated }}</span>
      </div>

      <div v-if="loading" class="text-center text-gray-400 py-16">Memuat data...</div>

      <template v-else>
        <!-- KPI: Total Produksi -->
        <h2
          class="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-2"
        >
          <span class="material-symbols-outlined text-base">conveyor_belt</span> Total Produksi
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div class="rounded-xl border border-slate-600/60 bg-slate-800/70 p-4">
            <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Target Qty</p>
            <p class="text-2xl font-bold text-white">
              {{ fmt(r.metrics_total_production?.target_qty_total) }}
            </p>
          </div>
          <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p class="text-xs text-emerald-400 uppercase tracking-wide mb-1">Actual Qty</p>
            <p class="text-2xl font-bold text-white">
              {{ fmt(r.metrics_total_production?.actual_qty_total) }}
            </p>
          </div>
          <div class="rounded-xl border border-slate-600/60 bg-slate-800/70 p-4">
            <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Achievement</p>
            <p
              class="text-2xl font-bold"
              :class="
                r.metrics_total_production?.achievement_percent >= 100
                  ? 'text-green-400'
                  : 'text-yellow-400'
              "
            >
              {{ fmtDec(r.metrics_total_production?.achievement_percent) }}%
            </p>
          </div>
        </div>

        <!-- KPI: Total MO -->
        <h2
          class="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-2"
        >
          <span class="material-symbols-outlined text-base">receipt_long</span> Total Manufacturing
          Order
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="rounded-xl border border-slate-600/60 bg-slate-800/70 p-4">
            <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">MO Planned</p>
            <p class="text-2xl font-bold text-white">
              {{ fmt(r.metrics_total_mo?.total_mo_planned) }}
            </p>
          </div>
          <div class="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
            <p class="text-xs text-green-400 uppercase tracking-wide mb-1">MO Done</p>
            <p class="text-2xl font-bold text-green-400">
              {{ fmt(r.metrics_total_mo?.total_mo_done) }}
            </p>
          </div>
          <div class="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
            <p class="text-xs text-yellow-400 uppercase tracking-wide mb-1">In Progress</p>
            <p class="text-2xl font-bold text-yellow-400">
              {{ fmt(r.metrics_total_mo?.total_mo_in_progress) }}
            </p>
          </div>
          <div class="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p class="text-xs text-red-400 uppercase tracking-wide mb-1">Unfinished</p>
            <p class="text-2xl font-bold text-red-400">
              {{ fmt(r.metrics_total_mo?.total_mo_unfinished) }}
            </p>
          </div>
        </div>

        <!-- KPI: OEE Quality -->
        <h2
          class="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-2"
        >
          <span class="material-symbols-outlined text-base">monitoring</span> Rata-Rata OEE Quality
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div class="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
            <p class="text-xs text-blue-400 uppercase tracking-wide mb-1">Avg Yield %</p>
            <p class="text-2xl font-bold text-white">
              {{ fmtDec(r.metrics_avg_oee_quality?.avg_yield_percent) }}%
            </p>
          </div>
          <div class="rounded-xl border border-slate-600/60 bg-slate-800/70 p-4">
            <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Avg Consumption Ratio</p>
            <p class="text-2xl font-bold text-white">
              {{ fmtDec(r.metrics_avg_oee_quality?.avg_consumption_ratio) }}
            </p>
          </div>
          <div class="rounded-xl border border-slate-600/60 bg-slate-800/70 p-4">
            <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Deviation Alerts</p>
            <p
              class="text-2xl font-bold"
              :class="
                (r.metrics_avg_oee_quality?.total_deviation_alerts || 0) > 0
                  ? 'text-red-400'
                  : 'text-green-400'
              "
            >
              {{ fmt(r.metrics_avg_oee_quality?.total_deviation_alerts) }}
            </p>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <!-- Target vs Actual Chart -->
          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-emerald-400">show_chart</span>
              Target vs Aktual Produksi Harian
            </h2>
            <div v-if="!targetActualRows.length" class="py-10 text-center text-gray-500 text-sm">
              Belum ada data
            </div>
            <apexchart
              v-else
              type="bar"
              height="310"
              :options="targetActualOpts"
              :series="targetActualSeries"
            />
          </div>

          <!-- Raw Material Consumption Chart -->
          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-yellow-400">grain</span>
              Konsumsi Bahan Baku
            </h2>
            <div v-if="!rawMatRows.length" class="py-10 text-center text-gray-500 text-sm">
              Belum ada data
            </div>
            <apexchart
              v-else
              type="bar"
              height="310"
              :options="rawMatOpts"
              :series="rawMatSeries"
            />
          </div>
        </div>

        <!-- Table: Silo Consumption & Stock -->
        <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5 mb-6">
          <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-teal-400">storage</span>
            Konsumsi &amp; Stok Silo
            <span class="ml-2 rounded-full bg-slate-600 px-2 py-0.5 text-xs text-gray-300">{{
              siloRows.length
            }}</span>
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-600 text-left text-gray-300">
                  <th class="px-3 py-2">Kode</th>
                  <th class="px-3 py-2">Nama Silo</th>
                  <th class="px-3 py-2 text-right">Stok Awal</th>
                  <th class="px-3 py-2 text-right">Stok Akhir</th>
                  <th class="px-3 py-2 text-right">Konsumsi Total</th>
                  <th class="px-3 py-2 text-right">Material</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(s, i) in siloRows"
                  :key="i"
                  class="border-b border-slate-700/50 hover:bg-slate-700/30"
                >
                  <td class="px-3 py-2 font-mono text-cyan-400">{{ s.equipment_code }}</td>
                  <td class="px-3 py-2 text-white">{{ s.equipment_name }}</td>
                  <td class="px-3 py-2 text-right text-gray-300">
                    {{ fmtDec(s.stock_start_total) }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-300">
                    {{ fmtDec(s.stock_end_total) }}
                  </td>
                  <td class="px-3 py-2 text-right text-yellow-300">
                    {{ fmtDec(s.consumed_total) }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-400">
                    {{ (s.materials || []).length }}
                  </td>
                </tr>
                <tr v-if="!siloRows.length">
                  <td colspan="6" class="px-3 py-8 text-center text-gray-500">Belum ada data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Table: Daily Finished Goods -->
        <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
          <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-indigo-400">inventory_2</span>
            Finished Goods Harian
            <span class="ml-2 rounded-full bg-slate-600 px-2 py-0.5 text-xs text-gray-300">{{
              finishedRows.length
            }}</span>
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-600 text-left text-gray-300">
                  <th v-for="col in finishedCols" :key="col" class="px-3 py-2 capitalize">
                    {{ col.replace(/_/g, ' ') }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in finishedRows"
                  :key="i"
                  class="border-b border-slate-700/50 hover:bg-slate-700/30"
                >
                  <td v-for="col in finishedCols" :key="col" class="px-3 py-2 text-gray-200">
                    {{ row[col] ?? '-' }}
                  </td>
                </tr>
                <tr v-if="!finishedRows.length">
                  <td colspan="8" class="px-3 py-8 text-center text-gray-500">Belum ada data</td>
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
import { computed, onMounted, ref, watch } from 'vue'
import ScadaNavbar from '../components/ScadaNavbar.vue'
import { authenticateScadaSession, callScadaJsonRpc } from '../services/scadaApi'

const loading = ref(true)
const errorMsg = ref('')
const lastUpdated = ref('-')
const period = ref('this_month')
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
const targetActualRows = computed(() => r.value?.chart_daily_target_vs_actual?.data || [])
const rawMatRows = computed(() => r.value?.chart_raw_material_consumption?.data || [])
const siloRows = computed(() => r.value?.table_silo_consumption_stock?.data || [])
const finishedRows = computed(() => r.value?.table_daily_finished_goods?.data || [])
const finishedCols = computed(() =>
  finishedRows.value.length ? Object.keys(finishedRows.value[0]).slice(0, 8) : [],
)

const chartDefaults = {
  chart: { toolbar: { show: false }, background: 'transparent' },
  grid: { borderColor: '#475569', strokeDashArray: 3 },
  dataLabels: { enabled: false },
  tooltip: { theme: 'dark' },
}

const targetActualOpts = computed(() => ({
  ...chartDefaults,
  chart: { ...chartDefaults.chart, type: 'bar' },
  plotOptions: { bar: { borderRadius: 3, columnWidth: '70%' } },
  colors: ['#6366f1', '#10b981'],
  xaxis: {
    categories: targetActualRows.value.map((d) => d.date || '-'),
    labels: { rotate: -45, style: { colors: '#cbd5e1', fontSize: '10px' } },
  },
  yaxis: { labels: { style: { colors: '#cbd5e1' } } },
  legend: { labels: { colors: '#cbd5e1' } },
}))
const targetActualSeries = computed(() => [
  { name: 'Target Qty', data: targetActualRows.value.map((d) => Number(d.target_qty) || 0) },
  { name: 'Actual Qty', data: targetActualRows.value.map((d) => Number(d.actual_qty) || 0) },
])

const rawMatOpts = computed(() => ({
  ...chartDefaults,
  chart: { ...chartDefaults.chart, type: 'bar' },
  plotOptions: { bar: { horizontal: true, borderRadius: 3 } },
  colors: ['#f59e0b', '#ef4444'],
  xaxis: { labels: { style: { colors: '#cbd5e1' } } },
  yaxis: {
    categories: rawMatRows.value.map((d) => d.raw_material_name || '-'),
    labels: { style: { colors: '#cbd5e1', fontSize: '10px' }, maxWidth: 140 },
  },
  legend: { labels: { colors: '#cbd5e1' } },
}))
const rawMatSeries = computed(() => [
  { name: 'Actual Consumed', data: rawMatRows.value.map((d) => Number(d.consumption_actual) || 0) },
  { name: 'BOM', data: rawMatRows.value.map((d) => Number(d.consumption_bom) || 0) },
])

async function loadData() {
  loading.value = true
  errorMsg.value = ''
  try {
    await authenticateScadaSession()
    const res = await callScadaJsonRpc('periodic-report', { period: period.value, limit: 1000 })
    data.value = res || {}
    lastUpdated.value = new Date().toLocaleString('id-ID')
  } catch (e) {
    errorMsg.value = e?.message || 'Gagal memuat data'
  } finally {
    loading.value = false
  }
}

watch(period, loadData)
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
