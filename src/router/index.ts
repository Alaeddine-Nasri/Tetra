import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '@/views/LandingView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',        name: 'home',    component: LandingView },
    { path: '/work',    name: 'work',    component: () => import('@/views/WorkView.vue') },
    { path: '/about',   name: 'about',   component: () => import('@/views/AboutView.vue') },
    { path: '/contact', name: 'contact', component: () => import('@/views/ContactView.vue') }
  ]
})

export default router
