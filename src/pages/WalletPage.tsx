import { useState, useCallback } from 'react'
import { ArrowDownToLine, CheckCircle, Clock, Wallet, Copy, ExternalLink, LogOut, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react'
import { withdraw } from '../store/gameStore'
import type { GameState, Transaction } from '../store/gameStore'

interface WalletPageProps {
  state: GameState
  setState: (s: GameState) => void
}

// Conversion rate: Stars to TON (example: 1000 stars = 1 TON)
const STARS_TO_TON_RATE = 0.001

export default function WalletPage({ state, setState }: WalletPageProps) {
  const [tonConnectUI] = useTonConnectUI()
  const wallet = useTonWallet()
  const userFriendlyAddress = useTonAddress()
  
  const [amount, setAmount] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const isConnected = !!wallet

  const handleConnect = useCallback(async () => {
    try {
      await tonConnectUI.openModal()
    } catch (err) {
      console.error('Failed to open connect modal:', err)
    }
  }, [tonConnectUI])

  const handleDisconnect = useCallback(async () => {
    try {
      await tonConnectUI.disconnect()
    } catch (err) {
      console.error('Failed to disconnect:', err)
    }
  }, [tonConnectUI])

  const handleWithdraw = async () => {
    setError('')
    const amt = parseFloat(amount)

    if (!isConnected || !userFriendlyAddress) {
      setError('Please connect your TON wallet first')
      return
    }
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (amt > state.balance) {
      setError(`Insufficient balance. You have ${state.balance.toFixed(1)} Stars`)
      return
    }
    if (amt < 10) {
      setError('Minimum withdrawal is 10 Stars')
      return
    }

    setIsProcessing(true)

    try {
      // Calculate TON amount
      const tonAmount = amt * STARS_TO_TON_RATE
      const nanotons = Math.floor(tonAmount * 1e9).toString()

      // Create transaction - this sends TON from user's wallet
      // In a real app, you'd have a backend that processes withdrawals
      // For demo, we simulate the withdrawal process
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Update local state
      const newState = withdraw(state, amt, userFriendlyAddress)
      setState(newState)
      
      setSuccess(true)
      setAmount('')
      setTimeout(() => setSuccess(false), 3500)
    } catch (err: any) {
      console.error('Withdrawal error:', err)
      setError(err?.message || 'Withdrawal failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMax = () => {
    setAmount(state.balance.toFixed(1))
  }

  const shortAddress = userFriendlyAddress
    ? userFriendlyAddress.slice(0, 6) + '...' + userFriendlyAddress.slice(-4)
    : ''

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
        <p className="text-muted-foreground text-sm mt-1">Stars</p>
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Total mined</span>
            <span className="text-foreground font-mono">{state.totalMined.toFixed(1)} Stars</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Estimated TON value</span>
            <span className="text-foreground font-mono">{(state.balance * STARS_TO_TON_RATE).toFixed(4)} TON</span>
          </div>
        </div>
      </div>

      {/* TON Wallet Connection */}
      <div className="w-full max-w-sm mx-auto mb-5 bg-card border border-border rounded-3xl p-5">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Wallet size={16} className="text-primary" />
          TON Wallet
        </h2>

        {!isConnected ? (
          <button
            onClick={handleConnect}
            className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, hsl(210 100% 50%), hsl(220 100% 45%))',
              color: 'white',
              boxShadow: '0 4px 20px hsl(210 100% 50% / 0.3)',
            }}
          >
            <Wallet size={18} />
            Connect TON Wallet
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Wallet size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{shortAddress}</p>
                  <p className="text-xs text-green-400">Connected</p>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={16} className="text-destructive" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Withdraw form */}
      <div className="w-full max-w-sm mx-auto mb-5 bg-card border border-border rounded-3xl p-5">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <ArrowDownToLine size={16} className="text-primary" />
          Withdraw to TON
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Amount (Stars)</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.0"
                min="10"
                step="0.1"
                disabled={!isConnected || isProcessing}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-16 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all font-mono disabled:opacity-50"
              />
              <button
                onClick={handleMax}
                disabled={!isConnected || isProcessing}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                style={{ color: 'hsl(45 100% 51%)', background: 'hsl(45 100% 51% / 0.1)' }}
              >
                MAX
              </button>
            </div>
            {amount && parseFloat(amount) > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                You will receive approximately {(parseFloat(amount) * STARS_TO_TON_RATE).toFixed(4)} TON
              </p>
            )}
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
                <span className="text-green-400 text-sm font-medium">Withdrawal submitted successfully!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleWithdraw}
            disabled={state.balance <= 0 || !isConnected || isProcessing}
            className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: state.balance > 0 && isConnected
                ? 'linear-gradient(135deg, hsl(45 100% 51%), hsl(35 100% 44%))'
                : 'hsl(220 25% 18%)',
              color: state.balance > 0 && isConnected ? 'hsl(220 30% 10%)' : 'hsl(210 15% 40%)',
              boxShadow: state.balance > 0 && isConnected ? '0 4px 20px hsl(45 100% 51% / 0.3)' : 'none',
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : !isConnected ? (
              'Connect Wallet First'
            ) : state.balance <= 0 ? (
              'Mine Stars First'
            ) : (
              'Withdraw to TON Wallet'
            )}
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2 bg-secondary/50 rounded-xl p-3">
          <span className="text-xs text-muted-foreground">
            <strong className="text-foreground">Rate:</strong> 1,000 Stars = 1 TON. Minimum withdrawal: 10 Stars. Withdrawals are processed to your connected TON wallet.
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

  const tonAmount = tx.amount * STARS_TO_TON_RATE

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
          -{tx.amount.toFixed(1)} Stars
        </p>
        <span className="text-xs text-blue-400">{tonAmount.toFixed(4)} TON</span>
      </div>
    </div>
  )
}
