import { PartyPopper, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type CommunitySuccessDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bonusFeuilles: number
}

export function CommunitySuccessDialog({
  open,
  onOpenChange,
  bonusFeuilles,
}: CommunitySuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-emerald-400 bg-linear-to-b from-[#e8f5e9] to-white sm:max-w-sm">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <Sparkles
            className="absolute top-4 right-8 size-6 text-amber-400 opacity-80 animate-pulse"
            aria-hidden
          />
          <Sparkles
            className="absolute bottom-12 left-6 size-5 text-emerald-500 opacity-70 animate-pulse"
            aria-hidden
            style={{ animationDelay: '0.5s' }}
          />
        </div>
        <DialogHeader className="relative z-[1] text-center sm:text-center">
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-2xl bg-[#2e7d32] text-white shadow-lg">
            <PartyPopper className="size-8" aria-hidden />
          </div>
          <DialogTitle className="text-xl font-black tracking-tight text-[#1b5e20] uppercase">
            Défi communautaire réussi
          </DialogTitle>
          <DialogDescription className="text-base font-medium text-gray-700">
            Toute la communauté a relevé le défi à temps. Bonus collectif débloqué !
          </DialogDescription>
        </DialogHeader>
        <div className="relative z-[1] rounded-2xl border border-[#a5d6a7] bg-[#c8e6c9]/60 px-4 py-5 text-center">
          <p className="text-sm font-semibold text-[#1b5e20]">Feuilles bonus</p>
          <p className="mt-1 text-4xl font-black tabular-nums text-[#2e7d32]">
            +{bonusFeuilles}
            <span className="ml-1 text-2xl" aria-hidden>
              🌿
            </span>
          </p>
        </div>
        <Button
          type="button"
          className="relative z-[1] w-full bg-[#1b5e20] text-white hover:bg-[#2e7d32]"
          onClick={() => onOpenChange(false)}
        >
          Génial !
        </Button>
      </DialogContent>
    </Dialog>
  )
}
