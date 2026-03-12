<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { computed, ref } from 'vue'

const route = useRoute()
const isActive = (path) => computed(() => route.path === path)

const liveDropdownOpen = ref(false)
const isLivePage = computed(() =>
  [
    '/scada-live',
    '/scada-today',
    '/scada-periodic',
    '/scada-oee',
    '/scada-kpi',
    '/scada-failure',
  ].includes(route.path),
)

const livePages = [
  { path: '/scada-live', icon: 'monitoring', label: 'Overview' },
  { path: '/scada-today', icon: 'today', label: 'Hari Ini' },
  { path: '/scada-periodic', icon: 'calendar_month', label: 'Periodik' },
  { path: '/scada-oee', icon: 'precision_manufacturing', label: 'OEE Equipment' },
  { path: '/scada-kpi', icon: 'inventory', label: 'KPI Produk' },
  { path: '/scada-failure', icon: 'report', label: 'Kegagalan' },
]
</script>

<template>
  <nav
    class="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 shadow-lg sticky top-0 z-50"
  >
    <div class="px-6">
      <div class="flex justify-between items-center h-16">
        <!-- Logo & Title -->
        <div class="flex items-center gap-3">
          <div class="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
            <span class="material-symbols-outlined text-white text-2xl">build</span>
          </div>
          <div>
            <h1 class="text-xl font-bold text-white font-poppins">SCADA Dashboard</h1>
            <p class="text-xs text-gray-400">Pengolahan Pakan Ternak</p>
          </div>
        </div>

        <!-- Navigation Links -->
        <div class="hidden sm:flex sm:items-center sm:space-x-1">
          <!-- Home -->
          <RouterLink
            to="/"
            :class="[
              isActive('/').value
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200',
              'inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors font-poppins',
            ]"
          >
            <span class="material-symbols-outlined text-sm mr-1">home</span>Home
          </RouterLink>

          <!-- Monitoring -->
          <RouterLink
            to="/scada"
            :class="[
              isActive('/scada').value
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200',
              'inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors font-poppins',
            ]"
          >
            <span class="material-symbols-outlined text-sm mr-1">radar</span>Monitoring
          </RouterLink>

          <!-- Live API Dropdown -->
          <div
            class="relative"
            @mouseenter="liveDropdownOpen = true"
            @mouseleave="liveDropdownOpen = false"
          >
            <button
              :class="[
                isLivePage.value
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200',
                'inline-flex items-center gap-1 px-3 py-2 border-b-2 text-sm font-medium transition-colors font-poppins h-16',
              ]"
            >
              <span class="material-symbols-outlined text-sm">monitoring</span>
              Live API
              <span class="material-symbols-outlined text-xs">expand_more</span>
            </button>
            <transition
              enter-active-class="transition ease-out duration-150"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition ease-in duration-100"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div
                v-show="liveDropdownOpen"
                class="absolute top-full left-0 mt-0 w-52 rounded-xl bg-slate-800 border border-slate-600 shadow-xl z-50 py-1"
              >
                <RouterLink
                  v-for="pg in livePages"
                  :key="pg.path"
                  :to="pg.path"
                  @click="liveDropdownOpen = false"
                  :class="[
                    route.path === pg.path
                      ? 'bg-slate-700 text-cyan-400'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white',
                    'flex items-center gap-2 px-4 py-2.5 text-sm font-poppins transition-colors',
                  ]"
                >
                  <span class="material-symbols-outlined text-sm">{{ pg.icon }}</span>
                  {{ pg.label }}
                </RouterLink>
              </div>
            </transition>
          </div>

          <!-- Reports -->
          <RouterLink
            to="/reports"
            :class="[
              isActive('/reports').value
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200',
              'inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors font-poppins',
            ]"
          >
            <span class="material-symbols-outlined text-sm mr-1">assessment</span>Reports
          </RouterLink>

          <!-- Quality -->
          <RouterLink
            to="/quality"
            :class="[
              isActive('/quality').value
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200',
              'inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors font-poppins',
            ]"
          >
            <span class="material-symbols-outlined text-sm mr-1">verified_user</span>Quality
          </RouterLink>

          <!-- Inventory -->
          <RouterLink
            to="/inventory"
            :class="[
              isActive('/inventory').value
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200',
              'inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors font-poppins',
            ]"
          >
            <span class="material-symbols-outlined text-sm mr-1">warehouse</span>Inventory
          </RouterLink>

          <!-- Maintenance -->
          <RouterLink
            to="/maintenance"
            :class="[
              isActive('/maintenance').value
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200',
              'inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors font-poppins',
            ]"
          >
            <span class="material-symbols-outlined text-sm mr-1">settings</span>Maintenance
          </RouterLink>

          <!-- KPI -->
          <RouterLink
            to="/kpi"
            :class="[
              isActive('/kpi').value
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200',
              'inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors font-poppins',
            ]"
          >
            <span class="material-symbols-outlined text-sm mr-1">speed</span>KPI
          </RouterLink>
        </div>

        <!-- Status Indicator -->
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full"
          >
            <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span class="text-xs text-green-300 font-semibold">ONLINE</span>
          </span>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.material-symbols-outlined {
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
</style>
