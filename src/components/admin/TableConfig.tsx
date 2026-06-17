'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  fetchBranchesAction,
  fetchTablesConfigAction,
  createTableAction,
  updateTableAction,
  deleteTableAction,
  resetTableAction,
  getTableQRAction,
} from '@/app/actions/admin'
import {
  ChefHat,
  Plus,
  Edit2,
  X,
  Check,
  MapPin,
  ArrowLeft,
  QrCode,
  Download,
  Loader2,
  Users,
  ToggleLeft,
  ToggleRight,
  Trash2,
  RotateCcw,
} from 'lucide-react'

interface Table {
  id: string
  name: string
  capacity: number
  status: string
  is_active: boolean
  qr_token: string
}

// ─── QR Modal ─────────────────────────────────────────────────────────────────

function QRModal({ tableId, onClose }: { tableId: string; onClose: () => void }) {
  const [qrData, setQrData] = useState<{ qrDataUrl: string; tableName: string; qrUrl: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTableQRAction(tableId).then(res => {
      if (res.success) setQrData(res)
      setLoading(false)
    })
  }, [tableId])

  const handleDownload = () => {
    if (!qrData) return
    const a = document.createElement('a')
    a.href = qrData.qrDataUrl
    a.download = `qr-${qrData.tableName.replace(/\s/g, '-').toLowerCase()}.png`
    a.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-zinc-900">
          <h3 className="text-sm font-bold text-zinc-100">
            {qrData ? `${qrData.tableName} — QR Kod` : 'QR Kod Yükleniyor'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          {loading ? (
            <Loader2 className="w-10 h-10 animate-spin text-amber-500/50" />
          ) : qrData ? (
            <>
              <div className="p-3 bg-white rounded-2xl shadow-lg">
                <img src={qrData.qrDataUrl} alt="QR Kod" className="w-48 h-48" />
              </div>
              <div className="text-center">
                <p className="text-[10px] text-zinc-500 font-mono break-all">{qrData.qrUrl}</p>
              </div>
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-xl transition"
                >
                  <Download className="w-3.5 h-3.5" /> İndir
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(qrData.qrUrl)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl hover:bg-zinc-800 transition"
                >
                  Linki Kopyala
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-red-400">QR kod oluşturulamadı.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Table Form Modal ──────────────────────────────────────────────────────────

function TableModal({
  table,
  branchId,
  onClose,
  onSaved,
}: {
  table: Table | null
  branchId: string
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!table
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name:      table?.name ?? '',
    capacity:  table?.capacity?.toString() ?? '4',
    is_active: table?.is_active ?? true,
  })

  const set = (key: keyof typeof form, value: any) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Masa adı zorunlu.'); return }
    setSaving(true)
    try {
      let res: any
      if (isEdit && table) {
        res = await updateTableAction(table.id, { name: form.name, capacity: Number(form.capacity), is_active: form.is_active })
      } else {
        res = await createTableAction(branchId, { name: form.name, capacity: Number(form.capacity) })
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
          <h3 className="text-sm font-bold text-zinc-100">{isEdit ? 'Masa Düzenle' : 'Yeni Masa Ekle'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-500 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Masa Adı *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} autoFocus
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition"
              placeholder="Örn: Masa 1, Teras A3, VIP 1" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Kapasite (Kişi)</label>
            <input type="number" min="1" max="100" value={form.capacity} onChange={e => set('capacity', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none transition" />
          </div>

          {isEdit && (
            <button type="button" onClick={() => set('is_active', !form.is_active)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition ${
                form.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}>
              {form.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {form.is_active ? 'Aktif' : 'Pasif'}
            </button>
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
              {isEdit ? 'Kaydet' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TableConfig({ embedded }: { embedded?: boolean }) {
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)

  const [tableModal, setTableModal] = useState<{ open: boolean; table: Table | null }>({ open: false, table: null })
  const [qrModal, setQrModal] = useState<string | null>(null)

  useEffect(() => {
    fetchBranchesAction().then(data => {
      setBranches(data)
      if (data.length > 0) setSelectedBranchId(data[0].id)
    })
  }, [])

  const reload = useCallback(async () => {
    if (!selectedBranchId) return
    setLoading(true)
    const data = await fetchTablesConfigAction(selectedBranchId)
    setTables(data)
    setLoading(false)
  }, [selectedBranchId])

  useEffect(() => { reload() }, [reload])

  const handleDelete = async (tableId: string, name: string) => {
    if (!confirm(`"${name}" masasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return
    await deleteTableAction(tableId)
    reload()
  }

  const handleReset = async (tableId: string, name: string) => {
    if (!confirm(`"${name}" masasını sıfırlamak istediğinize emin misiniz? Tüm açık oturumlar ve adisyonlar kapatılır.`)) return
    await resetTableAction(tableId)
    reload()
  }

  const handleToggleActive = async (table: Table) => {
    await updateTableAction(table.id, { is_active: !table.is_active })
    reload()
  }

  const statusColor = (s: string) => {
    if (s === 'occupied') return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    if (s === 'needs_cleaning') return 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    return 'bg-zinc-800 text-zinc-400 border-zinc-700'
  }
  const statusLabel = (s: string) => s === 'occupied' ? 'Dolu' : s === 'needs_cleaning' ? 'Temizlik' : 'Boş'

  return (
    <div className={embedded ? 'h-full flex flex-col bg-[#050507] text-zinc-100 font-sans overflow-hidden' : 'min-h-screen bg-[#050507] text-zinc-100 font-sans'}>
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
              <h1 className="text-sm font-bold text-zinc-100">Masa Ayarları</h1>
              <p className="text-[10px] text-zinc-500">Masa ekle, düzenle ve QR kod üret</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {branches.length > 0 && (
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                <select value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)}
                  className="bg-transparent text-xs text-zinc-200 font-semibold focus:outline-none cursor-pointer">
                  {branches.map(b => <option key={b.id} value={b.id} className="bg-zinc-900">{b.name}</option>)}
                </select>
              </div>
            )}
            <button
              onClick={() => setTableModal({ open: true, table: null })}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" /> Masa Ekle
            </button>
          </div>
        </header>
      )}

      <main className={embedded ? 'flex-1 overflow-y-auto p-6' : 'p-6'}>
        {embedded && (
          <div className="flex items-center justify-between mb-6">
            {branches.length > 1 && (
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                <select value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)}
                  className="bg-transparent text-xs text-zinc-200 font-semibold focus:outline-none cursor-pointer">
                  {branches.map(b => <option key={b.id} value={b.id} className="bg-zinc-900">{b.name}</option>)}
                </select>
              </div>
            )}
            <button
              onClick={() => setTableModal({ open: true, table: null })}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-xl transition ml-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Masa Ekle
            </button>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500/50" />
          </div>
        ) : tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
            <Users className="w-10 h-10 mb-3 text-zinc-800" />
            <p className="text-xs font-bold">Henüz masa yok</p>
            <p className="text-[10px] mt-1">Masa Ekle butonuna tıkla</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {tables.map(table => (
              <div
                key={table.id}
                className={`bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 space-y-3 group transition hover:border-zinc-700 ${!table.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">{table.name}</div>
                    <div className="flex items-center gap-1 mt-0.5 text-[9px] text-zinc-500">
                      <Users className="w-2.5 h-2.5" /> {table.capacity} kişi
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => setTableModal({ open: true, table })}
                      className="p-1 rounded-lg text-zinc-600 hover:text-amber-400 transition"
                      title="Düzenle"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(table.id, table.name)}
                      className="p-1 rounded-lg text-zinc-600 hover:text-rose-400 transition"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusColor(table.status)}`}>
                    {statusLabel(table.status)}
                  </span>
                  <button
                    onClick={() => handleToggleActive(table)}
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition ${
                      table.is_active
                        ? 'border-zinc-700 text-zinc-500 hover:border-rose-700/50 hover:text-rose-400'
                        : 'border-emerald-700/40 text-emerald-500 hover:border-emerald-600'
                    }`}
                    title={table.is_active ? 'Pasif Et' : 'Aktif Et'}
                  >
                    {table.is_active ? 'Aktif' : 'Pasif'}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setQrModal(table.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-zinc-800 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/20 border border-zinc-700 text-zinc-400 text-[10px] font-bold rounded-xl transition"
                  >
                    <QrCode className="w-3 h-3" /> QR
                  </button>
                  {table.status !== 'empty' && (
                    <button
                      onClick={() => handleReset(table.id, table.name)}
                      className="flex items-center justify-center gap-1 px-2 py-1.5 bg-zinc-800 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 border border-zinc-700 text-zinc-500 text-[10px] font-bold rounded-xl transition"
                      title="Masayı Sıfırla"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {tableModal.open && (
        <TableModal
          table={tableModal.table}
          branchId={selectedBranchId}
          onClose={() => setTableModal({ open: false, table: null })}
          onSaved={reload}
        />
      )}
      {qrModal && (
        <QRModal tableId={qrModal} onClose={() => setQrModal(null)} />
      )}
    </div>
  )
}
