import type { Metadata } from 'next'
import SetupDashboard from '@/components/admin/SetupDashboard'

export const metadata: Metadata = {
  title: 'thecheckmenu | Akıllı QR Masa Sipariş ve Servis Yönetim Konsolu',
  description: 'Gusto Lounge ve çok şubeli restoran zincirleri için tasarlanmış akıllı QR kod sipariş ve servis yönetim paneli.',
}

export default function HomePage() {
  return <SetupDashboard />
}
