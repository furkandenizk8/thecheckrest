import type { Metadata } from 'next'
import UnifiedDashboard from '@/components/admin/UnifiedDashboard'

export const metadata: Metadata = {
  title: 'Yönetim Paneli | thecheckmenu',
  description: 'Masa, mutfak, kasa ve servis taleplerini anlık yönetin.',
}

export default function PanelPage() {
  return <UnifiedDashboard defaultTab="tables" />
}
