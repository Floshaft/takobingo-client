import { useState } from 'react'
import { useSocket, emitAsync } from '../context/SocketContext'

const AVATARS = ['🐙','🦊','🐸','🦁','🐼','🐧','🦄','🐲']
const THEMES  = [
  { key: 'food',    icon: '🍕', label: 'Food'    },
  { key: 'travel',  icon: '✈️', label: 'Voyage'  },
  { key: 'music',   icon: '🎵', label: 'Musique' },
  { key: 'cinema',  icon: '🎬', label: 'Cinéma'  },
  { key: 'sport',   icon: '⚽', label: 'Sport'   },
  { key: 'animals', icon: '🐼', label: 'Animaux' },
  { key: 'games',   icon: '🎮', label: 'Gaming'  },
]

export default function LandingPage({ onNavigate }) {
  const socket = useSocket()
  const [tab, setTab]         = useState('create') // create | join
  const [name, setName]       = useState('')
  const [avatar, setAvatar]   = useState('🐙')
  const [theme, setTheme]     = useState('food')
  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleCreate = async () => {
    if (!name.trim()) { setError('Entre ton pseudo !'); return }
    setLoading(true); setError('')
    try {
      const res = await emitAsync(socket, 'room:create', {
        name: name.trim(), avatar, theme, maxPlayers: 8,
      })
      onNavigate('lobby', {
        room: res.room,
        player: { id: socket.id, name: name.trim(), avatar, isHost: true },
      })
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleJoin = async () => {
    if (!name.trim()) { setError('Entre ton pseudo !'); return }
    if (!code.trim()) { setError('Entre le code de la salle !'); return }
    setLoading(true); setError('')
    try {
      const res = await emitAsync(socket, 'room:join', {
        name: name.trim(), avatar, code: code.trim().toUpperCase(),
      })
      onNavigate('lobby', {
        room: res.room,
        player: { id: socket.id, name: name.trim(), avatar, isHost: false },
      })
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="page-landing">
      <header className="landing-header">
        <div className="logo-wrap">
          <span className="logo-crown">👑</span>
          <div className="logo-letters">
            {'TAKOBINGO'.split('').map((l, i) => (
              <span key={i} className={`logo-l logo-l-${i}`}>{l}</span>
            ))}
            <span className="logo-excl">!</span>
          </div>
          <span className="logo-tako">🐙</span>
        </div>
        <p className="landing-sub">✦ Party Edition ✦</p>
      </header>

      <div className="landing-card">
        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab === 'create' ? 'active' : ''}`} onClick={() => { setTab('create'); setError('') }}>
            Créer une salle
          </button>
          <button className={`tab ${tab === 'join' ? 'active' : ''}`} onClick={() => { setTab('join'); setError('') }}>
            Rejoindre
          </button>
        </div>

        {/* Pseudo */}
        <div className="field">
          <label className="field-label">Ton pseudo</label>
          <input className="field-input" placeholder="Entre ton pseudo..." maxLength={16}
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())} />
        </div>

        {/* Avatar */}
        <div className="field">
          <label className="field-label">Ton avatar</label>
          <div className="avatar-row">
            {AVATARS.map(av => (
              <button key={av} className={`av-btn ${avatar === av ? 'sel' : ''}`}
                onClick={() => setAvatar(av)}>{av}</button>
            ))}
          </div>
        </div>

        {/* Theme (create only) */}
        {tab === 'create' && (
          <div className="field">
            <label className="field-label">Thème des cases</label>
            <div className="theme-grid">
              {THEMES.map(t => (
                <button key={t.key} className={`theme-btn ${theme === t.key ? 'sel' : ''}`}
                  onClick={() => setTheme(t.key)}>
                  <span className="theme-icon">{t.icon}</span>
                  <span className="theme-name">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Code (join only) */}
        {tab === 'join' && (
          <div className="field">
            <label className="field-label">Code de la salle</label>
            <input className="code-input" placeholder="XXXXX" maxLength={5}
              value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()} />
          </div>
        )}

        {error && <div className="error-msg">⚠️ {error}</div>}

        <button className={`btn-primary ${tab === 'create' ? 'btn-green' : 'btn-blue'}`}
          onClick={tab === 'create' ? handleCreate : handleJoin}
          disabled={loading}>
          {loading ? '⏳ Connexion...' : tab === 'create' ? '🎯 Créer la salle !' : '🚀 Rejoindre !'}
        </button>
      </div>
    </div>
  )
}
