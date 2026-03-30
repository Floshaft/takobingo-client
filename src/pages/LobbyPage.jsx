import { useState, useEffect } from 'react'
import { useSocket, emitAsync } from '../context/SocketContext'

export default function LobbyPage({ onNavigate, room: initialRoom, player }) {
  const socket  = useSocket()
  const [room, setRoom]     = useState(initialRoom)
  const [chat, setChat]     = useState([{ system: true, text: '🎉 Bienvenue dans la salle !' }])
  const [msg, setMsg]       = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)

  const isHost = player?.isHost || room?.hostId === socket?.id

  useEffect(() => {
    if (!socket) return

    socket.on('room:updated', setRoom)
    socket.on('game:started', ({ theme, players }) => {
      onNavigate('game', { room: { ...room, status: 'playing', theme, players } })
    })
    socket.on('chat:message', (m) => setChat(c => [...c, m]))
    socket.on('chat:system',  (m) => setChat(c => [...c, { system: true, ...m }]))

    return () => {
      socket.off('room:updated')
      socket.off('game:started')
      socket.off('chat:message')
      socket.off('chat:system')
    }
  }, [socket])

  const copyCode = () => {
    navigator.clipboard?.writeText(room.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleStart = async () => {
    setLoading(true)
    try { await emitAsync(socket, 'game:start', {}) }
    catch (e) { alert(e.message) }
    finally { setLoading(false) }
  }

  const handleLeave = async () => {
    await emitAsync(socket, 'room:leave', {})
    onNavigate('landing')
  }

  const sendMsg = async () => {
    if (!msg.trim()) return
    try { await emitAsync(socket, 'chat:message', { text: msg.trim() }) }
    catch {}
    setMsg('')
  }

  if (!room) return null

  return (
    <div className="page-lobby">
      {/* Header */}
      <header className="lobby-header">
        <div className="lobby-title">
          <span className="lobby-tako">🐙</span>
          <span className="lobby-name">{room.theme?.toUpperCase()} · Salle privée</span>
        </div>
        <button className="btn-ghost-sm" onClick={handleLeave}>← Quitter</button>
      </header>

      <div className="lobby-body">
        {/* Left */}
        <div className="lobby-left">

          {/* Room code */}
          <div className="lobby-section">
            <div className="section-label">Code d'invitation</div>
            <div className="code-display">
              <span className="code-big">{room.code}</span>
              <button className="btn-copy" onClick={copyCode}>
                {copied ? '✓ Copié !' : 'Copier'}
              </button>
            </div>
            <div className="code-link">🔗 takobingo.io/{room.code}</div>
          </div>

          {/* Players */}
          <div className="lobby-section">
            <div className="section-label">
              Joueurs ({room.players?.length || 0}/{room.maxPlayers})
            </div>
            <div className="players-grid">
              {room.players?.map(p => (
                <div key={p.id} className={`player-card ${p.id === socket.id ? 'me' : ''}`}>
                  <span className="player-av">{p.avatar}</span>
                  <span className="player-name">{p.name}</span>
                  {p.isHost && <span className="host-badge">Hôte</span>}
                  {p.id === socket.id && <span className="me-badge">Vous</span>}
                </div>
              ))}
              {Array.from({ length: Math.max(0, (room.maxPlayers || 8) - (room.players?.length || 0)) }).map((_, i) => (
                <div key={`empty-${i}`} className="player-card empty">
                  <span className="player-av" style={{ opacity: .3 }}>+</span>
                  <span className="player-name" style={{ opacity: .3 }}>En attente...</span>
                </div>
              ))}
            </div>
          </div>

          {/* Start button */}
          {isHost ? (
            <button className="btn-primary btn-start"
              onClick={handleStart}
              disabled={loading || (room.players?.length || 0) < 1}>
              {loading ? '⏳ Lancement...' : `🎯 Lancer la partie ! (${room.players?.length || 0} joueur${room.players?.length > 1 ? 's' : ''})`}
            </button>
          ) : (
            <div className="waiting-host">
              <div className="waiting-dot" />
              En attente que l'hôte lance la partie...
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="lobby-chat">
          <div className="chat-header-label">💬 Chat</div>
          <div className="chat-msgs" id="lobby-chat-msgs">
            {chat.map((m, i) => (
              <div key={i} className={`chat-msg ${m.system ? 'system' : ''}`}>
                {!m.system && (
                  <span className="chat-name" style={{ color: colorForName(m.playerName) }}>
                    {m.playerName}
                  </span>
                )}
                <span className="chat-text">{m.text}</span>
              </div>
            ))}
          </div>
          <div className="chat-input-row">
            <input className="chat-input" placeholder="Message..." value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()} />
            <button className="chat-send" onClick={sendMsg}>↑</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const COLORS = ['#4D96FF','#FF6B6B','#6BCB77','#C77DFF','#FFD93D','#FF9F43']
const colorForName = (name) => COLORS[Math.abs(name?.split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 0) % COLORS.length]
