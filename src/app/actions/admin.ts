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
