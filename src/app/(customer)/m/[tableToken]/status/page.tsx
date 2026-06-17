import React from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { resolveTableToken } from '@/lib/restaurant/sessions'
import OrderStatusView from '@/components/customer/OrderStatusView'
import { Language } from '@/lib/i18n/customer'

interface PageProps {
  params: Promise<{
    tableToken: string
  }>
}

export default async function TableOrderStatusPage({ params }: PageProps) {
  const { tableToken } = await params
  
  // 1. Çerezlerden oturum bilgilerini oku
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('table_session_id')?.value
  const customerName = cookieStore.get('customer_name')?.value

  if (!sessionId || !customerName) {
    redirect(`/m/${tableToken}`)
  }

  const supabase = await createClient()

  // 2. Oturumun geçerliliğini doğrula
  const { data: session, error: sessionError } = await supabase
    .from('table_sessions')
    .select('is_active, language')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session || !session.is_active) {
    redirect(`/m/${tableToken}`)
  }

  // 3. Masa token'ını doğrula
  const tableDetails = await resolveTableToken(supabase, tableToken)
  if (!tableDetails) {
    redirect(`/m/${tableToken}`)
  }

  // 4. Bu oturuma ait mevcut aktif siparişleri veritabanından çek
  const { data: dbOrders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      total_amount,
      created_at,
      order_items (
        id,
        quantity,
        unit_price,
        chef_note,
        products (
          name_tr,
          name_en,
          name_ru,
          name_ka
        )
      )
    `)
    .eq('session_id', sessionId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })

  if (ordersError) {
    console.error('Error fetching initial orders:', ordersError)
  }

  const initialOrders = (dbOrders || []) as any[]

  return (
    <OrderStatusView
      initialOrders={initialOrders}
      tableToken={tableToken}
      sessionInfo={{
        id: sessionId,
        customerName,
        language: (session.language || 'tr') as Language
      }}
    />
  )
}
