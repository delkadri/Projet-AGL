// TODO: remplacer par appel API (ex: getCarbonScoreHistory())
export const mockCarbonScoreHistory = {
  userId: 'user-1',
  userProfile: 'challenge', // 'découverte' (1 quiz/semaine), 'challenge' (2 quizz/semaine)
  currentScore: 8.5, // en tonnes CO2e/an
  averageScore: 7.2, // moyenne nationale
  categories: [
    {
      id: 'housing',
      name: 'Logement & Énergie',
      score: 2.8, // tonnes CO2e/an
      maxScore: 5.0,
      percentage: 56, // 2.8/5.0
    },
    {
      id: 'transport',
      name: 'Transports',
      score: 3.2,
      maxScore: 4.0,
      percentage: 80,
    },
    {
      id: 'food',
      name: 'Alimentation',
      score: 1.5,
      maxScore: 2.5,
      percentage: 60,
    },
    {
      id: 'consumption',
      name: 'Consommation',
      score: 1.0,
      maxScore: 2.0,
      percentage: 50,
    },
  ],
  historicalData: [
    {
      date: '2025-01-15',
      score: 7.8,
    },
    {
      date: '2025-02-15',
      score: 8.1,
    },
    {
      date: '2025-03-15',
      score: 8.5,
    },
  ],
  message: 'Votre score est supérieur à la moyenne.',
}

/**
 * Calcule la date du prochain quiz en fonction du profil utilisateur
 * @param userProfile 'découverte' (1 quiz/semaine) ou 'challenge' (2 quizz/semaine)
 * @returns Date formatée en français
 */
export function getNextQuizDate(userProfile: string): string {
  const today = new Date()
  const daysToAdd =
    userProfile === 'challenge'
      ? 3 // 2 quizz par semaine = tous les 3-4 jours environ, on utilise 3
      : 7 // 1 quiz par semaine
  const nextDate = new Date(today)
  nextDate.setDate(nextDate.getDate() + daysToAdd)

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }

  return nextDate.toLocaleDateString('fr-FR', options)
}
