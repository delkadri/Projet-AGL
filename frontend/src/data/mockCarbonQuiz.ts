// TODO: remplacer par appel API (ex: getCarbonQuiz())
export const mockCarbonQuiz = {
  id: 'carbon-quiz-1',
  title: 'Quiz du mois',
  /** Court texte affiché sous le titre (écran Données / quiz du mois). */
  description:
    'Quelques questions pour mettre à jour votre empreinte carbone et suivre vos progrès sur le mois.',
  /** Affichée sous « Quiz ouvert » sur l’écran Données / quiz du mois. */
  encouragementQuizOuvert:
    'Quelques minutes suffisent pour mettre à jour votre empreinte — lancez-vous !',
  duration: 5, // en minutes
  imageUrl: '/planet.png',
  estimatedMinutes: '5 min',
}
