import type { Metadata } from 'next'
import ManagementPanel from '@/components/admin/ManagementPanel'

export const metadata: Metadata = {
  title: 'Yönetim Paneli | thecheckmenu',
}

export default function ManagementPage() {
  return <ManagementPanel />
}
