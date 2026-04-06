import type { ChallengePresentationDto } from '@/types/community'

/** Défi affiché sur la carte Accueil (mock jusqu’à API défis). */
export const HOME_DAILY_CHALLENGE: ChallengePresentationDto = {
  weekProgressLabel: '1/3 défis cette semaine',
  title: 'JOURNÉE SANS VIANDE',
  description: "Éviter la viande aujourd'hui pour réduire votre impact.",
  points: 150,
  iconKey: 'beef',
}
