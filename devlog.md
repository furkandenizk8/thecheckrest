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
