<template>
  <div>
    <ScadaNavbar />
    <div
      class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 font-poppins"
    >
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl">
            <span class="material-symbols-outlined text-white text-2xl">inventory</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-white">KPI Produk</h1>
            <p class="text-sm text-gray-400">Performa yield &amp; konsumsi per produk</p>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <select
            v-model="period"
            class="bg-slate-700 border border-slate-500 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
          >
            <option value="this_week">Minggu Ini</option>
            <option value="this_month">Bulan Ini</option>
            <option value="last_month">Bulan Lalu</option>
            <option value="this_year">Tahun Ini</option>
          </select>
          <button
            @click="loadData"
            :disabled="loading"
            class="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm rounded-lg transition disabled:opacity-50"
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
        Terakhir update: <span class="text-orange-400">{{ lastUpdated }}</span>
      </div>

      <div v-if="loading" class="text-center text-gray-400 py-16">Memuat data...</div>

      <template v-else>
        <!-- Summary KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
            <p class="text-xs text-orange-400 uppercase tracking-wide mb-1">Total Produk</p>
            <p class="text-2xl font-bold text-white">{{ fmt(summary.total_products) }}</p>
          </div>
          <div class="rounded-xl border border-slate-600/60 bg-slate-800/70 p-4">
            <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Total OEE Records</p>
            <p class="text-2xl font-bold text-white">{{ fmt(summary.total_oee_records) }}</p>
          </div>
          <div class="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
            <p class="text-xs text-green-400 uppercase tracking-wide mb-1">Avg Yield Terbaik</p>
            <p class="text-2xl font-bold text-green-400">{{ bestYield }}%</p>
          </div>
          <div class="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
            <p class="text-xs text-blue-400 uppercase tracking-wide mb-1">Avg Yield Semua</p>
            <p class="text-2xl font-bold text-white">{{ overallAvgYield }}%</p>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <!-- Yield Ranking Chart -->
          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-orange-400">leaderboard</span>
              Ranking Yield per Produk
            </h2>
            <div v-if="!sortedRows.length" class="py-10 text-center text-gray-500 text-sm">
              Belum ada data
            </div>
            <apexchart
              v-else
              type="bar"
              :height="Math.max(250, sortedRows.length * 32)"
              :options="yieldChartOpts"
              :series="yieldSeries"
            />
          </div>

          <!-- Consumption Ratio Chart -->
          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-400">speed</span>
              Consumption Ratio per Produk
            </h2>
            <div v-if="!sortedRows.length" class="py-10 text-center text-gray-500 text-sm">
              Belum ada data
            </div>
            <apexchart
              v-else
              type="bar"
              :height="Math.max(250, sortedRows.length * 32)"
              :options="consChartOpts"
              :series="consSeries"
            />
          </div>
        </div>

        <!-- Detail Table -->
        <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
          <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-slate-400">table_chart</span>
            Detail KPI per Produk
            <span class="ml-2 rounded-full bg-slate-600 px-2 py-0.5 text-xs text-gray-300">{{
              sortedRows.length
            }}</span>
            <span class="ml-auto text-xs text-gray-400 font-normal"
              >Urut berdasarkan Yield (tertinggi)</span
            >
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-600 text-left text-gray-300">
                  <th class="px-3 py-2 w-8">#</th>
                  <th class="px-3 py-2">Nama Produk</th>
                  <th class="px-3 py-2 text-right">Yield %</th>
                  <th class="px-3 py-2 text-right">Consumption Ratio</th>
                  <th class="px-3 py-2 text-right">Qty Planned</th>
                  <th class="px-3 py-2 text-right">Qty Finished</th>
                  <th class="px-3 py-2">Yield Progress</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in sortedRows"
                  :key="i"
                  class="border-b border-slate-700/50 hover:bg-slate-700/30"
                >
                  <td class="px-3 py-2 text-gray-500">{{ i + 1 }}</td>
                  <td class="px-3 py-2 text-white font-medium">{{ row.product_name || '-' }}</td>
                  <td
                    class="px-3 py-2 text-right font-semibold"
                    :class="
                      (row.avg_kpi?.yield_percent || 0) >= 95
                        ? 'text-green-400'
                        : (row.avg_kpi?.yield_percent || 0) >= 80
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    "
                  >
                    {{ fmtDec(row.avg_kpi?.yield_percent) }}%
                  </td>
                  <td class="px-3 py-2 text-right text-gray-300">
                    {{ fmtDec(row.avg_kpi?.consumption_ratio) }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-300">
                    {{ fmtDec(row.avg_kpi?.qty_planned) }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-300">
                    {{ fmtDec(row.avg_kpi?.qty_finished) }}
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all"
                          :style="`width:${Math.min(row.avg_kpi?.yield_percent || 0, 100)}%`"
                          :class="
                            (row.avg_kpi?.yield_percent || 0) >= 95
                              ? 'bg-green-400'
                              : (row.avg_kpi?.yield_percent || 0) >= 80
                                ? 'bg-yellow-400'
                                : 'bg-red-400'
                          "
                        />
                      </div>
                      <span class="text-xs text-gray-400 w-8 text-right"
                        >{{ Math.min(Math.round(row.avg_kpi?.yield_percent || 0), 100) }}%</span
                      >
                    </div>
                  </td>
                </tr>
                <tr v-if="!sortedRows.length">
                  <td colspan="7" class="px-3 py-8 text-center text-gray-500">Belum ada data</td>
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
const rawData = ref({})

function fmt(v) {
  return new Intl.NumberFormat('id-ID').format(Number(v) || 0)
}
function fmtDec(v) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(v) || 0)
}

const summary = computed(() => rawData.value?.summary || {})
const rows = computed(() => rawData.value?.data || [])

const sortedRows = computed(() =>
  [...rows.value].sort((a, b) => (b.avg_kpi?.yield_percent || 0) - (a.avg_kpi?.yield_percent || 0)),
)

const bestYield = computed(() => {
  if (!sortedRows.value.length) return '0'
  return fmtDec(sortedRows.value[0].avg_kpi?.yield_percent || 0)
})
const overallAvgYield = computed(() => {
  if (!sortedRows.value.length) return '0'
  const sum = sortedRows.value.reduce((a, r) => a + (Number(r.avg_kpi?.yield_percent) || 0), 0)
  return fmtDec(sum / sortedRows.value.length)
})

const chartBase = {
  chart: { toolbar: { show: false }, background: 'transparent' },
  grid: { borderColor: '#475569', strokeDashArray: 3 },
  dataLabels: { enabled: false },
  tooltip: { theme: 'dark' },
}

const yieldChartOpts = computed(() => ({
  ...chartBase,
  chart: { ...chartBase.chart, type: 'bar' },
  plotOptions: { bar: { horizontal: true, borderRadius: 3 } },
  colors: ['#f97316'],
  xaxis: { max: 100, labels: { style: { colors: '#cbd5e1' } } },
  yaxis: {
    categories: sortedRows.value.map((r) => (r.product_name || '-').slice(0, 25)),
    labels: { style: { colors: '#cbd5e1', fontSize: '10px' }, maxWidth: 160 },
  },
}))
const yieldSeries = computed(() => [
  {
    name: 'Avg Yield %',
    data: sortedRows.value.map((r) => Number(r.avg_kpi?.yield_percent) || 0),
  },
])

const consChartOpts = computed(() => ({
  ...chartBase,
  chart: { ...chartBase.chart, type: 'bar' },
  plotOptions: { bar: { horizontal: true, borderRadius: 3 } },
  colors: ['#f59e0b'],
  xaxis: { labels: { style: { colors: '#cbd5e1' } } },
  yaxis: {
    categories: sortedRows.value.map((r) => (r.product_name || '-').slice(0, 25)),
    labels: { style: { colors: '#cbd5e1', fontSize: '10px' }, maxWidth: 160 },
  },
}))
const consSeries = computed(() => [
  {
    name: 'Consumption Ratio',
    data: sortedRows.value.map((r) => Number(r.avg_kpi?.consumption_ratio) || 0),
  },
])

async function loadData() {
  loading.value = true
  errorMsg.value = ''
  try {
    await authenticateScadaSession()
    const res = await callScadaJsonRpc('kpi-product-report', {
      period: period.value,
      limit: 100,
      offset: 0,
    })
    rawData.value = res || {}
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
