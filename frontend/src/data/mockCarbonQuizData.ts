// TODO: remplacer par appel API (ex: getCarbonQuizQuestions(id))
import type { Quiz } from '@/types/quiz'

export const mockCarbonQuizData: Quiz = {
  id: 'carbon-quiz-1',
  name: 'Calculez votre empreinte carbone',
  categories: [
    {
      id: 'carbon-housing',
      name: 'LOGEMENT & ÉNERGIE',
      questions: [
        {
          id: 'carbon-q1',
          type: 'single',
          title: 'Quel type de chauffage utilisez-vous principalement ?',
          options: [
            {
              label: 'Gaz naturel',
              value: 'gaz_naturel',
            },
            {
              label: 'Électricité',
              value: 'electricite',
            },
            {
              label: 'Chauffage au fioul',
              value: 'fioul',
            },
            {
              label: 'Bois / Biomasse',
              value: 'bois',
            },
            {
              label: 'Pompe à chaleur',
              value: 'pac',
            },
          ],
          carbonMeta: {
            poste: '1.1',
            dataType: 'principal_mode',
          },
        },
        {
          id: 'carbon-q2',
          type: 'number',
          title: 'Quelle est votre surface habitable (en m²) ?',
          min: 10,
          max: 300,
          carbonMeta: {
            dataType: 'distance_km',
          },
        },
      ],
    },
    {
      id: 'carbon-transport',
      name: 'TRANSPORTS',
      questions: [
        {
          id: 'carbon-q3',
          type: 'single',
          title:
            'Possédez-vous une voiture personnelle ?',
          options: [
            {
              label: 'Oui, voiture essence',
              value: 'voiture_essence',
            },
            {
              label: 'Oui, voiture diesel',
              value: 'voiture_diesel',
            },
            {
              label: 'Oui, voiture électrique',
              value: 'voiture_electrique',
            },
            {
              label: 'Oui, voiture hybride',
              value: 'voiture_hybride',
            },
            {
              label: 'Non, je n\'en possède pas',
              value: 'non_voiture',
            },
          ],
          carbonMeta: {
            poste: '3.1',
            dataType: 'principal_mode',
          },
        },
        {
          id: 'carbon-q4',
          type: 'number',
          title:
            'Combien de kilomètres parcourez-vous en voiture par an ?',
          min: 0,
          max: 50000,
          carbonMeta: {
            dataType: 'distance_km',
          },
        },
      ],
    },
    {
      id: 'carbon-food',
      name: 'ALIMENTATION',
      questions: [
        {
          id: 'carbon-q5',
          type: 'single',
          title: 'Quel est votre régime alimentaire principal ?',
          options: [
            {
              label: 'Omnivore (viande régulièrement)',
              value: 'omnivore',
            },
            {
              label: 'Peu de viande (occasionnellement)',
              value: 'peu_viande',
            },
            {
              label: 'Végétarien',
              value: 'vegetarien',
            },
            {
              label: 'Vegan',
              value: 'vegan',
            },
          ],
          carbonMeta: {
            poste: '4.1',
            dataType: 'principal_mode',
          },
        },
        {
          id: 'carbon-q6',
          type: 'single',
          title:
            'Consommez-vous principalement des produits locaux ou importés ?',
          options: [
            {
              label: 'Principalement locaux',
              value: 'locaux',
            },
            {
              label: 'Mélange équilibré',
              value: 'equilibre',
            },
            {
              label: 'Beaucoup de produits importés',
              value: 'importes',
            },
          ],
          carbonMeta: {
            dataType: 'principal_mode',
          },
        },
      ],
    },
  ],
}
