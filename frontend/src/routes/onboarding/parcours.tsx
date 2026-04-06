import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ParcoursList } from '@/components/parcours'
import { Button } from '@/components/ui/button'
import { useParcours } from '@/api/hooks/useParcours'
import { AUTH_ME_QUERY_KEY } from '@/api/hooks/useAuth'
import { UsersService } from '@/api/client'

export const Route = createFileRoute('/onboarding/parcours')({
  component: ParcoursPage,
})

function ParcoursPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedParcoursId, setSelectedParcoursId] = useState<string | null>(null)
  const { data: parcours = [], isLoading, isError, error } = useParcours()

  useEffect(() => {
    if (parcours.length > 0 && selectedParcoursId === null) {
      const decouverte = parcours.find((p) => p.slug === 'decouverte') ?? parcours[0]
      setSelectedParcoursId(decouverte.id)
    }
  }, [parcours, selectedParcoursId])

  const updateParcoursMutation = useMutation({
    mutationFn: async (parcoursId: string) => {
      await UsersService.userControllerUpdateParcours({
        requestBody: { parcoursId },
      })
      await UsersService.userControllerCompleteOnboarding()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY })
      navigate({ to: '/' })
    },
  })

  const handleSelectParcoursAndContinue = (parcoursId: string) => {
    updateParcoursMutation.mutate(parcoursId)
  }

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-b from-green-50 to-blue-50">
      <ParcoursList
        selectedParcoursId={selectedParcoursId}
        onSelectParcours={setSelectedParcoursId}
        parcours={parcours}
        isLoading={isLoading}
        error={isError ? (error instanceof Error ? error.message : 'Erreur lors du chargement des parcours') : null}
      />
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200/70 bg-white/85 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md">
        {updateParcoursMutation.isError && (
          <p className="mb-2 text-center text-sm text-red-600">
            Impossible de mettre à jour le parcours. Réessayez.
          </p>
        )}
        <Button
          type="button"
          disabled={!selectedParcoursId || updateParcoursMutation.isPending}
          className="h-12 w-full rounded-xl bg-[#1A4D3E] text-white shadow-sm hover:bg-[#153936] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => selectedParcoursId && handleSelectParcoursAndContinue(selectedParcoursId)}
        >
          {updateParcoursMutation.isPending ? 'Enregistrement...' : 'Continuer'}
        </Button>
      </div>
    </div>
  )
}