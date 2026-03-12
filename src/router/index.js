import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/SCADADashboardView.vue'),
    },
    {
      path: '/scada',
      name: 'scada',
      component: () => import('../views/SCADADashboardView.vue'),
    },
    {
      path: '/scada-live',
      name: 'scada-live',
      component: () => import('../views/SCADALiveReportView.vue'),
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/ProductionReportView.vue'),
    },
    {
      path: '/quality',
      name: 'quality',
      component: () => import('../views/QualityReportView.vue'),
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('../views/InventoryDashboardView.vue'),
    },
    {
      path: '/maintenance',
      name: 'maintenance',
      component: () => import('../views/MaintenanceDashboardView.vue'),
    },
    {
      path: '/kpi',
      name: 'kpi',
      component: () => import('../views/RTKPIDashboardView.vue'),
    },
    {
      path: '/hr',
      name: 'hr',
      component: () => import('../views/HumanResourcesView.vue'),
    },
  ],
})

export default router
