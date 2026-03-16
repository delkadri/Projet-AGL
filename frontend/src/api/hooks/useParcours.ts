import { useQuery } from '@tanstack/react-query'
import type { Parcours } from '@/types/parcours'
import type { ParcoursDto } from '@/api/client'
import { ParcoursService } from '@/api/client'

const PARCOURS_QUERY_KEY = ['parcours'] as const

function mapParcoursDtoToParcours(dto: ParcoursDto): Parcours {
  const periodLabel =
    dto.period_type === 'week'
      ? 'semaine'
      : dto.period_type === 'day'
        ? 'jour'
        : 'période'
  const defisLabel =
    dto.defis_per_period === 1
      ? `1 défi/${periodLabel}`
      : `${dto.defis_per_period} défis/${periodLabel}`
  const quizzLabel =
    dto.quizz_per_period === 1
      ? `1 quizz/${periodLabel}`
      : `${dto.quizz_per_period} quizz/${periodLabel}`

  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    description: dto.description,
    imageUrl: dto.slug === 'decouverte' ? '/logo-parc-decouv.png' : dto.slug === 'progression' ? '/logo-parv-prog.png' : dto.slug === 'challenge' ? '/logo-parv-challenge.png' : undefined,
    frequency: {
      defis: defisLabel,
      quizz: quizzLabel,
    },
  }
}

export function useParcours() {
  return useQuery<Parcours[]>({
    queryKey: PARCOURS_QUERY_KEY,
    queryFn: async () => {
      const list = await ParcoursService.parcoursControllerGetAllParcours()
      return list.map(mapParcoursDtoToParcours)
    },
  })
}
