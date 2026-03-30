import { useState, useEffect } from 'react'
import { SocketProvider } from './context/SocketContext'
import LandingPage from './pages/LandingPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'
import WinPage from './pages/WinPage'
import './App.css'

export default function App() {
  const [page, setPage] = useState('landing') // landing | lobby | game | win
  const [roomData, setRoomData] = useState(null)
  const [playerData, setPlayerData] = useState(null)
  const [winData, setWinData] = useState(null)

  const navigate = (to, data = {}) => {
    if (data.room) setRoomData(data.room)
    if (data.player) setPlayerData(data.player)
    if (data.win) setWinData(data.win)
    setPage(to)
  }

  return (
    <SocketProvider>
      {page === 'landing' && <LandingPage onNavigate={navigate} />}
      {page === 'lobby'   && <LobbyPage   onNavigate={navigate} room={roomData} player={playerData} />}
      {page === 'game'    && <GamePage    onNavigate={navigate} room={roomData} player={playerData} />}
      {page === 'win'     && <WinPage     onNavigate={navigate} winData={winData} room={roomData} player={playerData} />}
    </SocketProvider>
  )
}
