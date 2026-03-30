import { useState, useEffect, useRef } from 'react'
import { useSocket, emitAsync } from '../context/SocketContext'

export default function LobbyPage({ onNavigate, room: initialRoom, player }) {
  const socket   = useSocket()
  const roomRef  = useRef(initialRoom)
  const [room, setRoom]       = useState(initialRoom)
  const [chat, setChat]       = useState([{ system: true, text: '🎉 Bienvenue dans la salle !' }])
  const [msg, setMsg]         = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)

  // Garde roomRef à jour pour le handler game:started
  useEffect(() => { roomRef.current = room }, [room])

  const isHost = room?.hostId === socket?.id

  useEffect(() => {
    if (!socket) return

    socket.on('room:updated', (updatedRoom) => {
      setRoom(updatedRoom)
      roomRef.current = updatedRoom
    })

    socket.on('game:started', ({ hostId, theme, players }) => {
      // On passe le hostId reçu du serveur → garantit que isHost est correct dans GamePage
      onNavigate('game', {
        room: { ...roomRef.current, status: 'playing', hostId, theme, players },
      })
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

  // Auto-scroll chat
  useEffect(() => {
    const el = document.getElementById('lobby-chat-msgs')
    if (el) el.scrollTop = el.scrollHeight
  }, [chat])

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
      <header className="lobby-header">
        <div className="lobby-title">
          <span className="lobby-tako">🐙</span>
          <span className="lobby-name">TakoBingo · Salle privée</span>
          {isHost && <span style={{ background: '#FFD93D', color: '#1a1000', borderRadius: '50px', padding: '.1rem .6rem', fontSize: '.65rem', fontWeight: 800 }}>Hôte</span>}
        </div>
        <button className="btn-ghost-sm" onClick={handleLeave}>← Quitter</button>
      </header>

      <div className="lobby-body">
        <div className="lobby-left">

          {/* Code */}
          <div className="lobby-section">
            <div className="section-label">Code d'invitation</div>
            <div className="code-display">
              <span className="code-big">{room.code}</span>
              <button className="btn-copy" onClick={copyCode}>{copied ? '✓ Copié !' : 'Copier'}</button>
            </div>
            <div className="code-link">🔗 takobingo-client.vercel.app · code : {room.code}</div>
          </div>

          {/* Joueurs */}
          <div className="lobby-section">
            <div className="section-label">
              Joueurs ({room.players?.length || 0}/{room.maxPlayers})
            </div>
            <div className="players-grid">
              {room.players?.map(p => (
                <div key={p.id} className={`player-card ${p.id === socket.id ? 'me' : ''}`}>
                  <span className="player-av">{p.avatar}</span>
                  <span className="player-name">{p.name}</span>
                  {p.isHost  && <span className="host-badge">Hôte</span>}
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

          {/* Thème actif */}
          <div className="lobby-section">
            <div className="section-label">Thème de la partie</div>
            <div style={{ background: '#1a1a35', borderRadius: '10px', padding: '.6rem .9rem', border: '1px solid rgba(255,255,255,.1)', fontSize: '.85rem', fontWeight: 700 }}>
              {room.customThemeName
                ? `🎨 ${room.customThemeName} (thème perso)`
                : `${themeIcon(room.theme)} ${room.theme}`}
            </div>
          </div>

          {/* Lancer */}
          {isHost ? (
            <button className="btn-start"
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
                {!m.system && <div className="chat-name" style={{ color: colorForName(m.playerName) }}>{m.playerName}</div>}
                <div className="chat-text">{m.text}</div>
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
const colorForName = (name = '') => COLORS[Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % COLORS.length]
const themeIcon = (t) => ({ food:'🍕', travel:'✈️', music:'🎵', cinema:'🎬', sport:'⚽', animals:'🐼', games:'🎮' }[t] || '🎯')
