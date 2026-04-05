import { motion } from 'framer-motion'
import { Trophy, Star } from 'lucide-react'
import { LEADERBOARD } from '../store/gameStore'
import type { GameState } from '../store/gameStore'

interface LeaderboardPageProps {
  state: GameState
}

export default function LeaderboardPage({ state }: LeaderboardPageProps) {
  // Insert user into leaderboard
  const userEntry = { rank: 0, username: state.username, stars: state.totalMined, badge: '🌟' }
  const allEntries = [...LEADERBOARD, userEntry].sort((a, b) => b.stars - a.stars).map((e, i) => ({ ...e, rank: i + 1 }))
  const userRank = allEntries.find(e => e.username === state.username)?.rank ?? 99

  return (
    <div className="flex flex-col min-h-full pb-24 pt-4 px-4 space-bg">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <Trophy size={20} className="text-primary" />
          <h1 className="text-lg font-bold text-foreground">Global Leaderboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">Your rank: #{userRank}</p>
      </div>

      {/* Top 3 podium */}
      <div className="w-full max-w-sm mx-auto flex items-end justify-center gap-3 mb-6 px-2">
        {/* 2nd place */}
        <PodiumCard entry={allEntries[1]} height="h-20" />
        {/* 1st place */}
        <PodiumCard entry={allEntries[0]} height="h-28" featured />
        {/* 3rd place */}
        <PodiumCard entry={allEntries[2]} height="h-16" />
      </div>

      {/* Full list */}
      <div className="w-full max-w-sm mx-auto bg-card border border-border rounded-3xl overflow-hidden">
        {allEntries.map((entry, i) => {
          const isUser = entry.username === state.username
          return (
            <motion.div
              key={entry.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors"
              style={{
                background: isUser ? 'hsl(45 100% 51% / 0.08)' : 'transparent',
              }}
            >
              {/* Rank */}
              <div className="w-8 text-center flex-shrink-0">
                {entry.rank <= 3 ? (
                  <span className="text-lg">{entry.badge}</span>
                ) : (
                  <span className="text-sm font-bold text-muted-foreground font-mono">#{entry.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                style={{
                  background: isUser
                    ? 'linear-gradient(135deg, hsl(45 100% 51%), hsl(35 100% 44%))'
                    : 'hsl(220 25% 20%)',
                  color: isUser ? 'hsl(220 30% 10%)' : 'hsl(210 20% 70%)',
                }}
              >
                {entry.username.slice(0, 2).toUpperCase()}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isUser ? 'text-primary' : 'text-foreground'}`}>
                  {entry.username}
                  {isUser && <span className="ml-1 text-xs font-normal text-muted-foreground">(You)</span>}
                </p>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star size={12} className="text-primary" />
                <span className="text-sm font-bold font-mono text-foreground">
                  {entry.stars.toLocaleString('en-US', { maximumFractionDigits: 1 })}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">Updated in real-time · Keep mining to climb the ranks!</p>
    </div>
  )
}

interface PodiumCardProps {
  entry: { rank: number; username: string; stars: number; badge: string }
  height: string
  featured?: boolean
}

function PodiumCard({ entry, height, featured }: PodiumCardProps) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      {featured && <span className="text-2xl mb-1">👑</span>}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2"
        style={{
          background: featured
            ? 'linear-gradient(135deg, hsl(45 100% 60%), hsl(35 100% 44%))'
            : 'hsl(220 25% 20%)',
          borderColor: featured ? 'hsl(45 100% 51%)' : 'hsl(220 20% 25%)',
          color: featured ? 'hsl(220 30% 10%)' : 'hsl(210 20% 70%)',
          boxShadow: featured ? 'var(--star-glow)' : 'none',
        }}
      >
        {entry.username.slice(0, 2).toUpperCase()}
      </div>
      <p className="text-xs font-semibold text-foreground truncate w-full text-center px-1">
        {entry.username.length > 10 ? entry.username.slice(0, 8) + '…' : entry.username}
      </p>
      <p className="text-xs font-mono text-primary">{entry.stars.toLocaleString()}</p>
      <div
        className={`w-full ${height} rounded-t-xl flex items-center justify-center`}
        style={{
          background: featured
            ? 'linear-gradient(180deg, hsl(45 100% 51% / 0.3), hsl(45 100% 51% / 0.1))'
            : 'hsl(220 25% 16%)',
          border: '1px solid hsl(220 20% 22%)',
        }}
      >
        <span className="text-lg">{entry.badge}</span>
      </div>
    </div>
  )
}
