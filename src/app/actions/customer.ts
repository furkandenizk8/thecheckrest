'use server'

import { createClient } from '@/lib/supabase/server'

interface OrderItemParam {
  productId: string
  quantity: number
  unitPrice: number
  chefNote?: string
}

interface PlaceOrderParams {
  tableSessionId: string
  billId: string
  tableId: string
  branchId: string
  items: OrderItemParam[]
  customerNote?: string
}

/**
 * Müşterinin sepetindeki siparişleri veritabanına kaydeder ve adisyonu günceller.
 */
export async function placeCustomerOrder(params: PlaceOrderParams) {
  const { tableSessionId, billId, tableId, branchId, items, customerNote } = params
  const supabase = await createClient()

  // 1. Oturumun aktif olup olmadığını doğrula
  const { data: session, error: sessionError } = await supabase
    .from('table_sessions')
    .select('is_active')
    .eq('id', tableSessionId)
    .single()

  if (sessionError || !session?.is_active) {
    return { success: false, error: 'Aktif masa oturumunuz bulunamadı. Lütfen QR kodu tekrar okutun.' }
  }

  // 2. Toplam tutarı hesapla
  let totalAmount = 0
  items.forEach((item) => {
    totalAmount += item.quantity * item.unitPrice
  })

  // 3. Siparişi oluştur
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      bill_id: billId,
      table_id: tableId,
      branch_id: branchId,
      session_id: tableSessionId,
      status: 'new',
      total_amount: totalAmount,
      customer_note: customerNote || '',
      cancel_window_ends_at: new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 dakika iptal penceresi
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('Error creating order:', orderError)
    return { success: false, error: 'Sipariş oluşturulurken bir hata oluştu.' }
  }

  // 4. Sipariş kalemlerini oluştur
  const orderItemsInsert = items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.quantity * item.unitPrice,
    chef_note: item.chefNote || '',
    status: 'pending'
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsInsert)

  if (itemsError) {
    console.error('Error creating order items:', itemsError)
    // Siparişi temizle
    await supabase.from('orders').delete().eq('id', order.id)
    return { success: false, error: 'Sipariş kalemleri oluşturulurken bir hata oluştu.' }
  }

  // 5. Adisyonun (bill) toplam tutarını ve servis ücretini güncelle
  // Adisyona bağlı tüm aktif siparişlerin toplamını al
  const { data: billOrders, error: sumError } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('bill_id', billId)
    .neq('status', 'cancelled')

  if (sumError) {
    console.error('Error calculating bill sum:', sumError)
  }

  let billTotal = 0
  if (billOrders) {
    billOrders.forEach((o) => {
      billTotal += Number(o.total_amount)
    })
  }

  // Şube servis ücreti yüzdesini çek
  const { data: branchData } = await supabase
    .from('branches')
    .select('service_fee_percent')
    .eq('id', branchId)
    .single()

  const serviceFeePercent = branchData?.service_fee_percent ? Number(branchData.service_fee_percent) : 0
  const serviceFee = billTotal * (serviceFeePercent / 100)

  const { error: billUpdateError } = await supabase
    .from('bills')
    .update({
      total_amount: billTotal + serviceFee,
      service_fee: serviceFee
    })
    .eq('id', billId)

  if (billUpdateError) {
    console.error('Error updating bill totals:', billUpdateError)
  }

  return { success: true, orderId: order.id }
}

interface CreateServiceRequestParams {
  tableSessionId: string
  tableId: string
  branchId: string
  type: 'waiter' | 'bill' | 'napkin' | 'water' | 'cleaning' | 'salt'
}

/**
 * Garson çağrısı veya servis talebi oluşturur.
 */
export async function createServiceRequest(params: CreateServiceRequestParams) {
  const { tableSessionId, tableId, branchId, type } = params
  const supabase = await createClient()

  // Öncelik belirle (Hesap isteme 'red' (acil/öncelikli), normal istekler 'yellow', diğerleri 'blue')
  let priority = 'yellow'
  if (type === 'bill') {
    priority = 'red'
  } else if (type === 'napkin' || type === 'salt') {
    priority = 'blue'
  }

  const { data, error } = await supabase
    .from('service_requests')
    .insert({
      table_id: tableId,
      branch_id: branchId,
      session_id: tableSessionId,
      type,
      priority,
      status: 'pending'
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating service request:', error)
    return { success: false, error: 'Talep iletilemedi.' }
  }

  return { success: true, requestId: data.id }
}
