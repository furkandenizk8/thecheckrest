import type { Metadata } from 'next'
import UnifiedDashboard from '@/components/admin/UnifiedDashboard'

export const metadata: Metadata = {
  title: 'Garson İstek Takibi | thecheckmenu',
  description: 'Garson çağrıları ve servis talepleri takip paneli.',
}

export default function RequestsPanelPage() {
  return <UnifiedDashboard defaultTab="requests" />
}
