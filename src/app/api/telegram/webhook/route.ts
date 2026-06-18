import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getOrCreateBill } from '@/lib/restaurant/sessions'

// Default fallback premium cover photo for menus
const DEFAULT_COVER_PHOTO = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600'

// Multi-language translations dictionary for the Telegram chatbot
const botTranslations: Record<string, Record<string, string>> = {
  tr: {
    welcome: '🍽️ <b>{branchName}</b>\n━━━━━━━━━━━━━━━━━\nHoş geldiniz! <b>{tableName}</b> için sipariş ve servis botu aktif.',
    selectLanguage: 'Lütfen tercih ettiğiniz dili seçin / Please select your language:',
    mainMenu: '🍽️ <b>Ana Menü ({tableName})</b>\n━━━━━━━━━━━━━━━━━\nMasadayken yapmak istediğiniz işlemi seçin:',
    btnMenu: '📖 Menüyü İncele',
    btnCart: '🛒 Sepetim ({count} adet)',
    btnService: '🔔 Garson Çağır / Servis',
    btnBill: '🧾 Adisyon / Ödeme',
    btnBackMenu: '🔙 Ana Menü',
    btnBackCats: '🔙 Kategoriler',
    categories: '📂 <b>Menü Kategorileri</b>\n━━━━━━━━━━━━━━━━━\nLütfen bir kategori seçin:',
    emptyCategory: 'Bu kategoride henüz ürün bulunmuyor.',
    categoryTitle: '📂 <b>{categoryName}</b>\n━━━━━━━━━━━━━━━━━\nÜrünleri inceleyebilir, detaylarına bakabilir ve sepetinize ekleyebilirsiniz:',
    addedToCart: 'Sepete eklendi.',
    removedFromCart: 'Sepetten çıkarıldı.',
    cartTitle: '🛒 <b>Sepetiniz ({tableName})</b>\n━━━━━━━━━━━━━━━━━\n',
    cartEmpty: 'Sepetiniz boş. Lütfen menüden ürün seçin.',
    cartItem: '• {qty} x {name} ({price} GEL)\n',
    cartTotal: '\nAra Toplam: {subtotal} GEL\nServis Ücreti (%{fee}): {serviceFee} GEL\n<b>Toplam Tutar: {total} GEL</b>',
    btnConfirmOrder: '✅ Siparişi Onayla',
    btnClearCart: '🗑️ Sepeti Temizle',
    orderConfirmed: '🎉 <b>Siparişiniz Alındı!</b>\n━━━━━━━━━━━━━━━━━\nSiparişiniz mutfağa iletildi.\n\n🔢 <b>Sipariş No:</b> #<code>{orderId}</code>\n⏳ <b>Durum:</b> Hazırlanıyor',
    cartCleared: 'Sepetiniz temizlendi.',
    serviceTitle: '🔔 <b>Garson / Servis İstekleri</b>\n━━━━━━━━━━━━━━━━━\nLütfen masanıza iletmek istediğiniz talebi seçin:',
    srv_waiter: '🙋 Garson Çağır',
    srv_bill: '🧾 Hesap İste',
    srv_napkin: '🧻 Peçete / Islak Mendil',
    srv_salt: '🧂 Tuz / Karabiber',
    srv_cutlery: '🍴 Çatal / Bıçak',
    srv_water: '💧 Su',
    srv_cleaning: '🧹 Temizlik',
    serviceRequestSent: '✅ Talebiniz ({type}) personele iletildi.',
    paymentTitle: '🧾 <b>Adisyon Ödeme ({tableName})</b>\n━━━━━━━━━━━━━━━━━\nToplam Tutar: <b>{total} GEL</b>\n\nLütfen masada kullanmak istediğiniz ödeme yöntemini seçin:',
    pay_cash: '💵 Nakit',
    pay_card: '💳 Kredi Kartı',
    paymentRequestSent: '✅ Ödeme talebiniz iletildi. Garsonumuz hesap süetiniz ile masanıza geliyor.',
    noActiveBill: 'Masaya ait henüz aktif adisyon bulunmuyor. Önce sipariş vermelisiniz.',
    invalidSession: '⚠️ Oturumunuz geçersiz. Lütfen masadaki QR kodu tekrar okutun.',
    btnNutrition: 'ℹ️ Detay & Kalori',
    btnViewOrder: '📋 Siparişimi Gör',
    btnNewOrder: '➕ Yeni Sipariş Ekle',
    btnCancelOrder: '❌ Siparişi İptal Et',
    btnCallWaiterChange: '🔔 Değişiklik için Garson Çağır',
    orderViewTitle: '📋 <b>Sipariş Durumu</b>',
    orderStatus_new: '⏳ Sırada Bekliyor',
    orderStatus_preparing: '👨‍🍳 Mutfakta Hazırlanıyor',
    orderStatus_ready: '🍽️ Hazır — Garson Getiriyor',
    orderStatus_delivered: '✅ Teslim Edildi',
    orderStatus_cancelled: '❌ İptal Edildi',
    orderCancelled: '✅ Siparişiniz iptal edildi. İsterseniz yeni sipariş verebilirsiniz.',
    orderCancelError: '⚠️ Bu sipariş artık iptal edilemiyor. Değişiklik için garson çağırın.',
    orderCancelWindowPassed: '⌛ İptal süresi doldu. Değişiklik için garson çağırın.'
  },
  en: {
    welcome: '🍽️ <b>{branchName}</b>\n━━━━━━━━━━━━━━━━━\nWelcome! Order and service bot for <b>{tableName}</b> is active.',
    selectLanguage: 'Please select your language:',
    mainMenu: '🍽️ <b>Main Menu ({tableName})</b>\n━━━━━━━━━━━━━━━━━\nChoose an action for your table:',
    btnMenu: '📖 View Menu',
    btnCart: '🛒 My Cart ({count} items)',
    btnService: '🔔 Call Waiter / Service',
    btnBill: '🧾 Bill / Payment',
    btnBackMenu: '🔙 Main Menu',
    btnBackCats: '🔙 Categories',
    categories: '📂 <b>Menu Categories</b>\n━━━━━━━━━━━━━━━━━\nPlease select a category:',
    emptyCategory: 'No products in this category yet.',
    categoryTitle: '📂 <b>{categoryName}</b>\n━━━━━━━━━━━━━━━━━\nReview items, view details and add to your cart:',
    addedToCart: 'Added to cart.',
    removedFromCart: 'Removed from cart.',
    cartTitle: '🛒 <b>Your Cart ({tableName})</b>\n━━━━━━━━━━━━━━━━━\n',
    cartEmpty: 'Your cart is empty. Please select items from the menu.',
    cartItem: '• {qty} x {name} ({price} GEL)\n',
    cartTotal: '\nSubtotal: {subtotal} GEL\nService Fee (%{fee}): {serviceFee} GEL\n<b>Total Amount: {total} GEL</b>',
    btnConfirmOrder: '✅ Confirm Order',
    btnClearCart: '🗑️ Clear Cart',
    orderConfirmed: '🎉 <b>Order Received!</b>\n━━━━━━━━━━━━━━━━━\nYour order has been sent to the kitchen.\n\n🔢 <b>Order No:</b> #<code>{orderId}</code>\n⏳ <b>Status:</b> Preparing',
    cartCleared: 'Your cart has been cleared.',
    serviceTitle: '🔔 <b>Call Waiter / Service Requests</b>\n━━━━━━━━━━━━━━━━━\nPlease select your request:',
    srv_waiter: '🙋 Call Waiter',
    srv_bill: '🧾 Bring Bill',
    srv_napkin: '🧻 Napkins / Wipes',
    srv_salt: '🧂 Salt / Pepper',
    srv_cutlery: '🍴 Cutlery',
    srv_water: '💧 Water',
    srv_cleaning: '🧹 Cleaning',
    serviceRequestSent: '✅ Your request ({type}) has been sent to staff.',
    paymentTitle: '🧾 <b>Payment Request ({tableName})</b>\n━━━━━━━━━━━━━━━━━\nTotal: <b>{total} GEL</b>\n\nPlease select payment method:',
    pay_cash: '💵 Cash',
    pay_card: '💳 Credit Card',
    paymentRequestSent: '✅ Payment request sent. Staff will attend to you shortly.',
    noActiveBill: 'No active bill found for this table. Place an order first.',
    invalidSession: '⚠️ Session expired or invalid. Please scan the QR code again.',
    btnNutrition: 'ℹ️ Details & Macros',
    btnViewOrder: '📋 View My Order',
    btnNewOrder: '➕ Add More Items',
    btnCancelOrder: '❌ Cancel Order',
    btnCallWaiterChange: '🔔 Call Waiter for Changes',
    orderViewTitle: '📋 <b>Order Status</b>',
    orderStatus_new: '⏳ Waiting in Queue',
    orderStatus_preparing: '👨‍🍳 Being Prepared',
    orderStatus_ready: '🍽️ Ready — Waiter Bringing It',
    orderStatus_delivered: '✅ Delivered',
    orderStatus_cancelled: '❌ Cancelled',
    orderCancelled: '✅ Your order has been cancelled. You can place a new order.',
    orderCancelError: '⚠️ This order can no longer be cancelled. Call a waiter for changes.',
    orderCancelWindowPassed: '⌛ Cancellation window has passed. Call a waiter for changes.'
  },
  ru: {
    welcome: '🍽️ <b>{branchName}</b>\n━━━━━━━━━━━━━━━━━\nДобро пожаловать! Бот заказа и сервиса для <b>{tableName}</b> активен.',
    selectLanguage: 'Пожалуйста, выберите язык:',
    mainMenu: '🍽️ <b>Главное меню ({tableName})</b>\n━━━━━━━━━━━━━━━━━\nВыберите действие:',
    btnMenu: '📖 Меню',
    btnCart: '🛒 Корзина ({count})',
    btnService: '🔔 Вызвать официанта',
    btnBill: '🧾 Счет / Оплата',
    btnBackMenu: '🔙 Главное меню',
    btnBackCats: '🔙 Категории',
    categories: '📂 <b>Категории меню</b>\n━━━━━━━━━━━━━━━━━\nПожалуйста, выберите категорию:',
    emptyCategory: 'В этой категории пока нет товаров.',
    categoryTitle: '📂 <b>{categoryName}</b>\n━━━━━━━━━━━━━━━━━\nВыберите товары, посмотрите детали и добавьте их в корзину:',
    addedToCart: 'Добавлено в корзину.',
    removedFromCart: 'Удалено из корзины.',
    cartTitle: '🛒 <b>Ваша корзина ({tableName})</b>\n━━━━━━━━━━━━━━━━━\n',
    cartEmpty: 'Ваша корзина пуста. Пожалуйста, выберите товары в меню.',
    cartItem: '• {qty} x {name} ({price} GEL)\n',
    cartTotal: '\nПодытог: {subtotal} GEL\nСервисный сбор (%{fee}): {serviceFee} GEL\n<b>Итого: {total} GEL</b>',
    btnConfirmOrder: '✅ Подтвердить заказ',
    btnClearCart: '🗑️ Очистить корзину',
    orderConfirmed: '🎉 <b>Заказ принят!</b>\n━━━━━━━━━━━━━━━━━\nВаш заказ отправлен на кухню.\n\n🔢 <b>Номер заказа:</b> #<code>{orderId}</code>\n⏳ <b>Статус:</b> Готовится',
    cartCleared: 'Ваша корзина очищена.',
    serviceTitle: '🔔 <b>Вызов официанта / Услуги</b>\n━━━━━━━━━━━━━━━━━\nПожалуйста, выберите ваш запрос:',
    srv_waiter: '🙋 Вызвать официанта',
    srv_bill: '🧾 Принести счет',
    srv_napkin: '🧻 Салфетки / Влажные салфетки',
    srv_salt: '🧂 Соль / Перец',
    srv_cutlery: '🍴 Столовые приборы',
    srv_water: '💧 Вода',
    srv_cleaning: '🧹 Уборка',
    serviceRequestSent: '✅ Ваш запрос ({type}) отправлен персоналу.',
    paymentTitle: '🧾 <b>Запрос оплаты ({tableName})</b>\n━━━━━━━━━━━━━━━━━\nИтого: <b>{total} GEL</b>\n\nВыберите способ оплаты:',
    pay_cash: '💵 Наличные',
    pay_card: '💳 Карта',
    paymentRequestSent: '✅ Запрос оплаты отправлен. Официант скоро подойдет.',
    noActiveBill: 'Нет активного счета для этого стола. Сначала сделайте заказ.',
    invalidSession: '⚠️ Сессия устарела. Пожалуйста, отсканируйте QR-код еще раз.',
    btnNutrition: 'ℹ️ Детали и калории',
    btnViewOrder: '📋 Мой заказ',
    btnNewOrder: '➕ Ещё заказать',
    btnCancelOrder: '❌ Отменить заказ',
    btnCallWaiterChange: '🔔 Вызвать официанта для изменений',
    orderViewTitle: '📋 <b>Статус заказа</b>',
    orderStatus_new: '⏳ В очереди',
    orderStatus_preparing: '👨‍🍳 Готовится',
    orderStatus_ready: '🍽️ Готов — официант несёт',
    orderStatus_delivered: '✅ Доставлен',
    orderStatus_cancelled: '❌ Отменён',
    orderCancelled: '✅ Ваш заказ отменён. Можете сделать новый.',
    orderCancelError: '⚠️ Заказ больше нельзя отменить. Вызовите официанта.',
    orderCancelWindowPassed: '⌛ Время отмены истекло. Вызовите официанта.'
  },
  ka: {
    welcome: '🍽️ <b>{branchName}</b>\n━━━━━━━━━━━━━━━━━\nმოგესალმებით! შეკვეთისა და სერვისის ბოტი მაგიდისთვის <b>{tableName}</b> აქტიურია.',
    selectLanguage: 'გთხოვთ აირჩიოთ სასურველი ენა:',
    mainMenu: '🍽️ <b>მთავარი მენიუ ({tableName})</b>\n━━━━━━━━━━━━━━━━━\nაირჩიეთ სასურველი მოქმედება:',
    btnMenu: '📖 მენიუს ნახვა',
    btnCart: '🛒 ჩემი კალათა ({count} ცალი)',
    btnService: '🔔 ოფიციანტის გამოძახება',
    btnBill: '🧾 ანგარიში / გადახდა',
    btnBackMenu: '🔙 მთავარი მენიუ',
    btnBackCats: '🔙 კატეგორიები',
    categories: '📂 <b>მენიუს კატეგორიები</b>\n━━━━━━━━━━━━━━━━━\nგთხოვთ აირჩიოთ კატეგორია:',
    emptyCategory: 'ამ კატეგორიაში პროდუქტები ჯერ არ არის.',
    categoryTitle: '📂 <b>{categoryName}</b>\n━━━━━━━━━━━━━━━━━\nიხილეთ პროდუქტები, დეტალები და დაამატეთ კალათაში:',
    addedToCart: 'დაემატა კალათაში.',
    removedFromCart: 'ამოიშალა კალათიდან.',
    cartTitle: '🛒 <b>თქვენი კალათა ({tableName})</b>\n━━━━━━━━━━━━━━━━━\n',
    cartEmpty: 'თქვენი კალათა ცარიელია. გთხოვთ აირჩიოთ პროდუქტები მენიუდან.',
    cartItem: '• {qty} x {name} ({price} GEL)\n',
    cartTotal: '\nჯამი: {subtotal} GEL\nმომსახურება (%{fee}): {serviceFee} GEL\n<b>სულ გადასახდელი: {total} GEL</b>',
    btnConfirmOrder: '✅ შეკვეთის დადასტურება',
    btnClearCart: '🗑️ კალათის გასუფთავება',
    orderConfirmed: '🎉 <b>შეკვეთა მიღებულია!</b>\n━━━━━━━━━━━━━━━━━\nთქვენი შეკვეთა გადაეგზავნა სამზარეულოს.\n\nშეკვეთის №: #<code>{orderId}</code>\n⏳ სტატუსი: მზადდება',
    cartCleared: 'კალათა გასუფთავდა.',
    serviceTitle: '🔔 <b>ოფიციანტის გამოძახება / სერვისები</b>\n━━━━━━━━━━━━━━━━━\nგთხოვთ აირჩიოთ მოთხოვნა:',
    srv_waiter: '🙋 ოფიციანტის გამოძახება',
    srv_bill: '🧾 ანგარიშის მოთხოვნა',
    srv_napkin: '🧻 ხელსახოცი / სველი ხელსახოცი',
    srv_salt: '🧂 მარილი / პილპილი',
    srv_cutlery: '🍴 დანა-ჩანგალი',
    srv_water: '💧 წყალი',
    srv_cleaning: '🧹 დასუფთავება',
    serviceRequestSent: '✅ თქვენი მოთხოვნა ({type}) გაგზავნილია.',
    paymentTitle: '🧾 <b>გადახდის მოთხოვნა ({tableName})</b>\n━━━━━━━━━━━━━━━━━\nჯამი: <b>{total} GEL</b>\n\nგთხოვთ აირჩიოთ გადახდის მეთოდი:',
    pay_cash: '💵 ნაღდი ანგარიშსწორება',
    pay_card: '💳 ბარათით',
    paymentRequestSent: '✅ გადახდის მოთხოვნა გაგზავნილია. ოფიციანტი მალე მოვა.',
    noActiveBill: 'მაგიდისთვის აქტიური ანგარიში ვერ მოიძებნა. ჯერ შეუკვეთეთ.',
    invalidSession: '⚠️ სესია გაუქმებულია. გთხოვთ თავიდან დაასკანეროთ QR კოდი.',
    btnNutrition: 'ℹ️ დეტალები და კალორიები',
    btnViewOrder: '📋 ჩემი შეკვეთა',
    btnNewOrder: '➕ კიდევ შეუკვეთე',
    btnCancelOrder: '❌ შეკვეთის გაუქმება',
    btnCallWaiterChange: '🔔 ოფიციანტის გამოძახება ცვლილებისთვის',
    orderViewTitle: '📋 <b>შეკვეთის სტატუსი</b>',
    orderStatus_new: '⏳ რიგში ელოდება',
    orderStatus_preparing: '👨‍🍳 მზადდება',
    orderStatus_ready: '🍽️ მზად — ოფიციანტი მოაქვს',
    orderStatus_delivered: '✅ ჩაბარდა',
    orderStatus_cancelled: '❌ გაუქმდა',
    orderCancelled: '✅ თქვენი შეკვეთა გაუქმდა. შეგიძლიათ ახალი გააკეთოთ.',
    orderCancelError: '⚠️ ამ შეკვეთის გაუქმება შეუძლებელია. ოფიციანტს დაუძახეთ.',
    orderCancelWindowPassed: '⌛ გაუქმების დრო გავიდა. ოფიციანტს დაუძახეთ.'
  }
}

const STAFF_REQUEST_LABELS: Record<string, { label: string; icon: string }> = {
  waiter: { label: 'Garson Çağır', icon: '🙋‍♂️' },
  bill: { label: 'Hesap İste', icon: '💵' },
  napkin: { label: 'Peçete İste', icon: '🧻' },
  water: { label: 'Su İste', icon: '💧' },
  salt: { label: 'Tuz/Karabiber İste', icon: '🧂' },
  cleaning: { label: 'Masayı Temizlet', icon: '🧹' }
}

function escapeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function getT(lang: string, key: string, params: Record<string, string | number> = {}): string {
  const dictionary = botTranslations[lang] || botTranslations.en
  let text = dictionary[key] || botTranslations.en[key] || key
  Object.entries(params).forEach(([k, v]) => {
    const escapedValue = typeof v === 'string' ? escapeHtml(v) : String(v)
    text = text.replace(new RegExp(`{${k}}`, 'g'), escapedValue)
  })
  return text
}

async function sendTelegramApi(token: string, method: string, body: any) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!response.ok) {
      console.error(`Telegram API ${method} error:`, await response.text())
    }
    return response
  } catch (error) {
    console.error(`Telegram fetch error:`, error)
  }
}

// Custom Helper: Updates both the photo and text of a Telegram message
async function sendOrEditPhotoMessage(
  token: string,
  chatId: number,
  photoUrl: string,
  caption: string,
  replyMarkup: any,
  messageId?: number
) {
  if (messageId) {
    try {
      // 1. Try editing the media (photo) and caption together
      const res = await fetch(`https://api.telegram.org/bot${token}/editMessageMedia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          media: {
            type: 'photo',
            media: photoUrl,
            caption: caption,
            parse_mode: 'HTML'
          },
          reply_markup: replyMarkup
        })
      })
      if (res.ok) return
      
      const errText = await res.text()
      console.error('editMessageMedia failed:', errText)
    } catch (e) {
      console.error('editMessageMedia failed, doing delete-and-send fallback:', e)
    }
  }

  // 2. Fallback: Send a new photo message first before deleting the old one
  try {
    const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'HTML',
        reply_markup: replyMarkup
      })
    })

    if (sendRes.ok) {
      // 3. Only delete the previous message if the new one was sent successfully
      if (messageId) {
        try {
          await fetch(`https://api.telegram.org/bot${token}/deleteMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, message_id: messageId })
          })
        } catch (e) {
          console.error('deleteMessage failed:', e)
        }
      }
    } else {
      const sendErrText = await sendRes.text()
      console.error('sendPhoto fallback failed:', sendErrText)
    }
  } catch (e) {
    console.error('sendPhoto fallback exception:', e)
  }
}

function getProductDetails(product: any, lang: string) {
  const name = product[`name_${lang}`] || product.name_en || product.name_tr || product.name_ka || 'Ürün'
  const desc = product[`description_${lang}`] || product.description_en || product.description_tr || product.description_ka || ''
  const ingredients = product[`ingredients_${lang}`] || product.ingredients_en || product.ingredients_tr || product.ingredients_ka || ''
  return { name, desc, ingredients }
}

function getCategoryName(category: any, lang: string) {
  return category[`name_${lang}`] || category.name_en || category.name_tr || category.name_ka || 'Kategori'
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 })
  }

  // Supabase Client Config
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Supabase credentials missing inside Telegram webhook handler')
    return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  try {
    const payload = await request.json()
    console.log('Telegram webhook payload:', JSON.stringify(payload, null, 2))

    // 1. HANDLE CALLBACK QUERIES
    if (payload.callback_query) {
      const callbackQuery = payload.callback_query
      const chatId = callbackQuery.message.chat.id
      const messageId = callbackQuery.message.message_id
      const dataStr = callbackQuery.data as string
      const callbackQueryId = callbackQuery.id

      // Load session and branch metadata
      const deviceId = `tg_${chatId}`
      const { data: session } = await supabase
        .from('table_sessions')
        .select(`
          *,
          tables (
            name,
            branches (
              id,
              name,
              currency,
              service_fee_percent,
              brands (
                logo_url
              )
            )
          )
        `)
        .eq('device_id', deviceId)
        .eq('is_active', true)
        .maybeSingle()

      if (!session) {
        await sendTelegramApi(token, 'answerCallbackQuery', {
          callback_query_id: callbackQueryId,
          text: 'Oturum bulunamadı. Lütfen QR kodu tekrar okutun.',
          show_alert: true
        })
        return NextResponse.json({ ok: true })
      }

      const lang = session.language || 'tr'
      const tableName = session.tables?.name || 'Masa'
      const branchName = session.tables?.branches?.name || 'Gusto Lounge'
      const branchId = session.tables?.branches?.id
      const currency = session.tables?.branches?.currency || 'GEL'
      const serviceFeePercent = session.tables?.branches?.service_fee_percent ? Number(session.tables.branches.service_fee_percent) : 0
      const logoUrl = (session.tables as any)?.branches?.brands?.logo_url || DEFAULT_COVER_PHOTO
      const cart = session.cart || {}

      // Split action and param
      const parts = dataStr.split(':')
      const action = parts[0]
      const param = parts.slice(1).join(':')

      let alertText = ''

      if (action === 'lang') {
        const selectedLang = param
        await supabase
          .from('table_sessions')
          .update({ language: selectedLang })
          .eq('id', session.id)

        alertText = selectedLang === 'tr' ? 'Türkçe Seçildi' : selectedLang === 'ka' ? 'ქართული არჩეულია' : selectedLang === 'ru' ? 'Выбран русский' : 'English Selected'
        await sendTelegramApi(token, 'answerCallbackQuery', { callback_query_id: callbackQueryId, text: alertText })
        
        await showMainMenu(token, chatId, tableName, branchName, selectedLang, logoUrl, messageId)
      } 
      else if (action === 'menu') {
        await sendTelegramApi(token, 'answerCallbackQuery', { callback_query_id: callbackQueryId })
        if (param === 'main') {
          await showMainMenu(token, chatId, tableName, branchName, lang, logoUrl, messageId)
        } else if (param === 'cats') {
          await showCategories(token, chatId, branchId, lang, logoUrl, messageId)
        } else if (param === 'cart') {
          await showCart(token, chatId, tableName, branchId, lang, cart, serviceFeePercent, currency, logoUrl, supabase, messageId)
        } else if (param === 'service') {
          await showServiceMenu(token, chatId, lang, logoUrl, messageId)
        } else if (param === 'payment') {
          await showPaymentMenu(token, chatId, tableName, branchId, lang, session.table_id, serviceFeePercent, currency, logoUrl, supabase, messageId)
        }
      } 
      else if (action === 'cat') {
        await sendTelegramApi(token, 'answerCallbackQuery', { callback_query_id: callbackQueryId })
        await showCategoryProducts(token, chatId, param, lang, cart, logoUrl, supabase, messageId)
      }
      else if (action === 'add' || action === 'rem') {
        const productId = param
        const { data: product } = await supabase
          .from('products')
          .select('id, category_id, base_price')
          .eq('id', productId)
          .single()

        if (product) {
          const currentQty = cart[productId] || 0
          if (action === 'add') {
            cart[productId] = currentQty + 1
            alertText = getT(lang, 'addedToCart')
          } else {
            if (currentQty > 1) {
              cart[productId] = currentQty - 1
            } else {
              delete cart[productId]
            }
            alertText = getT(lang, 'removedFromCart')
          }

          await supabase
            .from('table_sessions')
            .update({ cart })
            .eq('id', session.id)

          await sendTelegramApi(token, 'answerCallbackQuery', { callback_query_id: callbackQueryId, text: alertText })
          await showCategoryProducts(token, chatId, product.category_id, lang, cart, logoUrl, supabase, messageId)
        } else {
          await sendTelegramApi(token, 'answerCallbackQuery', { callback_query_id: callbackQueryId, text: 'Hata: Ürün bulunamadı.' })
        }
      } 
      else if (action === 'nut') {
        await sendTelegramApi(token, 'answerCallbackQuery', { callback_query_id: callbackQueryId })
        await showProductDetails(token, chatId, param, lang, cart, logoUrl, supabase, messageId)
      } 
      else if (action === 'cart' && param === 'clear') {
        await supabase
          .from('table_sessions')
          .update({ cart: {} })
          .eq('id', session.id)

        await sendTelegramApi(token, 'answerCallbackQuery', { callback_query_id: callbackQueryId, text: getT(lang, 'cartCleared') })
        await showCart(token, chatId, tableName, branchId, lang, {}, serviceFeePercent, currency, logoUrl, supabase, messageId)
      } 
      else if (action === 'order' && param === 'confirm') {
        if (Object.keys(cart).length === 0) {
          await sendTelegramApi(token, 'answerCallbackQuery', { callback_query_id: callbackQueryId, text: getT(lang, 'cartEmpty'), show_alert: true })
        } else {
          await sendTelegramApi(token, 'answerCallbackQuery', { callback_query_id: callbackQueryId })
          await handleConfirmOrder(token, chatId, session, cart, branchId, currency, serviceFeePercent, logoUrl, supabase, messageId)
        }
      }
      else if (action === 'order' && param.startsWith('view:')) {
        const orderId = param.replace('view:', '')
        await sendTelegramApi(token, 'answerCallbackQuery', { callback_query_id: callbackQueryId })
        await handleOrderView(token, chatId, orderId, lang, currency, logoUrl, supabase, messageId)
      }
      else if (action === 'order' && param.startsWith('cancel:')) {
        const orderId = param.replace('cancel:', '')
        await sendTelegramApi(token, 'answerCallbackQuery', { callback_query_id: callbackQueryId })
        await handleOrderCancel(token, chatId, orderId, lang, currency, logoUrl, supabase, messageId)
      }
      else if (action === 'srv') {
        const type = param
        await sendTelegramApi(token, 'answerCallbackQuery', { callback_query_id: callbackQueryId })
        await handleServiceRequest(token, chatId, session, type, lang, logoUrl, messageId)
      } 
      else if (action === 'pay') {
        const method = param
        await sendTelegramApi(token, 'answerCallbackQuery', { callback_query_id: callbackQueryId })
        await handlePaymentRequest(token, chatId, session, method, lang, serviceFeePercent, currency, logoUrl, supabase, messageId)
      }

      return NextResponse.json({ ok: true })
    }

    // 2. HANDLE STANDARD CHAT MESSAGES
    const message = payload.message
    if (!message || !message.text) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const text = message.text.trim()

    // Command: /start <tableToken>
    if (text.startsWith('/start ')) {
      const tableToken = text.substring('/start '.length).trim()

      const { data: tableData, error: tableError } = await supabase
        .from('tables')
        .select(`
          id,
          name,
          branch_id,
          branches (
            name,
            currency,
            service_fee_percent,
            languages,
            brands (
              logo_url
            )
          )
        `)
        .eq('qr_token', tableToken)
        .eq('is_active', true)
        .maybeSingle()

      if (tableError || !tableData) {
        await sendTelegramApi(token, 'sendMessage', {
          chat_id: chatId,
          text: '⚠️ <b>Geçersiz QR Kod!</b>\n\nOkuttuğunuz QR kod sistemimizde kayıtlı bir masaya ait değil veya pasif durumdadır. Lütfen masadaki kodu tekrar okutun.',
          parse_mode: 'HTML'
        })
        return NextResponse.json({ ok: true })
      }

      const branchName = (tableData.branches as any)?.name || 'Gusto Lounge'
      const tableName = tableData.name
      const logoUrl = (tableData.branches as any)?.brands?.logo_url || DEFAULT_COVER_PHOTO

      const deviceId = `tg_${chatId}`
      const { data: existingSession } = await supabase
        .from('table_sessions')
        .select('id, table_id')
        .eq('device_id', deviceId)
        .eq('is_active', true)
        .maybeSingle()

      let session = existingSession
      if (existingSession) {
        if (existingSession.table_id !== tableData.id) {
          const oldTableId = existingSession.table_id
          const { data: updatedSession } = await supabase
            .from('table_sessions')
            .update({
              table_id: tableData.id,
              branch_id: tableData.branch_id,
              last_active_at: new Date().toISOString()
            })
            .eq('id', existingSession.id)
            .select()
            .single()
          session = updatedSession || existingSession

          // Reset old table if no other sessions remain
          const { count } = await supabase
            .from('table_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('table_id', oldTableId)
            .eq('is_active', true)
          if (!count) {
            await supabase.from('tables').update({ status: 'empty' }).eq('id', oldTableId)
          }
        }
      } else {
        const { data: newSession } = await supabase
          .from('table_sessions')
          .insert({
            table_id: tableData.id,
            branch_id: tableData.branch_id,
            device_id: deviceId,
            customer_name: `${message.from?.first_name || ''} ${message.from?.last_name || ''}`.trim() || 'Telegram Customer',
            language: 'tr',
            cart: {}
          })
          .select()
          .single()
        session = newSession
      }

      // Mark Table Occupied
      await supabase
        .from('tables')
        .update({ status: 'occupied' })
        .eq('id', tableData.id)

      // Send greeting cover photo with language selection
      const welcomeText = getT('tr', 'welcome', { branchName, tableName }) + '\n\n' + getT('tr', 'selectLanguage')
      
      const inlineKeyboard = [
        [
          { text: '🇹🇷 Türkçe', callback_data: 'lang:tr' },
          { text: '🇬🇧 English', callback_data: 'lang:en' }
        ],
        [
          { text: '🇷🇺 Русский', callback_data: 'lang:ru' },
          { text: '🇬🇪 ქართული', callback_data: 'lang:ka' }
        ]
      ]

      await sendOrEditPhotoMessage(token, chatId, logoUrl, welcomeText, { inline_keyboard: inlineKeyboard })
    } else {
      // Plain text fallback - check if user has active session
      const deviceId = `tg_${chatId}`
      const { data: session } = await supabase
        .from('table_sessions')
        .select(`
          *,
          tables (
            name,
            branches (
              name,
              brands (
                logo_url
              )
            )
          )
        `)
        .eq('device_id', deviceId)
        .eq('is_active', true)
        .maybeSingle()

      if (session) {
        const lang = session.language || 'tr'
        const tableName = session.tables?.name || 'Masa'
        const branchName = session.tables?.branches?.name || 'Gusto Lounge'
        const logoUrl = (session.tables as any)?.branches?.brands?.logo_url || DEFAULT_COVER_PHOTO
        await showMainMenu(token, chatId, tableName, branchName, lang, logoUrl)
      } else {
        // Welcoming text
        await sendTelegramApi(token, 'sendMessage', {
          chat_id: chatId,
          text: '🍽️ <b>thecheckmenu</b>\n\nMenüyü açmak ve sipariş vermek için lütfen masanızda bulunan <b>QR Kodu</b> taratın veya size gönderilen bağlantıya tıklayın.',
          parse_mode: 'HTML'
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Webhook processing error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ----------------------------------------------------
// UI SCREEN RENDER HELPERS (EDIT PHOTO & CAPTIONS)
// ----------------------------------------------------

async function showMainMenu(
  token: string,
  chatId: number,
  tableName: string,
  branchName: string,
  lang: string,
  logoUrl: string,
  messageId?: number
) {
  const text = getT(lang, 'mainMenu', { tableName })
  const replyMarkup = {
    inline_keyboard: [
      [
        { text: getT(lang, 'btnMenu'), callback_data: 'menu:cats' },
        { text: getT(lang, 'btnCart', { count: 0 }).replace(' (0 adet)', '').replace(' (0 items)', '').replace(' (0)', '').replace(' (0 ცალი)', ''), callback_data: 'menu:cart' }
      ],
      [
        { text: getT(lang, 'btnService'), callback_data: 'menu:service' },
        { text: getT(lang, 'btnBill'), callback_data: 'menu:payment' }
      ]
    ]
  }

  await sendOrEditPhotoMessage(token, chatId, logoUrl, text, replyMarkup, messageId)
}

async function showCategories(
  token: string,
  chatId: number,
  branchId: string,
  lang: string,
  logoUrl: string,
  messageId: number
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('branch_id', branchId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const text = getT(lang, 'categories')
  const inlineKeyboard: any[] = []

  if (categories && categories.length > 0) {
    for (let i = 0; i < categories.length; i += 2) {
      const row: any[] = []
      row.push({
        text: getCategoryName(categories[i], lang),
        callback_data: `cat:${categories[i].id}`
      })
      if (i + 1 < categories.length) {
        row.push({
          text: getCategoryName(categories[i + 1], lang),
          callback_data: `cat:${categories[i + 1].id}`
        })
      }
      inlineKeyboard.push(row)
    }
  }

  inlineKeyboard.push([{ text: getT(lang, 'btnBackMenu'), callback_data: 'menu:main' }])

  await sendOrEditPhotoMessage(token, chatId, logoUrl, text, { inline_keyboard: inlineKeyboard }, messageId)
}

async function showCategoryProducts(
  token: string,
  chatId: number,
  categoryId: string,
  lang: string,
  cart: Record<string, number>,
  logoUrl: string,
  supabase: any,
  messageId: number
) {
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const categoryName = category ? getCategoryName(category, lang) : 'Menü'
  const cartTotal = Object.values(cart).reduce((a: number, b: number) => a + b, 0)
  const categoryPhoto = category?.photo_url || products?.find((p: any) => p.photo_url)?.photo_url || logoUrl

  let text = `📂 <b>${escapeHtml(categoryName)}</b>\n━━━━━━━━━━━━━━━━━\n\n`

  const inlineKeyboard: any[] = []

  if (products && products.length > 0) {
    products.forEach((prod: any, idx: number) => {
      const { name, desc } = getProductDetails(prod, lang)
      const price = Number(prod.base_price).toFixed(2)
      const qtyInCart = cart[prod.id] || 0

      if (idx > 0) text += `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n`
      text += `🍽 <b>${escapeHtml(name)}</b>\n`
      text += `💰 <b>${price} GEL</b>`
      if (qtyInCart > 0) text += `  🛒 <b>${qtyInCart} adet</b>`
      text += '\n'
      if (desc) text += `<i>${escapeHtml(desc)}</i>\n`
      text += '\n'

      const btnLabel = qtyInCart > 0 ? `${name}  🛒 ${qtyInCart}` : name
      inlineKeyboard.push([{ text: btnLabel, callback_data: `nut:${prod.id}` }])
    })
  } else {
    text += `<i>${getT(lang, 'emptyCategory')}</i>\n`
  }

  inlineKeyboard.push([
    { text: getT(lang, 'btnBackCats'), callback_data: 'menu:cats' },
    { text: getT(lang, 'btnCart', { count: cartTotal }), callback_data: 'menu:cart' },
  ])

  await sendOrEditPhotoMessage(token, chatId, categoryPhoto, text, { inline_keyboard: inlineKeyboard }, messageId)
}

async function showProductDetails(
  token: string,
  chatId: number,
  productId: string,
  lang: string,
  cart: Record<string, number>,
  logoUrl: string,
  supabase: any,
  messageId: number
) {
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (!product) return

  const { name, desc, ingredients } = getProductDetails(product, lang)
  const price = Number(product.base_price).toFixed(2)
  const calories = product.calories || 0
  const protein = product.protein_g || 0
  const carbs = product.carbs_g || 0
  const fat = product.fat_g || 0
  const allergens = (product.allergens || []).join(', ')
  const productPhoto = product.photo_url || logoUrl
  const qtyInCart = cart[product.id] || 0

  let text = `🍽 <b>${escapeHtml(name)}</b>\n━━━━━━━━━━━━━━━━━\n`
  text += `💰 <b>${price} GEL</b>\n\n`
  if (desc) text += `<i>${escapeHtml(desc)}</i>\n\n`
  if (ingredients) text += `📝 <b>İçindekiler:</b>\n${escapeHtml(ingredients)}\n\n`
  if (allergens) text += `⚠️ <b>Alerjenler:</b> ${escapeHtml(allergens)}\n\n`
  if (calories > 0) {
    text += `🔥 ${calories} kcal  •  Protein ${protein}g  •  Karbonhidrat ${carbs}g  •  Yağ ${fat}g\n`
  }
  if (qtyInCart > 0) text += `\n🛒 <b>Sepetinizde: ${qtyInCart} adet</b>`

  const cartRow = qtyInCart > 0
    ? [
        { text: '➖', callback_data: `rem:${product.id}` },
        { text: `🛒  ${qtyInCart} adet`, callback_data: `nut:${product.id}` },
        { text: '➕', callback_data: `add:${product.id}` },
      ]
    : [{ text: '🛒 Sepete Ekle', callback_data: `add:${product.id}` }]

  const inlineKeyboard = [
    cartRow,
    [{ text: `🔙 ${escapeHtml(getCategoryName({ id: product.category_id }, lang) || 'Kategori')}`, callback_data: `cat:${product.category_id}` }]
  ]

  await sendOrEditPhotoMessage(token, chatId, productPhoto, text, { inline_keyboard: inlineKeyboard }, messageId)
}

async function showCart(
  token: string,
  chatId: number,
  tableName: string,
  branchId: string,
  lang: string,
  cart: Record<string, number>,
  serviceFeePercent: number,
  currency: string,
  logoUrl: string,
  supabase: any,
  messageId: number
) {
  let text = getT(lang, 'cartTitle', { tableName })
  const inlineKeyboard: any[] = []
  const productIds = Object.keys(cart)

  if (productIds.length === 0) {
    text += `<i>${getT(lang, 'cartEmpty')}</i>`
    inlineKeyboard.push([{ text: getT(lang, 'btnMenu'), callback_data: 'menu:cats' }])
  } else {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)

    let subtotal = 0

    if (products) {
      products.forEach((prod: any) => {
        const qty = cart[prod.id] || 0
        const { name } = getProductDetails(prod, lang)
        const price = Number(prod.base_price)
        const itemTotal = price * qty
        subtotal += itemTotal

        text += getT(lang, 'cartItem', {
          qty,
          name,
          price: itemTotal.toFixed(2)
        })
      })
    }

    const serviceFee = subtotal * (serviceFeePercent / 100)
    const finalTotal = subtotal + serviceFee

    text += getT(lang, 'cartTotal', {
      subtotal: subtotal.toFixed(2),
      fee: serviceFeePercent,
      serviceFee: serviceFee.toFixed(2),
      total: finalTotal.toFixed(2)
    })

    inlineKeyboard.push([
      { text: getT(lang, 'btnConfirmOrder'), callback_data: 'order:confirm' }
    ])
    inlineKeyboard.push([
      { text: getT(lang, 'btnClearCart'), callback_data: 'cart:clear' }
    ])
    inlineKeyboard.push([
      { text: getT(lang, 'btnMenu'), callback_data: 'menu:cats' }
    ])
  }

  inlineKeyboard.push([{ text: getT(lang, 'btnBackMenu'), callback_data: 'menu:main' }])

  await sendOrEditPhotoMessage(token, chatId, logoUrl, text, { inline_keyboard: inlineKeyboard }, messageId)
}

async function handleConfirmOrder(
  token: string,
  chatId: number,
  session: any,
  cart: Record<string, number>,
  branchId: string,
  currency: string,
  serviceFeePercent: number,
  logoUrl: string,
  supabase: any,
  messageId: number
) {
  const billId = await getOrCreateBill(supabase, session.table_id, branchId)
  if (!billId) {
    await sendOrEditPhotoMessage(token, chatId, logoUrl, '⚠️ Adisyon oluşturulurken hata oluştu. Lütfen tekrar deneyin.', {
      inline_keyboard: [[{ text: '🔙 Sepete Dön', callback_data: 'menu:cart' }]]
    }, messageId)
    return
  }

  const productIds = Object.keys(cart)
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds)

  if (!products || products.length === 0) {
    return
  }

  const productMap = new Map<string, any>()
  products.forEach((p: any) => productMap.set(p.id, p))

  let orderTotal = 0
  const orderItemsInsert: any[] = []

  products.forEach((prod: any) => {
    const qty = cart[prod.id] || 0
    const price = Number(prod.base_price)
    const total = price * qty
    orderTotal += total

    orderItemsInsert.push({
      product_id: prod.id,
      quantity: qty,
      unit_price: price,
      total_price: total,
      status: 'pending'
    })
  })

  const cancelWindowEndsAt = new Date(Date.now() + 2 * 60 * 1000).toISOString()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      bill_id: billId,
      table_id: session.table_id,
      branch_id: branchId,
      session_id: session.id,
      status: 'new',
      total_amount: orderTotal,
      cancel_window_ends_at: cancelWindowEndsAt,
      customer_note: 'Telegram üzerinden sipariş edildi.'
    })
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('Error inserting order:', orderError)
    await sendOrEditPhotoMessage(token, chatId, logoUrl, '⚠️ Sipariş kaydedilemedi. Lütfen tekrar deneyin.', {
      inline_keyboard: [[{ text: '🔙 Sepete Dön', callback_data: 'menu:cart' }]]
    }, messageId)
    return
  }

  const itemsWithOrderId = orderItemsInsert.map(item => ({
    ...item,
    order_id: order.id
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsWithOrderId)

  if (itemsError) {
    console.error('Error inserting items:', itemsError)
    await supabase.from('orders').delete().eq('id', order.id)
    return
  }

  const { data: billOrders } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('bill_id', billId)
    .neq('status', 'cancelled')

  let billTotal = 0
  if (billOrders) {
    billOrders.forEach((o: any) => billTotal += Number(o.total_amount))
  }

  const serviceFee = billTotal * (serviceFeePercent / 100)
  const finalTotal = billTotal + serviceFee

  await supabase
    .from('bills')
    .update({
      total_amount: finalTotal,
      service_fee: serviceFee
    })
    .eq('id', billId)

  await supabase
    .from('table_sessions')
    .update({ cart: {} })
    .eq('id', session.id)

  const lang = session.language || 'tr'
  const branchName = session.tables?.branches?.name || 'Gusto Lounge'
  const tableName = session.tables?.name || 'Masa'
  const customerName = session.customer_name || 'Müşteri'
  const orderIdShort = order.id.slice(0, 8).toUpperCase()

  // Mutfak/garson bildirimi — kısa ve net
  let kitchenItemsHtml = ''
  products.forEach((prod: any) => {
    const qty = cart[prod.id] || 0
    kitchenItemsHtml += `  • ${qty}x ${prod.name_tr || prod.name_en || 'Ürün'} — ${(qty * Number(prod.base_price)).toFixed(2)} ${currency}\n`
  })

  const alertMessage = `🔔 <b>YENİ SİPARİŞ</b> — #${orderIdShort}
🎯 ${escapeHtml(tableName)} | 👤 ${escapeHtml(customerName)}
━━━━━━━━━━━━━━━━━
${kitchenItemsHtml}━━━━━━━━━━━━━━━━━
💰 Toplam: <b>${finalTotal.toFixed(2)} ${currency}</b>`

  const { sendTelegramNotification } = await import('@/lib/telegram')
  await sendTelegramNotification(alertMessage)

  // Müşteri onay mesajı — samimi ve detaylı
  let custItemsHtml = ''
  products.forEach((prod: any) => {
    const qty = cart[prod.id] || 0
    const name = prod[`name_${lang}`] || prod.name_tr || prod.name_en || 'Ürün'
    custItemsHtml += `• ${qty}x <b>${escapeHtml(name)}</b> — ${(qty * Number(prod.base_price)).toFixed(2)} ${currency}\n`
  })

  const custConfirmText =
lang === 'en'
  ? `✅ <b>Order received!</b>\n━━━━━━━━━━━━━━━━━\nOrder #<code>${orderIdShort}</code>\n\n${custItemsHtml}\n💰 <b>Total:</b> ${finalTotal.toFixed(2)} ${currency}\n━━━━━━━━━━━━━━━━━\nWe'll notify you when the kitchen starts preparing your order 🍳`
  : lang === 'ru'
  ? `✅ <b>Заказ принят!</b>\n━━━━━━━━━━━━━━━━━\nЗаказ #<code>${orderIdShort}</code>\n\n${custItemsHtml}\n💰 <b>Итого:</b> ${finalTotal.toFixed(2)} ${currency}\n━━━━━━━━━━━━━━━━━\nМы сообщим, когда кухня начнёт готовить 🍳`
  : lang === 'ka'
  ? `✅ <b>შეკვეთა მიღებულია!</b>\n━━━━━━━━━━━━━━━━━\nშეკვეთა #<code>${orderIdShort}</code>\n\n${custItemsHtml}\n💰 <b>სულ:</b> ${finalTotal.toFixed(2)} ${currency}\n━━━━━━━━━━━━━━━━━\nგაცნობებთ, როდესაც სამზარეულო მოამზადებს 🍳`
  : `✅ <b>Siparişiniz alındı!</b>\n━━━━━━━━━━━━━━━━━\nSipariş #<code>${orderIdShort}</code>\n\n${custItemsHtml}\n💰 <b>Toplam:</b> ${finalTotal.toFixed(2)} ${currency}\n━━━━━━━━━━━━━━━━━\nMutfağımız hazırlamaya başlayınca haber vereceğiz 🍳`

  await sendOrEditPhotoMessage(token, chatId, logoUrl, custConfirmText, {
    inline_keyboard: [
      [
        { text: getT(lang, 'btnViewOrder'), callback_data: `order:view:${order.id}` },
        { text: getT(lang, 'btnNewOrder'), callback_data: 'menu:cats' }
      ],
      [
        { text: getT(lang, 'btnService'), callback_data: 'menu:service' },
        { text: getT(lang, 'btnBackMenu'), callback_data: 'menu:main' }
      ]
    ]
  }, messageId)
}

async function handleOrderView(
  token: string,
  chatId: number,
  orderId: string,
  lang: string,
  currency: string,
  logoUrl: string,
  supabase: any,
  messageId: number
) {
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total_amount, cancel_window_ends_at, order_items(quantity, unit_price, products(name_tr, name_en, name_ru, name_ka))')
    .eq('id', orderId)
    .single()

  if (!order) {
    await sendOrEditPhotoMessage(token, chatId, logoUrl, '⚠️ Sipariş bulunamadı.', {
      inline_keyboard: [[{ text: getT(lang, 'btnBackMenu'), callback_data: 'menu:main' }]]
    }, messageId)
    return
  }

  const statusKey = `orderStatus_${order.status}` as string
  const statusLabel = getT(lang, statusKey) || order.status

  let itemsHtml = ''
  order.order_items?.forEach((item: any) => {
    const name = item.products?.[`name_${lang}`] || item.products?.name_tr || 'Ürün'
    const total = (Number(item.unit_price) * Number(item.quantity)).toFixed(2)
    itemsHtml += `• ${item.quantity}x <b>${escapeHtml(name)}</b> — ${total} ${currency}\n`
  })

  const title = getT(lang, 'orderViewTitle')
  const orderIdShort = orderId.slice(0, 8).toUpperCase()
  const text = `${title}\n━━━━━━━━━━━━━━━━━\n#<code>${orderIdShort}</code>  •  <b>${statusLabel}</b>\n\n${itemsHtml}\n💰 <b>${Number(order.total_amount).toFixed(2)} ${currency}</b>`

  const buttons: any[][] = []

  const now = new Date()
  const cancelWindow = order.cancel_window_ends_at ? new Date(order.cancel_window_ends_at) : null
  if (order.status === 'new' && cancelWindow && now < cancelWindow) {
    buttons.push([{ text: getT(lang, 'btnCancelOrder'), callback_data: `order:cancel:${orderId}` }])
  } else if (order.status === 'new' || order.status === 'preparing') {
    buttons.push([{ text: getT(lang, 'btnCallWaiterChange'), callback_data: 'menu:service' }])
  }

  buttons.push([
    { text: getT(lang, 'btnNewOrder'), callback_data: 'menu:cats' },
    { text: getT(lang, 'btnBackMenu'), callback_data: 'menu:main' }
  ])

  await sendOrEditPhotoMessage(token, chatId, logoUrl, text, { inline_keyboard: buttons }, messageId)
}

async function handleOrderCancel(
  token: string,
  chatId: number,
  orderId: string,
  lang: string,
  currency: string,
  logoUrl: string,
  supabase: any,
  messageId: number
) {
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total_amount, bill_id, cancel_window_ends_at')
    .eq('id', orderId)
    .single()

  if (!order || order.status !== 'new') {
    await sendOrEditPhotoMessage(token, chatId, logoUrl, getT(lang, 'orderCancelError'), {
      inline_keyboard: [
        [{ text: getT(lang, 'btnCallWaiterChange'), callback_data: 'menu:service' }],
        [{ text: getT(lang, 'btnBackMenu'), callback_data: 'menu:main' }]
      ]
    }, messageId)
    return
  }

  const now = new Date()
  const cancelWindow = order.cancel_window_ends_at ? new Date(order.cancel_window_ends_at) : null
  if (cancelWindow && now >= cancelWindow) {
    await sendOrEditPhotoMessage(token, chatId, logoUrl, getT(lang, 'orderCancelWindowPassed'), {
      inline_keyboard: [
        [{ text: getT(lang, 'btnCallWaiterChange'), callback_data: 'menu:service' }],
        [{ text: getT(lang, 'btnBackMenu'), callback_data: 'menu:main' }]
      ]
    }, messageId)
    return
  }

  await supabase.from('orders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', orderId)
  await supabase.from('order_items').update({ status: 'cancelled' }).eq('order_id', orderId)

  // Adisyon toplamını güncelle
  const { data: remainingOrders } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('bill_id', order.bill_id)
    .neq('status', 'cancelled')

  let newTotal = 0
  remainingOrders?.forEach((o: any) => { newTotal += Number(o.total_amount) })
  await supabase.from('bills').update({ total_amount: newTotal }).eq('id', order.bill_id)

  await sendOrEditPhotoMessage(token, chatId, logoUrl, getT(lang, 'orderCancelled'), {
    inline_keyboard: [
      [
        { text: getT(lang, 'btnNewOrder'), callback_data: 'menu:cats' },
        { text: getT(lang, 'btnBackMenu'), callback_data: 'menu:main' }
      ]
    ]
  }, messageId)
}

async function showServiceMenu(
  token: string,
  chatId: number,
  lang: string,
  logoUrl: string,
  messageId: number
) {
  const text = getT(lang, 'serviceTitle')
  const inlineKeyboard = [
    [
      { text: getT(lang, 'srv_waiter'), callback_data: 'srv:waiter' },
      { text: getT(lang, 'srv_bill'), callback_data: 'srv:bill' }
    ],
    [
      { text: getT(lang, 'srv_napkin'), callback_data: 'srv:napkin' },
      { text: getT(lang, 'srv_water'), callback_data: 'srv:water' }
    ],
    [
      { text: getT(lang, 'srv_cutlery'), callback_data: 'srv:cutlery' },
      { text: getT(lang, 'srv_cleaning'), callback_data: 'srv:cleaning' }
    ],
    [
      { text: getT(lang, 'btnBackMenu'), callback_data: 'menu:main' }
    ]
  ]

  await sendOrEditPhotoMessage(token, chatId, logoUrl, text, { inline_keyboard: inlineKeyboard }, messageId)
}

async function handleServiceRequest(
  token: string,
  chatId: number,
  session: any,
  type: string,
  lang: string,
  logoUrl: string,
  messageId: number
) {
  let priority = 'yellow'
  if (type === 'bill') {
    priority = 'red'
  } else if (type === 'napkin' || type === 'salt') {
    priority = 'blue'
  }

  const { data, error } = await supabaseCreateServiceRequest(supabaseClient(), {
    tableId: session.table_id,
    branchId: session.branch_id,
    sessionId: session.id,
    type,
    priority
  })

  if (error) {
    await sendOrEditPhotoMessage(token, chatId, logoUrl, '⚠️ Talebiniz iletilemedi. Lütfen tekrar deneyin.', {
      inline_keyboard: [[{ text: '🔙 Geri Dön', callback_data: 'menu:service' }]]
    }, messageId)
    return
  }

  const branchName = session.tables?.branches?.name || 'Gusto Lounge'
  const tableName = session.tables?.name || 'Masa'
  const customerName = session.customer_name || 'Müşteri'
  const reqInfo = STAFF_REQUEST_LABELS[type] || { label: type, icon: '🔔' }

  // Zone routing: masanın zone'una bak, varsa o zone'un telegram_chat_id'sine gönder
  let zoneChatId: string | undefined
  if (session.table_id) {
    const { data: tableRow } = await supabaseClient()
      .from('tables')
      .select('zone_id, zones(telegram_chat_id)')
      .eq('id', session.table_id)
      .maybeSingle()
    const zoneChat = (tableRow?.zones as any)?.telegram_chat_id
    if (zoneChat) zoneChatId = zoneChat
  }

  const alertMessage = `🚨 <b>Masa Talebi!</b>
━━━━━━━━━━━━━━━━━
🏢 <b>Şube:</b> ${escapeHtml(branchName)}
🎯 <b>Masa:</b> ${escapeHtml(tableName)}
👤 <b>Müşteri:</b> ${escapeHtml(customerName)}
━━━━━━━━━━━━━━━━━
🔔 <b>Talep:</b> ${reqInfo.icon} <b>${escapeHtml(reqInfo.label)}</b>`

  const { sendTelegramNotification } = await import('@/lib/telegram')
  await sendTelegramNotification(alertMessage, zoneChatId)

  const successText = getT(lang, 'serviceRequestSent', { type: reqInfo.label })

  await sendOrEditPhotoMessage(token, chatId, logoUrl, successText, {
    inline_keyboard: [[{ text: getT(lang, 'btnBackMenu'), callback_data: 'menu:main' }]]
  }, messageId)
}

async function showPaymentMenu(
  token: string,
  chatId: number,
  tableName: string,
  branchId: string,
  lang: string,
  tableId: string,
  serviceFeePercent: number,
  currency: string,
  logoUrl: string,
  supabase: any,
  messageId: number
) {
  const { data: bill } = await supabase
    .from('bills')
    .select('id, total_amount')
    .eq('table_id', tableId)
    .eq('status', 'open')
    .maybeSingle()

  if (!bill) {
    const text = getT(lang, 'noActiveBill')
    await sendOrEditPhotoMessage(token, chatId, logoUrl, text, {
      inline_keyboard: [[{ text: getT(lang, 'btnBackMenu'), callback_data: 'menu:main' }]]
    }, messageId)
    return
  }

  const text = getT(lang, 'paymentTitle', {
    tableName,
    total: Number(bill.total_amount).toFixed(2)
  })

  const inlineKeyboard = [
    [
      { text: getT(lang, 'pay_cash'), callback_data: 'pay:cash' },
      { text: getT(lang, 'pay_card'), callback_data: 'pay:card' }
    ],
    [
      { text: getT(lang, 'btnBackMenu'), callback_data: 'menu:main' }
    ]
  ]

  await sendOrEditPhotoMessage(token, chatId, logoUrl, text, { inline_keyboard: inlineKeyboard }, messageId)
}

async function handlePaymentRequest(
  token: string,
  chatId: number,
  session: any,
  method: string,
  lang: string,
  serviceFeePercent: number,
  currency: string,
  logoUrl: string,
  supabase: any,
  messageId: number
) {
  const { data: bill } = await supabase
    .from('bills')
    .select('id, total_amount')
    .eq('table_id', session.table_id)
    .eq('status', 'open')
    .maybeSingle()

  if (!bill) return

  const note = `Ödeme Yöntemi: ${method === 'cash' ? 'Nakit' : 'Kredi Kartı'}`
  const { error } = await supabase
    .from('service_requests')
    .insert({
      table_id: session.table_id,
      branch_id: session.branch_id,
      session_id: session.id,
      type: 'bill',
      priority: 'red',
      status: 'pending',
      assigned_to: null,
      notes: note
    })

  if (error) {
    console.error('Error inserting payment service request:', error)
    return
  }

  const branchName = session.tables?.branches?.name || 'Gusto Lounge'
  const tableName = session.tables?.name || 'Masa'
  const customerName = session.customer_name || 'Müşteri'

  const alertMessage = `💵 <b>HESAP ÖDEME TALEBİ (Telegram Chat)!</b>
━━━━━━━━━━━━━━━━━
🏢 <b>Şube:</b> ${escapeHtml(branchName)}
🎯 <b>Masa:</b> ${escapeHtml(tableName)}
👤 <b>Müşteri:</b> ${escapeHtml(customerName)} (Telegram Chat)
💳 <b>Ödeme:</b> ${method === 'cash' ? '💵 Nakit' : '💳 Kredi Kartı'}
💰 <b>Toplam Tutar:</b> <b>${Number(bill.total_amount).toFixed(2)} ${currency}</b>`

  const { sendTelegramNotification } = await import('@/lib/telegram')
  await sendTelegramNotification(alertMessage)

  const successText = getT(lang, 'paymentRequestSent')

  await sendOrEditPhotoMessage(token, chatId, logoUrl, successText, {
    inline_keyboard: [[{ text: getT(lang, 'btnBackMenu'), callback_data: 'menu:main' }]]
  }, messageId)
}

function supabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey)
}

async function supabaseCreateServiceRequest(supabase: any, params: any) {
  const { tableId, branchId, sessionId, type, priority } = params
  return supabase
    .from('service_requests')
    .insert({
      table_id: tableId,
      branch_id: branchId,
      session_id: sessionId,
      type,
      priority,
      status: 'pending'
    })
    .select('id')
    .single()
}
