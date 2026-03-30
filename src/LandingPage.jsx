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

export default function LandingPage({ onNavigate, onOpenEditor, customTheme, onClearCustomTheme }) {
  const socket = useSocket()
  const [tab, setTab]         = useState('create')
  const [name, setName]       = useState('')
  const [avatar, setAvatar]   = useState('🐙')
  const [theme, setTheme]     = useState('food')
  const [code, setCode]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Si un thème custom est dispo, on l'utilise automatiquement
  const useCustom = !!customTheme

  const handleCreate = async () => {
    if (!name.trim()) { setError('Entre ton pseudo !'); return }
    setLoading(true); setError('')
    try {
      const payload = {
        name: name.trim(),
        avatar,
        maxPlayers: 8,
        ...(useCustom
          ? { theme: 'custom', customWords: customTheme.words, customThemeName: customTheme.name }
          : { theme }
        )
      }
      const res = await emitAsync(socket, 'room:create', payload)
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
          <button className={`tab ${tab === 'create' ? 'active' : ''}`}
            onClick={() => { setTab('create'); setError('') }}>Créer une salle</button>
          <button className={`tab ${tab === 'join' ? 'active' : ''}`}
            onClick={() => { setTab('join'); setError('') }}>Rejoindre</button>
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

            {/* Custom theme banner */}
            {useCustom ? (
              <div style={{
                background: 'rgba(107,203,119,.1)', border: '1.5px solid rgba(107,203,119,.35)',
                borderRadius: '12px', padding: '.75rem 1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#6BCB77', letterSpacing: '1px', textTransform: 'uppercase' }}>Thème perso actif</div>
                  <div style={{ fontWeight: 800, fontSize: '.95rem' }}>🎨 {customTheme.name}</div>
                  <div style={{ fontSize: '.72rem', color: '#9090b8' }}>{customTheme.words.length} cases prêtes</div>
                </div>
                <button onClick={onClearCustomTheme} style={{
                  background: 'transparent', border: '1px solid rgba(255,107,107,.3)',
                  borderRadius: '8px', padding: '.3rem .6rem', color: '#FF6B6B',
                  fontSize: '.72rem', fontWeight: 700, cursor: 'pointer'
                }}>✕ Retirer</button>
              </div>
            ) : (
              <div className="theme-grid">
                {THEMES.map(t => (
                  <button key={t.key} className={`theme-btn ${theme === t.key ? 'sel' : ''}`}
                    onClick={() => setTheme(t.key)}>
                    <span className="theme-icon">{t.icon}</span>
                    <span className="theme-name">{t.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Bouton éditeur */}
            <button onClick={onOpenEditor} style={{
              marginTop: '.5rem', width: '100%', background: 'transparent',
              border: '1.5px dashed rgba(199,125,255,.4)', borderRadius: '12px',
              padding: '.6rem', color: '#C77DFF', fontFamily: "'Nunito',sans-serif",
              fontWeight: 800, fontSize: '.85rem', cursor: 'pointer', transition: 'all .2s'
            }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(199,125,255,.08)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              ✏️ {useCustom ? 'Modifier mon thème perso' : 'Créer mon thème perso'}
            </button>
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
