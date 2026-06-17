'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { translations, Language } from '@/lib/i18n/customer'
import { MenuCategory, MenuProduct } from '@/lib/restaurant/menu'
import { placeCustomerOrder, createServiceRequest } from '@/app/actions/customer'
import { 
  Utensils, Sparkles, Bell, ShoppingBag, Plus, Minus, 
  ChevronRight, X, MessageSquare, Flame, Leaf, Clock, 
  HelpCircle, AlertCircle, CheckCircle2, User, Info
} from 'lucide-react'

interface CustomerMenuViewProps {
  categories: MenuCategory[]
  products: MenuProduct[]
  tableToken: string
  tableDetails: {
    id: string
    name: string
    branch_id: string
    branch_name: string
    currency: string
    service_fee_percent: number
  }
  sessionInfo: {
    id: string
    customerName: string
    billId: string
    language: Language
  }
}

interface CartItem {
  product: MenuProduct
  quantity: number
  chefNote: string
}

export default function CustomerMenuView({
  categories,
  products,
  tableToken,
  tableDetails,
  sessionInfo
}: CustomerMenuViewProps) {
  const router = useRouter()
  const t = translations[sessionInfo.language] || translations.tr

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [chefNoteTemp, setChefNoteTemp] = useState<Record<string, string>>({})
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  // Service Request Modal State
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [requestLoading, setRequestLoading] = useState<string | null>(null)
  const [requestSuccessMessage, setRequestSuccessMessage] = useState('')

  // Product Detail Modal State
  const [detailProduct, setDetailProduct] = useState<MenuProduct | null>(null)

  // Category Scrolling Ref
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const categoryBarRef = useRef<HTMLDivElement | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('')

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id)
    }
  }, [categories, activeCategory])

  // Scroll to Category
  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId)
    const element = categoryRefs.current[categoryId]
    if (element) {
      const yOffset = -120 // Category bar + header offset
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  // Cart Functions
  const addToCart = (product: MenuProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1, chefNote: '' }]
    })
  }

  const updateQuantity = (productId: string, amount: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + amount
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    })
  }

  const handleChefNoteChange = (productId: string, note: string) => {
    setChefNoteTemp((prev) => ({ ...prev, [productId]: note }))
    setCart((prev) => 
      prev.map((item) => 
        item.product.id === productId 
          ? { ...item, chefNote: note }
          : item
      )
    )
  }

  // Calculate totals
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.quantity * item.product.price), 0)
  const serviceFee = cartSubtotal * (tableDetails.service_fee_percent / 100)
  const cartTotal = cartSubtotal + serviceFee

  // Submit Order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return
    
    setOrderLoading(true)
    try {
      const result = await placeCustomerOrder({
        tableSessionId: sessionInfo.id,
        billId: sessionInfo.billId,
        tableId: tableDetails.id,
        branchId: tableDetails.branch_id,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
          chefNote: item.chefNote
        }))
      })

      if (result.success) {
        setCart([])
        setOrderSuccess(true)
        setCartOpen(false)
      } else {
        alert(result.error || 'Sipariş gönderilirken bir hata oluştu.')
      }
    } catch (err) {
      console.error(err)
      alert('Sipariş bağlantı hatası nedeniyle iletilemedi.')
    } finally {
      setOrderLoading(false)
    }
  }

  // Send Service Request
  const handleServiceRequest = async (type: 'waiter' | 'bill' | 'napkin' | 'water' | 'cleaning' | 'salt') => {
    setRequestLoading(type)
    try {
      const result = await createServiceRequest({
        tableSessionId: sessionInfo.id,
        tableId: tableDetails.id,
        branchId: tableDetails.branch_id,
        type
      })

      if (result.success) {
        setRequestSuccessMessage(t.requestSuccessDesc)
        setTimeout(() => {
          setRequestSuccessMessage('')
          setRequestModalOpen(false)
        }, 3000)
      } else {
        alert('İstek gönderilemedi.')
      }
    } catch (err) {
      console.error(err)
      alert('Bağlantı hatası.')
    } finally {
      setRequestLoading(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col pb-24 min-h-screen text-zinc-100 bg-zinc-950">
      
      {/* 1. Üst Başlık (Sticky Header) */}
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/10">
            <Utensils className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              {tableDetails.branch_name}
            </h1>
            <p className="text-[10px] text-zinc-500 flex items-center gap-1">
              <User className="w-3 h-3 text-zinc-500" />
              <span>{sessionInfo.customerName}</span>
              <span className="text-zinc-700">•</span>
              <span className="font-semibold text-amber-500">{t.table} {tableDetails.name}</span>
            </p>
          </div>
        </div>

        {/* Hızlı Servis Çağrı Butonu */}
        <button
          onClick={() => setRequestModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold hover:bg-amber-500/20 active:scale-95 transition-all duration-300"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{t.callWaiter}</span>
        </button>
      </header>

      {/* 2. Kategori Çubuğu (Sticky Category Bar) */}
      <nav 
        ref={categoryBarRef}
        className="sticky top-[53px] z-20 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-900/60 py-2.5 px-4 overflow-x-auto scrollbar-none flex items-center gap-2"
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/15'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {cat.name}
            </button>
          )
        })}
      </nav>

      {/* 3. Ürünler Listesi */}
      <div className="px-4 py-4 space-y-8 flex-1">
        {categories.map((cat) => {
          const catProducts = products.filter((p) => p.category_id === cat.id)
          if (catProducts.length === 0) return null

          return (
            <div 
              key={cat.id}
              ref={(el) => { categoryRefs.current[cat.id] = el }}
              className="scroll-mt-32 space-y-3"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white uppercase tracking-wider">
                  {cat.name}
                </h2>
                <div className="flex-1 h-px bg-zinc-900" />
              </div>

              <div className="space-y-3">
                {catProducts.map((prod) => {
                  const cartItem = cart.find((item) => item.product.id === prod.id)
                  const count = cartItem ? cartItem.quantity : 0
                  
                  return (
                    <div 
                      key={prod.id}
                      onClick={() => setDetailProduct(prod)}
                      className="bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800/80 rounded-2xl p-3 flex gap-3 relative overflow-hidden transition duration-300 cursor-pointer active:bg-zinc-900/70"
                    >
                      {/* Ürün Görseli veya Varsayılan İkon */}
                      <div className="w-20 h-20 bg-zinc-950 rounded-xl flex items-center justify-center shrink-0 border border-zinc-800/50 overflow-hidden relative">
                        {prod.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={prod.photo_url} 
                            alt={prod.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <Utensils className="w-6 h-6 text-zinc-700" />
                        )}
                        
                        {/* Alerjen/Baharat/Vejetaryen İkonları */}
                        <div className="absolute top-1 left-1 flex gap-1">
                          {prod.is_spicy && (
                            <span className="w-5 h-5 rounded-full bg-red-950/80 flex items-center justify-center text-[10px]" title={t.spicy}>
                              🔥
                            </span>
                          )}
                          {prod.is_vegetarian && (
                            <span className="w-5 h-5 rounded-full bg-emerald-950/80 flex items-center justify-center text-[10px]" title={t.vegetarian}>
                              🌿
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ürün Detayları */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="text-sm font-bold text-white truncate leading-snug flex-1">
                              {prod.name}
                            </h3>
                            <Info className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                          </div>
                          <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5 leading-relaxed">
                            {prod.description}
                          </p>
                        </div>

                        <div className="flex items-end justify-between mt-2" onClick={(e) => e.stopPropagation()}>
                          <span className="text-sm font-black text-amber-500">
                            {prod.price.toFixed(2)} <span className="text-xs font-normal text-zinc-400">{tableDetails.currency}</span>
                          </span>

                          {/* Sepete Ekle Butonu */}
                          {count > 0 ? (
                            <div className="flex items-center bg-amber-500/10 border border-amber-500/20 rounded-xl px-1.5 py-1 text-amber-500">
                              <button 
                                onClick={() => updateQuantity(prod.id, -1)}
                                className="p-1 hover:bg-amber-500/10 rounded-lg active:scale-90"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-bold text-white min-w-5 text-center">
                                {count}
                              </span>
                              <button 
                                onClick={() => addToCart(prod)}
                                className="p-1 hover:bg-amber-500/10 rounded-lg active:scale-90"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(prod)}
                              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold text-xs rounded-xl hover:bg-amber-500 hover:border-amber-500 hover:text-white transition duration-300 flex items-center gap-1 active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t.addToCart}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* 4. Alt Kısım: Yüzen Sepet Barı */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-40 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 shadow-xl shadow-amber-500/15 flex items-center justify-between animate-bounce-short">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-orange-600 text-[10px] font-black rounded-full flex items-center justify-center border border-orange-600/10">
                {cartItemCount}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-white/80 font-medium tracking-wide uppercase">
                {t.cart}
              </p>
              <p className="text-sm font-black text-white">
                {cartTotal.toFixed(2)} {tableDetails.currency}
              </p>
            </div>
          </div>

          <button
            onClick={() => setCartOpen(true)}
            className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition duration-300 active:scale-95"
          >
            <span>{t.cart}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 5. Sepet Çekmecesi (Cart Drawer - Slide Up) */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end">
          <div className="w-full max-w-md bg-zinc-950 border-t border-zinc-800 rounded-t-[2.5rem] p-6 max-h-[90vh] flex flex-col justify-between shadow-2xl relative animate-slide-up">
            
            {/* Sürükleme/Kapatma Çizgisi */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-zinc-800 rounded-full" />

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                {t.cart}
              </h2>
              <button 
                onClick={() => setCartOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sepet Ürünleri Listesi */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 mb-6 scrollbar-thin">
              {cart.map((item) => (
                <div key={item.product.id} className="bg-zinc-900/40 border border-zinc-900/80 rounded-2xl p-3 space-y-2">
                  <div className="flex justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.product.name}</h4>
                      <p className="text-xs font-semibold text-amber-500 mt-0.5">
                        {item.product.price.toFixed(2)} {tableDetails.currency}
                      </p>
                    </div>

                    <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-1.5 py-1 text-amber-500 h-8 shrink-0">
                      <button 
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-0.5 hover:bg-zinc-900 rounded-lg"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 text-xs font-bold text-white min-w-4 text-center">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => addToCart(item.product)}
                        className="p-0.5 hover:bg-zinc-900 rounded-lg"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Özel Not */}
                  <div className="flex items-center gap-2 bg-zinc-950/60 rounded-xl px-3 py-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                    <input 
                      type="text" 
                      value={chefNoteTemp[item.product.id] || ''}
                      onChange={(e) => handleChefNoteChange(item.product.id, e.target.value)}
                      placeholder={t.chefNotePlaceholder}
                      className="w-full bg-transparent text-[11px] text-zinc-400 placeholder-zinc-700 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Adisyon Özeti */}
            <div className="border-t border-zinc-900 pt-4 space-y-2.5 mb-6">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{t.orderTotal}</span>
                <span className="font-semibold text-zinc-300">
                  {cartSubtotal.toFixed(2)} {tableDetails.currency}
                </span>
              </div>
              {tableDetails.service_fee_percent > 0 && (
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{t.serviceFee} (%{tableDetails.service_fee_percent})</span>
                  <span className="font-semibold text-zinc-300">
                    {serviceFee.toFixed(2)} {tableDetails.currency}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-zinc-900 pt-2.5 text-white font-bold">
                <span>{t.total}</span>
                <span className="text-amber-500">
                  {cartTotal.toFixed(2)} {tableDetails.currency}
                </span>
              </div>
            </div>

            {/* Sipariş Tamamlama Butonu */}
            <button
              onClick={handlePlaceOrder}
              disabled={orderLoading || cart.length === 0}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-4 rounded-2xl transition duration-300 shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {orderLoading ? t.loading : (
                <>
                  <span>{t.placeOrder}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 6. Başarılı Sipariş Ekranı Overlay */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-center items-center p-6 text-center animate-fade-in">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mb-6 text-emerald-500 animate-scale-up">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <h2 className="text-2xl font-black text-white mb-2">
            {t.orderSuccess}
          </h2>
          <p className="text-sm text-zinc-400 max-w-xs leading-relaxed mb-8">
            {t.orderSuccessDesc}
          </p>

          <div className="w-full max-w-xs space-y-3">
            <button
              onClick={() => {
                setOrderSuccess(false)
                router.push(`/m/${tableToken}/status`)
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3.5 rounded-xl transition duration-300 text-sm shadow-md"
            >
              {t.trackStatus}
            </button>
            <button
              onClick={() => setOrderSuccess(false)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-semibold py-3 rounded-xl hover:text-white transition duration-300 text-sm"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* 7. Garson Çağır / İstek Seçim Modali */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end">
          <div className="w-full max-w-md bg-zinc-950 border-t border-zinc-800 rounded-t-[2.5rem] p-6 max-h-[90vh] flex flex-col shadow-2xl relative animate-slide-up">
            
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-zinc-800 rounded-full" />

            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                {t.requestTitle}
              </h2>
              <button 
                onClick={() => setRequestModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {requestSuccessMessage ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-4 animate-scale-up">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{t.requestSuccess}</h4>
                <p className="text-xs text-zinc-400 max-w-xs">{requestSuccessMessage}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 py-3">
                {[
                  { type: 'waiter', label: t.callWaiter, icon: '🙋‍♂️', color: 'border-amber-500/30 text-amber-500 bg-amber-500/5' },
                  { type: 'bill', label: t.callBill, icon: '💵', color: 'border-red-500/30 text-red-400 bg-red-500/5' },
                  { type: 'napkin', label: t.requestNapkin, icon: '🧻', color: 'border-zinc-800 text-zinc-300' },
                  { type: 'water', label: t.requestWater, icon: '💧', color: 'border-zinc-800 text-zinc-300' },
                  { type: 'salt', label: t.requestSalt, icon: '🧂', color: 'border-zinc-800 text-zinc-300' },
                  { type: 'cleaning', label: t.requestCleaning, icon: '🧹', color: 'border-zinc-800 text-zinc-300' }
                ].map((req) => (
                  <button
                    key={req.type}
                    onClick={() => handleServiceRequest(req.type as any)}
                    disabled={requestLoading !== null}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-xs font-bold transition-all duration-300 active:scale-95 select-none gap-2 hover:border-amber-500/40 hover:bg-amber-500/5 ${req.color}`}
                  >
                    <span className="text-2xl leading-none">{req.icon}</span>
                    <span>{requestLoading === req.type ? t.loading : req.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 8. Ürün Detay ve Kalori/Besin Değerleri Modali (Slide Up Drawer) */}
      {detailProduct && (() => {
        const cartItem = cart.find((item) => item.product.id === detailProduct.id)
        const count = cartItem ? cartItem.quantity : 0
        const hasNutrition = detailProduct.calories !== null

        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-end" onClick={() => setDetailProduct(null)}>
            <div 
              className="w-full max-w-md bg-zinc-950 border-t border-zinc-800 rounded-t-[2.5rem] p-6 max-h-[92vh] flex flex-col justify-between shadow-2xl relative overflow-y-auto scrollbar-none animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Kapatma ve Kaydırma Çubuğu */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-zinc-800 rounded-full" />
              
              <div className="flex justify-between items-center mb-4 mt-2">
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.viewDetails}
                </span>
                <button 
                  onClick={() => setDetailProduct(null)}
                  className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Detay İçeriği */}
              <div className="space-y-6 flex-1 overflow-y-auto pr-1 scrollbar-none pb-6">
                
                {/* Görsel */}
                <div className="w-full h-48 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800/80 relative flex items-center justify-center">
                  {detailProduct.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={detailProduct.photo_url} 
                      alt={detailProduct.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Utensils className="w-12 h-12 text-zinc-850" />
                  )}

                  {/* Rozetler */}
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    {detailProduct.is_spicy && (
                      <span className="px-2.5 py-1 rounded-full bg-red-950/90 border border-red-900/30 text-red-400 text-[10px] font-black flex items-center gap-1">
                        🔥 {t.spicy}
                      </span>
                    )}
                    {detailProduct.is_vegetarian && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-900/30 text-emerald-400 text-[10px] font-black flex items-center gap-1">
                        🌿 {t.vegetarian}
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full bg-zinc-950/90 border border-zinc-800/80 text-zinc-400 text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {detailProduct.prep_time_minutes} {t.minutes.slice(0,2)}
                    </span>
                  </div>
                </div>

                {/* Ürün İsmi ve Fiyatı */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-white leading-tight">
                      {detailProduct.name}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      {detailProduct.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-black text-amber-500">
                      {detailProduct.price.toFixed(2)} <span className="text-xs font-normal text-zinc-400">{tableDetails.currency}</span>
                    </span>
                  </div>
                </div>

                {/* İçindekiler Bölümü */}
                {detailProduct.ingredients && (
                  <div className="bg-zinc-900/40 border border-zinc-900/80 rounded-2xl p-4 space-y-2">
                    <h3 className="text-xs font-bold text-zinc-400 tracking-wide uppercase">
                      {t.ingredients}
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {detailProduct.ingredients}
                    </p>
                  </div>
                )}

                {/* Besin Değerleri Bölümü */}
                <div className="bg-zinc-900/40 border border-zinc-900/80 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 tracking-wide uppercase flex justify-between items-center">
                    <span>{t.nutrition}</span>
                    {hasNutrition && (
                      <span className="text-[10px] font-bold text-amber-500">
                        {detailProduct.calories} Kcal
                      </span>
                    )}
                  </h3>

                  {hasNutrition ? (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {/* Kalori */}
                      <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-2">
                        <p className="text-[9px] font-bold text-zinc-500 uppercase">{t.caloriesText.slice(0,7)}</p>
                        <p className="text-sm font-black text-amber-500 mt-1">{detailProduct.calories}</p>
                        <p className="text-[8px] text-zinc-600">kcal</p>
                      </div>
                      {/* Protein */}
                      <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-2">
                        <p className="text-[9px] font-bold text-zinc-500 uppercase">{t.proteinText}</p>
                        <p className="text-sm font-black text-blue-400 mt-1">{(detailProduct.protein_g ?? 0).toFixed(1)}</p>
                        <p className="text-[8px] text-zinc-600">gram</p>
                      </div>
                      {/* Karbonhidrat */}
                      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-2">
                        <p className="text-[9px] font-bold text-zinc-500 uppercase">{t.carbsText.slice(0,5)}.</p>
                        <p className="text-sm font-black text-emerald-400 mt-1">{(detailProduct.carbs_g ?? 0).toFixed(1)}</p>
                        <p className="text-[8px] text-zinc-600">gram</p>
                      </div>
                      {/* Yağ */}
                      <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-2">
                        <p className="text-[9px] font-bold text-zinc-500 uppercase">{t.fatText}</p>
                        <p className="text-sm font-black text-red-400 mt-1">{(detailProduct.fat_g ?? 0).toFixed(1)}</p>
                        <p className="text-[8px] text-zinc-600">gram</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-600 italic">
                      {t.noNutritionData}
                    </p>
                  )}
                </div>

                {/* Alerjenler Bölümü */}
                {detailProduct.allergens && detailProduct.allergens.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-zinc-500 tracking-wide uppercase">
                      {t.allergens}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {detailProduct.allergens.map((alg) => (
                        <span key={alg} className="bg-red-950/20 border border-red-900/30 text-red-400 text-[10px] px-2.5 py-1 rounded-lg font-bold capitalize">
                          ⚠️ {alg}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Alt Buton ve Adet Kontrolü */}
              <div className="border-t border-zinc-900 pt-4 mt-2">
                {count > 0 ? (
                  <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-amber-500">
                    <button 
                      onClick={() => updateQuantity(detailProduct.id, -1)}
                      className="p-2 hover:bg-zinc-950 rounded-xl active:scale-90"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="text-center">
                      <span className="text-sm font-black text-white block">
                        {count} {sessionInfo.language === 'en' ? 'Items in Cart' : 'Adet Sepette'}
                      </span>
                    </div>
                    <button 
                      onClick={() => addToCart(detailProduct)}
                      className="p-2 hover:bg-zinc-950 rounded-xl active:scale-90"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      addToCart(detailProduct)
                      setDetailProduct(null) // Modali kapat
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3.5 rounded-2xl transition duration-300 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.addToCart}</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        )
      })()}
    </div>
  )
}
