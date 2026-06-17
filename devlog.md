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
