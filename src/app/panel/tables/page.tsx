import type { Metadata } from 'next'
import UnifiedDashboard from '@/components/admin/UnifiedDashboard'

export const metadata: Metadata = {
  title: 'Masa Durum Haritası | thecheckmenu',
  description: 'Masa doluluk ve durum haritası takip paneli.',
}

export default function TablesPanelPage() {
  return <UnifiedDashboard defaultTab="tables" />
}
