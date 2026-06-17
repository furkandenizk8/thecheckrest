import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { resolveTableToken } from '@/lib/restaurant/sessions'
import SessionStartForm from '@/components/customer/SessionStartForm'
import { AlertTriangle, HelpCircle } from 'lucide-react'

// Server Component (Next.js 16 App Router)
interface PageProps {
  params: Promise<{
    tableToken: string
  }>
}

export default async function TableLandingPage({ params }: PageProps) {
  const { tableToken } = await params
  
  const supabase = await createClient()
  const tableDetails = await resolveTableToken(supabase, tableToken)

  // Geçersiz QR kod durumunda premium hata ekranı göster
  if (!tableDetails) {
    return (
      <div className="flex-1 flex flex-col justify-between p-6 min-h-screen text-center">
        <div className="flex-1 flex flex-col justify-center items-center py-12">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-black text-white mb-3">
            Geçersiz QR Kod
          </h1>
          
          <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
            Okuttuğunuz QR kod sistemimizde kayıtlı bir masaya ait değil veya pasif durumdadır.
          </p>
          
          <div className="mt-8 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4 text-left max-w-xs flex gap-3 items-start">
            <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-500 leading-normal">
              <span className="font-semibold text-zinc-300 block mb-1">Ne Yapabilirsiniz?</span>
              Masada bulunan QR kodu tekrar okutmayı deneyin veya restoran görevlilerinden yardım isteyin.
            </div>
          </div>
        </div>

        <div className="py-4">
          <p className="text-[10px] text-zinc-700">
            Error Code: INVALID_QR_TOKEN
          </p>
        </div>
      </div>
    )
  }

  // Fetch bot username dynamically using Next.js cached fetch (revalidated every hour)
  let botUsername = 'thecheckmenubot'
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (botToken) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
        next: { revalidate: 3600 }
      })
      const data = await res.json()
      if (data.ok && data.result?.username) {
        botUsername = data.result.username
      }
    } catch (e) {
      console.error('Failed to fetch bot username:', e)
    }
  }

  // Geçerli masa durumunda giriş formunu yükle
  return (
    <SessionStartForm 
      tableDetails={tableDetails} 
      tableToken={tableToken} 
      botUsername={botUsername}
    />
  )
}
