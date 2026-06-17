import type { Metadata } from 'next'
import UnifiedDashboard from '@/components/admin/UnifiedDashboard'

export const metadata: Metadata = {
  title: 'Kasa & Adisyon İşlemleri | thecheckmenu',
  description: 'Kasa hesap ödeme alma ve kapatma yönetim paneli.',
}

export default function CashierPanelPage() {
  return <UnifiedDashboard defaultTab="cashier" />
}
