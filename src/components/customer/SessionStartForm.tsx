'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { nanoid } from 'nanoid'
import { translations, Language } from '@/lib/i18n/customer'
import { startCustomerSession } from '@/app/actions/session'
import { Utensils, Globe, User, ChevronRight, AlertCircle, Send } from 'lucide-react'

interface SessionStartFormProps {
  tableDetails: {
    id: string
    name: string
    branch_id: string
    branch_name: string
    currency: string
    service_fee_percent: number
    languages: string[]
  }
  tableToken: string
  botUsername?: string
}

const LANGUAGE_LABELS: Record<Language, { label: string; flag: string }> = {
  tr: { label: 'Türkçe', flag: '🇹🇷' },
  en: { label: 'English', flag: '🇬🇧' },
  ru: { label: 'Русский', flag: '🇷🇺' },
  ka: { label: 'ქართული', flag: '🇬🇪' },
}

export default function SessionStartForm({ tableDetails, tableToken, botUsername = 'thecheckmenubot' }: SessionStartFormProps) {
  const router = useRouter()
  
  // Şubenin desteklediği dilleri filtrele (veri tabanından gelen array'e göre)
  const availableLanguages = (tableDetails.languages || ['tr', 'en']) as Language[]
  
  const [selectedLang, setSelectedLang] = useState<Language>(
    availableLanguages.includes('tr') ? 'tr' : availableLanguages[0] || 'en'
  )
  const [customerName, setCustomerName] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [platform, setPlatform] = useState<'web' | 'telegram'>('web')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Cihaz kimliğini localStorage'da sakla (tekil cihaz takibi için)
  useEffect(() => {
    let savedDeviceId = localStorage.getItem('checkmenu_device_id')
    if (!savedDeviceId) {
      savedDeviceId = 'dev_' + nanoid(12)
      localStorage.setItem('checkmenu_device_id', savedDeviceId)
    }
    setDeviceId(savedDeviceId)
  }, [])

  const t = translations[selectedLang] || translations.en

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim()) {
      setError(t.requiredField)
      return
    }

    setLoading(false)
    setError('')
    setLoading(true)

    try {
      const result = await startCustomerSession({
        tableId: tableDetails.id,
        branchId: tableDetails.branch_id,
        customerName: customerName.trim(),
        deviceId: deviceId || 'anonymous_dev',
        language: selectedLang,
        tableToken: tableToken
      })

      if (result.success) {
        // Sepete/menüye yönlendir
        router.push(`/m/${tableToken}/menu`)
      } else {
        setError(result.error || 'Bir hata oluştu')
        setLoading(false)
      }
    } catch (err: any) {
      console.error(err)
      setError('Bağlantı hatası oluştu.')
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-6 min-h-screen">
      {/* Üst Kısım: Logo ve Karşılama */}
      <div className="flex-1 flex flex-col justify-center items-center py-8">
        <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-6 animate-pulse">
          <Utensils className="w-10 h-10 text-white" />
        </div>
        
        <h2 className="text-sm font-semibold tracking-wider text-amber-500 uppercase mb-2">
          {tableDetails.branch_name}
        </h2>
        
        <h1 className="text-3xl font-extrabold text-white text-center mb-1">
          {t.welcome}
        </h1>
        
        <div className="mt-2 bg-zinc-900 border border-zinc-800/80 px-4 py-1.5 rounded-full flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-semibold text-zinc-400">
            {t.table}: <span className="text-white">{tableDetails.name}</span>
          </span>
        </div>
      </div>

      {/* Orta Kısım: Form ve Seçenekler */}
      <div className="w-full bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        {/* Dekoratif Işık Efekti */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dil Seçimi */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              {t.languageSelect}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableLanguages.map((lang) => {
                const isSelected = selectedLang === lang
                const info = LANGUAGE_LABELS[lang] || { label: lang, flag: '🌐' }
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLang(lang)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all duration-300 font-medium ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-md shadow-amber-500/5'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    <span className="text-base leading-none">{info.flag}</span>
                    <span>{info.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Platform Seçimi */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              {selectedLang === 'tr' ? 'Giriş Yöntemi' : 
               selectedLang === 'ka' ? 'შესვლის მეთოდი' : 
               selectedLang === 'ru' ? 'Способ входа' : 'Access Method'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlatform('web')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all duration-300 font-medium ${
                  platform === 'web'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>
                  {selectedLang === 'tr' ? 'Web Tarayıcı' : 
                   selectedLang === 'ka' ? 'ვებ ბრაუზერი' : 
                   selectedLang === 'ru' ? 'Веб-браузер' : 'Web Browser'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPlatform('telegram')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all duration-300 font-medium ${
                  platform === 'telegram'
                    ? 'bg-gradient-to-r from-sky-500/10 to-sky-600/10 border-sky-500 text-sky-400'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>
                  {selectedLang === 'tr' ? 'Telegram Bot' : 
                   selectedLang === 'ka' ? 'ტელეგრამ ბოტი' : 
                   selectedLang === 'ru' ? 'Телеграм бот' : 'Telegram Bot'}
                </span>
              </button>
            </div>
          </div>

          {platform === 'web' ? (
            <>
              {/* İsim Girişi */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {t.enterName}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value)
                      if (e.target.value.trim()) setError('')
                    }}
                    placeholder={t.namePlaceholder}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                    disabled={loading}
                  />
                </div>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  {t.welcomeMessage}
                </p>
              </div>

              {/* Hata Mesajı */}
              {error && (
                <div className="flex items-start gap-2 bg-red-950/30 border border-red-900/40 rounded-xl p-3 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Giriş Butonu */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-3.5 rounded-xl transition duration-300 shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 group text-sm"
              >
                {loading ? t.loading : (
                  <>
                    <span>{t.startSession}</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="space-y-4 pt-2">
              <p className="text-xs text-zinc-400 text-center leading-relaxed">
                {selectedLang === 'tr' ? 'Telegram uygulaması üzerinden devam ederek daha kolay sipariş verebilir, bildirimleri anlık olarak alabilirsiniz.' : 
                 selectedLang === 'ka' ? 'ტელეგრამის საშუალებით შეკვეთა უფრო მარტივია, მიიღეთ შეტყობინებები მყისიერად.' : 
                 selectedLang === 'ru' ? 'Продолжайте в Telegram для более удобного заказа и получения мгновенных уведомлений.' : 
                 'Continue via Telegram for an easier ordering experience and instant notifications.'}
              </p>
              
              <button
                type="button"
                onClick={() => {
                  window.location.href = `https://t.me/${botUsername}?start=${tableToken}`
                }}
                className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold py-3.5 rounded-xl transition duration-300 shadow-lg shadow-sky-500/20 active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
              >
                <Send className="w-4 h-4 fill-white" />
                <span>
                  {selectedLang === 'tr' ? 'Telegram ile Devam Et' : 
                   selectedLang === 'ka' ? 'ტელეგრამით გაგრძელება' : 
                   selectedLang === 'ru' ? 'Продолжить в Telegram' : 'Continue with Telegram'}
                </span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Alt Bilgi */}
      <div className="py-4 text-center">
        <p className="text-[10px] text-zinc-600">
          Powered by <span className="font-semibold text-zinc-500">thecheckmenu</span>
        </p>
      </div>
    </div>
  )
}
