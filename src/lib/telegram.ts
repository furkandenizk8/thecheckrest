/**
 * Telegram botu üzerinden belirtilen gruba/kanala HTML formatında bildirim gönderir.
 * @param message Gönderilecek mesaj içeriği (HTML etiketleri destekler)
 */
export async function sendTelegramNotification(message: string, targetChatId?: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = targetChatId || process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId || token === 'YOUR_TELEGRAM_BOT_TOKEN_HERE' || chatId === 'YOUR_TELEGRAM_CHAT_ID_HERE') {
    return false
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Telegram API error:', errorData)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
    return false
  }
}
