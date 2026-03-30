import { useState } from 'react'
import { SocketProvider } from './context/SocketContext'
import LandingPage from './pages/LandingPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import WinPage from './pages/WinPage'
import ThemeEditor from './pages/ThemeEditor'
import './App.css'

export default function App() {
  const [page, setPage]             = useState('landing')
  const [roomData, setRoomData]     = useState(null)
  const [playerData, setPlayerData] = useState(null)
  const [winData, setWinData]       = useState(null)
  const [customTheme, setCustomTheme] = useState(null)

  const navigate = (to, data = {}) => {
    if (data.room)   setRoomData(data.room)
    if (data.player) setPlayerData(data.player)
    if (data.win)    setWinData(data.win)
    setPage(to)
  }

  const handleThemeSave = (theme) => {
    setCustomTheme(theme)
    setPage('landing')
  }

  return (
    <SocketProvider>
      {page === 'landing' && (
        <LandingPage
          onNavigate={navigate}
          onOpenEditor={() => setPage('editor')}
          customTheme={customTheme}
          onClearCustomTheme={() => setCustomTheme(null)}
        />
      )}
      {page === 'editor' && (
        <ThemeEditor
          onSave={handleThemeSave}
          onCancel={() => setPage('landing')}
        />
      )}
      {page === 'lobby' && (
        <LobbyPage onNavigate={navigate} room={roomData} player={playerData} />
      )}
      {page === 'game' && (
        <GamePage onNavigate={navigate} room={roomData} player={playerData} />
      )}
      {page === 'win' && (
        <WinPage onNavigate={navigate} winData={winData} room={roomData} player={playerData} />
      )}
    </SocketProvider>
  )
}
