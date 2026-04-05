import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Zap, TrendingUp, Trophy, Edit2, Check } from 'lucide-react'
import { saveState } from '../store/gameStore'
import type { GameState } from '../store/gameStore'

interface ProfilePageProps {
  state: GameState
  setState: (s: GameState) => void
}

const ACHIEVEMENTS = [
  { id: 'first_star', icon: '⭐', label: 'First Star', desc: 'Mine your first star', unlocked: (s: GameState) => s.totalMined >= 1 },
  { id: 'hundred', icon: '💯', label: 'Centennial', desc: 'Mine 100 stars', unlocked: (s: GameState) => s.totalMined >= 100 },
  { id: 'boost', icon: '🚀', label: 'Booster', desc: 'Reach Boost Level 2', unlocked: (s: GameState) => s.boostLevel >= 2 },
  { id: 'withdraw', icon: '💸', label: 'Cash Out', desc: 'Make your first withdrawal', unlocked: (s: GameState) => s.transactions.some(t => t.type === 'withdraw') },
  { id: 'thousand', icon: '🌟', label: 'Star Hoarder', desc: 'Mine 1,000 stars', unlocked: (s: GameState) => s.totalMined >= 1000 },
  { id: 'max_energy', icon: '⚡', label: 'Energized', desc: 'Max energy 200+', unlocked: (s: GameState) => s.maxEnergy >= 200 },
]

export default function ProfilePage({ state, setState }: ProfilePageProps) {
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(state.username)

  const withdrawals = state.transactions.filter(t => t.type === 'withdraw')
  const totalWithdrawn = withdrawals.reduce((sum, t) => sum + t.amount, 0)

  const saveName = () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    const newState = { ...state, username: trimmed }
    saveState(newState)
    setState(newState)
    setEditingName(false)
  }

  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked(state)).length

  return (
    <div className="flex flex-col min-h-full pb-28 pt-4 px-4 space-bg">
      {/* Avatar & name */}
      <div className="flex flex-col items-center mb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-3 border-2"
          style={{
            background: 'linear-gradient(135deg, hsl(45 100% 51%), hsl(35 100% 44%))',
            borderColor: 'hsl(45 100% 51% / 0.5)',
            boxShadow: 'var(--star-glow)',
            color: 'hsl(220 30% 10%)',
          }}
        >
          {state.username.slice(0, 2).toUpperCase()}
        </div>

        {editingName ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              className="bg-secondary border border-primary/40 rounded-xl px-3 py-1.5 text-sm text-foreground text-center outline-none focus:border-primary/70"
              maxLength={24}
            />
            <button onClick={saveName}>
              <Check size={16} className="text-primary" />
            </button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1.5 mt-1 group"
            onClick={() => { setNameInput(state.username); setEditingName(true) }}
          >
            <span className="text-base font-bold text-foreground">{state.username}</span>
            <Edit2 size={12} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        )}

        <div
          className="mt-2 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: 'hsl(45 100% 51% / 0.12)', color: 'hsl(45 100% 65%)' }}
        >
          ⭐ Star Miner
        </div>
      </div>

      {/* Stats grid */}
      <div className="w-full max-w-sm mx-auto grid grid-cols-2 gap-3 mb-6">
        {[
          { icon: <Star size={14} className="text-primary" />, label: 'Total Mined', value: state.totalMined.toFixed(1) + ' ⭐' },
          { icon: <Zap size={14} className="text-accent" />, label: 'Boost Level', value: '×' + state.boostLevel },
          { icon: <TrendingUp size={14} className="text-green-400" />, label: 'Per Tap', value: '+' + (state.miningRate * state.boostLevel).toFixed(1) },
          { icon: <Trophy size={14} className="text-yellow-400" />, label: 'Withdrawn', value: totalWithdrawn.toFixed(1) + ' ⭐' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-4"
          >
            <div className="flex items-center gap-1.5 mb-1">
              {stat.icon}
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-lg font-bold font-mono text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Achievements */}
      <div className="w-full max-w-sm mx-auto bg-card border border-border rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Achievements</h3>
          <span className="text-xs text-muted-foreground font-mono">{unlockedCount}/{ACHIEVEMENTS.length}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-secondary rounded-full mb-4 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, hsl(190 80% 50%), hsl(45 100% 51%))' }}
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        <div className="space-y-3">
          {ACHIEVEMENTS.map((achievement, i) => {
            const isUnlocked = achievement.unlocked(state)
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 py-1"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{
                    background: isUnlocked ? 'hsl(45 100% 51% / 0.15)' : 'hsl(220 25% 14%)',
                    filter: isUnlocked ? 'none' : 'grayscale(1) brightness(0.5)',
                  }}
                >
                  {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {achievement.label}
                  </p>
                  <p className="text-xs text-muted-foreground/70 truncate">{achievement.desc}</p>
                </div>
                {isUnlocked && (
                  <div
                    className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: 'hsl(151 55% 45% / 0.15)', color: 'hsl(151 55% 55%)' }}
                  >
                    ✓
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Mining info */}
      <div className="w-full max-w-sm mx-auto mt-4 bg-secondary/30 border border-border/50 rounded-2xl p-4">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          ⚡ Energy regenerates automatically — +1 every 5 seconds up to {state.maxEnergy}.<br />
          Upgrade your boost to earn more per tap!
        </p>
      </div>
    </div>
  )
}
