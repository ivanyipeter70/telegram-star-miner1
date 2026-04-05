// Game state management using localStorage
export interface Transaction {
  id: string
  type: 'mine' | 'withdraw'
  amount: number
  wallet?: string
  timestamp: number
  status: 'completed' | 'pending'
}

export interface GameState {
  balance: number
  totalMined: number
  miningRate: number // stars per tap
  energy: number
  maxEnergy: number
  boostLevel: number
  transactions: Transaction[]
  username: string
}

const STORAGE_KEY = 'telegram-star-miner'

const defaultState: GameState = {
  balance: 0,
  totalMined: 0,
  miningRate: 1,
  energy: 100,
  maxEnergy: 100,
  boostLevel: 1,
  transactions: [],
  username: 'StarMiner_' + Math.floor(Math.random() * 9999),
}

export function loadState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as GameState
      // Restore energy slowly over time
      return parsed
    }
  } catch {
    // ignore
  }
  return { ...defaultState }
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function mine(state: GameState): { newState: GameState; gained: number } {
  if (state.energy <= 0) return { newState: state, gained: 0 }

  const gained = state.miningRate * state.boostLevel
  const newState: GameState = {
    ...state,
    balance: state.balance + gained,
    totalMined: state.totalMined + gained,
    energy: Math.max(0, state.energy - 1),
    transactions: [
      {
        id: crypto.randomUUID(),
        type: 'mine',
        amount: gained,
        timestamp: Date.now(),
        status: 'completed',
      },
      ...state.transactions.slice(0, 49),
    ],
  }
  saveState(newState)
  return { newState, gained }
}

export function withdraw(state: GameState, amount: number, wallet: string): GameState {
  if (amount <= 0 || amount > state.balance) return state

  const newState: GameState = {
    ...state,
    balance: state.balance - amount,
    transactions: [
      {
        id: crypto.randomUUID(),
        type: 'withdraw',
        amount,
        wallet,
        timestamp: Date.now(),
        status: 'completed',
      },
      ...state.transactions.slice(0, 49),
    ],
  }
  saveState(newState)
  return newState
}

export function refillEnergy(state: GameState): GameState {
  const newState: GameState = { ...state, energy: state.maxEnergy }
  saveState(newState)
  return newState
}

export function upgradeBoost(state: GameState): GameState {
  const cost = state.boostLevel * 50
  if (state.balance < cost) return state

  const newState: GameState = {
    ...state,
    balance: state.balance - cost,
    boostLevel: state.boostLevel + 1,
    miningRate: state.miningRate + 0.5,
    maxEnergy: state.maxEnergy + 20,
    transactions: [
      {
        id: crypto.randomUUID(),
        type: 'mine',
        amount: -cost,
        timestamp: Date.now(),
        status: 'completed',
      },
      ...state.transactions.slice(0, 49),
    ],
  }
  saveState(newState)
  return newState
}

// Leaderboard mock data (static)
export const LEADERBOARD = [
  { rank: 1, username: 'CryptoKing_X', stars: 182450, badge: '👑' },
  { rank: 2, username: 'StarHunter99', stars: 97320, badge: '🥈' },
  { rank: 3, username: 'GalacticMiner', stars: 74110, badge: '🥉' },
  { rank: 4, username: 'NovaStar_Z', stars: 51890, badge: '⭐' },
  { rank: 5, username: 'CosmicTapper', stars: 43220, badge: '⭐' },
  { rank: 6, username: 'StarForge_V', stars: 38750, badge: '⭐' },
  { rank: 7, username: 'NebulaMiner', stars: 29400, badge: '⭐' },
  { rank: 8, username: 'AstroDigger', stars: 21100, badge: '⭐' },
  { rank: 9, username: 'QuantumStar', stars: 15680, badge: '⭐' },
  { rank: 10, username: 'PlanetTap', stars: 9870, badge: '⭐' },
]
