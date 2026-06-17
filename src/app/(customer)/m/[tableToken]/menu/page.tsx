import React from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { resolveTableToken, getOrCreateBill } from '@/lib/restaurant/sessions'
import { fetchBranchMenu } from '@/lib/restaurant/menu'
import CustomerMenuView from '@/components/customer/CustomerMenuView'
import { Language } from '@/lib/i18n/customer'

interface PageProps {
  params: Promise<{
    tableToken: string
  }>
}

export default async function TableMenuPage({ params }: PageProps) {
  const { tableToken } = await params
  
  // 1. Çerezlerden aktif oturum ve isim bilgilerini oku
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('table_session_id')?.value
  const customerName = cookieStore.get('customer_name')?.value

  // Oturum bilgileri yoksa giriş (landing) sayfasına yönlendir
  if (!sessionId || !customerName) {
    redirect(`/m/${tableToken}`)
  }

  const supabase = await createClient()

  // 2. Masa oturumunun veritabanında hâlâ aktif olup olmadığını denetle
  const { data: session, error: sessionError } = await supabase
    .from('table_sessions')
    .select('id, is_active, language')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session || !session.is_active) {
    // Oturum kapanmış veya geçersizse giriş sayfasına yönlendir
    redirect(`/m/${tableToken}`)
  }

  // 3. Masa ve şube bilgilerini çöz
  const tableDetails = await resolveTableToken(supabase, tableToken)
  if (!tableDetails) {
    redirect(`/m/${tableToken}`)
  }

  // 4. Masaya ait aktif adisyon (bill) bilgisini al
  const billId = await getOrCreateBill(supabase, tableDetails.id, tableDetails.branch_id)
  if (!billId) {
    redirect(`/m/${tableToken}`)
  }

  const selectedLanguage = (session.language || 'tr') as Language

  // 5. Şubenin menü içeriklerini çek (kategoriler + ürünler)
  const { categories, products } = await fetchBranchMenu(
    supabase, 
    tableDetails.branch_id, 
    selectedLanguage
  )

  return (
    <CustomerMenuView
      categories={categories}
      products={products}
      tableToken={tableToken}
      tableDetails={tableDetails}
      sessionInfo={{
        id: sessionId,
        customerName,
        billId,
        language: selectedLanguage
      }}
    />
  )
}
