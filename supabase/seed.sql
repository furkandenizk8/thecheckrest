-- Verileri temizle (Önceki kalıntıları temizlemek için)
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE service_requests CASCADE;
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE bills CASCADE;
TRUNCATE TABLE table_sessions CASCADE;
TRUNCATE TABLE branch_product_settings CASCADE;
TRUNCATE TABLE product_options CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE tables CASCADE;
TRUNCATE TABLE user_roles CASCADE;
TRUNCATE TABLE branches CASCADE;
TRUNCATE TABLE brands CASCADE;

-- 1. MARKA EKLE
INSERT INTO brands (id, name, logo_url)
VALUES ('b1000000-0000-0000-0000-000000000000', 'Gusto Lounge', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200')
ON CONFLICT (id) DO NOTHING;

-- 2. ŞUBELERİ EKLE
-- Şube 1: Tbilisi Central (GEL para birimi, %10 servis ücreti)
INSERT INTO branches (id, brand_id, name, address, phone, currency, service_fee_percent, languages, is_open)
VALUES (
  'c1000000-0000-0000-0000-000000000000',
  'b1000000-0000-0000-0000-000000000000',
  'Gusto Tbilisi Central',
  'Rustaveli Ave 12, Tbilisi, Georgia',
  '+995 32 212 3456',
  'GEL',
  10.00,
  ARRAY['ka', 'tr', 'en', 'ru'],
  true
);

-- Şube 2: Batumi Boulevard (GEL para birimi, %12 servis ücreti)
INSERT INTO branches (id, brand_id, name, address, phone, currency, service_fee_percent, languages, is_open)
VALUES (
  'c2000000-0000-0000-0000-000000000000',
  'b1000000-0000-0000-0000-000000000000',
  'Gusto Batumi Boulevard',
  'Sherif Khimshiashvili St 7, Batumi, Georgia',
  '+995 422 22 3344',
  'GEL',
  12.00,
  ARRAY['ka', 'tr', 'en', 'ru'],
  true
);

-- 3. MASALARI EKLE
-- Tbilisi Central Masaları (Kolay erişim için sabit qr_token'lar tanımlayalım)
INSERT INTO tables (id, branch_id, name, capacity, status, qr_token, is_active) VALUES
('a0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000000', 'Masa 1', 4, 'empty', 'masa1', true),
('a0000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000000', 'Masa 2', 2, 'empty', 'masa2', true),
('a0000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000000', 'Masa 3', 6, 'empty', 'masa3', true),
('a0000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000000', 'VIP Loca 1', 8, 'empty', 'vip1', true);

-- Batumi Boulevard Masaları
INSERT INTO tables (id, branch_id, name, capacity, status, qr_token, is_active) VALUES
('a0000000-0000-0000-0000-000000000005', 'c2000000-0000-0000-0000-000000000000', 'Masa B1', 4, 'empty', 'masab1', true),
('a0000000-0000-0000-0000-000000000006', 'c2000000-0000-0000-0000-000000000000', 'Teras Masa 5', 2, 'empty', 'teras5', true);

-- 4. KATEGORİLERİ EKLE (Tbilisi Central)
-- Kategori 1: Başlangıçlar
INSERT INTO categories (id, branch_id, name_ka, name_tr, name_en, name_ru, sort_order) VALUES
('c0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000000', 'წასახემსებელი', 'Başlangıçlar', 'Appetizers', 'Закуски', 1);

-- Kategori 2: Ana Yemekler
INSERT INTO categories (id, branch_id, name_ka, name_tr, name_en, name_ru, sort_order) VALUES
('c0000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000000', 'მთავარი კერძები', 'Ana Yemekler', 'Main Dishes', 'Основные блюда', 2);

-- Kategori 3: Tatlılar
INSERT INTO categories (id, branch_id, name_ka, name_tr, name_en, name_ru, sort_order) VALUES
('c0000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000000', 'დესერტები', 'Tatlılar', 'Desserts', 'Десерты', 3);

-- Kategori 4: İçecekler
INSERT INTO categories (id, branch_id, name_ka, name_tr, name_en, name_ru, sort_order) VALUES
('c0000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000000', 'სასმელები', 'İçecekler', 'Drinks', 'Напитки', 4);

-- 5. ÜRÜNLERİ EKLE
-- Ürün 1: Haçapuri (Adjarian Khachapuri) - Ana Yemek
INSERT INTO products (
  id, brand_id, category_id,
  name_ka, name_tr, name_en, name_ru,
  description_ka, description_tr, description_en, description_ru,
  photo_url, base_price, prep_time_minutes, allergens, is_spicy, is_vegetarian, is_active, sort_order,
  calories, protein_g, carbs_g, fat_g,
  ingredients_tr, ingredients_en, ingredients_ru, ingredients_ka
) VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000000',
  'c0000000-0000-0000-0000-000000000002',
  'აჭარული ხაჭაპური', 'Acaristan Pidesi (Haçapuri)', 'Adjarian Khachapuri', 'Хачапури по-аджарски',
  'ტრადიციული ქართული ყველით, კარაქითა და კვერცხის გულით.', 'Geleneksel Gürcü peyniri, tereyağı ve yumurta sarısı içeren kayık pide.', 'Traditional boat-shaped bread filled with Georgian cheese, butter, and raw egg yolk.', 'Традиционная лодочка из теста с грузинским сыром, сливочным маслом и яичным желтком.',
  'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400',
  16.00, 20, ARRAY['gluten', 'dairy', 'egg'], false, true, true, 1,
  780, 28.0, 75.0, 42.0,
  'Gürcü peyniri, tereyağı, un, maya, yumurta', 'Georgian cheese, butter, flour, yeast, egg', 'Грузинский сыр, сливочное масло, мука, дрожжи, яйцо', 'ქართული ყველი, კარაქი, ფქვილი, საფუარი, კვერცხი'
);

-- Ürün 2: Hinkal (Georgian Khinkali) - Ana Yemek (Acılı)
INSERT INTO products (
  id, brand_id, category_id,
  name_ka, name_tr, name_en, name_ru,
  description_ka, description_tr, description_en, description_ru,
  photo_url, base_price, prep_time_minutes, allergens, is_spicy, is_vegetarian, is_active, sort_order,
  calories, protein_g, carbs_g, fat_g,
  ingredients_tr, ingredients_en, ingredients_ru, ingredients_ka
) VALUES (
  'e0000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000000',
  'c0000000-0000-0000-0000-000000000002',
  'ხინკალი (საქონლის ხორცით)', 'Gürcü Mantısı (Hinkal)', 'Georgian Khinkali (Beef)', 'Хинкали с говядиной',
  'წვნიანი ხორცით, მწვანილებითა და სანელებლებით (5 ცალი).', 'Baharatlı et suyu dolgulu, taze otlar içeren dev Gürcü mantısı (5 adet).', 'Traditional Georgian dumplings filled with juicy spiced beef and herbs (5 pcs).', 'Традиционные грузинские пельмени с сочной пряной говядиной и зеленью (5 шт).',
  'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400',
  12.50, 15, ARRAY['gluten'], true, false, true, 2,
  420, 22.0, 52.0, 15.0,
  'Dana kıyması, soğan, un, karabiber, kişniş, taze otlar', 'Minced beef, onion, flour, black pepper, coriander, fresh herbs', 'Говяжий фарш, лук, мука, черный перец, кориандр, свежая зелень', 'საქონლის ფარში, ხახვი, ფქვილი, შავი პილპილი, ქინძი, ახალი მწვანილი'
);

-- Ürün 3: Çupra Izgara (Grilled Sea Bream) - Ana Yemek
INSERT INTO products (
  id, brand_id, category_id,
  name_ka, name_tr, name_en, name_ru,
  description_ka, description_tr, description_en, description_ru,
  photo_url, base_price, prep_time_minutes, allergens, is_spicy, is_vegetarian, is_active, sort_order,
  calories, protein_g, carbs_g, fat_g,
  ingredients_tr, ingredients_en, ingredients_ru, ingredients_ka
) VALUES (
  'e0000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000000',
  'c0000000-0000-0000-0000-000000000002',
  'დორადო გრილზე', 'Izgara Çupra', 'Grilled Sea Bream', 'Дорадо на гриле',
  'ახალი მწვანილებით, ლიმონითა და კარტოფილის გარნირით.', 'Taze otlar, zeytinyağı, limon ve fırın patates eşliğinde ızgara çipura.', 'Grilled sea bream served with fresh herbs, lemon, and baby potatoes.', 'Дорадо на гриле с зеленью, лимоном и гарниром из молодого картофеля.',
  'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400',
  28.00, 25, ARRAY['fish'], false, false, true, 3,
  380, 34.0, 12.0, 18.0,
  'Taze çipura, zeytinyağı, bebek fırın patates, limon, taze otlar', 'Fresh sea bream, olive oil, baby potatoes, lemon, fresh herbs', 'Свежий дорадо, оливковое масло, молодой картофель, лимон, свежая зелень', 'ნედლი დორადო, ზეითუნის ზეთი, ბეიბი კარტოფილი, ლიმონი, ახალი მწვანილი'
);

-- Ürün 4: Patates Kızartması (French Fries) - Başlangıç
INSERT INTO products (
  id, brand_id, category_id,
  name_ka, name_tr, name_en, name_ru,
  description_ka, description_tr, description_en, description_ru,
  photo_url, base_price, prep_time_minutes, allergens, is_spicy, is_vegetarian, is_active, sort_order,
  calories, protein_g, carbs_g, fat_g,
  ingredients_tr, ingredients_en, ingredients_ru, ingredients_ka
) VALUES (
  'e0000000-0000-0000-0000-000000000004',
  'b1000000-0000-0000-0000-000000000000',
  'c0000000-0000-0000-0000-000000000001',
  'კარტოფილი ფრი', 'Patates Kızartması', 'French Fries', 'Картофель фри',
  'ხრაშუნა კარტოფილი კეტჩუპითა და მაიონეზით.', 'Çıtır patates dilimleri, özel baharatlı kaju sosu ve ketçap eşliğinde.', 'Crispy golden fries served with ketchup and mayonnaise.', 'Хрустящий золотистый картофель фри с кетчупом и майонезом.',
  'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
  7.00, 10, ARRAY[]::text[], false, true, true, 4,
  310, 3.5, 41.0, 14.0,
  'Taze patates, kızartma yağı, tuz', 'Potatoes, frying oil, salt', 'Картофель, масло для фритюра, соль', 'კარტოფილი, შესაწვავი ზეთი, მარილი'
);

-- Ürün 5: Sezar Salatası (Caesar Salad) - Başlangıç
INSERT INTO products (
  id, brand_id, category_id,
  name_ka, name_tr, name_en, name_ru,
  description_ka, description_tr, description_en, description_ru,
  photo_url, base_price, prep_time_minutes, allergens, is_spicy, is_vegetarian, is_active, sort_order,
  calories, protein_g, carbs_g, fat_g,
  ingredients_tr, ingredients_en, ingredients_ru, ingredients_ka
) VALUES (
  'e0000000-0000-0000-0000-000000000005',
  'b1000000-0000-0000-0000-000000000000',
  'c0000000-0000-0000-0000-000000000001',
  'ცეზარი ქათმით', 'Sezar Salatası (Tavuklu)', 'Caesar Salad (Chicken)', 'Салат Цезарь с курицей',
  'გრილზე მომზადებული ქათმის ფილე, კრუტონები, პარმეზანი და ცეზარ სოუსი.', 'Izgara tavuk göğsü, marul, kruton ekmekler, parmesan peyniri ve Sezar sosu.', 'Grilled chicken breast, crisp romaine lettuce, croutons, parmesan, and Caesar dressing.', 'Гриль-курица, листья ромэна, сухарики, пармезан и фирменный соус Цезарь.',
  'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400',
  14.00, 12, ARRAY['gluten', 'dairy'], false, false, true, 5,
  480, 26.0, 18.0, 32.0,
  'Izgara tavuk göğsü, marul, kruton ekmek, parmesan, sezar sosu', 'Grilled chicken breast, romaine lettuce, croutons, parmesan cheese, Caesar dressing', 'Куриное филе гриль, салат ромэн, сухарики, сыр пармезан, соус Цезарь', 'ქათმის ფილე გრილზე, სალათის ფურცლები, ორცხობილები, პარმეზანი, ცეზარ სოუსი'
);

-- Ürün 6: Tiramisu - Tatlı
INSERT INTO products (
  id, brand_id, category_id,
  name_ka, name_tr, name_en, name_ru,
  description_ka, description_tr, description_en, description_ru,
  photo_url, base_price, prep_time_minutes, allergens, is_spicy, is_vegetarian, is_active, sort_order,
  calories, protein_g, carbs_g, fat_g,
  ingredients_tr, ingredients_en, ingredients_ru, ingredients_ka
) VALUES (
  'e0000000-0000-0000-0000-000000000006',
  'b1000000-0000-0000-0000-000000000000',
  'c0000000-0000-0000-0000-000000000003',
  'ტირამისუ', 'Tiramisu', 'Tiramisu', 'Тирамису',
  'იტალიური დესერტი მასკარპონეს კრემითა და ესპრესოთი.', 'Espressoya batırılmış savoyer bisküvileri ve mascarpone peynirli orijinal kremalı İtalyan tatlısı.', 'Classic Italian dessert with layers of espresso-soaked ladyfingers and rich mascarpone cream.', 'Классический итальянский десерт с нежным кремом маскарпоне и кофейной пропиткой.',
  'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
  9.50, 5, ARRAY['gluten', 'dairy', 'egg'], false, true, true, 6,
  340, 6.0, 42.0, 18.0,
  'Mascarpone peyniri, savoyer bisküvi, espresso, şeker, yumurta, kakao', 'Mascarpone cheese, ladyfinger biscuits, espresso coffee, sugar, egg, cocoa', 'Сыр маскарпоне, печенье савоярди, кофе эспрессо, сахар, яйцо, какао', 'ყველი მასკარპონე, ორცხობილა სავოიარდი, ესპრესო, შაქარი, კვერცხი, კაკაო'
);

-- Ürün 7: Ev Yapımı Limonata (Homemade Lemonade) - İçecek
INSERT INTO products (
  id, brand_id, category_id,
  name_ka, name_tr, name_en, name_ru,
  description_ka, description_tr, description_en, description_ru,
  photo_url, base_price, prep_time_minutes, allergens, is_spicy, is_vegetarian, is_active, sort_order,
  calories, protein_g, carbs_g, fat_g,
  ingredients_tr, ingredients_en, ingredients_ru, ingredients_ka
) VALUES (
  'e0000000-0000-0000-0000-000000000007',
  'b1000000-0000-0000-0000-000000000000',
  'c0000000-0000-0000-0000-000000000004',
  'სახლში მომზადებული ლიმონათი', 'Ev Yapımı Limonata', 'Homemade Lemonade', 'Домашний лимонад',
  'ახალი ლიმონის წვენი, პიტნა და ყინული.', 'Taze sıkılmış limon suyu, nane yaprakları ve kırık buz içeren serinletici limonata.', 'Freshly squeezed lemon juice with fresh mint and ice.', 'Свежевыжатый лимонный сок с листьями мяты и льдом.',
  'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400',
  6.50, 5, ARRAY[]::text[], false, true, true, 7,
  120, 0.5, 28.0, 0.0,
  'Taze sıkılmış limon suyu, nane, şeker, su, buz', 'Freshly squeezed lemon juice, mint, sugar, water, ice', 'Свежевыжатый лимонный сок, мята, сахар, вода, лед', 'ნედლი ლიმონის წვენი, პიტნა, შაქარი, წყალი, ყინული'
);

-- Ürün 8: Türk Kahvesi (Turkish Coffee) - İçecek
INSERT INTO products (
  id, brand_id, category_id,
  name_ka, name_tr, name_en, name_ru,
  description_ka, description_tr, description_en, description_ru,
  photo_url, base_price, prep_time_minutes, allergens, is_spicy, is_vegetarian, is_active, sort_order,
  calories, protein_g, carbs_g, fat_g,
  ingredients_tr, ingredients_en, ingredients_ru, ingredients_ka
) VALUES (
  'e0000000-0000-0000-0000-000000000008',
  'b1000000-0000-0000-0000-000000000000',
  'c0000000-0000-0000-0000-000000000004',
  'თურქული ყავა', 'Türk Kahvesi', 'Turkish Coffee', 'Турецкий кофе',
  'ტრადიციული თურქული ყავა, მოთხოვნისამებრ şაქრით.', 'Geleneksel yöntemlerle cezvede pişirilmiş köz kokulu Türk kahvesi.', 'Traditional finely ground Turkish coffee brewed in a cezve.', 'Традиционный турецкий кофе, сваренный в джезве, подается со стаканом воды.',
  'https://images.unsplash.com/photo-1579888944880-d98341148733?w=400',
  5.00, 7, ARRAY[]::text[], false, true, true, 8,
  5, 0.1, 0.5, 0.0,
  'İnce çekilmiş Türk kahvesi çekirdeği, su', 'Finely ground Turkish coffee beans, water', 'Мелко помолотый турецкий кофе, вода', 'წვრილად დაფქული თურქული ყავა, წყალი'
);

-- 6. ŞUBEYE ÖZEL FİYAT / STOK AYARLARI (İsteğe bağlı test)
-- Tbilisi Central'da Tiramisu fiyatı 10.50 GEL olsun (Custom override)
INSERT INTO branch_product_settings (branch_id, product_id, custom_price, is_active, stock_count)
VALUES (
  'c1000000-0000-0000-0000-000000000000', 
  'e0000000-0000-0000-0000-000000000006', 
  10.50, 
  true, 
  15 -- Stok sınırı 15 adet
)
ON CONFLICT (branch_id, product_id) DO NOTHING;
