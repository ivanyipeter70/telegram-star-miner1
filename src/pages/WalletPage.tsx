import { useState, useCallback, useEffect } from 'react'
import { ArrowDownToLine, CheckCircle, Clock, Wallet, Copy, ExternalLink, Loader2, Star, Send, Link2, Unlink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTonConnectUI, useTonAddress, useTonWallet } from '@tonconnect/ui-react'
import { withdraw } from '../store/gameStore'
import type { GameState, Transaction } from '../store/gameStore'
import {
  STARS_TO_TON_RATE,
  isValidTonAddress,
  normalizeAddress,
  shortenAddress,
  buildTonTransfer,
  explorerAddressUrl,
} from '../lib/ton'

interface WalletPageProps {
  state: GameState
  setState: (s: GameState) => void
}

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
  const [telegramUser, setTelegramUser] = useState<{ id: number; first_name: string; username?: string } | null>(null)

  const [tonConnectUI] = useTonConnectUI()
  const connectedAddress = useTonAddress() // user-friendly form, '' when disconnected
  const wallet = useTonWallet()
  const isConnected = Boolean(connectedAddress)

  // Check if running inside Telegram
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      if (tg.initDataUnsafe?.user) {
        setTelegramUser(tg.initDataUnsafe.user)
      }
    }
  }, [])

  // Default the payout address to the connected wallet (user can change it)
  useEffect(() => {
    if (connectedAddress && !walletAddress) {
      setWalletAddress(connectedAddress)
    }
  }, [connectedAddress, walletAddress])

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

  const handleConnect = useCallback(async () => {
    triggerHaptic('light')
    try {
      await tonConnectUI.openModal()
    } catch (err) {
      console.error('[v0] connect error:', err)
    }
  }, [tonConnectUI, triggerHaptic])

  const handleDisconnect = useCallback(async () => {
    triggerHaptic('light')
    try {
      await tonConnectUI.disconnect()
      setWalletAddress('')
    } catch (err) {
      console.error('[v0] disconnect error:', err)
    }
  }, [tonConnectUI, triggerHaptic])

  const handleWithdraw = async () => {
    setError('')
    const amt = parseFloat(amount)

    if (!isConnected) {
      await handleConnect()
      return
    }

    if (!walletAddress.trim()) {
      setError('Please enter a TON wallet address')
      triggerHaptic('error')
      return
    }
    if (!isValidTonAddress(walletAddress)) {
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

    await processWithdrawal(amt)
  }

  const processWithdrawal = async (amt: number) => {
    setIsProcessing(true)
    triggerHaptic('light')

    const tonAmount = amt * STARS_TO_TON_RATE
    const destination = normalizeAddress(walletAddress)

    try {
      // Build and broadcast a real, direct on-chain transfer via the connected wallet.
      const tx = buildTonTransfer(destination, tonAmount, 'Star Miner withdrawal')
      const result = await tonConnectUI.sendTransaction(tx)

      // result.boc is the signed message broadcast to the TON network
      const newState = withdraw(state, amt, destination, result.boc)
      setState(newState)

      setSuccess(true)
      setAmount('')
      triggerHaptic('success')

      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(
          `Sent ${tonAmount.toFixed(4)} TON to ${shortenAddress(destination)} successfully!`,
        )
      }

      setTimeout(() => setSuccess(false), 4000)
    } catch (err: unknown) {
      console.error('[v0] Withdrawal error:', err)
      const message = err instanceof Error ? err.message : 'Transaction failed or was rejected.'
      // User rejection in TON Connect throws with a recognizable message
      setError(/reject|cancel|decline/i.test(message) ? 'Transaction was cancelled.' : message)
      triggerHaptic('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMax = () => {
    setAmount(state.balance.toFixed(1))
    triggerHaptic('light')
  }

  const txHistory = state.transactions.filter(t => t.type === 'withdraw').slice(0, 10)
  const tonValue = state.balance * STARS_TO_TON_RATE

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

      {/* TON wallet connection */}
      <div className="w-full max-w-sm mx-auto mb-5">
        {isConnected ? (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-blue-500/30 bg-blue-500/10">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Wallet size={15} className="text-blue-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-blue-200 font-medium truncate">
                  {wallet?.device.appName ? `${wallet.device.appName} · ` : ''}Mainnet
                </p>
                <a
                  href={explorerAddressUrl(connectedAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400/80 font-mono hover:text-blue-300 truncate block"
                >
                  {shortenAddress(connectedAddress, 8, 6)}
                </a>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1 text-xs text-blue-300 px-2.5 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 transition-colors flex-shrink-0"
            >
              <Unlink size={13} />
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-semibold text-sm text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, hsl(205 90% 52%), hsl(210 90% 45%))', boxShadow: '0 4px 20px hsl(205 90% 52% / 0.3)' }}
          >
            <Link2 size={17} />
            Connect TON Wallet
          </button>
        )}
      </div>

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
            <span className="text-foreground font-mono">{tonValue.toFixed(4)} TON</span>
          </div>
        </div>
      </div>

      {/* Withdraw form */}
      <div className="w-full max-w-sm mx-auto mb-5 bg-card border border-border rounded-3xl p-5">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <ArrowDownToLine size={16} className="text-primary" />
          Send TON to Any Wallet
        </h2>

        <div className="space-y-4">
          {/* Wallet Address Input */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Recipient TON Address</label>
            <div className="relative">
              <input
                type="text"
                value={walletAddress}
                onChange={e => setWalletAddress(e.target.value)}
                placeholder="EQ... or UQ..."
                disabled={isProcessing}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all font-mono disabled:opacity-50"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Wallet size={16} className="text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Funds are sent directly on-chain to this address. Defaults to your connected wallet.
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
                Sends approximately <span className="text-blue-400 font-medium">{(parseFloat(amount) * STARS_TO_TON_RATE).toFixed(4)} TON</span>
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
                <span className="text-green-400 text-sm font-medium">Transaction sent on-chain!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleWithdraw}
            disabled={(isConnected && state.balance <= 0) || isProcessing}
            className="w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: !isConnected
                ? 'linear-gradient(135deg, hsl(205 90% 52%), hsl(210 90% 45%))'
                : state.balance > 0
                ? 'linear-gradient(135deg, hsl(45 100% 51%), hsl(35 100% 44%))'
                : 'hsl(220 25% 18%)',
              color: !isConnected ? '#fff' : state.balance > 0 ? 'hsl(220 30% 10%)' : 'hsl(210 15% 40%)',
              boxShadow: state.balance > 0 || !isConnected ? '0 4px 20px hsl(45 100% 51% / 0.3)' : 'none',
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Confirm in your wallet...
              </>
            ) : !isConnected ? (
              <>
                <Link2 size={18} />
                Connect Wallet to Send
              </>
            ) : state.balance <= 0 ? (
              'Mine Stars First'
            ) : (
              <>
                <ArrowDownToLine size={18} />
                Send TON
              </>
            )}
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2 bg-secondary/50 rounded-xl p-3">
          <span className="text-xs text-muted-foreground">
            <strong className="text-foreground">Direct &amp; instant:</strong> your wallet signs and broadcasts the transfer straight to the TON mainnet. Rate: 1,000 Stars = 1 TON. Minimum: 10 Stars.
          </span>
        </div>
      </div>

      {/* Withdrawal history */}
      {txHistory.length > 0 && (
        <div className="w-full max-w-sm mx-auto bg-card border border-border rounded-3xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock size={14} className="text-muted-foreground" />
            Transaction History
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
          <p className="text-muted-foreground text-sm">No transactions yet. Mine stars and send TON!</p>
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

  const shortWallet = tx.wallet ? shortenAddress(tx.wallet, 8, 6) : ''

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
          {tx.wallet && (
            <a
              href={explorerAddressUrl(tx.wallet)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0"
              aria-label="View on explorer"
            >
              <ExternalLink size={11} className="text-blue-400/70 hover:text-blue-300" />
            </a>
          )}
        </div>
        <p className="text-xs text-muted-foreground/70">{timeStr}{tx.txHash ? ' · on-chain' : ''}</p>
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
