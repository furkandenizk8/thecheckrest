'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  setupWebhook, 
  sendTestNotification, 
  getSystemStatus 
} from '@/app/actions/admin'
import { 
  Bot, 
  Database, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Send, 
  QrCode, 
  ExternalLink, 
  ChefHat, 
  Users, 
  CreditCard,
  Bell,
  Globe,
  Settings,
  HelpCircle
} from 'lucide-react'

interface SystemStatus {
  dbConnected: boolean
  counts: {
    branches: number
    tables: number
    products: number
  }
  env: {
    hasBotToken: boolean
    hasChatId: boolean
    hasSupabaseUrl: boolean
    hasSupabaseAnon: boolean
  }
  error?: string
}

export default function SetupDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [appUrl, setAppUrl] = useState('')
  const [webhookLoading, setWebhookLoading] = useState(false)
  const [webhookResult, setWebhookResult] = useState<{ success: boolean; message: string; botInfo?: any } | null>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Auto-detect deployment URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin)
    }
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    setLoadingStatus(true)
    try {
      const data = await getSystemStatus()
      setStatus(data as SystemStatus)
    } catch (err) {
      console.error('Failed to load status', err)
    } finally {
      setLoadingStatus(false)
    }
  }

  const handleRegisterWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appUrl) return

    setWebhookLoading(true)
    setWebhookResult(null)

    try {
      const res = await setupWebhook(appUrl)
      if (res.success) {
        setWebhookResult({
          success: true,
          message: `Webhook başarıyla kaydedildi!`,
          botInfo: res.botInfo
        })
      } else {
        setWebhookResult({
          success: false,
          message: res.error || 'Webhook kaydı başarısız oldu.'
        })
      }
    } catch (err: any) {
      setWebhookResult({
        success: false,
        message: err.message || 'Beklenmeyen bir hata oluştu.'
      })
    } finally {
      setWebhookLoading(false)
    }
  }

  const handleSendTestMessage = async () => {
    setTestLoading(true)
    setTestResult(null)

    try {
      const res = await sendTestNotification()
      if (res.success) {
        setTestResult({
          success: true,
          message: 'Test mesajı Telegram grubunuza gönderildi! Grubunuzu kontrol edin.'
        })
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Test mesajı gönderilemedi.'
        })
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Beklenmeyen hata.'
      })
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[350px] h-[350px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs font-semibold mb-4 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            thecheckmenu Sistem Console
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-3">
            thecheckmenu
          </h1>
          <p className="text-zinc-400 text-base max-w-lg mx-auto font-medium">
            Akıllı QR Kod Masa Siparişi, Çoklu Şube Yönetimi ve Personel/Servis Kontrol Paneli
          </p>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Diagnostics & Environment */}
          <div className="space-y-8 lg:col-span-1">
            
            {/* Supabase Status Card */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Database className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-200">Veritabanı Durumu</h3>
                    <p className="text-[10px] text-zinc-500">Supabase PostgreSQL</p>
                  </div>
                </div>

                <button 
                  onClick={fetchStatus}
                  disabled={loadingStatus}
                  className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 transition duration-300 disabled:opacity-50"
                  title="Yenile"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${loadingStatus ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingStatus ? (
                <div className="py-6 flex justify-center">
                  <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                </div>
              ) : status?.dbConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Veritabanı Bağlantısı Başarılı
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 text-center">
                      <span className="block text-xl font-bold text-white">{status.counts.branches}</span>
                      <span className="text-[10px] text-zinc-500 font-medium">Şube</span>
                    </div>
                    <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 text-center">
                      <span className="block text-xl font-bold text-white">{status.counts.tables}</span>
                      <span className="text-[10px] text-zinc-500 font-medium">Masa</span>
                    </div>
                    <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3 text-center">
                      <span className="block text-xl font-bold text-white">{status.counts.products}</span>
                      <span className="text-[10px] text-zinc-500 font-medium">Ürün</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                    <XCircle className="w-4 h-4 shrink-0" />
                    Bağlantı Hatası
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-normal">
                    {status?.error || 'Supabase bilgileriniz geçersiz veya tablolar/seed verisi yüklenmemiş.'}
                  </p>
                </div>
              )}
            </div>

            {/* Environment Variables Card */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-200">Çevre Değişkenleri (Env)</h3>
                  <p className="text-[10px] text-zinc-500">.env.local / Vercel Env</p>
                </div>
              </div>

              {loadingStatus ? (
                <div className="py-6 flex justify-center">
                  <div className="w-5 h-5 border-2 border-zinc-800 border-t-zinc-600 rounded-full animate-spin" />
                </div>
              ) : status && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/50">
                    <span className="text-zinc-500 font-medium">SUPABASE_URL</span>
                    {status.env?.hasSupabaseUrl ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">Yüklendi</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 text-[10px] font-semibold border border-red-500/20">Eksik</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/50">
                    <span className="text-zinc-500 font-medium">SUPABASE_ANON_KEY</span>
                    {status.env?.hasSupabaseAnon ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">Yüklendi</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 text-[10px] font-semibold border border-red-500/20">Eksik</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/50">
                    <span className="text-zinc-500 font-medium">TELEGRAM_BOT_TOKEN</span>
                    {status.env?.hasBotToken ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">Yüklendi</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 text-[10px] font-semibold border border-red-500/20">Eksik</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs py-1.5">
                    <span className="text-zinc-500 font-medium">TELEGRAM_CHAT_ID</span>
                    {status.env?.hasChatId ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">Yüklendi</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 text-[10px] font-semibold border border-red-500/20">Eksik</span>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Webhook Setup, QR Sim, and Panels */}
          <div className="space-y-8 lg:col-span-2">
            
            {/* Telegram Webhook Card */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-200">Telegram Bot & Webhook Yöneticisi</h3>
                  <p className="text-[10px] text-zinc-500">Müşteri Web App & Bildirim Altyapısı</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Müşterileriniz QR kodu okuturken <b>Telegram Bot</b> seçeneğini işaretlerse, botumuz onlara dinamik bir açılış butonu sağlar. Bunun için Telegram API&apos;ye web uygulamanızın canlı URL&apos;sini bildirmeniz gerekir.
                </p>

                <form onSubmit={handleRegisterWebhook} className="space-y-3">
                  <label className="block text-xs font-semibold text-zinc-400">Canlı Vercel Uygulama URL&apos;niz</label>
                  <div className="flex gap-2">
                    <input 
                      type="url"
                      required
                      value={appUrl}
                      onChange={(e) => setAppUrl(e.target.value)}
                      placeholder="https://siteniz.vercel.app"
                      className="flex-1 bg-zinc-950/80 border border-zinc-850 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={webhookLoading || !status?.env?.hasBotToken}
                      className="bg-sky-500 hover:bg-sky-600 active:scale-[0.98] transition-all duration-300 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shrink-0 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {webhookLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : 'Webhook Tanımla'}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-600">
                    Örn: <code className="text-zinc-500">https://thecheckrest.vercel.app</code> (Otomatik olarak algılanan: {appUrl})
                  </p>
                </form>

                {/* Webhook Result Banner */}
                {webhookResult && (
                  <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                    webhookResult.success 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    <div className="font-semibold mb-1">
                      {webhookResult.success ? '✓ Başarılı!' : '⚠️ Hata Oluştu'}
                    </div>
                    <div>{webhookResult.message}</div>
                    
                    {webhookResult.botInfo && (
                      <div className="mt-3 bg-zinc-950/80 rounded-xl p-3 border border-zinc-800/80 space-y-1 text-zinc-300">
                        <div>🤖 <b>Bot Adı:</b> {webhookResult.botInfo.firstName}</div>
                        <div>🔗 <b>Bot Username:</b> <a href={`https://t.me/${webhookResult.botInfo.username}`} target="_blank" rel="noopener noreferrer" className="text-sky-400 font-semibold hover:underline inline-flex items-center gap-0.5">@{webhookResult.botInfo.username} <ExternalLink className="w-3 h-3" /></a></div>
                        <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/60 mt-1">
                          Telefonunuzdan bota gidin, masanızdaki QR linkini test etmek için bota <b>/start masa1</b> yazın veya QR simülasyonunu kullanın.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Test Notification Trigger */}
                <div className="pt-4 border-t border-zinc-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-300">Telegram Bildirim Testi</h4>
                    <p className="text-[10px] text-zinc-500">Grup bildirimlerinin (sipariş/garson çağrısı) çalıştığını test edin.</p>
                  </div>
                  <button
                    onClick={handleSendTestMessage}
                    disabled={testLoading || !status?.env?.hasBotToken || !status?.env?.hasChatId}
                    className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-zinc-300 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {testLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-zinc-400/30 border-t-zinc-400 rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Test Bildirimi Gönder
                      </>
                    )}
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-xl border text-xs ${
                    testResult.success 
                      ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                      : 'bg-red-500/5 border-red-500/10 text-red-400'
                  }`}>
                    {testResult.message}
                  </div>
                )}
              </div>
            </div>

            {/* Test Tables & QR Codes */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-200">Masa QR Simülasyonu</h3>
                  <p className="text-[10px] text-zinc-500">Masa kodlarını taratıp müşteri sipariş ekranına geçiş yapın</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Tbilisi Central Branch */}
                <div>
                  <div className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Gusto Tbilisi Central (Şube 1 - GEL)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { name: 'Masa 1', token: 'masa1', cap: 4 },
                      { name: 'Masa 2', token: 'masa2', cap: 2 },
                      { name: 'Masa 3', token: 'masa3', cap: 6 },
                      { name: 'VIP Loca 1', token: 'vip1', cap: 8 },
                    ].map((item) => (
                      <Link 
                        key={item.token}
                        href={`/m/${item.token}`}
                        target="_blank"
                        className="group flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-850 hover:border-amber-500/40 hover:bg-zinc-900/60 transition-all duration-300"
                      >
                        <div>
                          <div className="text-xs font-bold text-zinc-200 group-hover:text-amber-400 transition-colors">{item.name}</div>
                          <div className="text-[10px] text-zinc-500 font-medium">Kapasite: {item.cap} Kişilik • Token: {item.token}</div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800/80 group-hover:border-amber-500/20 flex items-center justify-center text-zinc-400 group-hover:text-amber-400 transition-all">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Batumi Boulevard Branch */}
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Gusto Batumi Boulevard (Şube 2 - GEL)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { name: 'Masa B1', token: 'masab1', cap: 4 },
                      { name: 'Teras Masa 5', token: 'teras5', cap: 2 },
                    ].map((item) => (
                      <Link 
                        key={item.token}
                        href={`/m/${item.token}`}
                        target="_blank"
                        className="group flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-850 hover:border-amber-500/40 hover:bg-zinc-900/60 transition-all duration-300"
                      >
                        <div>
                          <div className="text-xs font-bold text-zinc-200 group-hover:text-amber-400 transition-colors">{item.name}</div>
                          <div className="text-[10px] text-zinc-500 font-medium">Kapasite: {item.cap} Kişilik • Token: {item.token}</div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800/80 group-hover:border-amber-500/20 flex items-center justify-center text-zinc-400 group-hover:text-amber-400 transition-all">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Restaurant Panels Quick Access */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-200">Personel & Yönetim Panelleri</h3>
                  <p className="text-[10px] text-zinc-500">İşletme yetkilileri için sipariş ve talep takip ekranları</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Mutfak Hazırlık Paneli', desc: 'Gelen siparişleri hazırlama ve durum güncelleme', link: '/panel/kitchen', icon: ChefHat, color: 'text-orange-400 bg-orange-500/10' },
                  { name: 'Masa Durum & Sipariş Haritası', desc: 'Masaların doluluk oranlarını ve talepleri anlık izleme', link: '/panel/tables', icon: Users, color: 'text-indigo-400 bg-indigo-500/10' },
                  { name: 'Adisyon & Kasa İşlemleri', desc: 'Hesap kapatma, ödeme alma ve nakit/kart fiş yönetimi', link: '/panel/cashier', icon: CreditCard, color: 'text-emerald-400 bg-emerald-500/10' },
                  { name: 'Garson İstek Takip Paneli', desc: 'Müşterilerden gelen servis ve garson çağırma talepleri', link: '/panel/requests', icon: Bell, color: 'text-amber-400 bg-amber-500/10' },
                ].map((panel) => (
                  <Link 
                    key={panel.link}
                    href={panel.link}
                    className="group block p-4 rounded-2xl bg-zinc-950/60 border border-zinc-850 hover:border-orange-500/30 hover:bg-zinc-900/60 transition-all duration-300"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-zinc-800 ${panel.color}`}>
                        <panel.icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-zinc-200 group-hover:text-orange-400 transition-colors flex items-center gap-1">
                          {panel.name}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[10px] text-zinc-500 leading-normal mt-0.5">{panel.desc}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-[11px] text-zinc-600 border-t border-zinc-900 pt-6">
          <p>© 2026 thecheckmenu Restaurant Solutions. Tüm Hakları Saklıdır.</p>
        </footer>

      </div>
    </div>
  )
}
