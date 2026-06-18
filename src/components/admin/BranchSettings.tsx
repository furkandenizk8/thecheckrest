'use client'

import React, { useEffect, useState } from 'react'
import { Star, Save, ExternalLink } from 'lucide-react'
import { fetchBranchesAction, fetchBranchSettingsAction, updateBranchSettingsAction } from '@/app/actions/admin'

interface BranchSettingsProps {
  embedded?: boolean
}

export default function BranchSettings({ embedded }: BranchSettingsProps) {
  const [branchId, setBranchId] = useState('')
  const [googleUrl, setGoogleUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBranchesAction().then(branches => {
      if (branches.length > 0) setBranchId(branches[0].id)
    })
  }, [])

  useEffect(() => {
    if (!branchId) return
    setLoading(true)
    fetchBranchSettingsAction(branchId).then(data => {
      if (data) setGoogleUrl((data as any).google_reviews_url || '')
      setLoading(false)
    })
  }, [branchId])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await updateBranchSettingsAction(branchId, { google_reviews_url: googleUrl.trim() })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className={`${embedded ? 'h-full overflow-y-auto' : ''} p-6`}>
      <div className="max-w-xl space-y-6">
        <div>
          <h2 className="text-sm font-bold text-zinc-100 mb-1">Şube Ayarları</h2>
          <p className="text-[11px] text-zinc-500">Memnuniyet anketi ve genel şube yapılandırması</p>
        </div>

        {/* Google Yorumlar */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-zinc-200">Google Yorum Linki</span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            4 ve 5 yıldız veren müşterilere ödeme sonrası bu link gönderilir.
            Google İşletme → Yorumlar → &quot;Yorum almak için bağlantı al&quot; adımından alabilirsiniz.
          </p>

          {loading ? (
            <div className="h-9 bg-zinc-800 rounded-xl animate-pulse" />
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                value={googleUrl}
                onChange={e => setGoogleUrl(e.target.value)}
                placeholder="https://g.page/r/XXXXXXXXXXXX/review"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
              />
              {googleUrl && (
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 hover:text-zinc-200 transition"
                  title="Linki test et"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-xl transition disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Kaydediliyor...' : saved ? '✓ Kaydedildi' : 'Kaydet'}
          </button>
        </div>

        {/* Bilgi notu */}
        <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4 text-[11px] text-zinc-500 space-y-1">
          <p className="font-semibold text-zinc-400">Nasıl çalışır?</p>
          <p>• Ödeme tamamlandığında Telegram üzerinden müşteriye 1–5 ⭐ anket gönderilir.</p>
          <p>• 4 veya 5 ⭐ verirlerse yukarıdaki Google link otomatik olarak gönderilir.</p>
          <p>• 1–3 ⭐ verirlerse sadece teşekkür mesajı gösterilir.</p>
        </div>
      </div>
    </div>
  )
}
