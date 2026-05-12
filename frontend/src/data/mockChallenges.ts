import type { Challenge } from '@/types/challenge'

const getDateFromToday = (daysFromNow: number) => {
  const date = new Date()
  date.setHours(18, 0, 0, 0)
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString()
}

export const mockChallenges: Challenge[] = [
  {
    id: 'challenge-transport-bike',
    title: 'Faire un trajet sans voiture',
    description:
      'Remplacez un trajet habituel en voiture par le vélo, la marche ou les transports en commun.',
    category: 'transport',
    difficulty: 'easy',
    leafReward: 25,
    dueDate: getDateFromToday(1),
    completed: false,
    icon: '🚲',
    progress: 30,
    tips: [
      'Préparez votre trajet avant de partir',
      'Choisissez un déplacement court pour commencer',
      'Gardez une preuve ou une note de votre trajet',
    ],
  },
  {
    id: 'challenge-food-veggie',
    title: 'Préparer un repas végétarien',
    description:
      'Cuisinez un repas complet sans viande ni poisson pour réduire l’impact carbone de votre assiette.',
    category: 'food',
    difficulty: 'medium',
    leafReward: 35,
    dueDate: getDateFromToday(2),
    completed: false,
    icon: '🥗',
    progress: 0,
    tips: [
      'Utilisez des légumineuses pour les protéines',
      'Privilégiez des légumes de saison',
      'Notez la recette pour pouvoir la refaire',
    ],
  },
  {
    id: 'challenge-energy-standby',
    title: 'Éteindre les appareils en veille',
    description:
      'Débranchez les chargeurs et appareils inutilisés pendant une soirée complète.',
    category: 'energy',
    difficulty: 'easy',
    leafReward: 20,
    dueDate: getDateFromToday(0),
    completed: true,
    completedAt: getDateFromToday(0),
    icon: '💡',
    tips: [
      'Commencez par le salon et la chambre',
      'Utilisez une multiprise avec interrupteur',
    ],
  },
  {
    id: 'challenge-consumption-repair',
    title: 'Réparer ou réutiliser un objet',
    description:
      'Donnez une seconde vie à un objet au lieu d’en acheter un nouveau.',
    category: 'consumption',
    difficulty: 'medium',
    leafReward: 40,
    dueDate: getDateFromToday(4),
    completed: false,
    icon: '♻️',
    progress: 60,
    tips: [
      'Cherchez un tutoriel simple',
      'Demandez de l’aide à un proche si nécessaire',
      'Partagez le résultat avec la communauté',
    ],
  },
]

