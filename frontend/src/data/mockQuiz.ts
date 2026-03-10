// TODO: remplacer par appel API (ex: getQuiz(id))
import type { Quiz } from '@/types/quiz'

export const mockQuiz: Quiz = {
  id: 'quiz-1',
  name: 'Bilan carbone',
  categories: [
    {
      id: 'cat-1',
      name: 'MOBILITÉ & TRANSPORT',
      questions: [
        {
          id: 'q1',
          type: 'single',
          title:
            'Comment vous rendez-vous principalement au travail ou à vos études ?',
          options: [
            'Voiture individuelle (Diesel / Essence)',
            'Transport en commun',
            'Vélo / Marche / Trotinette',
            'Covoiturage',
          ],
        },
        {
          id: 'q2',
          type: 'single',
          title: 'Combien de kilomètres parcourez-vous en moyenne par semaine ?',
          options: ['Moins de 50 km', '50–100 km', '100–200 km', 'Plus de 200 km'],
        },
        {
          id: 'q3',
          type: 'multiple',
          title: 'Quels modes de transport utilisez-vous régulièrement ?',
          options: [
            'Voiture',
            'Train',
            'Bus / Métro',
            'Vélo',
            'Marche',
            'Trotinette',
          ],
        },
        {
          id: 'q4',
          type: 'number',
          title: "Nombre de trajets en avion par an (aller simple = 1 trajet) ?",
          min: 0,
          max: 20,
        },
        {
          id: 'q5',
          type: 'single',
          title: 'Utilisez-vous le télétravail ?',
          options: ['Jamais', '1 jour/semaine', '2–3 jours/semaine', 'Tous les jours'],
        },
      ],
    },
  ],
}
