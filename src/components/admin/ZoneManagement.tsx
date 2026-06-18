'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  fetchBranchesAction, fetchZonesAction, createZoneAction, updateZoneAction, deleteZoneAction,
} from '@/app/actions/admin'
import { Plus, Edit2, Trash2, MapPin, Save, X, Loader2, Languages, SendHorizonal } from 'lucide-react'

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

interface ZoneForm {
  name_tr: string
  name_en: string
  name_ka: string
  name_ru: string
  telegram_chat_id: string
  sort_order: string
}

const EMPTY_FORM: ZoneForm = {
  name_tr: '', name_en: '', name_ka: '', name_ru: '',
  telegram_chat_id: '', sort_order: '0',
}

export default function ZoneManagement({ embedded }: { embedded?: boolean }) {
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [zones, setZones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState<ZoneForm>(EMPTY_FORM)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBranchesAction().then(b => {
      setBranches(b)
      if (b.length > 0) setSelectedBranchId(b[0].id)
    })
  }, [])

  const load = useCallback(async () => {
    if (!selectedBranchId) return
    setLoading(true)
    const data = await fetchZonesAction(selectedBranchId)
    setZones(data)
    setLoading(false)
  }, [selectedBranchId])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setShowAddModal(true); setError('') }
  const openEdit = (z: any) => {
    setForm({
      name_tr: z.name_tr,
      name_en: z.name_en || '',
      name_ka: z.name_ka || '',
      name_ru: z.name_ru || '',
      telegram_chat_id: z.telegram_chat_id || '',
      sort_order: String(z.sort_order ?? 0),
    })
    setEditingId(z.id)
    setShowAddModal(true)
    setError('')
  }
  const closeModal = () => { setShowAddModal(false); setEditingId(null); setForm(EMPTY_FORM) }

  const handleAutoTranslate = async () => {
    if (!form.name_tr.trim()) { setError('Önce Türkçe adı girin.'); return }
    setTranslating(true)
    setError('')
    const result = await autoTranslate(form.name_tr)
    if (result) {
      setForm(f => ({ ...f, name_en: result.en, name_ka: result.ka, name_ru: result.ru }))
    }
    setTranslating(false)
  }

  const handleSave = async () => {
    if (!form.name_tr.trim()) { setError('Bölge adı (TR) zorunludur.'); return }
    setSaving(true)
    setError('')
    const payload = {
      name_tr: form.name_tr.trim(),
      name_en: form.name_en.trim() || form.name_tr.trim(),
      name_ka: form.name_ka.trim() || form.name_tr.trim(),
      name_ru: form.name_ru.trim() || form.name_tr.trim(),
      telegram_chat_id: form.telegram_chat_id.trim() || undefined,
      sort_order: parseInt(form.sort_order) || 0,
    }
    const res = editingId
      ? await updateZoneAction(editingId, payload)
      : await createZoneAction(selectedBranchId, payload)
    setSaving(false)
    if (!res.success) { setError((res as any).error || 'Hata oluştu.'); return }
    closeModal()
    load()
  }

  const handleDelete = async (zoneId: string, name: string) => {
    if (!confirm(`"${name}" bölgesini silmek istediğinize emin misiniz? Bu bölgeye atanmış masalar bölgesiz kalacak.`)) return
    await deleteZoneAction(zoneId)
    load()
  }

  const handleToggleActive = async (z: any) => {
    await updateZoneAction(z.id, { is_active: !z.is_active })
    load()
  }

  return (
    <div className={embedded ? 'h-full overflow-y-auto bg-[#050507] text-zinc-100 p-6' : 'min-h-screen bg-[#050507] text-zinc-100 p-6'}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Bölge Yönetimi</h1>
            <p className="text-xs text-zinc-500 mt-0.5">İç Salon, Bahçe, 1. Kat gibi servis bölgelerini yönetin</p>
          </div>
          {branches.length > 1 && (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={selectedBranchId}
                onChange={e => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 font-semibold focus:outline-none cursor-pointer"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id} className="bg-zinc-900">{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={openAdd}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-amber-500/40 text-zinc-500 hover:text-amber-400 text-xs font-bold transition"
        >
          <Plus className="w-4 h-4" /> Yeni Bölge Ekle
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : zones.length === 0 ? (
          <div className="text-center py-16 text-zinc-600 text-xs font-bold">
            Henüz bölge yok. Yukarıdan ekleyin.
          </div>
        ) : (
          <div className="space-y-3">
            {zones.map(z => (
              <div
                key={z.id}
                className={`flex items-center justify-between p-4 rounded-2xl border transition ${z.is_active ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-900/10 border-zinc-900 opacity-50'}`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-zinc-100">{z.name_tr}</span>
                    {z.name_en && z.name_en !== z.name_tr && (
                      <span className="text-[10px] text-zinc-500">{z.name_en}</span>
                    )}
                    {!z.is_active && (
                      <span className="text-[10px] text-zinc-600 font-bold">Pasif</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {z.name_ka && z.name_ka !== z.name_tr && (
                      <span className="text-[10px] text-zinc-600">{z.name_ka}</span>
                    )}
                    {z.name_ru && z.name_ru !== z.name_tr && (
                      <span className="text-[10px] text-zinc-600">{z.name_ru}</span>
                    )}
                    {z.telegram_chat_id && (
                      <span className="text-[10px] text-sky-500/70 font-medium flex items-center gap-1">
                        <SendHorizonal className="w-3 h-3" /> Telegram aktif
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(z)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold transition ${z.is_active ? 'border-zinc-700 text-zinc-500 hover:text-zinc-300' : 'border-emerald-700/30 text-emerald-500 hover:border-emerald-600/50'}`}
                  >
                    {z.is_active ? 'Pasif Et' : 'Aktif Et'}
                  </button>
                  <button
                    onClick={() => openEdit(z)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(z.id, z.name_tr)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100">{editingId ? 'Bölgeyi Düzenle' : 'Yeni Bölge'}</h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* TR name + auto-translate button */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-1.5 block">Bölge Adı (TR) *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.name_tr}
                    onChange={e => setForm(p => ({ ...p, name_tr: e.target.value }))}
                    placeholder="örn. İç Salon, Bahçe, 1. Kat"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                  />
                  <button
                    onClick={handleAutoTranslate}
                    disabled={translating}
                    title="Otomatik çevir (EN/KA/RU)"
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition disabled:opacity-40 flex items-center gap-1.5 text-[10px] font-bold whitespace-nowrap"
                  >
                    {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
                    Çevir
                  </button>
                </div>
              </div>

              {/* EN name */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-1.5 block">Ad (EN)</label>
                <input
                  type="text"
                  value={form.name_en}
                  onChange={e => setForm(p => ({ ...p, name_en: e.target.value }))}
                  placeholder="Auto-filled"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* KA name */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-1.5 block">Ad (KA)</label>
                <input
                  type="text"
                  value={form.name_ka}
                  onChange={e => setForm(p => ({ ...p, name_ka: e.target.value }))}
                  placeholder="ავტო-შევსება"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* RU name */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-1.5 block">Ad (RU)</label>
                <input
                  type="text"
                  value={form.name_ru}
                  onChange={e => setForm(p => ({ ...p, name_ru: e.target.value }))}
                  placeholder="Авто-заполнение"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Telegram chat ID */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-1.5 block">Telegram Chat ID (opsiyonel)</label>
                <input
                  type="text"
                  value={form.telegram_chat_id}
                  onChange={e => setForm(p => ({ ...p, telegram_chat_id: e.target.value }))}
                  placeholder="-100123456789"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                />
                <p className="text-[10px] text-zinc-600 mt-1">Bu bölgedeki masalarda garson çağrısı bu chat&apos;e gider. Boş bırakılırsa bildirim gönderilmez.</p>
              </div>

              {/* Sort order */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-1.5 block">Sıra</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))}
                  className="w-24 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {error && <p className="text-[11px] text-rose-400 font-semibold">{error}</p>}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 text-xs font-bold hover:bg-zinc-900 transition"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {editingId ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
