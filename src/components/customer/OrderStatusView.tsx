'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { translations, Language } from '@/lib/i18n/customer'
import { createClient } from '@/lib/supabase/client'
import { Clock, ChevronLeft, Check, Sparkles, AlertTriangle, ArrowLeft } from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  chef_note: string
  products: {
    name_tr: string
    name_en: string
    name_ru: string
    name_ka: string
  }
}

interface Order {
  id: string
  status: string
  total_amount: number
  created_at: string
  order_items: OrderItem[]
}

interface OrderStatusViewProps {
  initialOrders: Order[]
  tableToken: string
  sessionInfo: {
    id: string
    customerName: string
    language: Language
  }
}

const STATUS_STEPS = ['new', 'preparing', 'ready', 'delivered']

export default function OrderStatusView({
  initialOrders,
  tableToken,
  sessionInfo
}: OrderStatusViewProps) {
  const router = useRouter()
  const t = translations[sessionInfo.language] || translations.tr
  const supabase = createClient()

  const [orders, setOrders] = useState<Order[]>(initialOrders)

  // Realtime Abonelikleri
  useEffect(() => {
    // 1. orders tablosundaki değişiklikleri izle (bu oturuma ait siparişler)
    const channel = supabase
      .channel(`session_orders:${sessionInfo.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `session_id=eq.${sessionInfo.id}`
        },
        async (payload) => {
          // Değişiklik olduğunda siparişleri yeniden çekelim (tüm ilişkileri almak için en garantili yol)
          const { data, error } = await supabase
            .from('orders')
            .select(`
              id,
              status,
              total_amount,
              created_at,
              order_items (
                id,
                quantity,
                unit_price,
                chef_note,
                products (
                  name_tr,
                  name_en,
                  name_ru,
                  name_ka
                )
              )
            `)
            .eq('session_id', sessionInfo.id)
            .neq('status', 'cancelled')
            .order('created_at', { ascending: false })

          if (!error && data) {
            setOrders(data as any[])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionInfo.id, supabase])

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return sessionInfo.language === 'en' ? 'Kitchen Approval' : 'Mutfak Onayında'
      case 'preparing':
        return sessionInfo.language === 'en' ? 'Preparing' : 'Hazırlanıyor'
      case 'ready':
        return sessionInfo.language === 'en' ? 'Ready!' : 'Hazır!'
      case 'delivered':
        return sessionInfo.language === 'en' ? 'Delivered' : 'Teslim Edildi'
      case 'cancelled':
        return sessionInfo.language === 'en' ? 'Cancelled' : 'İptal Edildi'
      default:
        return status
    }
  }

  const getStatusStepIndex = (status: string) => {
    return STATUS_STEPS.indexOf(status)
  }

  const getProductTranslatedName = (prod: any) => {
    if (!prod) return ''
    if (sessionInfo.language === 'en') return prod.name_en || prod.name_tr
    if (sessionInfo.language === 'ru') return prod.name_ru || prod.name_en
    if (sessionInfo.language === 'ka') return prod.name_ka || prod.name_en
    return prod.name_tr || prod.name_en
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen text-zinc-100 bg-zinc-950">
      
      {/* Üst Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push(`/m/${tableToken}/menu`)}
          className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-90"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-bold text-white">
          {sessionInfo.language === 'en' ? 'Order Tracking' : 'Sipariş Takibi'}
        </h1>
      </header>

      {/* Siparişler Listesi */}
      <div className="flex-1 p-4 space-y-6">
        {orders.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-zinc-500">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              {sessionInfo.language === 'en' ? 'No orders yet' : 'Henüz siparişiniz yok'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-xs leading-relaxed mb-6">
              {sessionInfo.language === 'en' 
                ? 'Your orders will be listed here in real-time once placed.' 
                : 'Menüden sipariş verdiğinizde siparişleriniz burada anlık olarak listelenecektir.'}
            </p>
            <button
              onClick={() => router.push(`/m/${tableToken}/menu`)}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{sessionInfo.language === 'en' ? 'Back to Menu' : 'Menüye Geri Dön'}</span>
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const stepIndex = getStatusStepIndex(order.status)
            return (
              <div 
                key={order.id} 
                className="bg-zinc-900/40 border border-zinc-900 rounded-3xl p-5 space-y-5 shadow-xl relative overflow-hidden"
              >
                {/* Dekoratif Gradient Işık */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl" />

                {/* Sipariş Başlığı */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                      {sessionInfo.language === 'en' ? 'Order ID' : 'Sipariş No'}
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                      {sessionInfo.language === 'en' ? 'Total' : 'Tutar'}
                    </h3>
                    <p className="text-sm font-black text-amber-500 mt-0.5">
                      {Number(order.total_amount).toFixed(2)} GEL
                    </p>
                  </div>
                </div>

                {/* Stepper Durum Takip Çubuğu */}
                {order.status !== 'cancelled' && (
                  <div className="py-2">
                    <div className="relative flex justify-between items-center w-full">
                      {/* Çizgi */}
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-800 z-0" />
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 z-0" 
                        style={{ width: `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                      />

                      {/* Adımlar */}
                      {STATUS_STEPS.map((step, idx) => {
                        const isCompleted = stepIndex >= idx
                        const isActive = stepIndex === idx
                        return (
                          <div key={step} className="flex flex-col items-center relative z-10">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-300 ${
                              isCompleted 
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-500 text-white' 
                                : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                            } ${isActive ? 'ring-4 ring-amber-500/20 scale-110' : ''}`}>
                              {isCompleted ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <span className="text-[10px] font-bold">{idx + 1}</span>
                              )}
                            </div>
                            <span className={`text-[9px] font-semibold mt-1.5 ${
                              isActive ? 'text-amber-500 font-black' : isCompleted ? 'text-zinc-300' : 'text-zinc-600'
                            }`}>
                              {idx === 0 && (sessionInfo.language === 'en' ? 'Sent' : 'Alındı')}
                              {idx === 1 && (sessionInfo.language === 'en' ? 'Prep' : 'Hazırlık')}
                              {idx === 2 && (sessionInfo.language === 'en' ? 'Ready' : 'Hazır')}
                              {idx === 3 && (sessionInfo.language === 'en' ? 'Served' : 'Teslim')}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* İptal Edildi Görünümü */}
                {order.status === 'cancelled' && (
                  <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-3 flex gap-2.5 items-center text-red-400">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold">{t.invalidTable}</h4>
                      <p className="text-[10px] text-red-400/80 leading-normal mt-0.5">
                        {sessionInfo.language === 'en' ? 'Your order has been cancelled by the kitchen staff.' : 'Bu sipariş mutfak veya yönetici tarafından iptal edildi.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Sipariş Edilen Ürünler */}
                <div className="border-t border-zinc-900 pt-4 space-y-2.5">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {sessionInfo.language === 'en' ? 'Items' : 'Ürünler'}
                  </h4>
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start text-xs">
                        <div className="flex gap-2">
                          <span className="font-bold text-amber-500">{item.quantity}x</span>
                          <div>
                            <span className="text-zinc-300 font-medium">
                              {getProductTranslatedName(item.products)}
                            </span>
                            {item.chef_note && (
                              <p className="text-[10px] text-zinc-500 mt-0.5">
                                "{item.chef_note}"
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-zinc-400 font-semibold">
                          {(item.quantity * Number(item.unit_price)).toFixed(2)} GEL
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
