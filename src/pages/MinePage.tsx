import { useState, useCallback, useRef } from 'react'
import { Zap, TrendingUp, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { mine, refillEnergy, upgradeBoost } from '../store/gameStore'
import type { GameState } from '../store/gameStore'

interface FloatParticle {
  id: string
  x: number
  y: number
  value: number
}

interface MinePageProps {
  state: GameState
  setState: (s: GameState) => void
}

export default function MinePage({ state, setState }: MinePageProps) {
  const [particles, setParticles] = useState<FloatParticle[]>([])
  const [tapping, setTapping] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (state.energy <= 0) return

    const { newState, gained } = mine(state)
    setState(newState)

    // Get tap position
    let x = 0, y = 0
    if ('touches' in e && e.touches[0]) {
      x = e.touches[0].clientX
      y = e.touches[0].clientY
    } else if ('clientX' in e) {
      x = e.clientX
      y = e.clientY
    }

    const particle: FloatParticle = {
      id: crypto.randomUUID(),
      x,
      y,
      value: gained,
    }
    setParticles(prev => [...prev, particle])
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== particle.id))
    }, 900)

    // Tap animation
    setTapping(true)
    setTimeout(() => setTapping(false), 180)
  }, [state, setState])

  const energyPct = (state.energy / state.maxEnergy) * 100
  const boostCost = state.boostLevel * 50

  return (
    <div className="flex flex-col items-center min-h-full pb-24 pt-4 px-4 space-bg">
      {/* Header */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-sm font-medium">Balance</span>
          <span className="text-muted-foreground text-sm">⚡ {state.energy}/{state.maxEnergy}</span>
        </div>

        <div className="text-center mb-4">
          <p className="text-5xl font-bold gold-text font-mono tracking-tight">
            {state.balance.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </p>
          <p className="text-muted-foreground text-sm mt-1 flex items-center justify-center gap-1">
            <Star size={12} className="text-primary" />
            Stars mined total: {state.totalMined.toFixed(1)}
          </p>
        </div>

        {/* Energy bar */}
        <div className="relative h-3 rounded-full bg-secondary overflow-hidden border border-border">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, hsl(190 80% 50%), hsl(45 100% 51%))',
              boxShadow: '0 0 8px hsl(45 100% 51% / 0.5)',
            }}
            animate={{ width: `${energyPct}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
          <div className="shimmer-bg absolute inset-0" />
        </div>
        <p className="text-xs text-muted-foreground text-center mt-1">
          {state.energy === 0 ? '⚠️ Energy depleted — tap Refill!' : `${state.energy} energy remaining`}
        </p>
      </div>

      {/* Star Mine Button */}
      <div className="relative flex items-center justify-center my-6">
        {/* Orbit ring */}
        <div
          className="absolute w-56 h-56 rounded-full border border-primary/20 spin-slow"
          style={{ boxShadow: '0 0 20px hsl(45 100% 51% / 0.1)' }}
        />
        <div
          className="absolute w-44 h-44 rounded-full border border-primary/10"
          style={{ animation: 'spin-slow 12s linear infinite reverse' }}
        />

        <motion.button
          ref={btnRef}
          onMouseDown={handleTap}
          onTouchStart={handleTap}
          animate={tapping ? { scale: 0.91 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          disabled={state.energy <= 0}
          className="relative z-10 w-36 h-36 rounded-full border-2 border-primary/60 flex items-center justify-center cursor-pointer select-none"
          style={{
            background: 'radial-gradient(circle at 40% 35%, hsl(50 100% 70%), hsl(38 100% 45%))',
            boxShadow: state.energy > 0
              ? 'var(--star-glow), inset 0 2px 8px hsl(0 0% 100% / 0.2)'
              : '0 0 10px hsl(0 0% 50% / 0.2)',
            filter: state.energy <= 0 ? 'grayscale(0.6) brightness(0.7)' : 'none',
          }}
        >
          <span className="text-6xl select-none" style={{ filter: 'drop-shadow(0 2px 8px hsl(0 0% 0% / 0.4))' }}>⭐</span>
        </motion.button>
      </div>

      <p className="text-muted-foreground text-sm mb-6">
        {state.energy > 0 ? 'Tap the star to mine!' : 'Refill energy to continue mining'}
      </p>

      {/* Stats row */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-primary" />
            <span className="text-xs text-muted-foreground">Per Tap</span>
          </div>
          <p className="text-xl font-bold text-foreground font-mono">
            +{(state.miningRate * state.boostLevel).toFixed(1)} ⭐
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-accent" />
            <span className="text-xs text-muted-foreground">Boost Level</span>
          </div>
          <p className="text-xl font-bold text-foreground font-mono">×{state.boostLevel}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-3">
        <button
          onClick={() => setState(refillEnergy(state))}
          className="flex flex-col items-center gap-2 bg-secondary hover:bg-secondary/80 border border-border rounded-2xl p-4 transition-all active:scale-95"
        >
          <span className="text-2xl">⚡</span>
          <span className="text-sm font-semibold text-foreground">Refill Energy</span>
          <span className="text-xs text-muted-foreground">Free</span>
        </button>

        <button
          onClick={() => setState(upgradeBoost(state))}
          disabled={state.balance < boostCost}
          className="flex flex-col items-center gap-2 rounded-2xl p-4 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: state.balance >= boostCost
              ? 'linear-gradient(135deg, hsl(45 100% 51%), hsl(35 100% 45%))'
              : 'hsl(220 25% 18%)',
            border: state.balance >= boostCost ? '1px solid hsl(45 100% 51% / 0.4)' : '1px solid hsl(220 20% 20%)',
          }}
        >
          <span className="text-2xl">🚀</span>
          <span className="text-sm font-semibold" style={{ color: state.balance >= boostCost ? 'hsl(220 30% 10%)' : 'hsl(210 15% 55%)' }}>
            Boost ×{state.boostLevel + 1}
          </span>
          <span className="text-xs" style={{ color: state.balance >= boostCost ? 'hsl(220 30% 20%)' : 'hsl(210 15% 45%)' }}>
            Cost: {boostCost} ⭐
          </span>
        </button>
      </div>

      {/* Floating particles */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="fixed pointer-events-none z-50 font-bold font-mono text-lg select-none"
            style={{ left: p.x - 20, top: p.y - 20, color: 'hsl(45 100% 65%)' }}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -80, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
          >
            +{p.value.toFixed(1)}⭐
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
