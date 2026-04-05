import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MinePage from './pages/MinePage'
import WalletPage from './pages/WalletPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import { loadState } from './store/gameStore'
import type { GameState } from './store/gameStore'

type Tab = 'mine' | 'wallet' | 'leaderboard' | 'profile'

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'mine', label: 'Mine', icon: '⭐' },
  { id: 'wallet', label: 'Wallet', icon: '💸' },
  { id: 'leaderboard', label: 'Ranks', icon: '🏆' },
  { id: 'profile', label: 'Profile', icon: '👤' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('mine')
  const [state, setState] = useState<GameState>(() => loadState())

  // Energy regen — +1 energy every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        if (prev.energy >= prev.maxEnergy) return prev
        const next = { ...prev, energy: Math.min(prev.maxEnergy, prev.energy + 1) }
        return next
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="flex flex-col w-full min-h-screen overflow-hidden"
      style={{ background: 'hsl(222 35% 6%)', maxWidth: '480px', margin: '0 auto' }}
    >
      {/* Top header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b border-border/50 sticky top-0 z-30"
        style={{ background: 'hsl(222 35% 7% / 0.95)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">⭐</span>
          <span className="font-bold text-base text-foreground tracking-tight">Star Miner</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold font-mono"
            style={{ background: 'hsl(45 100% 51% / 0.15)', color: 'hsl(45 100% 65%)' }}
          >
            <span>⭐</span>
            <span>{state.balance.toLocaleString('en-US', { maximumFractionDigits: 1 })}</span>
          </div>
          <div
            className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-mono"
            style={{ background: 'hsl(190 80% 50% / 0.1)', color: 'hsl(190 80% 65%)' }}
          >
            <span>⚡</span>
            <span>{state.energy}</span>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="min-h-full"
          >
            {activeTab === 'mine' && <MinePage state={state} setState={setState} />}
            {activeTab === 'wallet' && <WalletPage state={state} setState={setState} />}
            {activeTab === 'leaderboard' && <LeaderboardPage state={state} />}
            {activeTab === 'profile' && <ProfilePage state={state} setState={setState} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom tab bar */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full border-t border-border/60 z-40 flex items-stretch"
        style={{
          maxWidth: '480px',
          background: 'hsl(222 35% 7% / 0.97)',
          backdropFilter: 'blur(16px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
        }}
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-all relative"
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'hsl(45 100% 51%)' }}
                />
              )}
              <span
                className="text-xl transition-all"
                style={{
                  filter: isActive ? 'drop-shadow(0 0 6px hsl(45 100% 51% / 0.8))' : 'none',
                  transform: isActive ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                {tab.icon}
              </span>
              <span
                className="text-[10px] font-semibold transition-colors"
                style={{ color: isActive ? 'hsl(45 100% 65%)' : 'hsl(210 15% 45%)' }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
