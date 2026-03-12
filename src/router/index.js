import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/SCADALiveReportView.vue'),
    },
    {
      path: '/scada',
      name: 'scada',
      redirect: '/scada-live',
    },
    {
      path: '/scada-live',
      name: 'scada-live',
      component: () => import('../views/SCADALiveReportView.vue'),
    },
    {
      path: '/scada-today',
      name: 'scada-today',
      component: () => import('../views/SCADADashboardTodayView.vue'),
    },
    {
      path: '/scada-periodic',
      name: 'scada-periodic',
      component: () => import('../views/SCADAPeriodicReportView.vue'),
    },
    {
      path: '/scada-oee',
      name: 'scada-oee',
      component: () => import('../views/SCADAOEEEquipmentView.vue'),
    },
    {
      path: '/scada-kpi',
      name: 'scada-kpi',
      component: () => import('../views/SCADAKPIProductView.vue'),
    },
    {
      path: '/scada-failure',
      name: 'scada-failure',
      component: () => import('../views/SCADAFailureReportView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/scada-live',
    },
  ],
})

export default router
