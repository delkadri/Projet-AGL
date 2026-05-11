/**
 * Serveur Socket.IO de développement pour le chat des communautés.
 * CORS : définir COMMUNITY_CHAT_CORS (liste séparée par des virgules) si besoin.
 * Port : COMMUNITY_CHAT_PORT (défaut 3456).
 *
 * Lancer : npm run chat-mock
 */
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'

import { Server } from 'socket.io'

const PORT = Number(process.env.COMMUNITY_CHAT_PORT) || 3456
const CORS_RAW =
  process.env.COMMUNITY_CHAT_CORS ||
  'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000'
const CORS_ORIGIN = CORS_RAW.split(',').map((s) => s.trim()).filter(Boolean)

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] },
})

/** @type {Map<string, Array<Record<string, unknown>>>} */
const historyByRoom = new Map()

const MAX_HISTORY = 50

function pushHistory(room, msg) {
  const arr = historyByRoom.get(room) ?? []
  arr.push(msg)
  historyByRoom.set(room, arr.length > MAX_HISTORY ? arr.slice(-MAX_HISTORY) : arr)
}

const BOT_NAMES = ['Marion', 'Julien', 'Élodie', 'Nico', 'Sam']

function maybeBotMessage(room, communityId) {
  if (Math.random() > 0.35) return
  const text =
    Math.random() > 0.5
      ? 'Bravo pour le défi cette semaine !'
      : 'Quelqu’un pour un covoiturage demain ?'
  const msg = {
    id: randomUUID(),
    community_id: communityId,
    user_id: `bot-${randomUUID().slice(0, 8)}`,
    display_name: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
    text,
    created_at: new Date().toISOString(),
  }
  pushHistory(room, msg)
  io.to(room).emit('chat:message', msg)
}

io.on('connection', (socket) => {
  const communityId = socket.handshake.auth?.communityId
  if (!communityId || typeof communityId !== 'string') {
    socket.emit('chat:error', { message: 'communityId manquant (auth.communityId)' })
    socket.disconnect(true)
    return
  }

  const room = `community:${communityId}`
  socket.join(room)

  const hist = historyByRoom.get(room) ?? []
  socket.emit('chat:history', hist)

  const botTimer = setInterval(() => {
    maybeBotMessage(room, communityId)
  }, 55_000)

  socket.on('chat:message', (payload) => {
    const text = typeof payload?.text === 'string' ? payload.text.slice(0, 2000) : ''
    if (!text.trim()) return

    const msg = {
      id: randomUUID(),
      community_id: communityId,
      user_id: String(payload?.userId ?? 'anonymous'),
      display_name: String(payload?.displayName ?? 'Anonyme').slice(0, 80),
      text: text.trim(),
      created_at: new Date().toISOString(),
    }
    pushHistory(room, msg)
    io.to(room).emit('chat:message', msg)
  })

  socket.on('disconnect', () => {
    clearInterval(botTimer)
  })
})

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[community-chat-mock] Socket.IO on http://localhost:${PORT}`)
  // eslint-disable-next-line no-console
  console.log(`[community-chat-mock] CORS: ${CORS_ORIGIN.join(', ')}`)
})
