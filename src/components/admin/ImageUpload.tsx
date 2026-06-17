'use client'

import { useRef, useState, useCallback } from 'react'
import { Upload, X, Loader2, Image as ImageIcon, Info } from 'lucide-react'

const MAX_DIMENSION = 900   // px — her iki taraf da bu değerle sınırlanır
const JPEG_QUALITY  = 0.82  // 0–1 arası

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img

      // Küçültmeye gerek yoksa olduğu gibi döndür
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        resolve(file)
        return
      }

      // En-boy oranını koruyarak küçült
      if (width >= height) {
        height = Math.round((height * MAX_DIMENSION) / width)
        width = MAX_DIMENSION
      } else {
        width = Math.round((width * MAX_DIMENSION) / height)
        height = MAX_DIMENSION
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas context alınamadı')); return }
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Sıkıştırma başarısız')); return }
        const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
        resolve(compressed)
      }, 'image/jpeg', JPEG_QUALITY)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Resim yüklenemedi'))
    }
    img.src = objectUrl
  })
}

interface Props {
  value: string
  onChange: (url: string) => void
  label?: string
  hint?: string
}

export function ImageUpload({ value, onChange, label, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Sadece resim dosyası yüklenebilir (JPG, PNG, WEBP).')
      return
    }
    if (file.size > 30 * 1024 * 1024) {
      setError('Dosya 30MB\'dan büyük olamaz.')
      return
    }

    setError('')
    setUploading(true)

    try {
      setProgress('Sıkıştırılıyor...')
      const compressed = await compressImage(file)

      const originalKB = Math.round(file.size / 1024)
      const compressedKB = Math.round(compressed.size / 1024)
      const saved = file.size !== compressed.size
        ? ` (${originalKB}KB → ${compressedKB}KB)`
        : ''

      setProgress(`Yükleniyor${saved}...`)
      const form = new FormData()
      form.append('file', compressed)

      const res = await fetch('/api/upload-photo', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Yükleme başarısız')
      onChange(data.url)
    } catch (e: any) {
      setError(e.message || 'Beklenmeyen bir hata oluştu.')
    } finally {
      setUploading(false)
      setProgress('')
    }
  }, [onChange])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
          <ImageIcon className="w-3 h-3" />
          {label}
        </label>
      )}

      {value ? (
        /* ── Önizleme ── */
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-zinc-800 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="önizleme" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-lg backdrop-blur-sm transition"
            >
              Değiştir
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* ── Yükleme Alanı ── */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={uploading}
          className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
            dragging
              ? 'border-amber-500 bg-amber-500/5 text-amber-400'
              : uploading
              ? 'border-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900/40 text-zinc-600 hover:text-zinc-400'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span className="text-xs font-semibold text-zinc-400">{progress}</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6" />
              <span className="text-xs font-bold">Fotoğraf Yükle</span>
              <span className="text-[10px] text-zinc-600">Tıkla veya dosyayı buraya sürükle</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-[10px] text-red-400 flex items-center gap-1">
          <X className="w-3 h-3 shrink-0" /> {error}
        </p>
      )}

      {/* ── Kullanım Rehberi ── */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-3 space-y-1.5">
        <p className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
          <Info className="w-3 h-3" /> Fotoğraf Rehberi
        </p>
        <ul className="text-[10px] text-zinc-600 space-y-1 leading-relaxed">
          <li>• <span className="text-zinc-500">JPG, PNG veya WEBP</span> formatı önerilir</li>
          <li>• <span className="text-zinc-500">En az 800×800 px</span> çözünürlük — menüde net görünür</li>
          <li>• Büyük dosyalar otomatik olarak <span className="text-zinc-500">900px × JPEG %82</span> kaliteye sıkıştırılır</li>
          <li>• Telefonda çekeceğin fotoğraf doğrudan yüklenebilir — herhangi bir düzenleme gerekmez</li>
          <li>• En iyi sonuç için yemeği <span className="text-zinc-500">üstten, düz bir zeminde</span> ve iyi ışıkta çek</li>
        </ul>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  )
}
