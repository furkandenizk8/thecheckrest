import type { Metadata } from 'next'
import MenuManagement from '@/components/admin/MenuManagement'

export const metadata: Metadata = {
  title: 'Menü Yönetimi | thecheckmenu',
  description: 'Kategori ve ürün ekle, düzenle, yönet.',
}

export default function ManagementPage() {
  return <MenuManagement />
}
