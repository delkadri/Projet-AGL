import { useEffect, useRef, useState } from 'react'
import { Send, Trees, Users } from 'lucide-react'

import { useCommunityChat } from '@/hooks/useCommunityChat'
import { CommunityWinStreakInline } from '@/components/communities/CommunityWinStreakCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { CommunityChatMessageDto, CommunityWinStreakDto } from '@/types/community'

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function MessageBubble({
  msg,
  isOwn,
}: {
  msg: CommunityChatMessageDto
  isOwn: boolean
}) {
  return (
    <div className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm',
          isOwn
            ? 'rounded-br-md bg-[#2e7d32] text-white'
            : 'rounded-bl-md border border-[#c8e6c9] bg-white text-gray-900',
        )}
      >
        {!isOwn && (
          <p className="mb-0.5 text-xs font-semibold text-[#1b5e20]">{msg.display_name}</p>
        )}
        <p className="wrap-break-word whitespace-pre-wrap leading-snug">{msg.text}</p>
        <p
          className={cn(
            'mt-1 text-[10px] tabular-nums',
            isOwn ? 'text-white/80' : 'text-gray-500',
          )}
        >
          {formatTime(msg.created_at)}
        </p>
      </div>
    </div>
  )
}

type CommunityChatProps = {
  communityId: string
  currentUserId: string
  displayName: string
  communityName: string
  winStreak: CommunityWinStreakDto
  onOpenRanking: () => void
  className?: string
}

export function CommunityChat({
  communityId,
  currentUserId,
  displayName,
  communityName,
  winStreak,
  onOpenRanking,
  className,
}: CommunityChatProps) {
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const { messages, isConnected, connectionError, sendMessage, hasSocketConfig } = useCommunityChat(
    {
      communityId,
      userId: currentUserId,
      displayName,
      enabled: Boolean(communityId && currentUserId),
    },
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const chatStatusLabel = isConnected
    ? 'Chat connecté'
    : hasSocketConfig
      ? 'Connexion au chat…'
      : 'Chat hors ligne'

  return (
    <section
      className={cn(
        'flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden rounded-xl border border-[#c8e6c9] bg-white shadow-md',
        className,
      )}
      aria-labelledby="community-chat-heading"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-[#e8f5e9] bg-white px-2 py-2.5 sm:gap-2.5 sm:px-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f5e9] text-[#1b5e20]">
            <Users className="size-4" aria-hidden />
          </div>
          <h2
            id="community-chat-heading"
            className="min-w-0 truncate text-sm font-bold text-gray-900 sm:text-base"
          >
            {communityName}
          </h2>
          <span
            className={cn(
              'size-2 shrink-0 rounded-full',
              isConnected ? 'bg-emerald-500' : hasSocketConfig ? 'bg-amber-400' : 'bg-gray-300',
            )}
            title={chatStatusLabel}
            aria-label={chatStatusLabel}
          />
        </div>
        <CommunityWinStreakInline streak={winStreak} />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0 gap-1 border-[#1b5e20]/35 px-2 text-[#1b5e20] hover:bg-[#e8f5e9] sm:h-9 sm:px-2.5"
          aria-label="Classement des arbres"
          onClick={onOpenRanking}
        >
          <Trees className="size-4 shrink-0" aria-hidden />
          <span className="hidden min-[380px]:inline">Classement</span>
          <span className="min-[380px]:hidden">Rang</span>
        </Button>
      </div>

      {connectionError && (
        <p className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {connectionError}
        </p>
      )}

      <div className="min-h-0 flex-1 basis-0 space-y-2 overflow-y-auto overscroll-contain px-3 py-3">
        {messages.length === 0 && (
          <p className="py-6 text-center text-xs text-gray-500">
            Aucun message pour l’instant. Dites bonjour à la communauté !
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} isOwn={m.user_id === currentUserId} />
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex shrink-0 gap-2 border-t border-[#e8f5e9] bg-[#fafafa] p-2"
        onSubmit={(e) => {
          e.preventDefault()
          sendMessage(draft)
          setDraft('')
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Votre message…"
          className="h-9 flex-1 border-[#c8e6c9] bg-white text-sm"
          maxLength={2000}
          disabled={!isConnected}
          aria-label="Message à envoyer"
        />
        <Button
          type="submit"
          size="sm"
          className="h-9 shrink-0 bg-[#1b5e20] text-white hover:bg-[#2e7d32]"
          disabled={!isConnected || !draft.trim()}
          aria-label="Envoyer"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </section>
  )
}
