import { useCallback, useEffect, useState } from 'react'

import { GroupsService } from '@/api/client/services/GroupsService'
import { getSupabaseClient } from '@/lib/supabase'
import type { CommunityChatMessageDto } from '@/types/community'

function mapMessage(raw: any): CommunityChatMessageDto {
  const displayName = raw.user
    ? `${raw.user.first_name ?? ''} ${raw.user.last_name ?? ''}`.trim() ||
      raw.user.email?.split('@')[0] ||
      raw.user_id
    : raw.user_id
  return {
    id: raw.id,
    community_id: raw.group_id,
    user_id: raw.user_id,
    display_name: displayName,
    text: raw.content,
    created_at:
      typeof raw.created_at === 'string'
        ? raw.created_at
        : new Date(raw.created_at).toISOString(),
  }
}

export type UseCommunityChatOptions = {
  communityId: string
  userId: string
  displayName: string
  enabled?: boolean
}

export function useCommunityChat({
  communityId,
  enabled = true,
}: UseCommunityChatOptions) {
  const [messages, setMessages] = useState<CommunityChatMessageDto[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const supabase = getSupabaseClient()
  const hasSupabaseConfig = supabase !== null

  useEffect(() => {
    if (!enabled || !communityId) return

    if (!supabase) {
      setConnectionError(
        'Chat non configuré. Définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.',
      )
      setIsConnected(false)
      return
    }

    setConnectionError(null)

    GroupsService.chatControllerListMessages({ id: communityId })
      .then((res: any) => {
        const msgs: CommunityChatMessageDto[] = ([...(res.messages ?? [])])
          .reverse()
          .map(mapMessage)
        setMessages(msgs)
      })
      .catch(() => {})

    const channel = supabase
      .channel(`group:${communityId}`)
      .on('broadcast', { event: 'new_message' }, ({ payload }: { payload: any }) => {
        if (!payload?.id) return
        const msg = mapMessage(payload)
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setConnectionError(null)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false)
          setConnectionError('Connexion au chat impossible')
        } else if (status === 'CLOSED') {
          setIsConnected(false)
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [communityId, enabled, supabase])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      await GroupsService.chatControllerSendMessage({
        id: communityId,
        requestBody: { content: trimmed },
      })
    },
    [communityId],
  )

  return {
    messages,
    isConnected,
    connectionError,
    sendMessage,
    hasSocketConfig: hasSupabaseConfig,
  }
}
