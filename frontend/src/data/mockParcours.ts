import type { Parcours } from '@/types/parcours'

// TODO: remplacer par appel API pour récupérer la liste des parcours disponibles
export const mockParcours: Parcours[] = [
  {
    id: 'parcours-1',
    name: 'DÉCOUVERTE',
    description: 'L\'essentiel rapidement. Comprendre mon score sans surcharge avec des défis simples.',
    imageUrl: '/logo-parc-decouv.png',
    frequency: {
      defis: '1 défi/semaine',
      quizz: '1 quizz/semaine',
    },
  },
  {
    id: 'parcours-2',
    name: 'PROGRESSION',
    description: 'Engagement régulier. Suivi et défis personnalisés.',
    frequency: {
      defis: '3 défi/semaine',
      quizz: '3 quizz/semaine',
    },
    imageUrl: '/logo-parv-prog.png',
  },
  {
    id: 'parcours-3',
    name: 'CHALLENGE',
    description: 'Dynamique sociale. Objectifs et défis motivants.',
    frequency: {
      defis: '1 défi/jour',
      quizz: '1 quizz/jour',
    },
    imageUrl: '/logo-parv-challenge.png',
  },
]