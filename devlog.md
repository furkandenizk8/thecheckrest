## 2026-06-18 — Oturum 10: Bug Fix + Telegram Garson İşlemleri + Memnuniyet Anketi

### Yapılanlar
- **lib/telegram.ts** — `sendTelegramMessageWithButtons(message, replyMarkup, chatId)` yeni fonksiyon: inline keyboard ile mesaj gönderme, message_id döner
- **webhook/route.ts — srvack/srvdone handler**: Zone kanalındaki "👀 Gördüm" ve "✅ Tamamlandı" butonları artık session lookup olmadan işleniyor — garsonlar web'e girmeden Telegram'dan talepleri tamamlayabilir
- **webhook/route.ts — survey handler**: Ödeme sonrası müşteriye 1-5 ⭐ anket gelir; 4-5 ise Google Yorum linki (`GOOGLE_REVIEWS_URL` env var) gösterilir; session deaktif olduğu için oturuma gerek yok
- **webhook/route.ts — handleServiceRequest**: Zone bildirimleri artık "👀 Gördüm" + "✅ Tamamlandı" butonlarıyla — `srvack:{id}` ve `srvdone:{id}` callback
- **webhook/route.ts — handlePaymentRequest**: `notes` kolonu olmadığı için insert sessizce başarısız oluyordu — `type` alanını `bill_cash`/`bill_card` olarak değiştirdik, `notes` kaldırıldı; hata mesajı kullanıcıya gösteriliyor
- **webhook/route.ts — ikram:yes**: Doğrudan kayıt yerine kaç kişilik çay sorusu: 1-5 butonlu sayı seçici → `ikram:count:{n}` → N adet ikram_cay kaydı → zone bildirimi + butonlar
- **admin.ts — payBillAction**: Ödeme tamamlanınca masanın tüm siparişleri `delivered` yapılıyor (mutfak ekranı temizleniyor)
- **admin.ts — payBillAction**: Ödeme sonrası Telegram müşterilerine memnuniyet anketi gönderiliyor
- **UnifiedDashboard.tsx**: `bill_cash` → "Hesap — 💵 Nakit", `bill_card` → "Hesap — 💳 Kart/POS", `ikram_cay` → "☕ Çay İkramı" label'ları eklendi

### Proje Durumu
- [x] Garson isteklerini Telegram'dan tamamlama (srvack/srvdone)
- [x] Ödeme butonu sessiz hata düzeltildi (bill_cash/bill_card type)
- [x] Çay miktarı sorma (1-5 picker)
- [x] Mutfak ekranı ödeme sonrası temizleniyor
- [x] Memnuniyet anketi + Google Yorum yönlendirmesi
- [ ] `GOOGLE_REVIEWS_URL` env var'ı Vercel'e eklenmeli
- [ ] Supabase migrations 005-008 Dashboard'dan uygulanmalı

### Kritik Kararlar / Notlar
- `service_requests.notes` kolonu schema'da yok → `type: 'bill_cash'|'bill_card'` ile ödeme yöntemi encode edildi, migration gerekmedi
- Telegram callback_data max 64 byte — Google URL callback'e sığmaz; env var ile okunuyor
- `survey:`, `srvack:`, `srvdone:` callback'leri session lookup ÖNCE işleniyor (session deaktif/group chat fark etmiyor)

### Nerede Kaldık
Tüm buglar düzeltildi, garson Telegram akışı ve memnuniyet anketi eklendi. TS hataları yok.

### Sıradaki Adım
1. **Vercel env → `GOOGLE_REVIEWS_URL` = restoranın Google Maps yorum linki**
2. **Supabase Dashboard → SQL Editor → 005-008 migration'larını uygula**
3. Admin → Bölgeler → zone'ları oluştur, Telegram Chat ID'leri gir
4. Test: garson talebi → Telegram'da "Gördüm" → "Tamamlandı" → web'de güncellendiğini doğrula
5. Test: ödeme → müşteriye anket → 5 yıldız → Google link geliyor mu

---

## 2026-06-18 — Oturum 9: Zone Tam Entegrasyon + Telegram Bildirim Tamamlama + showTableOrders

### Yapılanlar
- **webhook/route.ts** — Tüm bildirimler zone routing'e bağlandı:
  - `/start <token>` QR scan → zone'a "🙋 Masa X — Yeni müşteri geldi 👤 Ad"
  - `handleConfirmOrder` → zone'a yeni sipariş bildirimi
  - `updateOrderStatusAction 'preparing'` → zone'a "👨‍🍳 Hazırlanıyor" bildirimi
  - `updateOrderStatusAction 'ready'` → zone'a "✅ Sipariş hazır" bildirimi
  - `handleServiceRequest` → zone'a talep bildirimi + garson görmediyse "🔔 Tekrar" butonu (60s cooldown)
  - `handlePaymentRequest` → zone'a kalemli adisyon + ödeme yöntemi ("POS getiriniz" kart için)
  - `payBillAction` → zone'a "🧹 Temizlik yapılsın" bildirimi
- **webhook/route.ts** — Çay ikramı akışı:
  - `menu:payment` → artık doğrudan `showPaymentMenu` yerine `showTeaQuestion` çağırıyor
  - `showTeaQuestion`: "☕ Çay ikramı ister misiniz?" (4 dilde) + Evet/Hayır butonları
  - `ikram:yes` → `service_requests` tablosuna `type: 'ikram_cay'` insert, zone'a bildirim, `showPaymentMenu`
  - `ikram:no` → doğrudan `showPaymentMenu`
- **webhook/route.ts** — `showPaymentMenu` güncellendi: sipariş kalemleri (ürün adı × adet = tutar) + toplam gösteriyor
- **webhook/route.ts** — `showTableOrders` yeni fonksiyon eklendi:
  - Masa'nın tüm aktif (cancelled/delivered değil) siparişlerini sorgular
  - Ürün bazında toplar (5x Adjaruli + 2x Lemonade şeklinde)
  - Açık adisyon toplamını bills tablosundan çeker
  - 4 dil desteği (tr/en/ka/ru)
  - Geri + Sipariş Ekle + Hesap butonları
- **Ana menü**: "📋 Masa Adisyonu" butonu eklendi → `menu:tableorders` callback → `showTableOrders`
- **UnifiedDashboard**: Masa Haritası zone gruplandırması eklendi
- **UnifiedDashboard**: `resendServiceRequestNotificationAction` import + 60s cooldown "🔔 Tekrar" butonu service request kartlarında
- **resendServiceRequestNotificationAction** admin.ts'e eklendi: requestId → tablo → zone → `🔁 TEKRAR: Masa Talebi!`

### Proje Durumu
- [x] Migration 008_zones.sql — hazır
- [x] Zone CRUD (admin.ts)
- [x] ZoneManagement bileşeni (4 dil + oto çeviri)
- [x] ManagementPanel Bölgeler sekmesi
- [x] TableConfig masa formunda bölge seçici + zone gruplandırma görünümü
- [x] Masa Haritası (UnifiedDashboard) zone gruplandırması
- [x] TÜM bildirimler zone routing'e bağlandı (QR scan, sipariş, mutfak, ödeme, temizlik)
- [x] Garson bildirimi "🔔 Tekrar" butonu (60s cooldown)
- [x] Çay ikramı akışı (ikram_cay service_request tracking)
- [x] Kalemli adisyon (showPaymentMenu + handlePaymentRequest)
- [x] showTableOrders — 4 kişi aynı masada toplu sipariş görünümü
- [ ] Supabase migrations 005-008 Dashboard'dan uygulanmalı

### Kritik Kararlar / Notlar
- `showTableOrders`: `orders.order_items.products` join + ürün bazında `itemMap` ile birleştirme — kişi bazında değil ürün bazında toplama tercih edildi (UX açısından daha temiz)
- `ikram_cay` için migration yok — `service_requests.type` text alanı, mevcut schema destekler
- `menu:showpay` yeni callback: çay sorusu bypass ederek doğrudan ödeme menüsüne gitmeyi daha sonra eklemek için (şu an kullanılmıyor)

### Nerede Kaldık
Webhook'taki TypeScript hatası (`showTableOrders` bulunamıyor) çözüldü. Tüm Telegram akışları (zone routing, çay ikramı, kalemli adisyon, toplu masa görünümü) kodlandı.

### Sıradaki Adım
1. **Supabase Dashboard → SQL Editor → 005-008 migration'larını uygula**
2. Admin panel → Bölgeler → "Bahçe", "İç Salon" vs. ekle, Telegram Chat ID `-1004350117567` gir
3. Masa Ayarları → Her masaya bölge ata
4. Telegram test: müşteri QR → zone bildirim, sipariş → zone bildirim, ödeme → kalemli adisyon
5. Çay ikramı test: ödeme butonuna bas → çay sorusu → "Evet" → service_requests'te `ikram_cay` kayıt

---

## 2026-06-18 — Oturum 8: Bölge (Zone) Sistemi — Garson Bildirim Yönlendirmesi

### Yapılanlar
- **Migration 008_zones.sql**: `zones` tablosu oluşturuldu (branch_id FK, name_tr/en/ka/ru, telegram_chat_id, is_active, sort_order) + `tables.zone_id` FK kolonu eklendi
- **admin.ts Zone CRUD**: `fetchZonesAction`, `createZoneAction`, `updateZoneAction`, `deleteZoneAction` eklendi
- **admin.ts Table actions güncellendi**: `createTableAction` ve `updateTableAction` artık `zone_id` parametresi kabul ediyor
- **ZoneManagement.tsx**: Yeni bileşen — 4 dil (TR/EN/KA/RU) + `/api/translate` ile oto çeviri + Telegram Chat ID alanı + aktif/pasif toggle + sıra numarası
- **ManagementPanel.tsx**: "Bölgeler" sekmesi eklendi (Layers ikonu → MapPin, ZoneManagement bileşeni render)
- **TableConfig.tsx**: Masa ekleme/düzenleme formuna bölge dropdown'u eklendi; masa kartında bölge adı amber MapPin ile görünüyor; zones state ve `fetchZonesAction` ile paralel yükleme
- **webhook/route.ts handleServiceRequest**: Garson bildirimi artık masa→zone→telegram_chat_id routing ile — masanın zone'una bak, zone'un telegram_chat_id'si varsa oraya gönder, yoksa global fallback

### Proje Durumu
- [x] Migration 008_zones.sql — hazır (Supabase'e manuel uygulanmalı)
- [x] Zone CRUD (admin.ts)
- [x] ZoneManagement bileşeni (4 dil + oto çeviri)
- [x] ManagementPanel Bölgeler sekmesi
- [x] TableConfig masa formunda bölge seçici
- [x] Garson bildirimi zone routing (webhook)
- [ ] Migration 005-008 Supabase Dashboard'dan uygulanmalı
- [ ] Zone oluştur → masalara ata → test et

### Kritik Kararlar / Notlar
- Zone routing: `handleServiceRequest` → `tables.select('zone_id, zones(telegram_chat_id)')` → `sendTelegramNotification(msg, zoneChatId)` — `sendTelegramNotification` zaten `targetChatId?` parametresi destekliyordu
- Bölgeler şubeye bağlı: `branch_id FK` ile her şubenin kendi bölgeleri var
- Fallback: zone veya zone.telegram_chat_id yoksa bildirim env'deki global `TELEGRAM_CHAT_ID`'ye gider

### Nerede Kaldık
Zone sistemi kodlaması tamamlandı ve push edildi. Migration 008'in Supabase Dashboard'dan uygulanması bekleniyor.

### Sıradaki Adım
1. **Supabase Dashboard → SQL Editor → 005, 006, 007, 008 migration'larını sırayla uygula**
2. Admin panel → Bölgeler → İç Salon, Bahçe, 1. Kat gibi bölgeler ekle + Telegram Chat ID'lerini gir
3. Masa Ayarları → Her masaya bölge ata
4. Test: müşteri masadan garson çağır → doğru bölgenin Telegram'ına gittiğini doğrula
5. Devam edilecekler: kasiyerin zone görünümü, bölge bazlı sipariş filtreleme

---

## 2026-06-18 — Oturum 7: UnifiedDashboard Birim Filtresi

### Yapılanlar
- **UnifiedDashboard**: `data.stations: any[]` alanı state'e eklendi
- **UnifiedDashboard**: `selectedStationId` state eklendi (default `'all'`)
- **Kitchen tab birim filtresi**: Stations listesi varsa tab üstünde renk pill'leri gösteriyor — "Tümü (N)", "Mutfak (N)", "Bar (N)" şeklinde
- **Kitchen orders filtreleme**: Seçili birime göre siparişler filtreleniyor — `order_items[].products.categories.station_id` üzerinden
- **Sipariş kartı birim badge'i**: Her siparişin hangi birim(ler)e ait olduğunu renkli rozet ile gösteriyor
- **Boş durum mesajı**: "Aktif Sipariş Yok" vs "Bu Birimde Sipariş Yok" — duruma göre farklı mesaj
- **Supabase MCP bağlantısı araştırıldı**: thecheckmenu projesi (`hlzjnryoqpfotmjqfpzv`) mevcut MCP hesabında yok, migration'lar elle uygulanmalı

### Proje Durumu
- [x] Migration 005_stations.sql (IF NOT EXISTS ile düzeltildi) — henüz uygulanmadı
- [x] Migration 006_photo_urls.sql — henüz uygulanmadı
- [x] Migration 007_storage_bucket.sql — henüz uygulanmadı
- [x] StationManagement bileşeni — zaten hazırdı
- [x] ManagementPanel'de Birimler sekmesi — zaten hazırdı
- [x] UnifiedDashboard kitchen tab birim filtresi
- [x] MenuManagement kategori formunda station seçici — zaten hazırdı
- [ ] customer.ts: birime göre Telegram yönlendirme (her birime kendi Telegram chat'ine bildirim)

### Kritik Kararlar / Notlar
- Kitchen IIFE pattern: `{activeTab === 'kitchen' && (() => { const kitchenOrders = ...; return (...) })()}`  — filtre hesabını tek yerde tutar, JSX içinde temiz
- Sipariş içindeki birim bilgisi: `order_items[].products.categories.stations` join'inden geliyor — migration uygulanmadan önce bu alan null gelir, uygulandıktan sonra otomatik çalışır
- Stations yoksa (migration uygulanmamış veya hiç birim eklenmemişse) filtre şeridi hiç görünmüyor

### Nerede Kaldık
`UnifiedDashboard.tsx` kitchen tab tamam. Sıradaki kritik adım 3 migration'ı Supabase Dashboard → SQL Editor'dan uygulamak — bunlar uygulanmadan foto upload ve birim filtreleme çalışmaz.

### Sıradaki Adım
1. Supabase Dashboard → SQL Editor → 005, 006, 007 migration'larını sırayla uygula
2. Dashboard → Storage → `menu-photos` bucket var mı kontrol et
3. Admin panel → Yönetim → Birimler → Mutfak, Bar gibi birimler ekle
4. Kategori formlarında birim seçimi yap
5. customer.ts birime göre Telegram yönlendirme (her birim kendi Telegram'ına)

---

## 2026-06-17 — Oturum 6: Fotoğraf Yükleme (Upload + Canvas Sıkıştırma)

### Yapılanlar
- **Migration 007_storage_bucket.sql**: `menu-photos` adında public Supabase Storage bucket oluşturuyor — public read + service role all policy
- **`/api/upload-photo` route**: Auth kontrolü → dosya tipi/boyut doğrulama → service client ile Supabase Storage'a yükle → public URL döndür
- **`ImageUpload` bileşeni** (`src/components/admin/ImageUpload.tsx`):
  - Tıkla veya dosya sürükle-bırak
  - Canvas API ile client-side sıkıştırma: max 900px, JPEG %82 kalite, en-boy oranı korunur
  - Yükleme sırasında "900KB → 120KB" şeklinde boyut bilgisi gösteriyor
  - Önizleme: hover'da "Değiştir" ve "Sil" butonları çıkıyor
  - Altında fotoğraf rehberi: format, çözünürlük, çekim ipuçları
- **MenuManagement ProductModal** ve **CategoryModal**: URL alanları kaldırıldı, `ImageUpload` bileşeni eklendi

### Önemli Not
Çalışması için Supabase dashboard'dan 3 migration uygulanmalı:
1. `005_stations.sql`
2. `006_photo_urls.sql`
3. `007_storage_bucket.sql`

### Sıradaki Adım
1. Supabase Dashboard → Storage → `menu-photos` bucket oluştur (ya da SQL Editor'dan 007 migration)
2. Tüm migration'ları uygula (005, 006, 007)
3. Admin panelde bir ürüne fotoğraf yükle, test et
4. Mutfak sekmesinde birim filtresi

---

## 2026-06-17 — Oturum 5: Foto İşlemleri (Ürün + Kategori Fotoğrafı)

### Yapılanlar
- **Migration 006_photo_urls.sql**: `categories.photo_url TEXT` eklendi (products'ta zaten vardı), `supabase/migrations/006_photo_urls.sql` oluşturuldu — Supabase dashboard'dan uygulanması lazım
- **admin.ts**: `createCategoryAction`, `updateCategoryAction`, `createProductAction`, `updateProductAction` — hepsine `photo_url?: string | null` parametresi eklendi
- **MenuManagement ProductModal**: `photo_url` form alanı eklendi — URL girişi + canlı önizleme (16x16 thumbnail), payload'a da eklendi
- **MenuManagement CategoryModal**: aynısı kategori için — photo_url alanı + önizleme
- **MenuManagement ürün kartları**: Her kartta 14x14 foto thumbnail gösteriyor, foto yoksa Image ikonu
- **MenuCategory interface**: `photo_url?: string | null` alanı eklendi (`src/lib/restaurant/menu.ts`)
- **fetchBranchMenu**: Kategori map'inde `photo_url` aktar edildi
- **CustomerMenuView**: Kategori başlığında foto varsa 10x10 yuvarlak köşeli thumbnail, yoksa eski amber çizgi gösteriyor

### Nerede Kaldık
Foto sistemi tamamlandı. Migration uygulandıktan sonra admin panelden URL yapıştırınca fotoğraf hem admin hem müşteri menüsünde görünecek.

### Sıradaki Adım
1. **Supabase dashboard → SQL Editor → 006_photo_urls.sql uygula** (hem 005 hem 006 henüz uygulanmadıysa ikisini de)
2. Admin panelden ürün/kategori eklerken resim URL'si gir, test et
3. Mutfak sekmesinde birim filtresi
4. per-station Telegram yönlendirme

---

## 2026-06-17 — Oturum 4: Telegram Yeniden Tasarım + Müşteri Bildirimleri + Dokunmatik Optimizasyon

### Yapılanlar
- **Admin panel realtime fallback**: UnifiedDashboard'a 15 saniyelik polling eklendi (realtime yanında yedek olarak çalışır)
- **Müşteri Telegram bildirimleri**: Mutfak "Aldım" (preparing) dediğinde müşteriye "hazırlanıyor", "Hazır" dediğinde "hazır" mesajı gidiyor — `updateOrderStatusAction` ve `updateOrderItemStatusAction` her ikisinde de
- **Telegram onay mesajı yeniden tasarlandı**: Eski kurumsal "YENİ SİPARİŞ (Telegram Chat)!" yerine müşteriye samimi, sipariş detaylı onay mesajı + 4 buton (Siparişimi Gör / Yeni Sipariş / Garson Çağır / Ana Menü)
- **Mutfak bildirimi kısaltıldı**: Gereksiz bilgiler çıkarıldı, kısa ve net format
- **Sipariş görüntüleme (order:view)**: Müşteri siparişini görebilir — durum etiketi, kalemler, toplam; eğer henüz 'new' ve 2dk iptal penceresi varsa "İptal Et" butonu, mutfaktaysa "Garson Çağır"
- **Sipariş iptali (order:cancel)**: 2 dakikalık iptal penceresi içinde müşteri siparişi iptal edebilir, adisyon toplamı yeniden hesaplanır
- **cancel_window_ends_at**: Telegram üzerinden verilen siparişlerde de 2dk iptal penceresi eklendi
- **Web menü dokunmatik optimizasyon**: Kategori butonları daha büyük (py-2.5 text-sm), ürün kartları daha büyük (w-24 h-24 foto, p-4), +/- butonları geniş (p-2 w-4 h-4), "Ekle" butonu büyük (px-4 py-2.5 text-sm), servis butonları büyük (p-5 min-h-[90px]), sipariş gönder py-5 text-base
- **Web menü görsel iyileştirme**: Kategori başlıklarında amber dikey çizgi, hover'da kart kenarlığı amber rengi, ürün adı daha büyük (text-[15px]), fiyat daha belirgin (text-base font-black text-amber-400)

### Proje Durumu
- [x] Realtime + 15s polling fallback
- [x] Müşteri Telegram bildirimleri (hazırlanıyor/hazır)
- [x] Samimi Telegram sipariş onayı + aksiyonlar
- [x] Sipariş görüntüleme/iptal (Telegram)
- [x] Dokunmatik tablet/telefon optimizasyonu
- [x] Web menü görsel iyileştirme
- [ ] Supabase migration 005_stations.sql (henüz uygulanmadı)
- [ ] Ürün ve kategori fotoğraf yükleme (admin panelde URL alanı yok henüz)
- [ ] Mutfak sekmesinde birim filtresi

### Kritik Kararlar / Notlar
- Telegram iptal penceresi: sipariş 'new' iken VE `cancel_window_ends_at` süresindeyse iptal edilebilir
- Müşteri chatId'si `device_id = 'tg_{chatId}'` formatından çekiliyor
- Hem `updateOrderStatusAction` hem `updateOrderItemStatusAction` müşteriye bildirim gönderiyor (auto-ready durumu için)

### Nerede Kaldık
Tüm 7 sorun ele alındı. Telegram tamamen yeniden tasarlandı, web menü dokunmatik optimizasyonu tamamlandı.

### Sıradaki Adım
1. Supabase dashboard → SQL Editor → 005_stations.sql uygula
2. MenuManagement → ProductModal'a photo_url alanı ekle (ürünlere fotoğraf girebilsin)
3. Kategori fotoğrafı için categories tablosuna photo_url migration yaz
4. Mutfak sekmesinde birim (station) filtre tab'ları
5. per-station Telegram yönlendirme (customer.ts)

---

## 2026-06-17 — Oturum 3: ManagementPanel + Masa Silme/Sıfırlama + Telegram Bug Fix

### Yapılanlar
- **ManagementPanel**: Tek birleşik yönetim sayfası — sol sidebar nav (Menü / Masalar / Birimler), sağda içerik; `/panel/management` giriş noktası, diğer sayfalar oraya redirect ediyor
- **embedded prop**: MenuManagement, TableConfig, StationManagement bileşenlerine `embedded` prop eklendi; ManagementPanel içinde header gizleniyor
- **Masa silme**: `deleteTableAction` eklendi, her masa kartında hover'da çöp ikonu
- **Masa aktif/pasif**: Masa kartında doğrudan toggle butonu
- **Masa sıfırlama**: TableConfig'teki occupied/dirty masalarda hızlı RotateCcw ikonu ile sıfırlama butonu
- **Telegram bug fix**: `/start <token>` ile session başka masaya taşınırken eski masa otomatik 'empty' yapılmıyor — oturumu taşırken artık eski masayı da sıfırlıyor (başka aktif session yoksa)
- **UnifiedDashboard sidebar**: Üç ayrı yönetim linki yerine tek "Yönetim" → `/panel/management`

### Nerede Kaldık
ManagementPanel birleşik yapı tamamlandı. Telegram masa stuck sorunu düzeltildi.

### Sıradaki Adım
1. Supabase migration 005_stations.sql uygulanmalı
2. customer.ts per-station Telegram yönlendirmesi
3. Mutfak sekmesinde birim filtre tab'ları

---

## 2026-06-17 — Oturum 2: Optimistic Updates + Birim (Station) Sistemi

### Yapılanlar
- **Optimistic updates**: Tüm butonlar (Aldım/Hazır, Gördüm/Tamamlandı, item Başla/Hazır) artık anında state günceller, server action arka planda çalışır — buton gecikmesi tamamen ortadan kalktı
- **Birim (Station) CRUD**: `fetchStationsAction`, `createStationAction`, `updateStationAction`, `deleteStationAction` admin.ts'e eklendi
- **StationManagement bileşeni**: Tam CRUD arayüzü — birim ekle/düzenle/sil/pasif et, renk seçici, Telegram Chat ID alanı, sıra numarası
- **/panel/stations sayfası**: Yeni sidebar linki + sayfa oluşturuldu
- **Kategori → Birim bağlantısı**: MenuManagement'taki kategori formuna "Birim (Hazırlayan)" seçici eklendi
- **createCategoryAction / updateCategoryAction**: `station_id` parametresi eklendi
- **Sidebar "Birimler" linki**: UnifiedDashboard'da Layers ikonu ile `/panel/stations` bağlantısı eklendi

### Proje Durumu
- [x] Order flow (Aldım/Hazır/Auto-deliver)
- [x] Supabase realtime (polling kaldırıldı)
- [x] Ses bildirimi (Web Audio API)
- [x] Optimistic updates (buton gecikmesi yok)
- [x] Menü yönetimi (/panel/management)
- [x] Masa ayarları (/panel/table-config)
- [x] Garson istekleri 2-adım akışı (Gördüm→Tamamlandı)
- [x] Otomatik dil çevirme (MyMemory API)
- [x] Station CRUD + StationManagement UI
- [x] Migration dosyası hazır (005_stations.sql) — DB'ye manuel uygulanması lazım
- [ ] Migration DB'ye uygulanmadı → stations şu an çalışmıyor
- [ ] customer.ts: birime göre Telegram yönlendirme
- [ ] Mutfak sekmesinde birim filtresi (tab'lar)

### Kritik Kararlar / Notlar
- Stations migration (005_stations.sql) Supabase dashboard SQL Editor'dan manuel uygulanmalı
- Birim sistemi tamamlandıktan sonra customer.ts'de siparişler birime göre Telegram'a yönlendirilecek
- Rol tabanlı filtreleme yok, herkes her birimi görüyor

### Nerede Kaldık
StationManagement tamamlandı, MenuManagement'a birim seçici eklendi. Migrations henüz uygulanmadı. customer.ts'de per-station Telegram yönlendirme henüz yapılmadı.

### Sıradaki Adım
1. Supabase dashboard → SQL Editor → `supabase/migrations/005_stations.sql` içeriğini yapıştır ve çalıştır
2. Birim ekranında birkaç birim oluştur (Mutfak, Bar vb.) ve kategori formlarından birimlere ata
3. customer.ts'e per-station Telegram yönlendirme ekle (sipariş gelince her birim kendi telegram_chat_id'ye bildirim alır)
4. Mutfak sekmesine birim filtresi (tab'lar) ekle

---

## 2026-06-17 — Oturum 1: Order Flow + Realtime + Menü & Masa Yönetimi

### Yapılanlar
- **Order flow yenilendi**: Mutfak panelinde "Tümünü Hazırlamaya Başla" → "👨‍🍳 Aldım — Hazırlanıyor", "Tümünü Hazırla" → "🍽 Hazır — Garsona Bildir" olarak yeniden adlandırıldı
- **Garsona Telegram bildirimi**: Mutfak "Hazır" dediğinde garson Telegram'a otomatik bildirim alıyor
- **Auto-delivered**: `ready` durumundaki siparişler 3 dakika sonra otomatik olarak `delivered` oluyor (kasiyer ödemeyi kapatınca da tüm siparişler teslim sayılıyor)
- **Item cascade**: Sipariş status değişince alt kalemler de otomatik güncelleniyor (`preparing` → pending kalemler, `ready` → hazırlanıyor olanlar, `delivered` → hepsi)
- **"Teslim Et" butonu kaldırıldı**: Artık garsonun ekstra tıklamasına gerek yok
- **Admin paneli realtime**: 5 saniyelik polling kaldırıldı, Supabase realtime subscriptions eklendi (orders, order_items, service_requests, bills, tables)
- **Ses bildirimi**: Web Audio API ile mutfak/garson panelinde yeni sipariş ve servis isteği gelince ses çalıyor
- **Menü yönetim paneli** (`/panel/management`): Kategori ekle/düzenle, ürün ekle/düzenle/toggle, şubeye özel fiyat ve stok ayarı
- **Masa ayarları paneli** (`/panel/table-config`): Masa ekle/düzenle, QR kod görüntüle/indir
- **Sidebar'a linkler eklendi**: "Menü Yönetimi" ve "Masa Ayarları" nav linklerini eklendi
- TypeScript hata yok

### Değiştirilen/Oluşturulan Dosyalar
- `src/app/actions/admin.ts` — sendTelegramNotification import, autoDeliverReadyOrders helper, updateOrderStatusAction güncellendi, fetchUnifiedDashboardData auto-deliver çağrısı, yeni CRUD actions
- `src/components/admin/UnifiedDashboard.tsx` — Tam yeniden yazıldı (realtime, ses, buton isimleri)
- `src/components/admin/MenuManagement.tsx` — Yeni bileşen
- `src/components/admin/TableConfig.tsx` — Yeni bileşen
- `src/app/panel/management/page.tsx` — Yeni sayfa
- `src/app/panel/table-config/page.tsx` — Yeni sayfa

### Proje Durumu
- [x] Müşteri sipariş akışı
- [x] Order flow (Aldım → Hazır → auto-delivered)
- [x] Garsona Telegram bildirimi (sipariş hazır)
- [x] Admin realtime (Supabase)
- [x] Ses bildirimi
- [x] Menü yönetim paneli
- [x] Masa ayarları + QR üretme
- [ ] Analitik / satış raporları
- [ ] Stok takibi otomasyonu
- [ ] Baskı/termal yazıcı entegrasyonu

### Kritik Kararlar / Notlar
- "Teslim Et" butonu eklenmedi — kullanıcıyla tartışıldı, restoran ortamında pratik değil
- Auto-delivered: 3 dakika sonra otomatik, kasiyer adisyon kapatınca tüm ready siparişler de delivered oluyor
- Menü yönetiminde ürün ismi TR zorunlu, diğer diller boş bırakılırsa TR değeri kopyalanıyor
- Realtime için Supabase'in `postgres_changes` kullanıldı; order_items'da branch filtresi yok (branch olmadığı için) — küçük sistemde sorun çıkarmaz

### Nerede Kaldık
Tüm planlanan özellikler tamamlandı. TypeScript hatasız. Dev sunucusunda test edilmedi (kullanıcı tarafında yapılacak).

### Sıradaki Adım
1. Dev sunucusunu çalıştırıp order flow'u test et
2. Menü yönetiminde ilk kategori ve ürünleri ekle
3. Masa ekle ve QR kodları oluştur
4. Supabase realtime'ın çalıştığını doğrula (RLS politikaları realtime'a da izin vermeli)
5. İleride: analitik/satış raporu, baskı entegrasyonu
