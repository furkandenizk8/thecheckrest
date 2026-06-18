/**
 * Telegram botu üzerinden belirtilen gruba/kanala HTML formatında bildirim gönderir.
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    })

    if (!response.ok) {
      console.error('Telegram API error:', await response.json())
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
    return false
  }
}

/**
 * Inline keyboard butonları ile birlikte Telegram mesajı gönderir.
 * Returns the sent message_id (string) or null on failure.
 */
export async function sendTelegramMessageWithButtons(
  message: string,
  replyMarkup: { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> },
  targetChatId?: string
): Promise<string | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = targetChatId || process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId || token === 'YOUR_TELEGRAM_BOT_TOKEN_HERE' || chatId === 'YOUR_TELEGRAM_CHAT_ID_HERE') {
    return null
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    })

    if (!response.ok) {
      console.error('Telegram sendMessageWithButtons error:', await response.json())
      return null
    }

    const data = await response.json()
    return String(data.result?.message_id ?? '')
  } catch (error) {
    console.error('Error sending Telegram message with buttons:', error)
    return null
  }
}
