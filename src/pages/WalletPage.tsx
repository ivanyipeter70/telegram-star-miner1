import { useState } from 'react'
import { ArrowDownToLine, CheckCircle, Clock, Wallet, Copy, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { withdraw } from '../store/gameStore'
import type { GameState, Transaction } from '../store/gameStore'

interface WalletPageProps {
  state: GameState
  setState: (s: GameState) => void
}

export default function WalletPage({ state, setState }: WalletPageProps) {
  const [walletAddress, setWalletAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleWithdraw = () => {
    setError('')
    const amt = parseFloat(amount)

    if (!walletAddress.trim()) {
      setError('Please enter a wallet address')
      return
    }
    if (walletAddress.trim().length < 10) {
      setError('Please enter a valid wallet address')
      return
    }
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (amt > state.balance) {
      setError(`Insufficient balance. You have ${state.balance.toFixed(1)} ⭐`)
      return
    }

    const newState = withdraw(state, amt, walletAddress.trim())
    setState(newState)
    setSuccess(true)
    setAmount('')
    setTimeout(() => setSuccess(false), 3500)
  }

  const handleMax = () => {
    setAmount(state.balance.toFixed(1))
  }

  const txHistory = state.transactions.filter(t => t.type === 'withdraw').slice(0, 10)

  return (
    <div className="flex flex-col min-h-full pb-24 pt-4 px-4 space-bg">
      {/* Balance card */}
      <div
        className="w-full max-w-sm mx-auto mb-5 rounded-3xl p-5 border border-primary/30"
        style={{
          background: 'linear-gradient(135deg, hsl(220 30% 12%), hsl(220 25% 16%))',
          boxShadow: 'var(--star-glow)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={16} className="text-primary" />
          <span className="text-sm text-muted-foreground font-medium">Available Balance</span>
        </div>
        <p className="text-4xl font-bold font-mono gold-text">
          {state.balance.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </p>
        <p className="text-muted-foreground text-sm mt-1">Stars (⭐)</p>
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Total mined</span>
            <span className="text-foreground font-mono">{state.totalMined.toFixed(1)} ⭐</span>
          </div>
        </div>
      </div>

      {/* Withdraw form */}
      <div className="w-full max-w-sm mx-auto mb-5 bg-card border border-border rounded-3xl p-5">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <ArrowDownToLine size={16} className="text-primary" />
          Instant Withdrawal
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Wallet Address</label>
            <input
              type="text"
              value={walletAddress}
              onChange={e => setWalletAddress(e.target.value)}
              placeholder="Enter any wallet address (TON, ETH, BTC...)"
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Amount (⭐)</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.0"
                min="0.1"
                step="0.1"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-16 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all font-mono"
              />
              <button
                onClick={handleMax}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded-lg transition-colors"
                style={{ color: 'hsl(45 100% 51%)', background: 'hsl(45 100% 51% / 0.1)' }}
              >
                MAX
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-destructive text-xs px-1"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3"
              >
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-green-400 text-sm font-medium">Withdrawal sent successfully! ✅</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleWithdraw}
            disabled={state.balance <= 0}
            className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: state.balance > 0
                ? 'linear-gradient(135deg, hsl(45 100% 51%), hsl(35 100% 44%))'
                : 'hsl(220 25% 18%)',
              color: state.balance > 0 ? 'hsl(220 30% 10%)' : 'hsl(210 15% 40%)',
              boxShadow: state.balance > 0 ? '0 4px 20px hsl(45 100% 51% / 0.3)' : 'none',
            }}
          >
            {state.balance <= 0 ? 'Mine Stars First' : '⚡ Withdraw Instantly'}
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2 bg-secondary/50 rounded-xl p-3">
          <span className="text-xs text-muted-foreground">
            ✅ <strong className="text-foreground">No verification required.</strong> Funds are sent instantly to any wallet address. No KYC, no limits.
          </span>
        </div>
      </div>

      {/* Withdrawal history */}
      {txHistory.length > 0 && (
        <div className="w-full max-w-sm mx-auto bg-card border border-border rounded-3xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock size={14} className="text-muted-foreground" />
            Withdrawal History
          </h3>
          <div className="space-y-3">
            {txHistory.map(tx => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        </div>
      )}

      {txHistory.length === 0 && (
        <div className="w-full max-w-sm mx-auto text-center py-8">
          <span className="text-4xl block mb-2">💸</span>
          <p className="text-muted-foreground text-sm">No withdrawals yet. Mine stars and cash out!</p>
        </div>
      )}
    </div>
  )
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (tx.wallet) {
      navigator.clipboard.writeText(tx.wallet)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const shortWallet = tx.wallet
    ? tx.wallet.slice(0, 8) + '...' + tx.wallet.slice(-6)
    : ''

  const date = new Date(tx.timestamp)
  const timeStr = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'hsl(45 100% 51% / 0.15)' }}
      >
        <ExternalLink size={14} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground truncate">{shortWallet}</span>
          <button onClick={handleCopy} className="flex-shrink-0">
            {copied
              ? <CheckCircle size={11} className="text-green-400" />
              : <Copy size={11} className="text-muted-foreground hover:text-foreground" />
            }
          </button>
        </div>
        <p className="text-xs text-muted-foreground/70">{timeStr}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold font-mono" style={{ color: 'hsl(0 84% 60%)' }}>
          -{tx.amount.toFixed(1)} ⭐
        </p>
        <span className="text-xs text-green-400">Sent ✓</span>
      </div>
    </div>
  )
}
