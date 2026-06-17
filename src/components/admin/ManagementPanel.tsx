'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChefHat, UtensilsCrossed, Settings, Layers } from 'lucide-react'
import MenuManagement from './MenuManagement'
import TableConfig from './TableConfig'
import StationManagement from './StationManagement'

type Tab = 'menu' | 'tables' | 'stations'

const TABS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'menu',     label: 'Menü Yönetimi', icon: UtensilsCrossed },
  { id: 'tables',   label: 'Masa Ayarları', icon: Settings },
  { id: 'stations', label: 'Birimler',       icon: Layers },
]

export default function ManagementPanel({ defaultTab = 'menu' }: { defaultTab?: Tab }) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab)

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-zinc-950 border-b border-zinc-900 px-6 py-4 flex items-center gap-3 shrink-0">
        <Link
          href="/panel"
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-8 h-8 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shrink-0">
          <ChefHat className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-zinc-100">Yönetim Paneli</h1>
          <p className="text-[10px] text-zinc-500">Menü, masa ve birim ayarları</p>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left nav */}
        <nav className="w-52 bg-zinc-950/60 border-r border-zinc-900 p-3 flex flex-col gap-1 shrink-0">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold transition border ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'menu'     && <MenuManagement embedded />}
          {activeTab === 'tables'   && <TableConfig embedded />}
          {activeTab === 'stations' && <StationManagement embedded />}
        </div>
      </div>
    </div>
  )
}
