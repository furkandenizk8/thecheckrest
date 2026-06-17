import type { Metadata } from 'next'
import TableConfig from '@/components/admin/TableConfig'

export const metadata: Metadata = {
  title: 'Masa Ayarları | thecheckmenu',
  description: 'Masa ekle, düzenle ve QR kod üret.',
}

export default function TableConfigPage() {
  return <TableConfig />
}
