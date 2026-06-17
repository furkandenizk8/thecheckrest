'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { fetchBranchesAction, fetchStationsAction, createStationAction, updateStationAction, deleteStationAction } from '@/app/actions/admin'
import { Plus, Edit2, Trash2, MapPin, Save, X, Loader2 } from 'lucide-react'

const COLOR_OPTIONS = [
  { value: 'amber',   label: 'Amber',   cls: 'bg-amber-500' },
  { value: 'sky',     label: 'Mavi',    cls: 'bg-sky-500' },
  { value: 'emerald', label: 'Yeşil',   cls: 'bg-emerald-500' },
  { value: 'rose',    label: 'Kırmızı', cls: 'bg-rose-500' },
  { value: 'violet',  label: 'Mor',     cls: 'bg-violet-500' },
]

const BADGE_MAP: Record<string, string> = {
  amber:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  sky:     'bg-sky-500/10 text-sky-400 border-sky-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rose:    'bg-rose-500/10 text-rose-400 border-rose-500/20',
  violet:  'bg-violet-500/10 text-violet-400 border-violet-500/20',
}

interface StationForm {
  name: string
  color: string
  telegram_chat_id: string
  sort_order: string
}

const EMPTY_FORM: StationForm = { name: '', color: 'amber', telegram_chat_id: '', sort_order: '0' }

export default function StationManagement({ embedded }: { embedded?: boolean }) {
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [stations, setStations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState<StationForm>(EMPTY_FORM)
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
    const data = await fetchStationsAction(selectedBranchId)
    setStations(data)
    setLoading(false)
  }, [selectedBranchId])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setShowAddModal(true); setError('') }
  const openEdit = (s: any) => {
    setForm({
      name: s.name,
      color: s.color || 'amber',
      telegram_chat_id: s.telegram_chat_id || '',
      sort_order: String(s.sort_order ?? 0),
    })
    setEditingId(s.id)
    setShowAddModal(true)
    setError('')
  }
  const closeModal = () => { setShowAddModal(false); setEditingId(null); setForm(EMPTY_FORM) }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Birim adı zorunludur.'); return }
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      color: form.color,
      telegram_chat_id: form.telegram_chat_id.trim() || undefined,
      sort_order: parseInt(form.sort_order) || 0,
    }
    const res = editingId
      ? await updateStationAction(editingId, payload)
      : await createStationAction(selectedBranchId, payload)
    setSaving(false)
    if (!res.success) { setError((res as any).error || 'Hata oluştu.'); return }
    closeModal()
    load()
  }

  const handleDelete = async (stationId: string, name: string) => {
    if (!confirm(`"${name}" birimini silmek istediğinize emin misiniz? Bu birime bağlı kategoriler birimi kaybeder.`)) return
    await deleteStationAction(stationId)
    load()
  }

  const handleToggleActive = async (s: any) => {
    await updateStationAction(s.id, { is_active: !s.is_active })
    load()
  }

  return (
    <div className={embedded ? 'h-full overflow-y-auto bg-[#050507] text-zinc-100 p-6' : 'min-h-screen bg-[#050507] text-zinc-100 p-6'}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Birim Yönetimi</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Mutfak, Bar, Soğuk Mutfak gibi hazırlık birimlerini yönetin</p>
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
          <Plus className="w-4 h-4" /> Yeni Birim Ekle
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : stations.length === 0 ? (
          <div className="text-center py-16 text-zinc-600 text-xs font-bold">
            Henüz birim yok. Yukarıdan ekleyin.
          </div>
        ) : (
          <div className="space-y-3">
            {stations.map(s => {
              const badge = BADGE_MAP[s.color] || BADGE_MAP.amber
              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition ${s.is_active ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-900/10 border-zinc-900 opacity-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full border text-[11px] font-black ${badge}`}>{s.name}</span>
                    {s.telegram_chat_id && (
                      <span className="text-[10px] text-zinc-500 font-medium">📨 Telegram aktif</span>
                    )}
                    {!s.is_active && (
                      <span className="text-[10px] text-zinc-600 font-bold">Pasif</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(s)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-bold transition ${s.is_active ? 'border-zinc-700 text-zinc-500 hover:text-zinc-300' : 'border-emerald-700/30 text-emerald-500 hover:border-emerald-600/50'}`}
                    >
                      {s.is_active ? 'Pasif Et' : 'Aktif Et'}
                    </button>
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100">{editingId ? 'Birimi Düzenle' : 'Yeni Birim'}</h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-1.5 block">Birim Adı *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="örn. Mutfak, Bar, Soğuk Mutfak"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-2 block">Renk</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setForm(p => ({ ...p, color: c.value }))}
                      className={`w-7 h-7 rounded-full ${c.cls} border-2 transition ${form.color === c.value ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-1.5 block">Telegram Chat ID (opsiyonel)</label>
                <input
                  type="text"
                  value={form.telegram_chat_id}
                  onChange={e => setForm(p => ({ ...p, telegram_chat_id: e.target.value }))}
                  placeholder="-100123456789"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                />
                <p className="text-[10px] text-zinc-600 mt-1">Boş bırakılırsa bu birime Telegram bildirimi gönderilmez.</p>
              </div>

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
