import type { Metadata } from 'next'
import UnifiedDashboard from '@/components/admin/UnifiedDashboard'

export const metadata: Metadata = {
  title: 'Mutfak Hazırlık Paneli | thecheckmenu',
  description: 'Mutfak sipariş hazırlama ve takip paneli.',
}

export default function KitchenPanelPage() {
  return <UnifiedDashboard defaultTab="kitchen" />
}
