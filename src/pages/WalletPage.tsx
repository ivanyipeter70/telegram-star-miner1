import { useState, useCallback, useEffect } from 'react'
import { ArrowDownToLine, CheckCircle, Clock, Wallet, Copy, ExternalLink, LogOut, Loader2, Star, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { withdraw } from '../store/gameStore'
import type { GameState, Transaction } from '../store/gameStore'

interface WalletPageProps {
  state: GameState
  setState: (s: GameState) => void
}

// Conversion rate: Stars to TON (example: 1000 stars = 1 TON)
const STARS_TO_TON_RATE = 0.001

// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
          }
        }
        ready: () => void
        expand: () => void
        close: () => void
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          show: () => void
          hide: () => void
          enable: () => void
          disable: () => void
          onClick: (callback: () => void) => void
          offClick: (callback: () => void) => void
          showProgress: (leaveActive?: boolean) => void
          hideProgress: () => void
        }
        openInvoice: (url: string, callback?: (status: string) => void) => void
        showPopup: (params: { title?: string; message: string; buttons?: Array<{ id?: string; type?: string; text?: string }> }, callback?: (buttonId: string) => void) => void
        showAlert: (message: string, callback?: () => void) => void
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
          selectionChanged: () => void
        }
        platform: string
        version: string
        colorScheme: 'light' | 'dark'
        themeParams: Record<string, string>
        isExpanded: boolean
        viewportHeight: number
        viewportStableHeight: number
      }
    }
  }
}

export default function WalletPage({ state, setState }: WalletPageProps) {
  const [amount, setAmount] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false)
  const [telegramUser, setTelegramUser] = useState<{ id: number; first_name: string; username?: string } | null>(null)

  // Check if running inside Telegram
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      setIsTelegramWebApp(true)
      tg.ready()
      tg.expand()
      
      if (tg.initDataUnsafe?.user) {
        setTelegramUser(tg.initDataUnsafe.user)
      }
    }
  }, [])

  const triggerHaptic = useCallback((type: 'success' | 'error' | 'warning' | 'light' | 'medium') => {
    const tg = window.Telegram?.WebApp?.HapticFeedback
    if (tg) {
      if (type === 'success' || type === 'error' || type === 'warning') {
        tg.notificationOccurred(type)
      } else {
        tg.impactOccurred(type)
      }
    }
  }, [])

  const handleWithdraw = async () => {
    setError('')
    const amt = parseFloat(amount)

    if (!walletAddress.trim()) {
      setError('Please enter your TON wallet address')
      triggerHaptic('error')
      return
    }

    // Basic TON address validation (EQ or UQ prefix, 48 chars total)
    const isValidTonAddress = /^(EQ|UQ)[a-zA-Z0-9_-]{46}$/.test(walletAddress.trim()) || 
                              /^0:[a-fA-F0-9]{64}$/.test(walletAddress.trim())
    
    if (!isValidTonAddress) {
      setError('Please enter a valid TON wallet address')
      triggerHaptic('error')
      return
    }

    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount')
      triggerHaptic('error')
      return
    }
    if (amt > state.balance) {
      setError(`Insufficient balance. You have ${state.balance.toFixed(1)} Stars`)
      triggerHaptic('error')
      return
    }
    if (amt < 10) {
      setError('Minimum withdrawal is 10 Stars')
      triggerHaptic('error')
      return
    }

    // Show confirmation via Telegram if available
    if (isTelegramWebApp && window.Telegram?.WebApp?.showConfirm) {
      const tonAmount = (amt * STARS_TO_TON_RATE).toFixed(4)
      window.Telegram.WebApp.showConfirm(
        `Withdraw ${amt.toFixed(1)} Stars (≈${tonAmount} TON) to ${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}?`,
        async (confirmed) => {
          if (confirmed) {
            await processWithdrawal(amt)
          }
        }
      )
    } else {
      await processWithdrawal(amt)
    }
  }

  const processWithdrawal = async (amt: number) => {
    setIsProcessing(true)
    triggerHaptic('light')

    try {
      // Simulate processing delay (in production, this would be an API call)
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Update local state
      const newState = withdraw(state, amt, walletAddress.trim())
      setState(newState)
      
      setSuccess(true)
      setAmount('')
      triggerHaptic('success')
      
      // Show success via Telegram alert if available
      if (isTelegramWebApp && window.Telegram?.WebApp?.showAlert) {
        const tonAmount = (amt * STARS_TO_TON_RATE).toFixed(4)
        window.Telegram.WebApp.showAlert(`Withdrawal of ${amt.toFixed(1)} Stars (≈${tonAmount} TON) submitted successfully!`)
      }
      
      setTimeout(() => setSuccess(false), 3500)
    } catch (err: any) {
      console.error('Withdrawal error:', err)
      setError(err?.message || 'Withdrawal failed. Please try again.')
      triggerHaptic('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMax = () => {
    setAmount(state.balance.toFixed(1))
    triggerHaptic('light')
  }

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      triggerHaptic('light')
    }
  }

  const txHistory = state.transactions.filter(t => t.type === 'withdraw').slice(0, 10)

  return (
    <div className="flex flex-col min-h-full pb-24 pt-4 px-4 space-bg">
      {/* Telegram User Info (if available) */}
      {telegramUser && (
        <div className="w-full max-w-sm mx-auto mb-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <Send size={14} className="text-blue-400" />
            <span className="text-xs text-blue-300">
              Connected as <strong>{telegramUser.first_name}</strong>
              {telegramUser.username && <span className="text-blue-400/70"> @{telegramUser.username}</span>}
            </span>
          </div>
        </div>
      )}

      {/* Balance card */}
      <div
        className="w-full max-w-sm mx-auto mb-5 rounded-3xl p-5 border border-primary/30"
        style={{
          background: 'linear-gradient(135deg, hsl(220 30% 12%), hsl(220 25% 16%))',
          boxShadow: 'var(--star-glow)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Star size={16} className="text-primary" />
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

      {/* Withdraw form */}
      <div className="w-full max-w-sm mx-auto mb-5 bg-card border border-border rounded-3xl p-5">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <ArrowDownToLine size={16} className="text-primary" />
          Withdraw to TON Wallet
        </h2>

        <div className="space-y-4">
          {/* Wallet Address Input */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">TON Wallet Address</label>
            <div className="relative">
              <input
                type="text"
                value={walletAddress}
                onChange={e => setWalletAddress(e.target.value)}
                placeholder="EQ... or UQ..."
                disabled={isProcessing}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all font-mono disabled:opacity-50"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Wallet size={16} className="text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Enter your TON wallet address (Tonkeeper, Telegram Wallet, etc.)
            </p>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Amount (Stars)</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.0"
                min="10"
                step="0.1"
                disabled={isProcessing}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-16 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all font-mono disabled:opacity-50"
              />
              <button
                onClick={handleMax}
                disabled={isProcessing}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                style={{ color: 'hsl(45 100% 51%)', background: 'hsl(45 100% 51% / 0.1)' }}
              >
                MAX
              </button>
            </div>
            {amount && parseFloat(amount) > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                You will receive approximately <span className="text-blue-400 font-medium">{(parseFloat(amount) * STARS_TO_TON_RATE).toFixed(4)} TON</span>
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
            disabled={state.balance <= 0 || isProcessing}
            className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: state.balance > 0 
                ? 'linear-gradient(135deg, hsl(45 100% 51%), hsl(35 100% 44%))'
                : 'hsl(220 25% 18%)',
              color: state.balance > 0 ? 'hsl(220 30% 10%)' : 'hsl(210 15% 40%)',
              boxShadow: state.balance > 0 ? '0 4px 20px hsl(45 100% 51% / 0.3)' : 'none',
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : state.balance <= 0 ? (
              'Mine Stars First'
            ) : (
              <>
                <ArrowDownToLine size={18} />
                Withdraw to TON
              </>
            )}
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2 bg-secondary/50 rounded-xl p-3">
          <span className="text-xs text-muted-foreground">
            <strong className="text-foreground">Rate:</strong> 1,000 Stars = 1 TON. Minimum withdrawal: 10 Stars. Withdrawals are typically processed within 24 hours.
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
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-secondary flex items-center justify-center">
            <Wallet size={24} className="text-muted-foreground" />
          </div>
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
