import { SupabaseClient } from '@supabase/supabase-js'

export interface MenuProduct {
  id: string
  name: string
  description: string
  photo_url: string | null
  price: number
  prep_time_minutes: number
  allergens: string[]
  is_spicy: boolean
  is_vegetarian: boolean
  is_active: boolean
  stock_count: number | null
  category_id: string
}

export interface MenuCategory {
  id: string
  name: string
  sort_order: number
}

/**
 * Şubeye ait aktif menü kategorilerini ve ürünlerini çeker.
 * Ürün fiyatlarını ve stok durumlarını şube bazlı ayarlarla (branch_product_settings) birleştirir.
 */
export async function fetchBranchMenu(
  supabase: SupabaseClient,
  branchId: string,
  language: string
): Promise<{ categories: MenuCategory[]; products: MenuProduct[] }> {
  // 1. Kategorileri çek
  const { data: dbCategories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('branch_id', branchId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (catError) {
    console.error('Error fetching categories:', catError)
    return { categories: [], products: [] }
  }

  // 2. Şubenin ait olduğu markayı (brand_id) bulmak için şubeyi çek
  const { data: branchData, error: branchError } = await supabase
    .from('branches')
    .select('brand_id')
    .eq('id', branchId)
    .single()

  if (branchError || !branchData) {
    console.error('Error fetching branch brand:', branchError)
    return { categories: [], products: [] }
  }

  const brandId = branchData.brand_id

  // 3. Markaya ait tüm aktif ürünleri çek
  const { data: dbProducts, error: prodError } = await supabase
    .from('products')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)

  if (prodError || !dbProducts) {
    console.error('Error fetching products:', prodError)
    return { categories: [], products: [] }
  }

  // 4. Şubeye özel ürün ayarlarını çek (fiyat, stok, aktiflik overrides)
  const { data: branchSettings, error: settingsError } = await supabase
    .from('branch_product_settings')
    .select('*')
    .eq('branch_id', branchId)

  if (settingsError) {
    console.error('Error fetching branch product settings:', settingsError)
  }

  // Şube ayarlarını map haline getir
  const settingsMap = new Map<string, any>()
  if (branchSettings) {
    branchSettings.forEach((setting) => {
      settingsMap.set(setting.product_id, setting)
    })
  }

  // 5. Ürünleri ve şube ayarlarını birleştir, seçilen dile göre isim/açıklama seç
  const products: MenuProduct[] = dbProducts
    .map((prod) => {
      const settings = settingsMap.get(prod.id)
      
      // Şubeye özel aktiflik ayarı (varsayılan: true)
      const isBranchActive = settings ? settings.is_active : true
      // Şubeye özel fiyat varsa onu kullan, yoksa ürünün taban fiyatını (base_price) kullan
      const price = settings && settings.custom_price !== null 
        ? Number(settings.custom_price) 
        : Number(prod.base_price)
      // Şubeye özel stok durumu
      const stock_count = settings ? settings.stock_count : null

      // Seçilen dile göre isim ve açıklama seçimi (tr, en, ru, ka)
      let name = prod.name_tr || prod.name_en || prod.name_ka || ''
      let description = prod.description_tr || prod.description_en || prod.description_ka || ''

      if (language === 'en') {
        name = prod.name_en || prod.name_tr || prod.name_ka || ''
        description = prod.description_en || prod.description_tr || prod.description_ka || ''
      } else if (language === 'ru') {
        name = prod.name_ru || prod.name_en || prod.name_tr || ''
        description = prod.description_ru || prod.description_en || prod.description_tr || ''
      } else if (language === 'ka') {
        name = prod.name_ka || prod.name_en || prod.name_tr || ''
        description = prod.description_ka || prod.description_en || prod.description_tr || ''
      }

      return {
        id: prod.id,
        name,
        description,
        photo_url: prod.photo_url,
        price,
        prep_time_minutes: prod.prep_time_minutes || 15,
        allergens: prod.allergens || [],
        is_spicy: prod.is_spicy || false,
        is_vegetarian: prod.is_vegetarian || false,
        is_active: isBranchActive && prod.is_active,
        stock_count,
        category_id: prod.category_id
      }
    })
    // Sadece aktif ve stokta olan veya (stok count null/pozitif) olan ürünleri filtrele
    .filter((p) => p.is_active)

  // 6. Kategorilerin isimlerini de dile göre seç
  const categories: MenuCategory[] = dbCategories.map((cat) => {
    let name = cat.name_tr || cat.name_en || cat.name_ka || ''
    if (language === 'en') {
      name = cat.name_en || cat.name_tr || cat.name_ka || ''
    } else if (language === 'ru') {
      name = cat.name_ru || cat.name_en || cat.name_tr || ''
    } else if (language === 'ka') {
      name = cat.name_ka || cat.name_en || cat.name_tr || ''
    }
    return {
      id: cat.id,
      name,
      sort_order: cat.sort_order || 0
    }
  })

  return { categories, products }
}
