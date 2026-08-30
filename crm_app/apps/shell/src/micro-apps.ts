import type { RegistrableApp } from 'qiankun'

export const microApps: RegistrableApp<Record<string, unknown>>[] = [
  {
    name: 'customer',
    entry: import.meta.env.VITE_CUSTOMER_ENTRY ?? 'http://localhost:8801',
    container: '#micro-app-container',
    activeRule: '/customer',
    props: {
      appName: 'Common CRM'
    }
  }
]
