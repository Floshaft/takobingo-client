import { useState, useEffect, useRef } from 'react'
import { useSocket, emitAsync } from '../context/SocketContext'

const REACTIONS = ['🎉','🔥','😱','🐙','😤','💩']

export default function GamePage({ onNavigate, room: initialRoom, player }) {
  const socket = useSocket()
  const chatRef = useRef(null)

  const [card, setCard]         = useState([])
  const [marked, setMarked]     = useState(new Set([12])) // FREE always marked
  const [drawnItems, setDrawn]  = useState([])
  const [lastItem, setLastItem] = useState(null)
  const [scores, setScores]     = useState([])
  const [chat, setChat]         = useState([{ system: true, text: '🎮 La partie commence !' }])
  const [msg, setMsg]           = useState('')
  const [room, setRoom]         = useState(initialRoom)
  const [drawing, setDrawing]   = useState(false)
  const [bingoError, setBingoError] = useState('')

  const isHost = room?.hostId === socket?.id

  useEffect(() => {
    if (!socket) return

    // Receive personal card
    socket.on('game:cardDealt', ({ card }) => {
      setCard(card)
      setMarked(new Set([12]))
    })

    // Ball drawn
    socket.on('game:ballDrawn', ({ item, drawnItems }) => {
      setDrawn(drawnItems)
      setLastItem(item)
    })

    // Scores updated
    socket.on('game:scoreUpdated', ({ scores }) => setScores(scores))

    // Someone won!
    socket.on('game:bingoWon', ({ winner, scores }) => {
      onNavigate('win', { win: { winner, scores }, room })
    })

    // Chat
    socket.on('chat:message',  (m) => addChat(m))
    socket.on('chat:reaction', (m) => addChat({ ...m, text: m.emoji, isReaction: true }))
    socket.on('chat:system',   (m) => addChat({ system: true, ...m }))

    return () => {
      socket.off('game:cardDealt')
      socket.off('game:ballDrawn')
      socket.off('game:scoreUpdated')
      socket.off('game:bingoWon')
      socket.off('chat:message')
      socket.off('chat:reaction')
      socket.off('chat:system')
    }
  }, [socket])

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [chat])

  const addChat = (m) => setChat(c => [...c.slice(-80), m])

  const handleDraw = async () => {
    setDrawing(true)
    try { await emitAsync(socket, 'game:draw', {}) }
    catch (e) { alert(e.message) }
    finally { setDrawing(false) }
  }

  const handleMarkCell = async (idx) => {
    const word = card[idx]
    if (!word || word === 'FREE') return
    if (!drawnItems.includes(word)) return // not drawn yet

    try {
      await emitAsync(socket, 'game:markCell', { cellIndex: idx })
      setMarked(prev => {
        const next = new Set(prev)
        next.has(idx) ? next.delete(idx) : next.add(idx)
        return next
      })
    } catch {}
  }

  const handleBingo = async () => {
    setBingoError('')
    try {
      await emitAsync(socket, 'game:bingo', {})
    } catch (e) {
      setBingoError(e.message)
      setTimeout(() => setBingoError(''), 3000)
    }
  }

  const sendMsg = async () => {
    if (!msg.trim()) return
    try { await emitAsync(socket, 'chat:message', { text: msg.trim() }) }
    catch {}
    setMsg('')
  }

  const sendReaction = async (emoji) => {
    try { await emitAsync(socket, 'chat:reaction', { emoji }) }
    catch {}
  }

  const totalItems = 25
  const progress = Math.round((drawnItems.length / totalItems) * 100)
  const BALL_COLORS = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#C77DFF','#FF9F43']
  const ballColor = BALL_COLORS[drawnItems.length % BALL_COLORS.length]

  return (
    <div className="page-game">

      {/* Sidebar: scores + drawn */}
      <aside className="game-sidebar">
        <div className="sidebar-section">
          <div className="sidebar-label">Scores</div>
          {scores.map((p, i) => (
            <div key={p.id} className={`score-row ${p.id === socket.id ? 'me' : ''}`}>
              <span className="score-rank" style={{ color: i === 0 ? '#FFD93D' : undefined }}>{i + 1}</span>
              <span className="score-av">{p.avatar}</span>
              <span className="score-name">{p.id === socket.id ? 'Vous' : p.name}</span>
              <span className="score-pts">{p.score}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-section" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="sidebar-label">Tirés ({drawnItems.length})</div>
          <div className="drawn-grid">
            {drawnItems.map((w, i) => (
              <div key={i} className="drawn-ball"
                style={{ background: BALL_COLORS[i % BALL_COLORS.length] + '22', border: `1.5px solid ${BALL_COLORS[i % BALL_COLORS.length]}`, color: BALL_COLORS[i % BALL_COLORS.length] }}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main game area */}
      <main className="game-main">

        {/* Top bar */}
        <div className="game-topbar">
          <div className="current-ball-wrap">
            <div className="current-ball" style={lastItem ? { background: `linear-gradient(135deg, ${ballColor}, ${ballColor}99)`, border: 'none', boxShadow: `0 0 16px ${ballColor}60` } : {}}>
              {drawnItems.length > 0 ? drawnItems.length : '?'}
            </div>
            <div>
              <div className="current-word">{lastItem ? `#${drawnItems.length} — ${lastItem}` : 'En attente...'}</div>
              <div className="current-sub">{drawnItems.length} / {totalItems} boules tirées</div>
            </div>
          </div>

          <div className="topbar-actions">
            {bingoError && <span className="bingo-error">{bingoError}</span>}
            <button className="btn-bingo" onClick={handleBingo}>🎉 BINGO !</button>
            {isHost && (
              <button className="btn-draw" onClick={handleDraw} disabled={drawing}>
                {drawing ? '...' : 'Tirer →'}
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${ballColor}, #C77DFF)` }} />
        </div>

        {/* Bingo card */}
        <div className="card-wrap">
          <div className="bingo-card">
            {['B','I','N','G','O'].map(h => (
              <div key={h} className="card-head">{h}</div>
            ))}
            {card.map((word, i) => {
              const isFree   = word === 'FREE'
              const isMarked = marked.has(i)
              const isAvail  = !isFree && drawnItems.includes(word) && !isMarked
              return (
                <div key={i}
                  className={`card-cell ${isFree ? 'free' : ''} ${isMarked ? 'marked' : ''} ${isAvail ? 'available' : ''}`}
                  onClick={() => handleMarkCell(i)}>
                  {isFree ? '⭐' : word}
                </div>
              )
            })}
            {card.length === 0 && Array.from({ length: 25 }).map((_, i) => (
              <div key={i} className="card-cell empty">…</div>
            ))}
          </div>
          <div className="card-legend">
            <span className="legend-dot" style={{ background: '#6BCB77' }} /> Disponible à valider
            <span className="legend-dot" style={{ background: '#FF6B6B', marginLeft: '.75rem' }} /> Validée
          </div>
        </div>
      </main>

      {/* Chat */}
      <aside className="game-chat">
        <div className="chat-head">
          <span className="chat-head-title">Chat</span>
          <span className="online-dot" />
        </div>
        <div className="chat-msgs" ref={chatRef}>
          {chat.map((m, i) => (
            <div key={i} className={`chat-msg ${m.system ? 'system' : ''}`}>
              {!m.system && (
                <div className="chat-name" style={{ color: colorForName(m.playerName) }}>
                  {m.playerName}
                </div>
              )}
              <div className="chat-text">{m.text}</div>
            </div>
          ))}
        </div>
        <div className="reactions-bar">
          {REACTIONS.map(e => (
            <button key={e} className="reaction-btn" onClick={() => sendReaction(e)}>{e}</button>
          ))}
        </div>
        <div className="chat-input-row">
          <input className="chat-input" placeholder="Message..." value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMsg()} />
          <button className="chat-send" onClick={sendMsg}>↑</button>
        </div>
      </aside>
    </div>
  )
}

const COLORS = ['#4D96FF','#FF6B6B','#6BCB77','#C77DFF','#FFD93D','#FF9F43']
const colorForName = (name = '') => COLORS[Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % COLORS.length]
