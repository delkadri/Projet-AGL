import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

import type { CommunityChatMessageDto } from '@/types/community'

function chatSocketUrl(): string | undefined {
  const raw = import.meta.env.VITE_COMMUNITY_CHAT_SOCKET_URL as string | undefined
  return raw?.trim() || undefined
}

export type UseCommunityChatOptions = {
  communityId: string
  userId: string
  displayName: string
  enabled?: boolean
}

export function useCommunityChat({
  communityId,
  userId,
  displayName,
  enabled = true,
}: UseCommunityChatOptions) {
  const [messages, setMessages] = useState<CommunityChatMessageDto[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!enabled || !communityId) return

    const url = chatSocketUrl()
    if (!url) {
      setConnectionError(
        'Serveur de chat non configuré. Définissez VITE_COMMUNITY_CHAT_SOCKET_URL et lancez npm run chat-mock.',
      )
      setIsConnected(false)
      return
    }

    setConnectionError(null)
    const socket = io(url, {
      auth: { communityId },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 800,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      setConnectionError(null)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('connect_error', (err: Error) => {
      setConnectionError(err.message || 'Connexion impossible')
      setIsConnected(false)
    })

    socket.on('chat:history', (hist: CommunityChatMessageDto[]) => {
      if (Array.isArray(hist)) setMessages(hist)
    })

    socket.on('chat:message', (msg: CommunityChatMessageDto) => {
      if (!msg?.id) return
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [communityId, enabled])

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !socketRef.current?.connected) return
      socketRef.current.emit('chat:message', {
        userId,
        displayName,
        text: trimmed,
      })
    },
    [userId, displayName],
  )

  return {
    messages,
    isConnected,
    connectionError,
    sendMessage,
    hasSocketConfig: Boolean(chatSocketUrl()),
  }
}
