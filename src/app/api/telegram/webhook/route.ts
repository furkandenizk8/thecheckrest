import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 })
  }

  // Vercel derleme (build) sırasında env değerleri eksik olduğunda çökmemesi için
  // Supabase client'ını POST fonksiyonu içinde lazily (istek geldiğinde) kuruyoruz.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Supabase credentials missing inside Telegram webhook handler')
    return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 })
  }

  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  )

  try {
    const payload = await request.json()
    console.log('Telegram webhook payload:', JSON.stringify(payload, null, 2))

    const message = payload.message
    if (!message || !message.text) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const text = message.text.trim()

    // Kullanıcı /start <tableToken> komutu gönderdiyse
    if (text.startsWith('/start ')) {
      const tableToken = text.substring('/start '.length).trim()

      // 1. Masanın geçerli olup olmadığını veritabanından sorgula
      const { data: tableData, error: tableError } = await supabase
        .from('tables')
        .select(`
          id,
          name,
          branch_id,
          branches (
            name,
            currency
          )
        `)
        .eq('qr_token', tableToken)
        .eq('is_active', true)
        .maybeSingle()

      if (tableError || !tableData) {
        // Geçersiz masa uyarısı gönder
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: '⚠️ <b>Geçersiz Masa!</b>\n\nOkuttuğunuz QR kod sistemimizde kayıtlı bir masaya ait değil. Lütfen masadaki kodu tekrar deneyin.',
            parse_mode: 'HTML'
          })
        })
        return NextResponse.json({ ok: true })
      }

      const branchName = (tableData.branches as any)?.name || 'Gusto Lounge'
      const tableName = tableData.name

      // 2. Dinamik olarak host adresini al (ngrok, custom domain veya local)
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000'
      const appUrl = `${protocol}://${host}`

      // 3. Telegram Web App butonu içeren karşılama mesajını gönder
      const webAppUrl = `${appUrl}/m/${tableToken}?tg=true&chatId=${chatId}`

      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🍽️ <b>${branchName}</b>\n━━━━━━━━━━━━━━━━━\nHoş geldiniz! <b>${tableName}</b> için Telegram üzerinden menüyü inceleyebilir ve siparişinizi verebilirsiniz.\n\nMenüyü açmak için aşağıdaki butona tıklayın. 👇`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🍽️ Menüyü Aç',
                  web_app: {
                    url: webAppUrl
                  }
                }
              ]
            ]
          }
        })
      })

      if (!response.ok) {
        console.error('Failed to send telegram welcome message:', await response.text())
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Webhook processing error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
