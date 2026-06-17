'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Utensils, 
  Terminal, 
  CheckCircle2, 
  KeyRound
} from 'lucide-react'

// Wrap in Suspense because of useSearchParams (Next.js client-side search params requirement)
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050507] flex items-center justify-center text-zinc-400">
        <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const redirectPath = searchParams.get('redirect') || '/'

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  // Redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        router.push(redirectPath)
      }
    }
    checkUser()
  }, [router, redirectPath, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setUserId(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { data, error: loginErr } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (loginErr) {
          setError(loginErr.message || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.')
          setLoading(false)
          return
        }

        setSuccess('Giriş başarılı! Yönlendiriliyorsunuz...')
        setTimeout(() => {
          router.push(redirectPath)
          router.refresh()
        }, 1200)

      } else {
        // Register mode
        const { data, error: registerErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name
            }
          }
        })

        if (registerErr) {
          setError(registerErr.message || 'Kayıt işlemi başarısız oldu.')
          setLoading(false)
          return
        }

        const registeredUser = data.user
        if (registeredUser) {
          setUserId(registeredUser.id)
          setSuccess('Hesabınız başarıyla oluşturuldu! Şimdi panele erişmek için bu kullanıcıya veritabanından rol atamalısınız.')
        } else {
          setSuccess('Kayıt başarılı! E-posta onayını kontrol edin veya giriş yapmayı deneyin.')
        }
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.message || 'Beklenmeyen bir hata oluştu.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Glow Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-orange-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        <div className="inline-flex w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl items-center justify-center shadow-lg shadow-amber-500/10 mb-4">
          <Utensils className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
          thecheckmenu
        </h2>
        <p className="mt-2 text-xs text-zinc-400 font-medium">
          Personel & Yönetici Giriş Paneli
        </p>
      </div>

      {/* Main Login Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />

          {/* Mode Switch Tabs */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850 mb-8">
            <button
              onClick={() => {
                setMode('login')
                setError('')
                setSuccess('')
              }}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => {
                setMode('register')
                setError('')
                setSuccess('')
              }}
              className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Yeni Hesap Oluştur
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Adınız Soyadınız
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="w-full bg-zinc-950/80 border border-zinc-850 focus:border-amber-500 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all"
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                E-posta Adresi
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yönetici@restoran.com"
                className="w-full bg-zinc-950/80 border border-zinc-850 focus:border-amber-500 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Şifre
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950/80 border border-zinc-850 focus:border-amber-500 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 bg-red-950/20 border border-red-900/30 rounded-xl p-3.5 text-red-400 text-xs leading-normal">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-start gap-2 bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3.5 text-emerald-400 text-xs leading-normal">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3.5 rounded-xl transition duration-300 shadow-lg shadow-amber-500/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 group text-xs mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol ve Oluştur'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Setup / Developer Instructions (Rendered dynamically if registration yields a userId) */}
          {(userId || mode === 'register') && (
            <div className="mt-8 pt-6 border-t border-zinc-850 space-y-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Terminal className="w-4.5 h-4.5" />
                <h4 className="text-xs font-bold">Geliştirici Rol Tanımlama</h4>
              </div>
              <p className="text-[11px] text-zinc-500 leading-normal">
                Supabase kuralları gereği, kayıt olan kullanıcının yönetim paneline (`/panel/*`) girebilmesi için veritabanında yönetici rolüne sahip olması gerekir.
              </p>
              
              <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-850 relative">
                <div className="text-[10px] text-zinc-500 font-mono select-all break-all whitespace-pre-wrap leading-relaxed">
{`-- SQL Editor'de çalıştırın:
INSERT INTO user_roles (user_id, branch_id, role)
VALUES (
  '${userId || 'KAYIT_OLUNCA_GELECEK_ID'}',
  'c1000000-0000-0000-0000-000000000000',
  'super_admin'
);`}
                </div>
              </div>
              
              <p className="text-[10px] text-zinc-600 leading-normal">
                💡 <b>Adım:</b> Kayıt olduktan sonra yukarıdaki SQL komutunu kopyalayın, Supabase Dashboard &gt; SQL Editor alanına yapıştırıp <b>RUN</b> tuşuna basın. Ardından &quot;Giriş Yap&quot; sekmesinden giriş sağlayabilirsiniz.
              </p>
            </div>
          )}

          {/* Simple Info Tip */}
          {mode === 'login' && !userId && (
            <div className="mt-6 text-center">
              <p className="text-[10px] text-zinc-600 leading-normal inline-flex items-center justify-center gap-1">
                <KeyRound className="w-3 h-3 text-zinc-600" />
                Masalardan birini test etmek için şifre gerekmez, doğrudan ana sayfaya dönüp masalara tıklayabilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
