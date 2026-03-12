<template>
  <div>
    <ScadaNavbar />
    <div
      class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 font-poppins"
    >
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl">
            <span class="material-symbols-outlined text-white text-2xl"
              >precision_manufacturing</span
            >
          </div>
          <div>
            <h1 class="text-2xl font-bold text-white">OEE Equipment Average</h1>
            <p class="text-sm text-gray-400">Rata-rata OEE per equipment berdasarkan periode</p>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <select
            v-model="period"
            class="bg-slate-700 border border-slate-500 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500"
          >
            <option value="this_week">Minggu Ini</option>
            <option value="this_month">Bulan Ini</option>
            <option value="last_month">Bulan Lalu</option>
            <option value="this_year">Tahun Ini</option>
          </select>
          <button
            @click="loadData"
            :disabled="loading"
            class="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition disabled:opacity-50"
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
        Terakhir update: <span class="text-violet-400">{{ lastUpdated }}</span>
      </div>

      <div v-if="loading" class="text-center text-gray-400 py-16">Memuat data...</div>

      <template v-else>
        <!-- Summary -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="rounded-xl border border-slate-600/60 bg-slate-800/70 p-4">
            <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Equipment</p>
            <p class="text-2xl font-bold text-white">{{ rows.length }}</p>
          </div>
          <div class="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
            <p class="text-xs text-violet-400 uppercase tracking-wide mb-1">Avg Yield (All)</p>
            <p class="text-2xl font-bold text-white">{{ avgYield }}%</p>
          </div>
          <div class="rounded-xl border border-slate-600/60 bg-slate-800/70 p-4">
            <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Avg Consumption Ratio</p>
            <p class="text-2xl font-bold text-white">{{ avgConsRatio }}</p>
          </div>
          <div class="rounded-xl border border-slate-600/60 bg-slate-800/70 p-4">
            <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Total OEE Records</p>
            <p class="text-2xl font-bold text-white">{{ totalRecords }}</p>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <!-- Yield per Equipment -->
          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-violet-400">bar_chart</span>
              Yield % per Equipment
            </h2>
            <div v-if="!rows.length" class="py-10 text-center text-gray-500 text-sm">
              Belum ada data
            </div>
            <apexchart
              v-else
              type="bar"
              height="320"
              :options="yieldChartOpts"
              :series="yieldSeries"
            />
          </div>

          <!-- Consumption Ratio -->
          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-yellow-400">speed</span>
              Consumption Ratio per Equipment
            </h2>
            <div v-if="!rows.length" class="py-10 text-center text-gray-500 text-sm">
              Belum ada data
            </div>
            <apexchart
              v-else
              type="bar"
              height="320"
              :options="consChartOpts"
              :series="consSeries"
            />
          </div>
        </div>

        <!-- Detail Table -->
        <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
          <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-slate-400">table_chart</span>
            Detail OEE Equipment
            <span class="ml-2 rounded-full bg-slate-600 px-2 py-0.5 text-xs text-gray-300">{{
              rows.length
            }}</span>
          </h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-600 text-left text-gray-300">
                  <th class="px-3 py-2">Kode</th>
                  <th class="px-3 py-2">Nama Equipment</th>
                  <th class="px-3 py-2">Status</th>
                  <th class="px-3 py-2 text-right">Records</th>
                  <th class="px-3 py-2 text-right">Qty Planned</th>
                  <th class="px-3 py-2 text-right">Qty Finished</th>
                  <th class="px-3 py-2 text-right">Yield %</th>
                  <th class="px-3 py-2 text-right">Consumption Ratio</th>
                  <th class="px-3 py-2 text-right">Variance</th>
                  <th class="px-3 py-2">Terakhir OEE</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(eq, i) in rows"
                  :key="i"
                  class="border-b border-slate-700/50 hover:bg-slate-700/30"
                >
                  <td class="px-3 py-2 font-mono text-cyan-400">{{ eq.equipment?.code || '-' }}</td>
                  <td class="px-3 py-2 text-white font-medium">{{ eq.equipment?.name || '-' }}</td>
                  <td class="px-3 py-2">
                    <span
                      :class="
                        eq.equipment?.connection_status === 'connected'
                          ? 'text-green-400'
                          : 'text-gray-400'
                      "
                      class="text-xs px-2 py-0.5 rounded-full border"
                      :style="
                        eq.equipment?.connection_status === 'connected'
                          ? 'border-color:#22c55e30;background:#22c55e10'
                          : 'border-color:#47455630;background:#47455620'
                      "
                    >
                      {{ eq.equipment?.connection_status || 'N/A' }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-right text-gray-300">
                    {{ fmt(eq.oee_records_count) }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-300">
                    {{ fmtDec(eq.avg_summary?.qty_planned) }}
                  </td>
                  <td class="px-3 py-2 text-right text-gray-300">
                    {{ fmtDec(eq.avg_summary?.qty_finished) }}
                  </td>
                  <td
                    class="px-3 py-2 text-right font-semibold"
                    :class="
                      (eq.avg_summary?.yield_percent || 0) >= 95
                        ? 'text-green-400'
                        : (eq.avg_summary?.yield_percent || 0) >= 80
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    "
                  >
                    {{ fmtDec(eq.avg_summary?.yield_percent) }}%
                  </td>
                  <td class="px-3 py-2 text-right text-gray-300">
                    {{ fmtDec(eq.avg_summary?.consumption_ratio) }}
                  </td>
                  <td
                    class="px-3 py-2 text-right"
                    :class="
                      (eq.avg_summary?.variance_finished || 0) < 0
                        ? 'text-red-400'
                        : 'text-green-400'
                    "
                  >
                    {{ fmtDec(eq.avg_summary?.variance_finished) }}
                  </td>
                  <td class="px-3 py-2 text-gray-400 text-xs">{{ eq.last_oee_date || '-' }}</td>
                </tr>
                <tr v-if="!rows.length">
                  <td colspan="10" class="px-3 py-8 text-center text-gray-500">Belum ada data</td>
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
const rawData = ref([])

function fmt(v) {
  return new Intl.NumberFormat('id-ID').format(Number(v) || 0)
}
function fmtDec(v) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(v) || 0)
}

const rows = computed(() =>
  Array.isArray(rawData.value) ? rawData.value : rawData.value?.data || [],
)
const avgYield = computed(() => {
  if (!rows.value.length) return 0
  const sum = rows.value.reduce((a, e) => a + (Number(e.avg_summary?.yield_percent) || 0), 0)
  return fmtDec(sum / rows.value.length)
})
const avgConsRatio = computed(() => {
  if (!rows.value.length) return 0
  const sum = rows.value.reduce((a, e) => a + (Number(e.avg_summary?.consumption_ratio) || 0), 0)
  return fmtDec(sum / rows.value.length)
})
const totalRecords = computed(() =>
  rows.value.reduce((a, e) => a + (Number(e.oee_records_count) || 0), 0),
)

const eqNames = computed(() => rows.value.map((e) => e.equipment?.code || e.equipment?.name || '-'))

const chartBase = {
  chart: { toolbar: { show: false }, background: 'transparent' },
  grid: { borderColor: '#475569', strokeDashArray: 3 },
  dataLabels: { enabled: false },
  tooltip: { theme: 'dark' },
}
const yieldChartOpts = computed(() => ({
  ...chartBase,
  chart: { ...chartBase.chart, type: 'bar' },
  plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
  colors: ['#a855f7'],
  xaxis: { max: 100, labels: { style: { colors: '#cbd5e1' } } },
  yaxis: {
    categories: eqNames.value,
    labels: { style: { colors: '#cbd5e1', fontSize: '11px' } },
  },
}))
const yieldSeries = computed(() => [
  {
    name: 'Avg Yield %',
    data: rows.value.map((e) => Number(e.avg_summary?.yield_percent) || 0),
  },
])

const consChartOpts = computed(() => ({
  ...chartBase,
  chart: { ...chartBase.chart, type: 'bar' },
  plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
  colors: ['#f59e0b'],
  xaxis: { labels: { style: { colors: '#cbd5e1' } } },
  yaxis: {
    categories: eqNames.value,
    labels: { style: { colors: '#cbd5e1', fontSize: '11px' } },
  },
}))
const consSeries = computed(() => [
  {
    name: 'Consumption Ratio',
    data: rows.value.map((e) => Number(e.avg_summary?.consumption_ratio) || 0),
  },
])

async function loadData() {
  loading.value = true
  errorMsg.value = ''
  try {
    await authenticateScadaSession()
    const res = await callScadaJsonRpc('oee-equipment-avg', {
      period: period.value,
      limit: 100,
      offset: 0,
    })
    rawData.value = res?.data ?? res ?? []
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
