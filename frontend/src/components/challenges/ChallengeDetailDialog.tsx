import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ChallengePresentationDto } from '@/types/community'

import { ChallengeDetailContent } from './ChallengeDetailContent'

type ChallengeDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  challenge: ChallengePresentationDto
  /** Titre de la modale (accessibilité). */
  dialogTitle?: string
  footer?: ReactNode
}

export function ChallengeDetailDialog({
  open,
  onOpenChange,
  challenge,
  dialogTitle = 'Détail du défi',
  footer,
}: ChallengeDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#a5d6a7] bg-[#e8f5e9] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1b5e20]">{dialogTitle}</DialogTitle>
          <DialogDescription className="text-[#2e7d32]">
            Objectif, récompense en feuilles et description du défi.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-2xl bg-[#c8e6c9]/80 p-4">
          <ChallengeDetailContent challenge={challenge} />
        </div>
        {footer ?? (
          <DialogFooter className="sm:justify-stretch">
            <Button
              type="button"
              className="w-full bg-[#2e7d32] text-white hover:bg-[#1b5e20]"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
