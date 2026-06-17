import React from 'react'

export const metadata = {
  title: 'thecheckmenu',
  description: 'Akıllı QR Masa Sipariş ve Servis Yönetim Sistemi',
}

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-900 flex justify-center items-start overflow-y-auto selection:bg-amber-500/30 selection:text-amber-200">
      {/* Mobil Cihaz Çerçevesi (Masaüstü için ortalanmış, mobil için tam ekran) */}
      <div className="w-full max-w-md min-h-screen bg-zinc-950 flex flex-col relative shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] border-x border-zinc-800/40">
        
        {/* Arka Plan Ambient Süsleme Işıkları */}
        <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[300px] h-[300px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Sayfa İçeriği */}
        <main className="flex-1 flex flex-col relative z-10">
          {children}
        </main>
      </div>
    </div>
  )
}
