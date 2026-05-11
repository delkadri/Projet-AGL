import { Trees } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { CommunityTreeRankingEntryDto } from '@/types/community'

type CommunityTreeRankingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  communityName: string
  entries: CommunityTreeRankingEntryDto[]
}

function medalForRank(rank: number) {
  if (rank === 1) return { emoji: '🥇', className: 'text-amber-600' }
  if (rank === 2) return { emoji: '🥈', className: 'text-gray-500' }
  if (rank === 3) return { emoji: '🥉', className: 'text-amber-800' }
  return { emoji: null as string | null, className: 'text-gray-400' }
}

export function CommunityTreeRankingDialog({
  open,
  onOpenChange,
  communityName,
  entries,
}: CommunityTreeRankingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-hidden border-[#c8e6c9] bg-[#f1f8e9] p-0 sm:max-w-md">
        <DialogHeader className="border-b border-[#c8e6c9] bg-white px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-[#1b5e20]">
            <Trees className="size-5 shrink-0" aria-hidden />
            Classement des arbres
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Score inspiré des feuilles TerraScore — {communityName}
          </DialogDescription>
        </DialogHeader>
        <ul className="max-h-[55vh] overflow-y-auto px-3 py-3">
          {entries.map((e) => {
            const m = medalForRank(e.rank)
            return (
              <li
                key={e.user_id}
                className={cn(
                  'mb-2 flex items-center gap-3 rounded-xl border border-[#e8f5e9] bg-white px-3 py-2.5 shadow-sm',
                  e.rank <= 3 && 'border-[#a5d6a7]/80',
                )}
              >
                <span
                  className={cn(
                    'flex w-9 shrink-0 justify-center text-lg font-bold tabular-nums',
                    m.className,
                  )}
                  aria-hidden={!m.emoji}
                >
                  {m.emoji ?? e.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{e.display_name}</p>
                  <p className="text-xs text-gray-500">Arbres — score communautaire</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-[#1b5e20]">
                  {e.tree_score}
                </span>
              </li>
            )
          })}
        </ul>
        <div className="border-t border-[#c8e6c9] bg-white px-4 py-3">
          <Button
            type="button"
            className="w-full bg-[#1b5e20] text-white hover:bg-[#2e7d32]"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
