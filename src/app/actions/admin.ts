'use server'

import { createClient } from '@/lib/supabase/server'

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
    const supabase = await createClient()
    
    // Get counts
    const { count: branchCount, error: branchErr } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true })
      
    const { count: tableCount, error: tableErr } = await supabase
      .from('tables')
      .select('*', { count: 'exact', head: true })
      
    const { count: productCount, error: productErr } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

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
      error: err.message || 'Connection to Supabase failed'
    }
  }
}

export async function fetchBranchesAction() {
  const supabase = await createClient()
  const { data } = await supabase.from('branches').select('*')
  return data || []
}

export async function fetchUnifiedDashboardData(branchId: string) {
  const supabase = await createClient()

  // 1. Fetch all tables
  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .eq('branch_id', branchId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  // 2. Fetch active sessions
  const { data: activeSessions } = await supabase
    .from('table_sessions')
    .select('*')
    .eq('branch_id', branchId)
    .eq('is_active', true)

  // 3. Fetch active open bills
  const { data: openBills } = await supabase
    .from('bills')
    .select('*')
    .eq('branch_id', branchId)
    .eq('status', 'open')

  // 4. Fetch active service requests (waiter calls)
  const { data: activeRequests } = await supabase
    .from('service_requests')
    .select('*')
    .eq('branch_id', branchId)
    .neq('status', 'done')
    .order('created_at', { ascending: true })

  // 5. Fetch active orders
  const { data: activeOrders } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (
          name_tr,
          name_en,
          name_ka,
          name_ru
        )
      )
    `)
    .eq('branch_id', branchId)
    .neq('status', 'cancelled')
    .neq('status', 'delivered')
    .order('created_at', { ascending: true })

  return {
    tables: tables || [],
    activeSessions: activeSessions || [],
    openBills: openBills || [],
    activeRequests: activeRequests || [],
    activeOrders: activeOrders || []
  }
}

export async function updateOrderStatusAction(orderId: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('orders')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateOrderItemStatusAction(itemId: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('order_items')
    .update({ status })
    .eq('id', itemId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function completeServiceRequestAction(requestId: string) {
  const supabase = await createClient()

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
  const supabase = await createClient()

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

export async function payBillAction(billId: string, amount: number, method: 'cash' | 'card') {
  const supabase = await createClient()

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
