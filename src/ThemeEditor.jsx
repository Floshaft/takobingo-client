import { useState } from 'react'

const MAX_WORDS = 24
const COLORS = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#C77DFF','#FF9F43']

const SUGGESTIONS = [
  'Fou rire','Potin','Selfie','Road trip','Binge','Soirée','Secret','Défi',
  'Karaoké','Brunch','Piscine','Rooftop','BFF','Running gag','Nuit blanche',
  'Raclette','Shot','Danse','Câlin','Plan foireux','Phrase culte','Surnom',
]

export default function ThemeEditor({ onSave, onCancel }) {
  const [themeName, setThemeName] = useState('')
  const [words, setWords]         = useState([])
  const [input, setInput]         = useState('')
  const [error, setError]         = useState('')

  const addWord = (val = input) => {
    const clean = val.trim()
    if (!clean) return
    if (words.length >= MAX_WORDS) { setError(`Maximum ${MAX_WORDS} cases !`); return }
    if (words.map(w => w.toLowerCase()).includes(clean.toLowerCase())) { setError('Ce mot existe déjà !'); return }
    setWords(prev => [...prev, clean])
    setInput('')
    setError('')
  }

  const removeWord = (i) => setWords(prev => prev.filter((_, idx) => idx !== i))

  const handleSave = () => {
    if (!themeName.trim())        { setError('Donne un nom à ton thème !'); return }
    if (words.length < MAX_WORDS) { setError(`Il manque ${MAX_WORDS - words.length} case${MAX_WORDS - words.length > 1 ? 's' : ''} (${words.length}/${MAX_WORDS})`); return }
    onSave({ name: themeName.trim(), words })
  }

  const remaining = MAX_WORDS - words.length
  const progress  = Math.round((words.length / MAX_WORDS) * 100)

  return (
    <div className="page-landing" style={{ justifyContent: 'flex-start', paddingTop: '1.5rem' }}>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: '520px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.25rem' }}>
        <div style={{ fontFamily: "'Boogaloo', cursive", fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '.4rem', color: '#f0f0ff' }}>
          <span>🎨</span> Créer mon thème
        </div>
        <button className="btn-ghost-sm" onClick={onCancel}>← Retour</button>
      </div>

      <div className="landing-card" style={{ maxWidth: '520px' }}>

        {/* Nom du thème */}
        <div className="field">
          <label className="field-label">Nom du thème</label>
          <input className="field-input"
            placeholder="Ex : Soirée chez Julie, Noël 2026, Quiz Cinéma..."
            maxLength={30} value={themeName}
            onChange={e => { setThemeName(e.target.value); setError('') }} />
        </div>

        {/* Ajouter un mot */}
        <div className="field">
          <label className="field-label">
            Tes cases &nbsp;
            <span style={{ color: words.length === MAX_WORDS ? '#6BCB77' : '#FFD93D', fontWeight: 800 }}>
              {words.length}/{MAX_WORDS}
            </span>
          </label>
          <div style={{ display: 'flex', gap: '.4rem' }}>
            <input className="field-input" style={{ flex: 1 }}
              placeholder="Un mot, une phrase, un emoji..."
              maxLength={24} value={input}
              onChange={e => { setInput(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && addWord()} />
            <button onClick={() => addWord()} style={{
              background: 'linear-gradient(135deg, #C77DFF, #4D96FF)',
              border: 'none', borderRadius: '12px', padding: '.6rem 1.1rem',
              color: '#fff', fontWeight: 900, fontSize: '1.2rem',
              cursor: 'pointer', transition: 'all .2s', flexShrink: 0,
            }}>+</button>
          </div>
        </div>

        {/* Barre de progression */}
        <div>
          <div style={{ height: '6px', background: '#1a1a35', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '3px', transition: 'width .4s ease',
              width: `${progress}%`,
              background: words.length === MAX_WORDS
                ? 'linear-gradient(90deg,#6BCB77,#00b894)'
                : 'linear-gradient(90deg,#4D96FF,#C77DFF)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.3rem', fontSize: '.65rem', fontWeight: 700, color: '#9090b8' }}>
            <span>{progress}% complété</span>
            <span style={{ color: remaining > 0 ? '#FFD93D' : '#6BCB77' }}>
              {remaining > 0 ? `encore ${remaining} case${remaining > 1 ? 's' : ''}` : '✅ Prêt à jouer !'}
            </span>
          </div>
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}

        {/* Suggestions rapides */}
        {words.length < MAX_WORDS && (
          <div className="field">
            <label className="field-label">Suggestions rapides</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {SUGGESTIONS.filter(s => !words.includes(s)).slice(0, 10).map(s => (
                <button key={s} onClick={() => addWord(s)} style={{
                  background: '#1a1a35', border: '1px solid rgba(255,255,255,.15)',
                  borderRadius: '50px', padding: '.25rem .65rem',
                  fontSize: '.75rem', fontWeight: 700, color: '#9090b8',
                  cursor: 'pointer', transition: 'all .15s',
                }}
                  onMouseOver={e => { e.currentTarget.style.color = '#f0f0ff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.3)'; }}
                  onMouseOut={e => { e.currentTarget.style.color = '#9090b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)'; }}>
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Liste des mots ajoutés */}
        {words.length > 0 && (
          <div className="field">
            <label className="field-label">Cases ajoutées</label>
            <div style={{
              background: '#13132a', borderRadius: '12px', padding: '.75rem',
              border: '1px solid rgba(255,255,255,.08)',
              display: 'flex', flexWrap: 'wrap', gap: '5px',
              maxHeight: '160px', overflowY: 'auto',
            }}>
              {words.map((w, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '.3rem',
                  background: COLORS[i % COLORS.length] + '18',
                  border: `1px solid ${COLORS[i % COLORS.length]}44`,
                  borderRadius: '50px', padding: '.25rem .65rem .25rem .75rem',
                  fontSize: '.78rem', fontWeight: 700,
                }}>
                  <span style={{ color: '#f0f0ff' }}>{w}</span>
                  <button onClick={() => removeWord(i)} style={{
                    background: 'none', border: 'none', color: '#9090b8',
                    cursor: 'pointer', fontSize: '.8rem', padding: '0 2px',
                    lineHeight: 1, transition: 'color .15s',
                  }}
                    onMouseOver={e => e.target.style.color = '#FF6B6B'}
                    onMouseOut={e => e.target.style.color = '#9090b8'}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aperçu carton */}
        {words.length >= 5 && (
          <div className="field">
            <label className="field-label">Aperçu du carton</label>
            <div style={{ background: '#13132a', borderRadius: '12px', padding: '.75rem', border: '1px solid rgba(255,255,255,.08)' }}>
              <div className="bingo-card" style={{ maxWidth: '100%' }}>
                {['B','I','N','G','O'].map(h => (
                  <div key={h} className="card-head" style={{ fontSize: '1rem', padding: '.35rem' }}>{h}</div>
                ))}
                {Array.from({ length: 25 }).map((_, i) => {
                  const isFree = i === 12
                  const word   = isFree ? null : words[i < 12 ? i : i - 1]
                  return (
                    <div key={i} className={`card-cell ${isFree ? 'free' : ''} ${!isFree && !word ? 'empty' : ''}`}
                      style={{ minHeight: '38px', fontSize: '.5rem', cursor: 'default' }}>
                      {isFree ? '⭐' : word || '…'}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bouton sauvegarder */}
        <button
          className={`btn-primary ${words.length === MAX_WORDS ? 'btn-green' : ''}`}
          style={words.length < MAX_WORDS ? {
            background: 'linear-gradient(90deg,#4D96FF,#7b6ff0)',
            color: '#fff', opacity: .75,
          } : {}}
          onClick={handleSave}>
          {words.length === MAX_WORDS
            ? '✅ Utiliser ce thème !'
            : `Encore ${remaining} case${remaining > 1 ? 's' : ''} à ajouter...`}
        </button>

      </div>
    </div>
  )
}
