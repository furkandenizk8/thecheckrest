'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendTelegramNotification } from '@/lib/telegram'

async function verifyAdminOrStaff() {
  const cookieClient = await createClient()
  const { data: { user }, error: authError } = await cookieClient.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Unauthorized: No active session.')
  }

  const serviceClient = createServiceClient()
  const { data: roleData, error: roleError } = await serviceClient
    .from('user_roles')
    .select('role, branch_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (roleError || !roleData) {
    throw new Error('Unauthorized: Access denied.')
  }

  const allowedRoles = ['super_admin', 'brand_owner', 'branch_manager', 'cashier', 'kitchen', 'waiter']
  if (!allowedRoles.includes(roleData.role)) {
    throw new Error('Unauthorized: Invalid role.')
  }

  return { user, role: roleData.role, branchId: roleData.branch_id }
}


async function autoDeliverReadyOrders(supabase: ReturnType<typeof createServiceClient>, branchId: string) {
  const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString()
  const { data: readyOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('branch_id', branchId)
    .eq('status', 'ready')
    .lt('updated_at', threeMinutesAgo)

  if (!readyOrders?.length) return

  const orderIds = readyOrders.map((o: any) => o.id)
  await supabase
    .from('orders')
    .update({ status: 'delivered', updated_at: new Date().toISOString() })
    .in('id', orderIds)
  await supabase
    .from('order_items')
    .update({ status: 'delivered' })
    .in('order_id', orderIds)
    .neq('status', 'delivered')
}

export async function setupWebhook(appUrl: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return { success: false, error: 'Telegram Bot Token is not configured in environment variables.' }
  }

  // Ensure url is clean and has https
  let cleanUrl = appUrl.trim()
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`
  }

  // Check if it's localhost or an ip
  if (cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1')) {
    return { 
      success: false, 
      error: 'Telegram does not support localhost webhooks directly. Please use a public HTTPS URL (like your Vercel URL or an ngrok tunnel).' 
    }
  }

  const webhookUrl = `${cleanUrl}/api/telegram/webhook`

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
      }),
    })

    const data = await response.json()
    if (!response.ok || !data.ok) {
      return { success: false, error: data.description || 'Unknown Telegram error.' }
    }

    // Fetch bot info to verify credentials and get bot username
    let botInfo = null
    try {
      const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`)
      const meData = await meRes.json()
      if (meData.ok) {
        botInfo = {
          username: meData.result.username,
          firstName: meData.result.first_name,
        }
      }
    } catch (e) {
      console.error('getMe error', e)
    }

    return { success: true, webhookUrl, botInfo }
  } catch (error: any) {
    return { success: false, error: error.message || 'Connection failed to Telegram API.' }
  }
}

export async function sendTestNotification() {
  const { sendTelegramNotification } = await import('@/lib/telegram')
  
  const testMessage = `
🔔 <b>thecheckmenu — Test Bildirimi</b>
━━━━━━━━━━━━━━━━━
Sisteminiz başarıyla kuruldu ve Telegram entegrasyonunuz aktif!

🚀 <b>Sunucu Bilgileri:</b>
• Durum: Aktif
• Zaman damgası: ${new Date().toLocaleString('tr-TR')}

Bu bildirim, Telegram Bot Token ve Chat ID'nizin doğru yapılandırıldığını gösterir.
`
  const success = await sendTelegramNotification(testMessage)
  if (success) {
    return { success: true }
  } else {
    return { success: false, error: 'Telegram bildirimi gönderilemedi. Lütfen Bot Token ve Chat ID değerlerinizi kontrol edin.' }
  }
}

export async function getSystemStatus() {
  try {
    const cookieClient = await createClient()
    const { data: { user }, error: authErr } = await cookieClient.auth.getUser()
    if (authErr || !user) {
      return { dbConnected: false, error: 'Unauthorized: No active session.' }
    }

    const supabase = createServiceClient()

    const [
      { count: branchCount, error: branchErr },
      { count: tableCount, error: tableErr },
      { count: productCount, error: productErr },
    ] = await Promise.all([
      supabase.from('branches').select('*', { count: 'exact', head: true }),
      supabase.from('tables').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
    ])

    const dbConnected = !branchErr && !tableErr && !productErr

    return {
      dbConnected,
      counts: {
        branches: branchCount || 0,
        tables: tableCount || 0,
        products: productCount || 0
      },
      env: {
        hasBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
        hasChatId: !!process.env.TELEGRAM_CHAT_ID,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    }
  } catch (err: any) {
    return {
      dbConnected: false,
      counts: { branches: 0, tables: 0, products: 0 },
      env: {
        hasBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
        hasChatId: !!process.env.TELEGRAM_CHAT_ID,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      error: err.message || 'Connection to Supabase failed'
    }
  }
}

export async function fetchBranchesAction() {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()
  const { data } = await supabase.from('branches').select('*')
  return data || []
}

export async function fetchUnifiedDashboardData(branchId: string) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()

  // autoDeliver arka planda çalışır — dashboard fetch'ini bloklamaz
  autoDeliverReadyOrders(supabase, branchId).catch(console.error)

  // Tüm sorgular paralel çalışır
  const [
    { data: tables },
    { data: activeSessions },
    { data: openBills },
    { data: activeRequests },
    { data: activeOrders },
    { data: stations },
  ] = await Promise.all([
    supabase
      .from('tables')
      .select('*')
      .eq('branch_id', branchId)
      .eq('is_active', true)
      .order('name', { ascending: true }),

    supabase
      .from('table_sessions')
      .select('*')
      .eq('branch_id', branchId)
      .eq('is_active', true),

    supabase
      .from('bills')
      .select('*')
      .eq('branch_id', branchId)
      .eq('status', 'open'),

    supabase
      .from('service_requests')
      .select('*')
      .eq('branch_id', branchId)
      .neq('status', 'done')
      .order('created_at', { ascending: true }),

    supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            name_tr,
            name_en,
            name_ka,
            name_ru,
            categories (
              id,
              station_id,
              stations (id, name, color)
            )
          )
        )
      `)
      .eq('branch_id', branchId)
      .neq('status', 'cancelled')
      .neq('status', 'delivered')
      .order('created_at', { ascending: true }),

    supabase
      .from('stations')
      .select('*')
      .eq('branch_id', branchId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ])

  return {
    tables: tables || [],
    activeSessions: activeSessions || [],
    openBills: openBills || [],
    activeRequests: activeRequests || [],
    activeOrders: activeOrders || [],
    stations: stations || [],
  }
}

export async function updateOrderStatusAction(orderId: string, status: string) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) return { success: false, error: error.message }

  if (status === 'preparing') {
    await supabase.from('order_items').update({ status: 'preparing' }).eq('order_id', orderId).eq('status', 'pending')

    // Müşteriye Telegram bildirimi — hazırlanıyor
    const { data: orderSess } = await supabase
      .from('orders')
      .select('session_id, table_sessions(device_id, language)')
      .eq('id', orderId)
      .single()
    if (orderSess?.session_id) {
      const sess = orderSess.table_sessions as any
      const deviceId: string = sess?.device_id || ''
      if (deviceId.startsWith('tg_')) {
        const custChatId = deviceId.replace('tg_', '')
        const lang = sess?.language || 'tr'
        const custMsg = lang === 'en' ? '👨‍🍳 Your order is being prepared in the kitchen!'
          : lang === 'ru' ? '👨‍🍳 Ваш заказ готовится на кухне!'
          : lang === 'ka' ? '👨‍🍳 თქვენი შეკვეთა სამზარეულოში მზადდება!'
          : '👨‍🍳 Siparişiniz mutfakta hazırlanmaya başladı!'
        sendTelegramNotification(custMsg, custChatId).catch(console.error)
      }
    }
  } else if (status === 'ready') {
    await supabase.from('order_items').update({ status: 'ready' }).eq('order_id', orderId).in('status', ['pending', 'preparing'])

    const { data: order } = await supabase
      .from('orders')
      .select('tables(name), branches(name), table_sessions(customer_name, device_id, language)')
      .eq('id', orderId)
      .single()

    if (order) {
      const msg =
`🍽 <b>SİPARİŞ HAZIR — MASAYA GÖTÜR!</b>
━━━━━━━━━━━━━━━━━
🏢 <b>Şube:</b> ${(order.branches as any)?.name || 'Şube'}
🎯 <b>Masa:</b> ${(order.tables as any)?.name || 'Masa'}
👤 <b>Müşteri:</b> ${(order.table_sessions as any)?.customer_name || 'Müşteri'}
━━━━━━━━━━━━━━━━━
✅ Mutfak siparişi hazırladı. Lütfen teslim edin.`
      sendTelegramNotification(msg).catch(console.error)

      // Müşteriye Telegram bildirimi — hazır
      const deviceId: string = (order.table_sessions as any)?.device_id || ''
      if (deviceId.startsWith('tg_')) {
        const custChatId = deviceId.replace('tg_', '')
        const lang = (order.table_sessions as any)?.language || 'tr'
        const custMsg = lang === 'en' ? '🍽️ Your order is ready! Our waiter is bringing it to your table.'
          : lang === 'ru' ? '🍽️ Ваш заказ готов! Официант несёт его к вашему столику.'
          : lang === 'ka' ? '🍽️ თქვენი შეკვეთა მზად არის! ოფიციანტი მოგართმევთ.'
          : '🍽️ Siparişiniz hazır! Garsonumuz masanıza getiriyor.'
        sendTelegramNotification(custMsg, custChatId).catch(console.error)
      }
    }
  } else if (status === 'delivered') {
    await supabase.from('order_items').update({ status: 'delivered' }).eq('order_id', orderId).neq('status', 'delivered')
  }

  return { success: true }
}

export async function updateOrderItemStatusAction(itemId: string, status: string) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('order_items')
    .update({ status })
    .eq('id', itemId)

  if (error) return { success: false, error: error.message }

  // Tüm kalemler ready/delivered olunca siparişi otomatik ready yap + garsona bildir
  if (status === 'ready') {
    const { data: item } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('id', itemId)
      .single()

    if (item) {
      const { data: allItems } = await supabase
        .from('order_items')
        .select('status')
        .eq('order_id', item.order_id)

      const allReady = allItems?.every(i => i.status === 'ready' || i.status === 'delivered')

      if (allReady) {
        await supabase
          .from('orders')
          .update({ status: 'ready', updated_at: new Date().toISOString() })
          .eq('id', item.order_id)
          .neq('status', 'delivered')

        // Garsona bildirim — ana TELEGRAM_CHAT_ID'ye
        const { data: order } = await supabase
          .from('orders')
          .select('tables(name), branches(name), table_sessions(customer_name)')
          .eq('id', item.order_id)
          .single()

        if (order) {
          const msg =
`🍽 <b>SİPARİŞ HAZIR — MASAYA GÖTÜR!</b>
━━━━━━━━━━━━━━━━━
🏢 <b>Şube:</b> ${(order.branches as any)?.name || 'Şube'}
🎯 <b>Masa:</b> ${(order.tables as any)?.name || 'Masa'}
👤 <b>Müşteri:</b> ${(order.table_sessions as any)?.customer_name || 'Müşteri'}
━━━━━━━━━━━━━━━━━
✅ Tüm birimler hazırladı. Lütfen teslim edin.`
          sendTelegramNotification(msg).catch(console.error)

          // Müşteriye Telegram bildirimi — hazır
          const deviceId: string = (order.table_sessions as any)?.device_id || ''
          if (deviceId.startsWith('tg_')) {
            const custChatId = deviceId.replace('tg_', '')
            const lang = (order.table_sessions as any)?.language || 'tr'
            const custMsg = lang === 'en' ? '🍽️ Your order is ready! Our waiter is bringing it to your table.'
              : lang === 'ru' ? '🍽️ Ваш заказ готов! Официант несёт его к вашему столику.'
              : lang === 'ka' ? '🍽️ თქვენი შეკვეთა მზად არის! ოფიციანტი მოგართმევთ.'
              : '🍽️ Siparişiniz hazır! Garsonumuz masanıza getiriyor.'
            sendTelegramNotification(custMsg, custChatId).catch(console.error)
          }
        }
      }
    }
  }

  return { success: true }
}

export async function acknowledgeServiceRequestAction(requestId: string) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('service_requests')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString()
    })
    .eq('id', requestId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function completeServiceRequestAction(requestId: string) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('service_requests')
    .update({
      status: 'done',
      completed_at: new Date().toISOString()
    })
    .eq('id', requestId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function resetTableAction(tableId: string) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()

  // 1. Get branch_id or check bill
  const { data: openBill } = await supabase
    .from('bills')
    .select('id')
    .eq('table_id', tableId)
    .eq('status', 'open')
    .maybeSingle()

  if (openBill) {
    // Close the bill
    await supabase
      .from('bills')
      .update({ 
        status: 'closed',
        closed_at: new Date().toISOString()
      })
      .eq('id', openBill.id)
  }

  // 2. Deactivate all sessions on this table
  await supabase
    .from('table_sessions')
    .update({ is_active: false })
    .eq('table_id', tableId)

  // 3. Clear pending requests on this table
  await supabase
    .from('service_requests')
    .update({ 
      status: 'done',
      completed_at: new Date().toISOString()
    })
    .eq('table_id', tableId)
    .neq('status', 'done')

  // 4. Update table status to empty
  await supabase
    .from('tables')
    .update({ status: 'empty' })
    .eq('id', tableId)

  return { success: true }
}

export async function updateTableStatusAction(tableId: string, status: 'empty' | 'occupied' | 'needs_cleaning' | 'available') {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('tables')
    .update({ status: status === 'available' ? 'empty' : status })
    .eq('id', tableId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function payBillAction(billId: string, amount: number, method: 'cash' | 'card') {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()

  // 1. Fetch current bill
  const { data: bill } = await supabase
    .from('bills')
    .select('*')
    .eq('id', billId)
    .single()

  if (!bill) {
    return { success: false, error: 'Adisyon bulunamadı.' }
  }

  const newPaidAmount = Number(bill.paid_amount || 0) + amount
  const isFullyPaid = newPaidAmount >= Number(bill.total_amount)

  const updateData: any = {
    paid_amount: newPaidAmount,
    payment_method: method
  }

  if (isFullyPaid) {
    updateData.status = 'closed'
    updateData.closed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('bills')
    .update(updateData)
    .eq('id', billId)

  if (error) {
    return { success: false, error: error.message }
  }

  // If fully paid, automatically reset the table and deactivate sessions
  if (isFullyPaid) {
    await supabase
      .from('table_sessions')
      .update({ is_active: false })
      .eq('table_id', bill.table_id)

    await supabase
      .from('tables')
      .update({ status: 'empty' })
      .eq('id', bill.table_id)

    // Complete requests
    await supabase
      .from('service_requests')
      .update({ 
        status: 'done',
        completed_at: new Date().toISOString()
      })
      .eq('table_id', bill.table_id)
      .neq('status', 'done')
  }

  return { success: true, isFullyPaid }
}

// ========== KATEGORİ YÖNETİMİ ==========

export async function fetchCategoriesAction(branchId: string) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('branch_id', branchId)
    .order('sort_order', { ascending: true })
  return data || []
}

export async function createCategoryAction(branchId: string, data: { name_tr: string; name_en?: string; name_ka?: string; name_ru?: string; sort_order?: number; station_id?: string | null; photo_url?: string | null }) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()
  const { data: created, error } = await supabase
    .from('categories')
    .insert({
      branch_id: branchId,
      name_tr: data.name_tr,
      name_ka: data.name_ka || data.name_tr,
      name_en: data.name_en || data.name_tr,
      name_ru: data.name_ru || data.name_tr,
      sort_order: data.sort_order ?? 0,
      is_active: true,
      station_id: data.station_id ?? null,
      photo_url: data.photo_url || null,
    })
    .select('id')
    .single()
  if (error) return { success: false, error: error.message }
  return { success: true, id: created.id }
}

export async function updateCategoryAction(categoryId: string, data: { name_tr?: string; name_en?: string; name_ka?: string; name_ru?: string; sort_order?: number; is_active?: boolean; station_id?: string | null; photo_url?: string | null }) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()
  const { error } = await supabase.from('categories').update(data).eq('id', categoryId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ========== ÜRÜN YÖNETİMİ ==========

export async function fetchProductsAction(branchId: string) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()

  const { data: branch } = await supabase.from('branches').select('brand_id').eq('id', branchId).single()
  if (!branch) return []

  const { data: products } = await supabase
    .from('products')
    .select(`*, categories(id, name_tr), branch_product_settings(custom_price, is_active, stock_count, branch_id)`)
    .eq('brand_id', branch.brand_id)
    .order('sort_order', { ascending: true })

  return (products || []).map((p: any) => ({
    ...p,
    branch_settings: (p.branch_product_settings || []).find((s: any) => s.branch_id === branchId) ?? null,
    branch_product_settings: undefined,
  }))
}

export async function createProductAction(
  branchId: string,
  data: {
    category_id: string
    name_tr: string
    name_en?: string
    name_ka?: string
    name_ru?: string
    description_tr?: string
    base_price: number
    prep_time_minutes?: number
    is_vegetarian?: boolean
    is_spicy?: boolean
    allergens?: string[]
    sort_order?: number
    photo_url?: string | null
  }
) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()

  const { data: branch } = await supabase.from('branches').select('brand_id').eq('id', branchId).single()
  if (!branch) return { success: false, error: 'Şube bulunamadı.' }

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      brand_id: branch.brand_id,
      category_id: data.category_id,
      name_tr: data.name_tr,
      name_ka: data.name_ka || data.name_tr,
      name_en: data.name_en || data.name_tr,
      name_ru: data.name_ru || data.name_tr,
      description_tr: data.description_tr || '',
      description_ka: data.description_tr || '',
      description_en: data.description_tr || '',
      description_ru: data.description_tr || '',
      base_price: data.base_price,
      prep_time_minutes: data.prep_time_minutes ?? 15,
      is_vegetarian: data.is_vegetarian ?? false,
      is_spicy: data.is_spicy ?? false,
      allergens: data.allergens ?? [],
      sort_order: data.sort_order ?? 0,
      is_active: true,
      photo_url: data.photo_url || null,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }

  await supabase.from('branch_product_settings').insert({ branch_id: branchId, product_id: product.id, is_active: true })

  return { success: true, id: product.id }
}

export async function updateProductAction(
  productId: string,
  branchId: string,
  data: {
    category_id?: string
    name_tr?: string
    name_en?: string
    name_ka?: string
    name_ru?: string
    description_tr?: string
    base_price?: number
    prep_time_minutes?: number
    is_vegetarian?: boolean
    is_spicy?: boolean
    allergens?: string[]
    sort_order?: number
    is_active?: boolean
    custom_price?: number | null
    stock_count?: number | null
    branch_active?: boolean
    photo_url?: string | null
  }
) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()

  const { custom_price, stock_count, branch_active, ...productData } = data

  if (Object.keys(productData).length > 0) {
    const { error } = await supabase.from('products').update(productData).eq('id', productId)
    if (error) return { success: false, error: error.message }
  }

  if (custom_price !== undefined || stock_count !== undefined || branch_active !== undefined) {
    const { data: existing } = await supabase
      .from('branch_product_settings')
      .select('id')
      .eq('product_id', productId)
      .eq('branch_id', branchId)
      .maybeSingle()

    const settingsData: any = {}
    if (custom_price !== undefined) settingsData.custom_price = custom_price
    if (stock_count !== undefined) settingsData.stock_count = stock_count
    if (branch_active !== undefined) settingsData.is_active = branch_active

    if (existing) {
      await supabase.from('branch_product_settings').update(settingsData).eq('id', existing.id)
    } else {
      await supabase.from('branch_product_settings').insert({ product_id: productId, branch_id: branchId, ...settingsData })
    }
  }

  return { success: true }
}

// ========== MASA YÖNETİMİ ==========

export async function fetchTablesConfigAction(branchId: string) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()
  const { data } = await supabase.from('tables').select('*').eq('branch_id', branchId).order('name', { ascending: true })
  return data || []
}

export async function createTableAction(branchId: string, data: { name: string; capacity: number }) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()
  const { data: table, error } = await supabase
    .from('tables')
    .insert({ branch_id: branchId, name: data.name, capacity: data.capacity, status: 'empty', is_active: true })
    .select('id, qr_token')
    .single()
  if (error) return { success: false, error: error.message }
  return { success: true, id: table.id, qrToken: table.qr_token }
}

export async function updateTableAction(tableId: string, data: { name?: string; capacity?: number; is_active?: boolean }) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()
  const { error } = await supabase.from('tables').update(data).eq('id', tableId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteTableAction(tableId: string) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()
  const { error } = await supabase.from('tables').delete().eq('id', tableId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getTableQRAction(tableId: string) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()
  const { data: table } = await supabase.from('tables').select('qr_token, name').eq('id', tableId).single()
  if (!table) return { success: false as const, error: 'Masa bulunamadı.' }
  const { generateTableQR } = await import('@/lib/qr')
  const qrDataUrl = await generateTableQR(table.qr_token)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return { success: true as const, qrDataUrl, tableName: table.name, qrUrl: `${baseUrl}/m/${table.qr_token}` }
}

// ========== BİRİM (STATION) YÖNETİMİ ==========

export async function fetchStationsAction(branchId: string) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('stations')
    .select('*')
    .eq('branch_id', branchId)
    .order('sort_order', { ascending: true })
  return data || []
}

export async function createStationAction(
  branchId: string,
  data: { name: string; color?: string; telegram_chat_id?: string; sort_order?: number }
) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()
  const { data: station, error } = await supabase
    .from('stations')
    .insert({ branch_id: branchId, ...data, is_active: true })
    .select('id')
    .single()
  if (error) return { success: false, error: error.message }
  return { success: true, id: station.id }
}

export async function updateStationAction(
  stationId: string,
  data: { name?: string; color?: string; telegram_chat_id?: string; sort_order?: number; is_active?: boolean }
) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()
  const { error } = await supabase.from('stations').update(data).eq('id', stationId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteStationAction(stationId: string) {
  await verifyAdminOrStaff()
  const supabase = createServiceClient()
  const { error } = await supabase.from('stations').delete().eq('id', stationId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
