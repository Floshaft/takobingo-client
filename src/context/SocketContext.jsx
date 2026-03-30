import { createContext, useContext, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

export function SocketProvider({ children }) {
  const socketRef = useRef(null)

  if (!socketRef.current) {
    socketRef.current = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  }

  useEffect(() => {
    const socket = socketRef.current
    socket.connect()
    return () => { socket.disconnect() }
  }, [])

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}

// ── Helpers promisifiés ────────────────────────────────────────
export function emitAsync(socket, event, data, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout serveur')), timeout)
    socket.emit(event, data, (res) => {
      clearTimeout(timer)
      if (res?.success === false) reject(new Error(res.error || 'Erreur inconnue'))
      else resolve(res)
    })
  })
}
