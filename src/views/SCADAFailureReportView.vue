<template>
  <div>
    <ScadaNavbar />
    <div
      class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 font-poppins"
    >
      <!-- Header -->
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex items-center gap-3">
          <div class="p-3 bg-gradient-to-br from-red-500 to-rose-700 rounded-xl">
            <span class="material-symbols-outlined text-white text-2xl">report</span>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-white">Laporan Kegagalan Equipment</h1>
            <p class="text-sm text-gray-400">Riwayat kerusakan &amp; downtime per equipment</p>
          </div>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <select
            v-model="period"
            class="bg-slate-700 border border-slate-500 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500"
          >
            <option value="this_week">Minggu Ini</option>
            <option value="this_month">Bulan Ini</option>
            <option value="last_month">Bulan Lalu</option>
            <option value="this_year">Tahun Ini</option>
          </select>
          <button
            @click="loadData"
            :disabled="loading"
            class="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition disabled:opacity-50"
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
        Terakhir update: <span class="text-red-400">{{ lastUpdated }}</span>
      </div>

      <div v-if="loading" class="text-center text-gray-400 py-16">Memuat data...</div>

      <template v-else>
        <!-- Summary KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            class="rounded-xl p-4"
            :class="
              totalFailures > 0
                ? 'border border-red-500/30 bg-red-500/10'
                : 'border border-slate-600/60 bg-slate-800/70'
            "
          >
            <p
              class="text-xs uppercase tracking-wide mb-1"
              :class="totalFailures > 0 ? 'text-red-400' : 'text-gray-400'"
            >
              Total Kegagalan
            </p>
            <p
              class="text-3xl font-bold"
              :class="totalFailures > 0 ? 'text-red-400' : 'text-green-400'"
            >
              {{ fmt(totalFailures) }}
            </p>
          </div>
          <div class="rounded-xl border border-slate-600/60 bg-slate-800/70 p-4">
            <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Equipment Affected</p>
            <p class="text-3xl font-bold text-white">{{ fmt(summary.equipment_count) }}</p>
          </div>
          <div class="rounded-xl border border-slate-600/60 bg-slate-800/70 p-4">
            <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Downtime (menit)</p>
            <p class="text-3xl font-bold text-white">{{ fmt(totalDowntime) }}</p>
          </div>
          <div class="rounded-xl border border-slate-600/60 bg-slate-800/70 p-4">
            <p class="text-xs text-gray-400 uppercase tracking-wide mb-1">Avg Downtime (menit)</p>
            <p class="text-3xl font-bold text-white">{{ fmtDec(avgDowntime) }}</p>
          </div>
        </div>

        <!-- No data state -->
        <div
          v-if="totalFailures === 0 && !failureRows.length"
          class="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center"
        >
          <span class="material-symbols-outlined text-5xl text-green-400 block mb-2"
            >check_circle</span
          >
          <p class="text-green-300 font-semibold">Tidak ada kegagalan equipment pada periode ini</p>
          <p class="text-gray-500 text-sm mt-1">Semua equipment beroperasi normal</p>
        </div>

        <template v-if="totalFailures > 0 || byEquipmentRows.length">
          <!-- Charts Row -->
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <!-- Failure Count by Equipment -->
            <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
              <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-red-400">bar_chart</span>
                Kegagalan per Equipment
              </h2>
              <div v-if="!byEquipmentRows.length" class="py-10 text-center text-gray-500 text-sm">
                Belum ada data
              </div>
              <apexchart
                v-else
                type="bar"
                height="300"
                :options="failureChartOpts"
                :series="failureSeries"
              />
            </div>

            <!-- Downtime by Equipment -->
            <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
              <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-orange-400">timer_off</span>
                Total Downtime per Equipment (menit)
              </h2>
              <div v-if="!byEquipmentRows.length" class="py-10 text-center text-gray-500 text-sm">
                Belum ada data
              </div>
              <apexchart
                v-else
                type="bar"
                height="300"
                :options="downtimeChartOpts"
                :series="downtimeSeries"
              />
            </div>
          </div>

          <!-- Failure Log Table -->
          <div class="rounded-xl border border-slate-600 bg-slate-800/70 p-5">
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-slate-400">error_outline</span>
              Log Kegagalan
              <span class="ml-2 rounded-full bg-slate-600 px-2 py-0.5 text-xs text-gray-300">{{
                failureRows.length
              }}</span>
            </h2>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-600 text-left text-gray-300">
                    <th class="px-3 py-2">Equipment</th>
                    <th class="px-3 py-2">Deskripsi</th>
                    <th class="px-3 py-2">Tanggal</th>
                    <th class="px-3 py-2 text-right">Durasi (menit)</th>
                    <th class="px-3 py-2">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(f, i) in failureRows"
                    :key="i"
                    class="border-b border-slate-700/50 hover:bg-slate-700/30"
                  >
                    <td class="px-3 py-2 text-white font-medium">
                      {{ f.equipment_name || f.equipment || '-' }}
                    </td>
                    <td class="px-3 py-2 text-gray-300 max-w-xs truncate" :title="f.description">
                      {{ f.description || '-' }}
                    </td>
                    <td class="px-3 py-2 text-gray-400 whitespace-nowrap">{{ f.date || '-' }}</td>
                    <td
                      class="px-3 py-2 text-right font-mono"
                      :class="
                        (f.duration_minutes || 0) > 60
                          ? 'text-red-400'
                          : (f.duration_minutes || 0) > 30
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                      "
                    >
                      {{ fmt(f.duration_minutes) }}
                    </td>
                    <td class="px-3 py-2">
                      <span
                        v-if="(f.duration_minutes || 0) > 60"
                        class="text-xs px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400"
                        >Kritis</span
                      >
                      <span
                        v-else-if="(f.duration_minutes || 0) > 30"
                        class="text-xs px-2 py-0.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                        >Sedang</span
                      >
                      <span
                        v-else
                        class="text-xs px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400"
                        >Ringan</span
                      >
                    </td>
                  </tr>
                  <tr v-if="!failureRows.length">
                    <td colspan="5" class="px-3 py-8 text-center text-gray-500">
                      Tidak ada log kegagalan
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
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
const failureRows = computed(() => rawData.value?.data || [])
const byEquipmentRows = computed(() => summary.value?.by_equipment || [])

const totalFailures = computed(() => Number(summary.value?.total_failures) || 0)
const totalDowntime = computed(() =>
  failureRows.value.reduce((a, r) => a + (Number(r.duration_minutes) || 0), 0),
)
const avgDowntime = computed(() =>
  failureRows.value.length ? totalDowntime.value / failureRows.value.length : 0,
)

const chartBase = {
  chart: { toolbar: { show: false }, background: 'transparent' },
  grid: { borderColor: '#475569', strokeDashArray: 3 },
  dataLabels: { enabled: false },
  tooltip: { theme: 'dark' },
}

const failureChartOpts = computed(() => ({
  ...chartBase,
  chart: { ...chartBase.chart, type: 'bar' },
  plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
  colors: ['#ef4444'],
  xaxis: {
    categories: byEquipmentRows.value.map((e) => e.equipment_name || e.equipment || '-'),
    labels: { rotate: -45, style: { colors: '#cbd5e1', fontSize: '11px' } },
  },
  yaxis: { labels: { style: { colors: '#cbd5e1' } } },
}))
const failureSeries = computed(() => [
  {
    name: 'Kegagalan',
    data: byEquipmentRows.value.map((e) => Number(e.failure_count) || 0),
  },
])

const downtimeChartOpts = computed(() => ({
  ...chartBase,
  chart: { ...chartBase.chart, type: 'bar' },
  plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
  colors: ['#f97316'],
  xaxis: { labels: { style: { colors: '#cbd5e1' } } },
  yaxis: {
    categories: byEquipmentRows.value.map((e) => e.equipment_name || e.equipment || '-'),
    labels: { style: { colors: '#cbd5e1', fontSize: '11px' } },
  },
}))
const downtimeSeries = computed(() => [
  {
    name: 'Downtime (menit)',
    data: byEquipmentRows.value.map((e) => Number(e.total_downtime_minutes) || 0),
  },
])

async function loadData() {
  loading.value = true
  errorMsg.value = ''
  try {
    await authenticateScadaSession()
    const res = await callScadaJsonRpc('equipment-failure-report', {
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
