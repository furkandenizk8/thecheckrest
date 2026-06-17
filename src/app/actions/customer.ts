'use server'

import { createClient } from '@/lib/supabase/server'
import { sendTelegramNotification } from '@/lib/telegram'

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
 * Müşterinin sepetindeki siparişleri veritabanına kaydeder, adisyonu günceller ve Telegram bildirimi gönderir.
 */
export async function placeCustomerOrder(params: PlaceOrderParams) {
  const { tableSessionId, billId, tableId, branchId, items, customerNote } = params
  const supabase = await createClient()

  // 1. Oturumun aktif olup olmadığını doğrula
  const { data: session, error: sessionError } = await supabase
    .from('table_sessions')
    .select('is_active, customer_name')
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
  const { data: billOrders } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('bill_id', billId)
    .neq('status', 'cancelled')

  let billTotal = 0
  if (billOrders) {
    billOrders.forEach((o) => {
      billTotal += Number(o.total_amount)
    })
  }

  // Şube detaylarını çek (Servis ücreti ve isim için)
  const { data: branchData } = await supabase
    .from('branches')
    .select('name, currency, service_fee_percent')
    .eq('id', branchId)
    .single()

  const { data: tableData } = await supabase
    .from('tables')
    .select('name')
    .eq('id', tableId)
    .single()

  const serviceFeePercent = branchData?.service_fee_percent ? Number(branchData.service_fee_percent) : 0
  const serviceFee = billTotal * (serviceFeePercent / 100)
  const finalTotal = billTotal + serviceFee

  const { error: billUpdateError } = await supabase
    .from('bills')
    .update({
      total_amount: finalTotal,
      service_fee: serviceFee
    })
    .eq('id', billId)

  if (billUpdateError) {
    console.error('Error updating bill totals:', billUpdateError)
  }

  // 6. TELEGRAM BİLDİRİMİ GÖNDER (Arka planda çalışır, sipariş akışını bloke etmez)
  (async () => {
    try {
      // Ürün isimlerini çek
      const productIds = items.map((i) => i.productId)
      const { data: products } = await supabase
        .from('products')
        .select('id, name_tr, name_en')
        .in('id', productIds)

      const productMap = new Map<string, string>()
      if (products) {
        products.forEach((p) => productMap.set(p.id, p.name_tr || p.name_en || 'Bilinmeyen Ürün'))
      }

      // Mesajı oluştur
      let itemsListHtml = ''
      items.forEach((item) => {
        const prodName = productMap.get(item.productId) || 'Ürün'
        itemsListHtml += `• ${item.quantity}x <b>${prodName}</b> - ${(item.quantity * item.unitPrice).toFixed(2)} ${branchData?.currency || 'GEL'}\n`
        if (item.chefNote) {
          itemsListHtml += `  <i>Not: ${item.chefNote}</i>\n`
        }
      })

      const telegramMessage = 
`📦 <b>YENİ SİPARİŞ!</b>
━━━━━━━━━━━━━━━━━
🏢 <b>Şube:</b> ${branchData?.name || 'Bilinmeyen Şube'}
🎯 <b>Masa:</b> ${tableData?.name || 'Bilinmeyen Masa'}
👤 <b>Müşteri:</b> ${session.customer_name}
🔢 <b>Sipariş ID:</b> <code>#${order.id.slice(0, 8).toUpperCase()}</code>
━━━━━━━━━━━━━━━━━
🛒 <b>Ürünler:</b>
${itemsListHtml}━━━━━━━━━━━━━━━━━
💰 <b>Toplam Tutar:</b> <b>${finalTotal.toFixed(2)} ${branchData?.currency || 'GEL'}</b> (Servis Dahil)
${customerNote ? `💬 <b>Müşteri Genel Notu:</b> ${customerNote}` : ''}`

      await sendTelegramNotification(telegramMessage)
    } catch (telegramErr) {
      console.error('Failed to construct and send Telegram order notification:', telegramErr)
    }
  })()

  return { success: true, orderId: order.id }
}

interface CreateServiceRequestParams {
  tableSessionId: string
  tableId: string
  branchId: string
  type: 'waiter' | 'bill' | 'napkin' | 'water' | 'cleaning' | 'salt'
}

const REQUEST_LABELS: Record<string, { label: string; icon: string }> = {
  waiter: { label: 'Garson Çağır', icon: '🙋‍♂️' },
  bill: { label: 'Hesap İste', icon: '💵' },
  napkin: { label: 'Peçete İste', icon: '🧻' },
  water: { label: 'Su İste', icon: '💧' },
  salt: { label: 'Tuz/Karabiber İste', icon: '🧂' },
  cleaning: { label: 'Masayı Temizlet', icon: '🧹' }
}

/**
 * Garson çağrısı veya servis talebi oluşturur ve Telegram üzerinden garson grubuna iletir.
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

  // Telegram Bildirimi Gönder
  (async () => {
    try {
      const { data: session } = await supabase
        .from('table_sessions')
        .select('customer_name')
        .eq('id', tableSessionId)
        .single()

      const { data: branchData } = await supabase
        .from('branches')
        .select('name')
        .eq('id', branchId)
        .single()

      const { data: tableData } = await supabase
        .from('tables')
        .select('name')
        .eq('id', tableId)
        .single()

      const reqInfo = REQUEST_LABELS[type] || { label: type, icon: '🔔' }

      const telegramMessage = 
`🚨 <b>Masa Talebi!</b>
━━━━━━━━━━━━━━━━━
🏢 <b>Şube:</b> ${branchData?.name || 'Bilinmeyen Şube'}
🎯 <b>Masa:</b> ${tableData?.name || 'Bilinmeyen Masa'}
👤 <b>Müşteri:</b> ${session?.customer_name || 'Bilinmeyen'}
━━━━━━━━━━━━━━━━━
🔔 <b>Talep:</b> ${reqInfo.icon} <b>${reqInfo.label}</b>
`
      await sendTelegramNotification(telegramMessage)
    } catch (telegramErr) {
      console.error('Failed to send Telegram service request notification:', telegramErr)
    }
  })()

  return { success: true, requestId: data.id }
}
