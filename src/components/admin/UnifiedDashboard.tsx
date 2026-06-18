'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  fetchBranchesAction,
  fetchUnifiedDashboardData,
  updateOrderStatusAction,
  updateOrderItemStatusAction,
  acknowledgeServiceRequestAction,
  completeServiceRequestAction,
  resetTableAction,
  updateTableStatusAction,
  payBillAction,
  resendServiceRequestNotificationAction,
} from '@/app/actions/admin'
import {
  ChefHat,
  CreditCard,
  Bell,
  Users,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  LogOut,
  X,
  Check,
  MapPin,
  Trash2,
  Settings,
  UtensilsCrossed,
  Layers,
  Sparkles,
  RotateCcw,
  Receipt,
} from 'lucide-react'

interface UnifiedDashboardProps {
  defaultTab?: 'tables' | 'kitchen' | 'cashier' | 'requests'
}

export default function UnifiedDashboard({ defaultTab = 'tables' }: UnifiedDashboardProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [activeTab, setActiveTab] = useState<'tables' | 'kitchen' | 'cashier' | 'requests'>(defaultTab)
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [data, setData] = useState<{
    tables: any[]
    activeSessions: any[]
    openBills: any[]
    activeRequests: any[]
    activeOrders: any[]
    stations: any[]
    zones: any[]
  }>({ tables: [], activeSessions: [], openBills: [], activeRequests: [], activeOrders: [], stations: [], zones: [] })

  const [selectedStationId, setSelectedStationId] = useState<string>('all')
  // requestId → son bildirim zamanı (ms), 60sn cooldown
  const [resendCooldowns, setResendCooldowns] = useState<Record<string, number>>({})

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)

  const [payAmount, setPayAmount] = useState<string>('')
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [paymentError, setPaymentError] = useState<string>('')
  const [paymentSuccess, setPaymentSuccess] = useState<string>('')

  // Sound notification refs
  const audioCtxRef = useRef<AudioContext | null>(null)
  const prevOrderCountRef = useRef(0)
  const prevRequestCountRef = useRef(0)
  const hasInitializedRef = useRef(false)

  const playBeep = useCallback((type: 'order' | 'request' = 'order') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      if (type === 'order') {
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12)
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.24)
      } else {
        osc.frequency.setValueAtTime(660, ctx.currentTime)
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.18)
      }
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    } catch (_) {}
  }, [])

  // Load branches
  useEffect(() => {
    async function loadBranches() {
      const branchData = await fetchBranchesAction()
      setBranches(branchData)
      if (branchData.length > 0) setSelectedBranchId(branchData[0].id)
      else setLoading(false)
    }
    loadBranches()
  }, [])

  const loadDashboardData = useCallback(async (showLoading = false) => {
    if (!selectedBranchId) return
    if (showLoading) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetchUnifiedDashboardData(selectedBranchId)
      setData(res)
    } catch (err) {
      console.error('Failed to load dashboard data', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedBranchId])

  // Sound effects — fire only after first data load
  useEffect(() => {
    if (!hasInitializedRef.current) return
    const newCount = data.activeOrders.filter(o => o.status === 'new').length
    if (newCount > prevOrderCountRef.current) playBeep('order')
    prevOrderCountRef.current = newCount
  }, [data.activeOrders, playBeep])

  useEffect(() => {
    if (!hasInitializedRef.current) return
    if (data.activeRequests.length > prevRequestCountRef.current) playBeep('request')
    prevRequestCountRef.current = data.activeRequests.length
  }, [data.activeRequests, playBeep])

  // Supabase realtime — replaces 5s polling
  useEffect(() => {
    if (!selectedBranchId) return

    loadDashboardData(true).then(() => {
      hasInitializedRef.current = true
    })

    const reload = () => loadDashboardData(false)

    const channel = supabase
      .channel(`dashboard-${selectedBranchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders',           filter: `branch_id=eq.${selectedBranchId}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' },                                                    reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests', filter: `branch_id=eq.${selectedBranchId}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills',            filter: `branch_id=eq.${selectedBranchId}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables',           filter: `branch_id=eq.${selectedBranchId}` }, reload)
      .subscribe()

    const intervalId = setInterval(() => loadDashboardData(false), 15000)

    return () => { supabase.removeChannel(channel); clearInterval(intervalId) }
  }, [selectedBranchId, loadDashboardData, supabase])

  const selectedTable = data.tables.find(t => t.id === selectedTableId)
  const activeBill = selectedTable ? data.openBills.find(b => b.table_id === selectedTable.id) : null
  const tableSessions = selectedTable ? data.activeSessions.filter(s => s.table_id === selectedTable.id) : []
  const tableOrders = selectedTable ? data.activeOrders.filter(o => o.table_id === selectedTable.id) : []

  const handleUpdateOrderItemStatus = async (itemId: string, status: string) => {
    setData(prev => ({
      ...prev,
      activeOrders: prev.activeOrders.map(order => ({
        ...order,
        order_items: order.order_items?.map((item: any) =>
          item.id === itemId ? { ...item, status } : item
        )
      }))
    }))
    updateOrderItemStatusAction(itemId, status).catch(() => {})
  }

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    setData(prev => ({
      ...prev,
      activeOrders: prev.activeOrders.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    }))
    updateOrderStatusAction(orderId, status).catch(() => {})
  }

  const handleAcknowledgeRequest = async (requestId: string) => {
    setData(prev => ({
      ...prev,
      activeRequests: prev.activeRequests.map(req =>
        req.id === requestId ? { ...req, status: 'acknowledged' } : req
      )
    }))
    acknowledgeServiceRequestAction(requestId).catch(() => {})
  }

  const handleCompleteRequest = async (requestId: string) => {
    setData(prev => ({
      ...prev,
      activeRequests: prev.activeRequests.filter(req => req.id !== requestId)
    }))
    completeServiceRequestAction(requestId).catch(() => {})
  }

  const handleResetTable = async (tableId: string) => {
    if (!confirm('Bu masadaki tüm oturumları sonlandırmak ve masayı sıfırlamak istediğinize emin misiniz?')) return
    const res = await resetTableAction(tableId)
    if (res.success) {
      setSelectedTableId(null)
      loadDashboardData(true)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeBill) return
    setPaymentError('')
    setPaymentSuccess('')

    const total = Number(activeBill.total_amount)
    const paid = Number(activeBill.paid_amount || 0)
    const remaining = total - paid

    let amountToPay = remaining
    if (paymentType === 'partial') {
      const parsed = parseFloat(payAmount)
      if (isNaN(parsed) || parsed <= 0 || parsed > remaining) {
        setPaymentError(`Lütfen 0 ile kalan tutar (${remaining.toFixed(2)} GEL) arasında geçerli bir miktar girin.`)
        return
      }
      amountToPay = parsed
    }

    try {
      const res = await payBillAction(activeBill.id, amountToPay, paymentMethod)
      if (res.success) {
        setPaymentSuccess('Ödeme başarıyla kaydedildi!')
        setPayAmount('')
        if (res.isFullyPaid) {
          setTimeout(() => { setSelectedTableId(null); setPaymentSuccess('') }, 1500)
        }
        loadDashboardData(false)
      } else {
        setPaymentError(res.error || 'Ödeme işlemi başarısız oldu.')
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Ödeme sırasında hata oluştu.')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const getTableColor = (table: any) => {
    const tableRequests = data.activeRequests.filter(r => r.table_id === table.id)
    if (tableRequests.length > 0) {
      const hasBillReq = tableRequests.some(r => r.type === 'bill')
      return hasBillReq ? 'border-red-500/80 bg-red-950/20 text-red-300' : 'border-amber-500/80 bg-amber-950/20 text-amber-300'
    }
    if (table.status === 'occupied') return 'border-indigo-500/40 bg-indigo-950/10 text-indigo-300'
    if (table.status === 'needs_cleaning') return 'border-orange-500/40 bg-orange-950/10 text-orange-300'
    return 'border-zinc-800/80 bg-zinc-900/10 text-zinc-400 hover:border-zinc-700'
  }

  const getTableStatusText = (table: any) => {
    const tableRequests = data.activeRequests.filter(r => r.table_id === table.id)
    if (tableRequests.length > 0) {
      const firstReq = tableRequests[0]
      const label = firstReq.type === 'waiter' ? 'Garson Çağrısı' : firstReq.type === 'bill' ? 'Hesap Talebi' : 'Servis İsteği'
      return `🚨 ${label}`
    }
    if (table.status === 'occupied') return 'Dolu'
    if (table.status === 'needs_cleaning') return 'Temizlik Bekliyor'
    return 'Boş'
  }

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 font-sans flex flex-col selection:bg-amber-500/30 selection:text-amber-200">

      {/* Top Header */}
      <header className="bg-zinc-950 border-b border-zinc-900 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">thecheckmenu</h1>
            <p className="text-[10px] text-zinc-500 font-medium">Unified Service & Cashier Control Console</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {branches.length > 0 && (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded-xl">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 font-semibold focus:outline-none cursor-pointer"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id} className="bg-zinc-900 text-zinc-300">{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => loadDashboardData(true)}
            disabled={loading || refreshing}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
            title="Manuel Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing || loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-red-950/20 border border-zinc-800 hover:border-red-900/30 text-zinc-400 hover:text-red-400 transition"
            title="Çıkış Yap"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Navigation Sidebar */}
        <nav className="w-full md:w-64 bg-zinc-950/60 border-r border-zinc-900 p-4 flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-x-visible md:justify-start">
          {[
            { id: 'tables',   name: 'Masa Haritası',      count: data.tables.filter(t => t.status === 'occupied').length, icon: Users },
            { id: 'kitchen',  name: 'Mutfak Hazırlık',    count: data.activeOrders.length,                                icon: ChefHat },
            { id: 'requests', name: 'Garson İstekleri',   count: data.activeRequests.length,                              icon: Bell },
            { id: 'cashier',  name: 'Kasa / Adisyonlar', count: data.openBills.length,                                   icon: CreditCard },
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSelectedTableId(null) }}
                className={`flex-1 md:flex-none flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition duration-300 border active:scale-[0.98] ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-md shadow-amber-500/5'
                    : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </div>
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-amber-500 text-black font-black' : 'bg-zinc-800 text-zinc-400 font-semibold'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}

          {/* Divider + management links */}
          <div className="hidden md:block border-t border-zinc-900 my-2" />
          <Link
            href="/panel/management"
            className="flex-1 md:flex-none flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/30 border border-transparent transition"
          >
            <Settings className="w-4 h-4" />
            <span>Yönetim</span>
          </Link>
        </nav>

        {/* Workspace */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#050507]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                <span className="text-xs text-zinc-500 font-medium">Veriler yükleniyor...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Tab 1: Tables Map */}
              {activeTab === 'tables' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-100">Masa Haritası</h2>
                    <p className="text-xs text-zinc-500">Masa durumlarını ve anlık garson çağrılarını takip edin</p>
                  </div>

                  {(() => {
                    // Bölgeye göre gruplandır — data.zones'u kullan (sort_order sıralı)
                    const hasZones = data.zones.length > 0
                    const groups: { zoneId: string | null; zoneName: string | null; tables: any[] }[] = []
                    if (hasZones) {
                      data.zones.forEach((z: any) => {
                        const zoneTables = data.tables.filter(t => t.zone_id === z.id)
                        if (zoneTables.length > 0) groups.push({ zoneId: z.id, zoneName: z.name_tr, tables: zoneTables })
                      })
                    }
                    const unzoned = data.tables.filter(t => !t.zone_id)
                    if (unzoned.length > 0) groups.push({ zoneId: null, zoneName: null, tables: unzoned })
                    if (!hasZones) groups.splice(0, groups.length, { zoneId: null, zoneName: null, tables: data.tables })

                    const renderTable = (table: any) => {
                      const tableBill = data.openBills.find(b => b.table_id === table.id)
                      const tableSessions = data.activeSessions.filter(s => s.table_id === table.id)
                      const isSelected = selectedTableId === table.id
                      const firstSession = tableSessions[0]
                      const isTelegram = firstSession?.device_id?.startsWith('tg_')
                      return (
                        <button
                          key={table.id}
                          onClick={() => setSelectedTableId(isSelected ? null : table.id)}
                          className={`flex flex-col justify-between p-4 h-36 rounded-3xl border transition duration-300 text-left relative overflow-hidden group ${
                            isSelected ? 'ring-2 ring-amber-500 border-amber-500 bg-zinc-900/80 shadow-lg' : getTableColor(table)
                          }`}
                        >
                          <div className="absolute top-0 right-0 w-16 h-16 bg-white/2 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div>
                            <div className="text-xs font-black text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                              {table.name}
                              {isTelegram && <span className="text-[9px] text-sky-400 font-bold">TG</span>}
                            </div>
                            {firstSession ? (
                              <div className="text-[10px] text-zinc-300 font-semibold mt-0.5 truncate max-w-[90px]">
                                {firstSession.customer_name}
                                {tableSessions.length > 1 && <span className="text-zinc-500"> +{tableSessions.length - 1}</span>}
                              </div>
                            ) : (
                              <div className="text-[10px] text-zinc-500 font-semibold mt-0.5">Kapasite: {table.capacity}</div>
                            )}
                          </div>
                          <div>
                            {tableBill && (
                              <div className="text-xs font-black text-zinc-200 mb-1">{Number(tableBill.total_amount).toFixed(2)} GEL</div>
                            )}
                            <div className="text-[9px] font-black uppercase tracking-wider">{getTableStatusText(table)}</div>
                          </div>
                        </button>
                      )
                    }

                    return (
                      <div className="space-y-6">
                        {groups.map(g => (
                          <div key={g.zoneId ?? '__unzoned__'}>
                            {hasZones && (
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-bold text-zinc-300">
                                  {g.zoneName ?? 'Bölge Atanmamış'}
                                </span>
                                <span className="text-[10px] text-zinc-600">{g.tables.length} masa</span>
                                <div className="flex-1 h-px bg-zinc-800" />
                              </div>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                              {g.tables.map(renderTable)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}

                  {/* Quick Actions — seçili masa */}
                  {selectedTableId && (() => {
                    const t = data.tables.find(t => t.id === selectedTableId)
                    if (!t) return null
                    const bill = data.openBills.find(b => b.table_id === t.id)
                    const sessions = data.activeSessions.filter(s => s.table_id === t.id)
                    return (
                      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-black text-zinc-100">{t.name}</div>
                            <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                              {sessions.length > 0
                                ? sessions.map(s => s.customer_name).join(', ')
                                : 'Boş masa'}
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedTableId(null)}
                            className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {bill && (
                            <button
                              onClick={() => { setActiveTab('cashier'); }}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition active:scale-[0.97]"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              Hesap Al — {Number(bill.total_amount).toFixed(2)} GEL
                            </button>
                          )}
                          <button
                            onClick={() => setActiveTab('kitchen')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold hover:bg-orange-500/20 transition active:scale-[0.97]"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            Mutfak Durumu
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`"${t.name}" masasını sıfırlamak istediğinize emin misiniz?`)) return
                              const res = await resetTableAction(t.id)
                              if (res.success) { setSelectedTableId(null); loadDashboardData(true) }
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition active:scale-[0.97]"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Masayı Sıfırla
                          </button>
                          <button
                            onClick={async () => {
                              await updateTableStatusAction(t.id, 'available')
                              loadDashboardData(false)
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold hover:bg-sky-500/20 transition active:scale-[0.97]"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Temizlendi
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Tab 2: Kitchen Panel */}
              {activeTab === 'kitchen' && (() => {
                const ST_COLOR: Record<string, string> = {
                  amber:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
                  sky:     'bg-sky-500/10 text-sky-400 border-sky-500/20',
                  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                  rose:    'bg-rose-500/10 text-rose-400 border-rose-500/20',
                  violet:  'bg-violet-500/10 text-violet-400 border-violet-500/20',
                }
                const ST_COLOR_ACTIVE: Record<string, string> = {
                  amber:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
                  sky:     'bg-sky-500/20 text-sky-400 border-sky-500/30',
                  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                  rose:    'bg-rose-500/20 text-rose-400 border-rose-500/30',
                  violet:  'bg-violet-500/20 text-violet-400 border-violet-500/30',
                }
                const kitchenOrders = data.activeOrders.filter(order =>
                  selectedStationId === 'all' ||
                  order.order_items?.some((item: any) =>
                    item.products?.categories?.station_id === selectedStationId
                  )
                )
                return (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-100">Mutfak Hazırlık Paneli</h2>
                      <p className="text-xs text-zinc-500">Sipariş alın, hazırlayın ve garsona iletin</p>
                    </div>

                    {/* Station filter pills */}
                    {data.stations.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedStationId('all')}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${
                            selectedStationId === 'all'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-zinc-900/40 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                          }`}
                        >
                          Tümü ({data.activeOrders.length})
                        </button>
                        {data.stations.map((st: any) => {
                          const count = data.activeOrders.filter(o =>
                            o.order_items?.some((item: any) =>
                              item.products?.categories?.station_id === st.id
                            )
                          ).length
                          const isActive = selectedStationId === st.id
                          return (
                            <button
                              key={st.id}
                              onClick={() => setSelectedStationId(st.id)}
                              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${
                                isActive
                                  ? (ST_COLOR_ACTIVE[st.color] || ST_COLOR_ACTIVE.amber)
                                  : 'bg-zinc-900/40 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                              }`}
                            >
                              {st.name}{count > 0 ? ` (${count})` : ''}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {kitchenOrders.length === 0 ? (
                      <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-3xl p-12 text-center text-zinc-500 max-w-lg mx-auto mt-6">
                        <ChefHat className="w-10 h-10 mx-auto text-zinc-700 mb-3" />
                        <div className="text-xs font-bold">
                          {selectedStationId === 'all' ? 'Aktif Sipariş Yok' : 'Bu Birimde Sipariş Yok'}
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-1">
                          {selectedStationId === 'all'
                            ? 'Şu anda hazırlanması gereken bir sipariş bulunmuyor.'
                            : 'Bu birime ait aktif sipariş yok.'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {kitchenOrders.map(order => {
                          const table = data.tables.find(t => t.id === order.table_id)
                          const session = data.activeSessions.find(s => s.id === order.session_id)
                          const timeStr = new Date(order.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                          const isNew = order.status === 'new'
                          const isReady = order.status === 'ready'
                          const orderStations: any[] = Array.from(
                            new Map(
                              order.order_items
                                ?.map((item: any) => item.products?.categories?.stations)
                                .filter(Boolean)
                                .map((s: any) => [s.id, s])
                            ).values()
                          )

                          return (
                            <div key={order.id} className={`rounded-3xl p-5 shadow-xl space-y-4 border ${
                              isNew    ? 'bg-orange-950/20 border-orange-800/30' :
                              isReady  ? 'bg-emerald-950/20 border-emerald-800/30' :
                                         'bg-zinc-900/40 border-zinc-850'
                            }`}>
                              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                                <div>
                                  <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                                    <span>{table?.name || 'Masa'}</span>
                                    <span className="text-[10px] text-zinc-500 font-medium">• {session?.customer_name || 'Müşteri'}</span>
                                    {orderStations.map((st: any) => (
                                      <span key={st.id} className={`px-1.5 py-0.5 rounded-full text-[9px] font-black border ${ST_COLOR[st.color] || ST_COLOR.amber}`}>
                                        {st.name}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="text-[9px] text-zinc-500 flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" /> {timeStr}
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                  isNew   ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                  isReady ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                }`}>
                                  {isNew ? '🆕 Yeni' : isReady ? '✅ Hazır' : '⏳ Hazırlanıyor'}
                                </span>
                              </div>

                              {/* Order Items */}
                              <div className="space-y-2">
                                {order.order_items?.map((item: any) => {
                                  const prodName = item.products?.name_tr || item.products?.name_en || 'Ürün'
                                  return (
                                    <div key={item.id} className="flex items-center justify-between text-xs py-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-amber-400">{item.quantity}x</span>
                                        <span className="text-zinc-300 font-medium">{prodName}</span>
                                        {item.chef_note && (
                                          <span className="text-[9px] text-zinc-500 italic">({item.chef_note})</span>
                                        )}
                                      </div>
                                      <div>
                                        {item.status === 'pending' && (
                                          <button
                                            onClick={() => handleUpdateOrderItemStatus(item.id, 'preparing')}
                                            className="px-2 py-1 rounded-lg bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-orange-400 hover:border-orange-500/30 transition text-[10px] font-bold"
                                          >
                                            Başla
                                          </button>
                                        )}
                                        {item.status === 'preparing' && (
                                          <button
                                            onClick={() => handleUpdateOrderItemStatus(item.id, 'ready')}
                                            className="px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 transition text-[10px] font-bold"
                                          >
                                            Hazır
                                          </button>
                                        )}
                                        {item.status === 'ready' && (
                                          <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-0.5">
                                            <Check className="w-3 h-3" /> Hazır
                                          </span>
                                        )}
                                        {item.status === 'delivered' && (
                                          <span className="text-zinc-600 text-[10px] font-bold">✓ Teslim</span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>

                              {/* Order-level action buttons */}
                              <div className="pt-3 border-t border-zinc-800/60 flex gap-2">
                                {isNew && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold py-2.5 rounded-xl transition"
                                  >
                                    👨‍🍳 Aldım — Hazırlanıyor
                                  </button>
                                )}
                                {order.status === 'preparing' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold py-2.5 rounded-xl transition"
                                  >
                                    🍽 Hazır — Garsona Bildir
                                  </button>
                                )}
                                {isReady && (
                                  <div className="flex-1 text-center text-[10px] text-emerald-400 font-bold py-2.5">
                                    📨 Garson bildirildi, teslim bekleniyor...
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Tab 3: Service Requests */}
              {activeTab === 'requests' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-100">Garson İstek Takip Paneli</h2>
                    <p className="text-xs text-zinc-500">Müşterilerden gelen servis ve garson çağırma taleplerini anlık izleyin</p>
                  </div>

                  {data.activeRequests.length === 0 ? (
                    <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-3xl p-12 text-center text-zinc-500 max-w-lg mx-auto mt-6">
                      <Bell className="w-10 h-10 mx-auto text-zinc-700 mb-3" />
                      <div className="text-xs font-bold">Aktif Talep Yok</div>
                      <p className="text-[10px] text-zinc-600 mt-1">Şu anda masalardan gelen bir talep bulunmuyor.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.activeRequests.map(req => {
                        const table = data.tables.find(t => t.id === req.table_id)
                        const session = data.activeSessions.find(s => s.id === req.session_id)
                        const timeStr = new Date(req.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                        const isAcknowledged = req.status === 'acknowledged'

                        let label = req.type, icon = '🔔'
                        if (req.type === 'waiter')   { label = 'Garson Çağır';     icon = '🙋‍♂️' }
                        else if (req.type === 'bill')    { label = 'Hesap İste';      icon = '🧾' }
                        else if (req.type === 'napkin')  { label = 'Peçete İste';     icon = '🧻' }
                        else if (req.type === 'water')   { label = 'Su İste';         icon = '💧' }
                        else if (req.type === 'salt')    { label = 'Tuz/Karabiber';   icon = '🧂' }
                        else if (req.type === 'cutlery') { label = 'Çatal / Bıçak';  icon = '🍴' }
                        else if (req.type === 'cleaning'){ label = 'Temizlik Talebi'; icon = '🧹' }

                        return (
                          <div
                            key={req.id}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition ${
                              isAcknowledged
                                ? 'bg-sky-950/10 border-sky-800/30'
                                : req.priority === 'red'
                                  ? 'bg-red-950/10 border-red-900/30'
                                  : req.priority === 'blue'
                                    ? 'bg-zinc-900/40 border-zinc-800'
                                    : 'bg-amber-950/10 border-amber-900/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{icon}</span>
                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-2">
                                  <span>{table?.name || 'Masa'}</span>
                                  <span className="text-[10px] text-zinc-500 font-medium">({session?.customer_name || 'Müşteri'})</span>
                                </div>
                                <div className="text-[10px] font-semibold mt-0.5 flex items-center gap-2">
                                  <span className={isAcknowledged ? 'text-sky-400' : req.priority === 'red' ? 'text-red-300' : 'text-amber-300'}>
                                    {label}
                                  </span>
                                  {isAcknowledged && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-black">
                                      👀 Görüldü
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-500">{timeStr}</span>
                              {/* Tekrar Bildir — 60sn cooldown */}
                              {(() => {
                                const lastSent = resendCooldowns[req.id] || 0
                                const elapsed = Date.now() - lastSent
                                const onCooldown = elapsed < 60_000
                                const remaining = Math.ceil((60_000 - elapsed) / 1000)
                                return (
                                  <button
                                    disabled={onCooldown}
                                    onClick={async () => {
                                      setResendCooldowns(p => ({ ...p, [req.id]: Date.now() }))
                                      await resendServiceRequestNotificationAction(req.id)
                                    }}
                                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 active:scale-[0.98] transition disabled:opacity-30 disabled:cursor-not-allowed"
                                    title={onCooldown ? `${remaining}sn sonra tekrar gönderebilirsin` : 'Tekrar bildirim gönder'}
                                  >
                                    🔔 {onCooldown ? `${remaining}s` : 'Tekrar'}
                                  </button>
                                )
                              })()}
                              {!isAcknowledged ? (
                                <button
                                  onClick={() => handleAcknowledgeRequest(req.id)}
                                  className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 active:scale-[0.98] transition"
                                >
                                  👀 Gördüm
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleCompleteRequest(req.id)}
                                  className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 active:scale-[0.98] transition"
                                >
                                  <Check className="w-3.5 h-3.5" /> Tamamlandı
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Cashier */}
              {activeTab === 'cashier' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-100">Kasa & Adisyon İşlemleri</h2>
                    <p className="text-xs text-zinc-500">Tüm masalardaki açık hesap durumlarını ve ödemeleri tek panelden izleyin</p>
                  </div>

                  {data.openBills.length === 0 ? (
                    <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-3xl p-12 text-center text-zinc-500 max-w-lg mx-auto mt-6">
                      <CreditCard className="w-10 h-10 mx-auto text-zinc-700 mb-3" />
                      <div className="text-xs font-bold">Açık Adisyon Yok</div>
                      <p className="text-[10px] text-zinc-600 mt-1">Şu anda ödeme bekleyen bir hesap bulunmuyor.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {data.openBills.map(bill => {
                        const table = data.tables.find(t => t.id === bill.table_id)
                        const sessions = data.activeSessions.filter(s => s.table_id === bill.table_id)
                        const total = Number(bill.total_amount)
                        const paid = Number(bill.paid_amount || 0)
                        const remaining = total - paid
                        return (
                          <div
                            key={bill.id}
                            onClick={() => setSelectedTableId(bill.table_id)}
                            className="bg-zinc-900/40 border border-zinc-850 hover:border-zinc-700 rounded-3xl p-5 shadow-xl flex flex-col justify-between h-48 cursor-pointer transition"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-xs font-bold text-white">{table?.name || 'Masa'}</div>
                                <p className="text-[9px] text-zinc-500 font-semibold mt-0.5">Aktif Oturum: {sessions.length} Kişi</p>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Açık Hesap
                              </span>
                            </div>
                            <div className="space-y-1.5 pt-4">
                              <div className="flex justify-between text-xs">
                                <span className="text-zinc-500 font-medium">Toplam Tutar:</span>
                                <span className="text-white font-bold">{total.toFixed(2)} GEL</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-zinc-500 font-medium">Ödenen:</span>
                                <span className="text-emerald-400 font-bold">{paid.toFixed(2)} GEL</span>
                              </div>
                              <div className="flex justify-between text-xs border-t border-zinc-850 pt-1.5 font-bold">
                                <span className="text-zinc-400">Kalan Tutar:</span>
                                <span className="text-amber-400">{remaining.toFixed(2)} GEL</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>

        {/* Right Sidebar: Table Details */}
        {selectedTableId && selectedTable && (
          <aside className="w-full md:w-96 bg-zinc-950 border-l border-zinc-900 overflow-y-auto shrink-0 flex flex-col h-full z-10">
            <div className="p-5 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/20">
              <div>
                <h3 className="font-bold text-sm text-zinc-200">{selectedTable.name} Detayları</h3>
                <p className="text-[10px] text-zinc-500 font-medium">Aktif Oturum & Adisyon Kontrolü</p>
              </div>
              <button
                onClick={() => { setSelectedTableId(null); setPaymentError(''); setPaymentSuccess('') }}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex-1 space-y-6">
              {/* Sessions */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Masa Oturumları</h4>
                {tableSessions.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">Bu masada şu an aktif oturum yok.</p>
                ) : (
                  <div className="space-y-2">
                    {tableSessions.map(s => {
                      const orderCount = tableOrders.filter(o => o.session_id === s.id).length
                      return (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/40 border border-zinc-850">
                          <div>
                            <div className="text-xs font-bold text-white">{s.customer_name}</div>
                            <div className="text-[9px] text-zinc-500 font-medium">#{s.id.slice(0, 8).toUpperCase()}</div>
                          </div>
                          <span className="text-[9px] bg-zinc-800 border border-zinc-750 px-2 py-0.5 rounded-full text-zinc-400 font-semibold">
                            {orderCount} Sipariş
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Masa Sipariş Kalemleri</h4>
                {tableOrders.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic">Masa henüz bir sipariş vermedi.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-zinc-900 rounded-2xl p-3 bg-zinc-950/40">
                    {tableOrders.map(o => (
                      <div key={o.id} className="space-y-1.5 border-b border-zinc-900/60 last:border-b-0 pb-2 mb-2 last:pb-0 last:mb-0">
                        {o.order_items?.map((item: any) => {
                          const prodName = item.products?.name_tr || item.products?.name_en || 'Ürün'
                          return (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                              <span className="text-zinc-400 font-medium"><span className="text-amber-500/80 font-bold">{item.quantity}x</span> {prodName}</span>
                              <span className={`text-[9px] font-bold uppercase ${item.status === 'delivered' ? 'text-emerald-400' : item.status === 'ready' ? 'text-sky-400' : 'text-orange-400'}`}>
                                {item.status === 'delivered' ? 'Teslim' : item.status === 'ready' ? 'Hazır' : 'Hazırlanıyor'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Billing */}
              {activeBill ? (
                <div className="space-y-4 pt-4 border-t border-zinc-900">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Adisyon Hesabı</h4>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase">Aktif</span>
                  </div>

                  <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Adisyon Toplam:</span>
                      <span className="font-bold text-white">{Number(activeBill.total_amount).toFixed(2)} GEL</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Ödenen Tutar:</span>
                      <span className="font-bold text-emerald-400">{Number(activeBill.paid_amount || 0).toFixed(2)} GEL</span>
                    </div>
                    <div className="flex justify-between text-xs border-t border-zinc-800/80 pt-2 font-bold">
                      <span className="text-zinc-200">Kalan Borç:</span>
                      <span className="text-amber-400">{(Number(activeBill.total_amount) - Number(activeBill.paid_amount || 0)).toFixed(2)} GEL</span>
                    </div>
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase">Ödeme Türü</label>
                      <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-850">
                        <button type="button" onClick={() => { setPaymentType('full'); setPayAmount('') }}
                          className={`py-1.5 text-xs font-bold rounded-lg transition ${paymentType === 'full' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                          Tam Kapat
                        </button>
                        <button type="button" onClick={() => setPaymentType('partial')}
                          className={`py-1.5 text-xs font-bold rounded-lg transition ${paymentType === 'partial' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                          Kısmi Kapat
                        </button>
                      </div>
                    </div>

                    {paymentType === 'partial' && (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-zinc-500 uppercase">Ödenecek Miktar (GEL)</label>
                        <input
                          type="number" step="0.01" required
                          value={payAmount}
                          onChange={e => setPayAmount(e.target.value)}
                          placeholder="Örn: 20.00"
                          className="w-full bg-zinc-950 border border-zinc-850 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase">Ödeme Yöntemi</label>
                      <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-850">
                        <button type="button" onClick={() => setPaymentMethod('cash')}
                          className={`py-1.5 text-xs font-bold rounded-lg transition ${paymentMethod === 'cash' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'text-zinc-500 hover:text-zinc-300'}`}>
                          💵 Nakit
                        </button>
                        <button type="button" onClick={() => setPaymentMethod('card')}
                          className={`py-1.5 text-xs font-bold rounded-lg transition ${paymentMethod === 'card' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'text-zinc-500 hover:text-zinc-300'}`}>
                          💳 Kredi Kartı
                        </button>
                      </div>
                    </div>

                    {paymentError && (
                      <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{paymentError}</span>
                      </div>
                    )}
                    {paymentSuccess && (
                      <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl text-xs flex items-start gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{paymentSuccess}</span>
                      </div>
                    )}

                    <button type="submit"
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition text-xs flex items-center justify-center gap-1 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98]">
                      <Check className="w-4 h-4" /> Ödemeyi Kaydet
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-zinc-900/20 border border-zinc-900/50 rounded-2xl p-4 text-center text-zinc-500 text-xs">
                  Adisyon kaydı bulunmuyor.
                </div>
              )}

              {/* Reset Table */}
              <div className="pt-6 border-t border-zinc-900">
                <button
                  onClick={() => handleResetTable(selectedTable.id)}
                  className="w-full bg-zinc-900 hover:bg-red-950/20 border border-zinc-800 hover:border-red-900/30 text-zinc-400 hover:text-red-400 font-bold py-3 rounded-xl transition text-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Trash2 className="w-4 h-4" /> Masayı Sıfırla & Oturumları Kapat
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
