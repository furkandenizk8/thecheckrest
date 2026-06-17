'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  fetchBranchesAction,
  fetchCategoriesAction,
  fetchProductsAction,
  fetchStationsAction,
  createCategoryAction,
  updateCategoryAction,
  createProductAction,
  updateProductAction,
} from '@/app/actions/admin'
import {
  ChefHat,
  Plus,
  Edit2,
  X,
  Check,
  MapPin,
  ArrowLeft,
  Tag,
  Flame,
  Leaf,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Languages,
} from 'lucide-react'

async function autoTranslate(text: string): Promise<{ en: string; ka: string; ru: string } | null> {
  if (!text.trim()) return null
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string
  name_tr: string
  name_en: string
  sort_order: number
  is_active: boolean
  station_id?: string | null
}

interface Product {
  id: string
  name_tr: string
  name_en: string
  description_tr: string
  base_price: number
  category_id: string
  prep_time_minutes: number
  is_vegetarian: boolean
  is_spicy: boolean
  allergens: string[]
  is_active: boolean
  sort_order: number
  categories: { id: string; name_tr: string } | null
  branch_settings: { custom_price: number | null; is_active: boolean; stock_count: number | null } | null
}

// ─── Product Form Modal ────────────────────────────────────────────────────────

function ProductModal({
  product,
  categories,
  branchId,
  onClose,
  onSaved,
}: {
  product: Product | null
  categories: Category[]
  branchId: string
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!product
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name_tr:          product?.name_tr ?? '',
    name_en:          product?.name_en ?? '',
    name_ka:          '',
    name_ru:          '',
    description_tr:   product?.description_tr ?? '',
    base_price:       product?.base_price?.toString() ?? '',
    category_id:      product?.category_id ?? (categories[0]?.id ?? ''),
    prep_time_minutes: product?.prep_time_minutes?.toString() ?? '15',
    is_vegetarian:    product?.is_vegetarian ?? false,
    is_spicy:         product?.is_spicy ?? false,
    allergens:        product?.allergens?.join(', ') ?? '',
    is_active:        product?.is_active ?? true,
    custom_price:     product?.branch_settings?.custom_price?.toString() ?? '',
    stock_count:      product?.branch_settings?.stock_count?.toString() ?? '',
    branch_active:    product?.branch_settings?.is_active ?? true,
  })

  const set = (key: keyof typeof form, value: any) => setForm(f => ({ ...f, [key]: value }))

  const handleTranslate = async () => {
    if (!form.name_tr.trim()) { setError('Önce Türkçe adı girin.'); return }
    setError('')
    setTranslating(true)
    const result = await autoTranslate(form.name_tr)
    if (result) {
      setForm(f => ({ ...f, name_en: result.en, name_ka: result.ka, name_ru: result.ru }))
    }
    // Also translate description if filled
    if (form.description_tr.trim()) {
      const descResult = await autoTranslate(form.description_tr)
      // descriptions stored only in TR for now, no extra fields needed
      void descResult
    }
    setTranslating(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name_tr.trim()) { setError('Ürün adı zorunlu.'); return }
    if (!form.base_price || isNaN(Number(form.base_price))) { setError('Geçerli bir fiyat girin.'); return }
    if (!form.category_id) { setError('Kategori seçin.'); return }

    setSaving(true)
    try {
      const payload = {
        name_tr:          form.name_tr,
        name_en:          form.name_en || form.name_tr,
        name_ka:          form.name_ka || form.name_tr,
        name_ru:          form.name_ru || form.name_tr,
        description_tr:   form.description_tr,
        base_price:       Number(form.base_price),
        category_id:      form.category_id,
        prep_time_minutes: Number(form.prep_time_minutes) || 15,
        is_vegetarian:    form.is_vegetarian,
        is_spicy:         form.is_spicy,
        allergens:        form.allergens ? form.allergens.split(',').map(a => a.trim()).filter(Boolean) : [],
        is_active:        form.is_active,
        custom_price:     form.custom_price ? Number(form.custom_price) : null,
        stock_count:      form.stock_count ? Number(form.stock_count) : null,
        branch_active:    form.branch_active,
      }

      let res: any
      if (isEdit && product) {
        res = await updateProductAction(product.id, branchId, payload)
      } else {
        res = await createProductAction(branchId, payload)
      }

      if (!res.success) { setError(res.error || 'Bir hata oluştu.'); return }
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-zinc-900">
          <h3 className="text-sm font-bold text-zinc-100">{isEdit ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Name + Auto-Translate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Ürün Adı (TR) *</label>
                <button
                  type="button"
                  onClick={handleTranslate}
                  disabled={translating || !form.name_tr.trim()}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-bold transition"
                >
                  {translating
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Languages className="w-3 h-3" />}
                  {translating ? 'Çevriliyor...' : 'Otomatik Çevir'}
                </button>
              </div>
              <input value={form.name_tr} onChange={e => set('name_tr', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition"
                placeholder="Örn: Khachapuri" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Ad (EN)</label>
              <input value={form.name_en} onChange={e => set('name_en', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition"
                placeholder="Auto-filled" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Ad (KA)</label>
              <input value={form.name_ka} onChange={e => set('name_ka', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition"
                placeholder="ავტო-შევსება" />
            </div>
          </div>

          {/* RU name (hidden below, auto-filled) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Ad (RU)</label>
            <input value={form.name_ru} onChange={e => set('name_ru', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition"
              placeholder="Авто-заполнение" />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Açıklama</label>
            <textarea value={form.description_tr} onChange={e => set('description_tr', e.target.value)}
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition resize-none"
              placeholder="Kısa ürün açıklaması..." />
          </div>

          {/* Category + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Kategori *</label>
              <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name_tr}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Fiyat (GEL) *</label>
              <input type="number" step="0.01" value={form.base_price} onChange={e => set('base_price', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition"
                placeholder="0.00" />
            </div>
          </div>

          {/* Branch price override + stock */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
            <div className="col-span-2 text-[9px] font-black text-zinc-500 uppercase">Bu Şubeye Özel</div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Şube Fiyatı</label>
              <input type="number" step="0.01" value={form.custom_price} onChange={e => set('custom_price', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition"
                placeholder="Boş = base fiyat" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Stok Adedi</label>
              <input type="number" value={form.stock_count} onChange={e => set('stock_count', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition"
                placeholder="Boş = sınırsız" />
            </div>
          </div>

          {/* Prep time */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Hazırlık Süresi (dk)</label>
            <input type="number" value={form.prep_time_minutes} onChange={e => set('prep_time_minutes', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition" />
          </div>

          {/* Allergens */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Alerjenler (virgülle ayır)</label>
            <input value={form.allergens} onChange={e => set('allergens', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition"
              placeholder="gluten, süt, yumurta" />
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'is_vegetarian', label: 'Vejetaryen', icon: <Leaf className="w-3 h-3" /> },
              { key: 'is_spicy',      label: 'Acılı',      icon: <Flame className="w-3 h-3" /> },
              { key: 'is_active',     label: 'Aktif',       icon: null },
              { key: 'branch_active', label: 'Şubede Aktif', icon: null },
            ].map(({ key, label, icon }) => (
              <button
                type="button"
                key={key}
                onClick={() => set(key as any, !(form as any)[key])}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition ${
                  (form as any)[key]
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                {(form as any)[key] ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                {icon}
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs">{error}</div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 text-xs font-bold hover:bg-zinc-900 transition">
              İptal
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition flex items-center justify-center gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {isEdit ? 'Kaydet' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Category Modal ────────────────────────────────────────────────────────────

function CategoryModal({
  category,
  branchId,
  stations,
  onClose,
  onSaved,
}: {
  category: Category | null
  branchId: string
  stations: any[]
  onClose: () => void
  onSaved: () => void
}) {
  const [names, setNames] = useState({ tr: category?.name_tr ?? '', en: '', ka: '', ru: '' })
  const [stationId, setStationId] = useState<string>(category?.station_id ?? '')
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState('')

  const handleTranslate = async () => {
    if (!names.tr.trim()) { setError('Önce Türkçe adı girin.'); return }
    setError('')
    setTranslating(true)
    const result = await autoTranslate(names.tr)
    if (result) setNames(n => ({ ...n, en: result.en, ka: result.ka, ru: result.ru }))
    setTranslating(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!names.tr.trim()) { setError('Kategori adı zorunlu.'); return }
    setSaving(true)
    try {
      const payload = {
        name_tr: names.tr,
        name_en: names.en || names.tr,
        name_ka: names.ka || names.tr,
        name_ru: names.ru || names.tr,
        station_id: stationId || null,
      }
      let res: any
      if (category) {
        res = await updateCategoryAction(category.id, payload)
      } else {
        res = await createCategoryAction(branchId, payload)
      }
      if (!res.success) { setError(res.error || 'Bir hata oluştu.'); return }
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-zinc-900">
          <h3 className="text-sm font-bold text-zinc-100">{category ? 'Kategori Düzenle' : 'Yeni Kategori'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Kategori Adı (TR)</label>
              <button type="button" onClick={handleTranslate} disabled={translating || !names.tr.trim()}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] font-bold transition">
                {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                {translating ? 'Çevriliyor...' : 'Çevir'}
              </button>
            </div>
            <input value={names.tr} onChange={e => setNames(n => ({ ...n, tr: e.target.value }))} autoFocus
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition"
              placeholder="Örn: Ana Yemekler" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['en', 'ka', 'ru'] as const).map(lang => (
              <div key={lang} className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-600 uppercase">{lang.toUpperCase()}</label>
                <input value={names[lang]} onChange={e => setNames(n => ({ ...n, [lang]: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-1.5 text-[10px] text-zinc-300 focus:border-amber-500 focus:outline-none transition"
                  placeholder="otomatik" />
              </div>
            ))}
          </div>
          {stations.length > 0 && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Birim (Hazırlayan)</label>
              <select
                value={stationId}
                onChange={e => setStationId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition"
              >
                <option value="">— Birim seçin (opsiyonel) —</option>
                {stations.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          {error && <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs">{error}</div>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 text-xs font-bold hover:bg-zinc-900 transition">
              İptal
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition flex items-center justify-center gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {category ? 'Kaydet' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MenuManagement({ embedded }: { embedded?: boolean }) {
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stations, setStations] = useState<any[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [categoryModal, setCategoryModal] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null })
  const [productModal, setProductModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null })

  useEffect(() => {
    fetchBranchesAction().then(data => {
      setBranches(data)
      if (data.length > 0) setSelectedBranchId(data[0].id)
    })
  }, [])

  const reload = useCallback(async () => {
    if (!selectedBranchId) return
    setLoading(true)
    const [cats, prods, stats] = await Promise.all([
      fetchCategoriesAction(selectedBranchId),
      fetchProductsAction(selectedBranchId),
      fetchStationsAction(selectedBranchId),
    ])
    setCategories(cats)
    setProducts(prods)
    setStations(stats)
    if (!selectedCategoryId && cats.length > 0) setSelectedCategoryId(cats[0].id)
    setLoading(false)
  }, [selectedBranchId, selectedCategoryId])

  useEffect(() => { reload() }, [reload])

  const visibleProducts = selectedCategoryId
    ? products.filter(p => p.category_id === selectedCategoryId)
    : products

  return (
    <div className={embedded ? 'h-full flex flex-col bg-[#050507] text-zinc-100 font-sans' : 'min-h-screen bg-[#050507] text-zinc-100 font-sans'}>
      {!embedded && (
        <header className="bg-zinc-950 border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/panel" className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-8 h-8 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-100">Menü Yönetimi</h1>
              <p className="text-[10px] text-zinc-500">Kategori ve ürün ekle, düzenle</p>
            </div>
          </div>
          {branches.length > 0 && (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              <select value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 font-semibold focus:outline-none cursor-pointer">
                {branches.map(b => <option key={b.id} value={b.id} className="bg-zinc-900">{b.name}</option>)}
              </select>
            </div>
          )}
        </header>
      )}

      <div className={embedded ? 'flex flex-1 overflow-hidden' : 'flex h-[calc(100vh-65px)]'}>
        {/* Left: Categories */}
        <aside className="w-56 bg-zinc-950/60 border-r border-zinc-900 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900">
            <span className="text-[10px] font-black text-zinc-500 uppercase">Kategoriler</span>
            <button
              onClick={() => setCategoryModal({ open: true, category: null })}
              className="p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition ${
                selectedCategoryId === null ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
              }`}
            >
              Tümü ({products.length})
            </button>
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center group">
                <button
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex-1 text-left px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    selectedCategoryId === cat.id ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3 h-3 opacity-50" />
                    {cat.name_tr}
                    <span className="ml-auto text-[9px] text-zinc-600">{products.filter(p => p.category_id === cat.id).length}</span>
                  </span>
                </button>
                <button
                  onClick={() => setCategoryModal({ open: true, category: cat })}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-zinc-600 hover:text-zinc-300 transition"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Right: Products */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500/50" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-zinc-100">
                    {selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name_tr : 'Tüm Ürünler'}
                  </h2>
                  <p className="text-xs text-zinc-500">{visibleProducts.length} ürün</p>
                </div>
                <button
                  onClick={() => setProductModal({ open: true, product: null })}
                  disabled={categories.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-bold rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Ürün Ekle
                </button>
              </div>

              {visibleProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
                  <ChefHat className="w-10 h-10 mb-3 text-zinc-800" />
                  <p className="text-xs font-bold">Bu kategoride ürün yok</p>
                  <p className="text-[10px] mt-1">Ürün Ekle butonuna tıkla</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleProducts.map(product => {
                    const displayPrice = product.branch_settings?.custom_price ?? product.base_price
                    const isActive = product.is_active && (product.branch_settings?.is_active ?? true)

                    return (
                      <div
                        key={product.id}
                        className={`bg-zinc-900/40 border rounded-2xl p-4 space-y-3 transition group ${
                          isActive ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-900 opacity-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white truncate">{product.name_tr}</div>
                            <div className="text-[9px] text-zinc-500 mt-0.5">{product.categories?.name_tr}</div>
                          </div>
                          <button
                            onClick={() => setProductModal({ open: true, product })}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition shrink-0"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {product.description_tr && (
                          <p className="text-[10px] text-zinc-500 line-clamp-2">{product.description_tr}</p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-amber-400">{Number(displayPrice).toFixed(2)}</span>
                            <span className="text-[9px] text-zinc-500">GEL</span>
                            {product.branch_settings?.custom_price && (
                              <span className="text-[9px] text-zinc-600 line-through">{Number(product.base_price).toFixed(2)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {product.is_vegetarian && <Leaf className="w-3 h-3 text-emerald-500" />}
                            {product.is_spicy && <Flame className="w-3 h-3 text-red-500" />}
                            {product.branch_settings?.stock_count !== null && product.branch_settings?.stock_count !== undefined && (
                              <span className="text-[9px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-md">
                                Stok: {product.branch_settings.stock_count}
                              </span>
                            )}
                            {!isActive && <span className="text-[9px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded-md">Pasif</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {categoryModal.open && (
        <CategoryModal
          category={categoryModal.category}
          branchId={selectedBranchId}
          stations={stations}
          onClose={() => setCategoryModal({ open: false, category: null })}
          onSaved={reload}
        />
      )}
      {productModal.open && (
        <ProductModal
          product={productModal.product}
          categories={categories}
          branchId={selectedBranchId}
          onClose={() => setProductModal({ open: false, product: null })}
          onSaved={reload}
        />
      )}
    </div>
  )
}
