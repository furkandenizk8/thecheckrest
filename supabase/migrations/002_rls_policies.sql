-- 1. MENÜ VE MASA BİLGİLERİ (Public Read)
-- Herkes markaları, şubeleri, masaları, kategorileri ve ürünleri okuyabilir.
CREATE POLICY "Allow public read access to brands" ON brands FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access to branches" ON branches FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access to tables" ON tables FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access to categories" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access to products" ON products FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access to branch_product_settings" ON branch_product_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public read access to product_options" ON product_options FOR SELECT TO anon USING (true);

-- 2. MASA OTURUMLARI (table_sessions)
-- Herkes oturum açabilir, okuyabilir ve güncelleyebilir (aktif/pasif).
CREATE POLICY "Allow public insert to table_sessions" ON table_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public select to table_sessions" ON table_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public update to table_sessions" ON table_sessions FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 3. ADİSYONLAR (bills)
-- Müşteriler adisyon açabilir, görebilir ve güncelleyebilir (tutar güncellemesi vb.).
CREATE POLICY "Allow public insert to bills" ON bills FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public select to bills" ON bills FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public update to bills" ON bills FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 4. SİPARİŞLER (orders)
-- Müşteriler sipariş verebilir, kendi siparişlerini görebilir ve güncelleyebilir.
CREATE POLICY "Allow public insert to orders" ON orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public select to orders" ON orders FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public update to orders" ON orders FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 5. SİPARİŞ KALEMLERİ (order_items)
-- Müşteriler sipariş kalemleri ekleyebilir ve görebilir.
CREATE POLICY "Allow public insert to order_items" ON order_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public select to order_items" ON order_items FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public update to order_items" ON order_items FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 6. SERVİS İSTEKLERİ (service_requests)
-- Müşteriler istek oluşturabilir ve görebilir.
CREATE POLICY "Allow public insert to service_requests" ON service_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public select to service_requests" ON service_requests FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public update to service_requests" ON service_requests FOR UPDATE TO anon USING (true) WITH CHECK (true);
