import { useEffect, useState } from 'react'
import { useSocket, emitAsync } from '../context/SocketContext'

export default function WinPage({ onNavigate, winData, room, player }) {
  const socket  = useSocket()
  const [confetti, setConfetti] = useState([])
  const [restarting, setRestarting] = useState(false)

  const isHost   = room?.hostId === socket?.id
  const winner   = winData?.winner
  const scores   = winData?.scores || []
  const isWinner = winner?.id === socket?.id

  const COLORS = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#C77DFF','#FF9F43']
  const MEDALS = ['🥇','🥈','🥉']

  useEffect(() => {
    // Spawn confetti
    setConfetti(
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        color: COLORS[i % COLORS.length],
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 1.5 + Math.random() * 2.5,
        size: 6 + Math.random() * 10,
      }))
    )

    if (!socket) return
    socket.on('game:restarted', (newRoom) => {
      onNavigate('lobby', { room: newRoom })
    })
    return () => socket.off('game:restarted')
  }, [socket])

  const handleRestart = async () => {
    setRestarting(true)
    try { await emitAsync(socket, 'game:restart', {}) }
    catch (e) { alert(e.message); setRestarting(false) }
  }

  return (
    <div className="page-win">
      {/* Confetti */}
      <div className="confetti-wrap" aria-hidden>
        {confetti.map(c => (
          <div key={c.id} className="confetti-piece" style={{
            left: `${c.left}%`, background: c.color,
            width: c.size, height: c.size,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }} />
        ))}
      </div>

      <div className="win-bg-glow" />

      {/* Content */}
      <div className="win-content">
        <div className="win-emoji">{isWinner ? '🏆' : '🎊'}</div>
        <h1 className="win-title">BINGO !!!</h1>
        <p className="win-sub">{isWinner ? 'Tu as gagné ! Belle performance ! 🔥' : `${winner?.name} a crié BINGO en premier !`}</p>

        {/* Winner card */}
        <div className="winner-card">
          <div className="winner-av">{winner?.avatar}</div>
          <div>
            <div className="winner-name">{winner?.name}</div>
            <div className="winner-pts">⭐ {scores.find(s => s.id === winner?.id)?.score || 0} points · 1ère place</div>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="final-scores">
          {scores.map((p, i) => (
            <div key={p.id} className={`final-row ${i === 0 ? 'first' : ''} ${p.id === socket.id ? 'me' : ''}`}>
              <span className="final-medal">{MEDALS[i] || `${i + 1}.`}</span>
              <span className="final-av">{p.avatar}</span>
              <span className="final-name">{p.id === socket.id ? 'Vous' : p.name}</span>
              <span className="final-pts">{p.score}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="win-actions">
          {isHost ? (
            <button className="btn-primary btn-restart" onClick={handleRestart} disabled={restarting}>
              {restarting ? '⏳ ...' : '🔄 Rejouer !'}
            </button>
          ) : (
            <div className="waiting-host">⏳ En attente que l'hôte relance...</div>
          )}
          <button className="btn-ghost-sm" onClick={() => onNavigate('landing')}>
            🏠 Accueil
          </button>
        </div>
      </div>
    </div>
  )
}
