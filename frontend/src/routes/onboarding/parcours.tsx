import { useState } from 'react'
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
    <div className="flex min-h-screen flex-col bg-[#EAF9EA]">
      <ParcoursList
        selectedParcoursId={selectedParcoursId}
        onSelectParcours={setSelectedParcoursId}
        parcours={parcours}
        isLoading={isLoading}
        error={isError ? (error instanceof Error ? error.message : 'Erreur lors du chargement des parcours') : null}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-[#EAF9EA] px-4 pb-6 pt-4">
        {updateParcoursMutation.isError && (
          <p className="mb-2 text-center text-sm text-red-600">
            Impossible de mettre à jour le parcours. Réessayez.
          </p>
        )}
        <Button
          type="button"
          disabled={!selectedParcoursId || updateParcoursMutation.isPending}
          className="w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => selectedParcoursId && handleSelectParcoursAndContinue(selectedParcoursId)}
        >
          {updateParcoursMutation.isPending ? 'Enregistrement...' : 'Continuer'}
        </Button>
      </div>
    </div>
  )
}