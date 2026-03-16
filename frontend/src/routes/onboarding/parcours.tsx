import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ParcoursList } from '@/components/parcours'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/onboarding/parcours')({
  component: ParcoursPage,
})

function ParcoursPage() {
  const navigate = useNavigate()
  const [selectedParcoursId, setSelectedParcoursId] = useState<string | null>(null)

  const handleSelectParcoursAndContinue = (parcoursId: string) => {
    // TODO: sauvegarder le parcours sélectionné (contexte/API) avant de naviguer

    navigate({ to: '/' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#EAF9EA]">
      <ParcoursList
        selectedParcoursId={selectedParcoursId}
        onSelectParcours={setSelectedParcoursId}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-[#EAF9EA] px-4 pb-6 pt-4">
        <Button
          type="button"
          disabled={!selectedParcoursId}
          className="w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => selectedParcoursId && handleSelectParcoursAndContinue(selectedParcoursId)}
        >
          Continuer
        </Button>
      </div>
    </div>
  )
}