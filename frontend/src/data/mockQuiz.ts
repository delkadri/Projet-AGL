// TODO: remplacer par appel API (ex: getQuiz(id))
import type { Quiz } from '@/types/quiz'

export const mockQuiz: Quiz = {
  id: 'quiz-1',
  name: 'Bilan carbone',
  categories: [
    {
      id: 'cat-transport',
      name: 'MOBILITÉ & TRANSPORT',
      questions: [
        {
          id: 'q-transport-mode',
          type: 'single',
          title: 'Comment vous rendez-vous principalement au travail ou à vos études ?',
          options: [
            { label: 'Voiture individuelle', value: 'voiture_diesel_essence' },
            { label: 'Transport en commun (bus, métro, RER…)', value: 'transport_commun' },
            { label: 'Vélo / Marche / Trottinette', value: 'velo_marche_trottinette' },
            { label: 'Deux-roues motorisé (moto, scooter)', value: 'deux_roues_motorise' },
            { label: 'Covoiturage', value: 'covoiturage' },
          ],
          carbonMeta: { dataType: 'principal_mode' },
        },
        {
          id: 'q-vehicle-fuel',
          type: 'single',
          title: 'Si vous utilisez une voiture, quel est son type de motorisation ?',
          showIf: { questionId: 'q-transport-mode', value: 'voiture_diesel_essence' },
          options: [
            { label: 'Diesel', value: 'diesel' },
            { label: 'Essence', value: 'essence' },
            { label: 'Hybride (non rechargeable)', value: 'hybride' },
            { label: 'Hybride rechargeable', value: 'hybride_rechargeable' },
            { label: 'Électrique', value: 'electrique' },
            { label: 'Je n\'utilise pas de voiture', value: 'none' },
          ],
          carbonMeta: { dataType: 'vehicle_fuel_type' },
        },
        {
          id: 'q-transport-distance',
          type: 'single',
          title: 'Quelle distance parcourez-vous pour ce trajet (aller-retour par jour travaillé) ?',
          options: [
            { label: 'Moins de 20 km', value: 'moins_20' },
            { label: '20–50 km', value: '20_50' },
            { label: '50–100 km', value: '50_100' },
            { label: 'Plus de 100 km', value: 'plus_100' },
          ],
          carbonMeta: { dataType: 'distance_km' },
        },
        {
          id: 'q-transport-telework',
          type: 'single',
          title: 'Combien de jours par semaine êtes-vous en télétravail ?',
          options: [
            { label: 'Jamais (0 jour)', value: 'never' },
            { label: '1 jour/semaine', value: '1d' },
            { label: '2–3 jours/semaine', value: '2_3d' },
            { label: 'Tous les jours (full remote)', value: 'everyday' },
          ],
          carbonMeta: { dataType: 'telework_factor' },
        },
        {
          id: 'q-flight-count',
          type: 'number',
          title: 'Combien de trajets en avion faites-vous par an ? (aller simple = 1 trajet)',
          min: 0,
          max: 30,
          carbonMeta: { dataType: 'flight_count' },
        },
        {
          id: 'q-flight-class',
          type: 'single',
          title: `Pour vos trajets en avion, il s'agit principalement de :`,
          showIf: { questionId: 'q-flight-count', operator: 'gt', value: 0 },
          options: [
            { label: 'Courts courriers (< 1 000 km, ex : Paris–Nice)', value: 'court' },
            { label: 'Moyens courriers (1 000–3 500 km, ex : Paris–Maroc)', value: 'moyen' },
            { label: 'Longs courriers (> 3 500 km, ex : Paris–New York)', value: 'long' },
          ],
          carbonMeta: { dataType: 'flight_distance_class' },
        },
        {
          id: 'q-transport-train',
          type: 'single',
          title: 'Combien de kilomètres parcourez-vous en train (TGV, Intercités) par an ?',
          options: [
            { label: 'Presque pas (moins de 500 km)', value: 'moins_500' },
            { label: 'Modéré (500 - 2 000 km)', value: '500_2000' },
            { label: 'Régulier (2 000 - 10 000 km)', value: '2000_10000' },
            { label: 'Intensif (plus de 10 000 km)', value: 'plus_10000' },
          ],
          carbonMeta: { dataType: 'train_distance_km' },
        },
        {
          id: 'q-transport-voiture-vacances',
          type: 'single',
          title: 'Au-delà de vos trajets quotidiens, combien de kilomètres parcourez-vous en voiture pour vos week-ends et vacances (par an) ?',
          options: [
            { label: 'Moins de 1 000 km', value: 'moins_1000' },
            { label: '1 000 à 5 000 km', value: '1000_5000' },
            { label: '5 000 à 10 000 km', value: '5000_10000' },
            { label: 'Plus de 10 000 km', value: 'plus_10000' },
          ],
          carbonMeta: { dataType: 'leisure_car_distance_km' },
        },
      ],
    },
    {
      id: 'cat-logement',
      name: 'LOGEMENT',
      questions: [
        {
          id: 'q-housing-surface',
          type: 'single',
          title: 'Quelle est la surface de votre logement ?',
          options: [
            { label: 'Moins de 30 m²', value: 'moins_30' },
            { label: '30–60 m²', value: '30_60' },
            { label: '60–120 m²', value: '60_120' },
            { label: 'Plus de 120 m²', value: 'plus_120' },
          ],
          carbonMeta: { dataType: 'housing_surface' },
        },
        {
          id: 'q-heating-type',
          type: 'single',
          title: 'Quel est votre principal moyen de chauffage ?',
          options: [
            { label: 'Gaz naturel', value: 'gaz' },
            { label: 'Électricité (convecteurs, radiateurs)', value: 'electricite' },
            { label: 'Pompe à chaleur (PAC)', value: 'pac' },
            { label: 'Fioul', value: 'fioul' },
            { label: 'Bois / Pellets', value: 'bois' },
            { label: 'Réseau de chaleur urbain', value: 'reseau_chaleur' },
          ],
          carbonMeta: { dataType: 'heating_type' },
        },
        {
          id: 'q-housing-insulation',
          type: 'single',
          title: `Comment qualifieriez-vous l'isolation de votre logement ?`,
          options: [
            { label: 'Bien isolé (BBC, RT 2012 ou mieux)', value: 'bien_isole' },
            { label: 'Standard (isolation correcte mais pas récente)', value: 'standard' },
            {
              label: `Peu isolé (vieux logement, courants d'air, simple vitrage)`,
              value: 'peu_isole',
            },
          ],
          carbonMeta: { dataType: 'housing_insulation' },
        },
        {
          id: 'q-housing-occupants',
          type: 'single',
          title: 'Combien de personnes vivent dans votre logement (vous compris) ?',
          options: [
            { label: '1 personne', value: '1' },
            { label: '2 personnes', value: '2' },
            { label: '3–4 personnes', value: '3_4' },
            { label: '5 personnes ou plus', value: '5_plus' },
          ],
          carbonMeta: { dataType: 'housing_occupants' },
        },
        {
          id: 'q-housing-ac',
          type: 'single',
          title: "Votre logement est-il équipé de la climatisation ?",
          options: [
            { label: 'Non', value: 'non' },
            { label: "Oui, et je l'utilise quelques jours par an", value: 'oui_peu' },
            { label: "Oui, et je l'utilise tout l'été", value: 'oui_beaucoup' },
          ],
          carbonMeta: { dataType: 'housing_ac_usage' },
        },
        {
          id: 'q-housing-age',
          type: 'single',
          title: 'De quand date la construction de votre logement ?',
          options: [
            { label: 'Avant 1975 (avant les réglementations thermiques)', value: 'avant_1975' },
            { label: 'Entre 1975 et 2012', value: '1975_2012' },
            { label: 'Après 2012 (RT2012, RE2020, très bien isolé)', value: 'apres_2012' },
            { label: 'Je ne sais pas', value: 'inconnu' },
          ],
          carbonMeta: { dataType: 'housing_construction_era' },
        },
      ],
    },
    {
      id: 'cat-alimentation',
      name: 'ALIMENTATION',
      questions: [
        {
          id: 'q-diet-type',
          type: 'single',
          title: 'Comment décririez-vous votre alimentation ?',
          options: [
            {
              label: 'Omnivore (je mange de tout, y compris viande et poisson)',
              value: 'omnivore',
            },
            {
              label: 'Flexitarien (je limite la viande, moins de 3 fois/semaine)',
              value: 'flexitarien',
            },
            { label: 'Végétarien (pas de viande ni poisson)', value: 'vegetarien' },
            { label: 'Végétalien / Vegan (aucun produit animal)', value: 'vegan' },
          ],
          carbonMeta: { dataType: 'diet_type' },
        },
        {
          id: 'q-red-meat-frequency',
          type: 'single',
          title: 'À quelle fréquence consommez-vous de la viande rouge (bœuf, agneau, porc) ?',
          options: [
            { label: 'Tous les jours ou presque', value: 'quotidien' },
            { label: 'Plusieurs fois par semaine', value: 'plusieurs_semaine' },
            { label: 'Une fois par semaine environ', value: 'une_semaine' },
            { label: `Rarement (moins d'une fois par semaine)`, value: 'rarement' },
            { label: 'Jamais', value: 'jamais' },
          ],
          carbonMeta: { dataType: 'red_meat_frequency' },
        },
        {
          id: 'q-dairy-frequency',
          type: 'single',
          title:
            'À quelle fréquence consommez-vous des produits laitiers (lait, fromage, yaourt) ?',
          options: [
            { label: 'Tous les jours ou presque', value: 'quotidien' },
            { label: 'Plusieurs fois par semaine', value: 'plusieurs_semaine' },
            { label: 'Une fois par semaine environ', value: 'une_semaine' },
            { label: 'Jamais ou très rarement', value: 'jamais' },
          ],
          carbonMeta: { dataType: 'dairy_frequency' },
        },
        {
          id: 'q-local-food',
          type: 'single',
          title: 'Quelle part de votre alimentation est locale et de saison ?',
          options: [
            { label: 'Presque toujours (marchés, AMAP, jardin…)', value: 'toujours' },
            { label: 'Souvent', value: 'souvent' },
            { label: 'Parfois', value: 'parfois' },
            { label: 'Rarement ou jamais', value: 'jamais' },
          ],
          carbonMeta: { dataType: 'local_food_share' },
        },
        {
          id: 'q-drinks-bottled-water',
          type: 'single',
          title: 'Que buvez-vous principalement comme eau ?',
          options: [
            { label: 'Eau du robinet (exclusivement ou presque)', value: 'robinet' },
            { label: 'Moitié robinet, moitié bouteille', value: 'mixte' },
            { label: 'Eau en bouteille (exclusivement ou presque)', value: 'bouteille' },
          ],
          carbonMeta: { dataType: 'bottled_water_consumption' },
        },
        {
          id: 'q-drinks-alcohol-coffee',
          type: 'single',
          title: "Quelle est votre consommation de boissons chaudes (café/thé) ou d'alcool (bière, vin) ?",
          options: [
            { label: "Je n'en bois pas ou très occasionnellement", value: 'faible' },
            { label: 'Modérée (1 à 2 tasses/verres par jour)', value: 'moderee' },
            { label: 'Importante (plus de 3 tasses/verres par jour)', value: 'importante' },
          ],
          carbonMeta: { dataType: 'hot_drinks_alcohol' },
        },
      ],
    },
    {
      id: 'cat-consommation',
      name: 'CONSOMMATION',
      questions: [
        {
          id: 'q-clothes',
          type: 'single',
          title: 'Combien de vêtements neufs achetez-vous par an environ ?',
          options: [
            { label: 'Très peu (moins de 5 pièces)', value: 'peu' },
            { label: 'Modéré (5 à 15 pièces)', value: 'moyen' },
            { label: 'Beaucoup (plus de 15 pièces)', value: 'beaucoup' },
          ],
          carbonMeta: { dataType: 'new_clothes_per_year' },
        },
        {
          id: 'q-electronics',
          type: 'single',
          title:
            'À quelle fréquence achetez-vous des appareils électroniques (smartphone, ordinateur, TV…) ?',
          options: [
            {
              label: 'Jamais ou très rarement (1 achat tous les 5 ans ou plus)',
              value: 'jamais',
            },
            { label: 'Rarement (1 achat tous les 3–4 ans)', value: 'rarement' },
            { label: 'Parfois (1 achat par an)', value: 'parfois' },
            { label: 'Souvent (2 achats ou plus par an)', value: 'souvent' },
          ],
          carbonMeta: { dataType: 'electronics_frequency' },
        },
        {
          id: 'q-second-hand',
          type: 'single',
          title: `Quelle est votre pratique de l'achat d'occasion / seconde main ?`,
          options: [
            { label: 'Presque toujours (Vinted, brocantes, réparation…)', value: 'toujours' },
            { label: 'Souvent', value: 'souvent' },
            { label: 'Parfois', value: 'parfois' },
            { label: 'Jamais ou presque', value: 'jamais' },
          ],
          carbonMeta: { dataType: 'second_hand_practice' },
        },
        {
          id: 'q-furniture',
          type: 'single',
          title: 'À quelle fréquence achetez-vous des meubles ou équipements pour la maison (neufs) ?',
          options: [
            { label: 'Très rarement (occasion ou rien depuis des années)', value: 'rare' },
            { label: 'Occasion principalement, quelques neufs', value: 'occasion' },
            { label: 'Régulièrement du neuf (aménagement, renouvellement)', value: 'neuf_regulier' },
          ],
          carbonMeta: { dataType: 'furniture_purchase_frequency' },
        },
      ],
    },
    {
      id: 'cat-numerique',
      name: 'NUMÉRIQUE',
      questions: [
        {
          id: 'q-device-renewal',
          type: 'single',
          title:
            'À quelle fréquence renouvelez-vous vos appareils numériques (smartphone, PC, tablette…) ?',
          options: [
            { label: 'Jamais ou très rarement (plus de 10 ans)', value: 'jamais' },
            { label: 'Tous les 5 ans environ', value: 'tous_5ans' },
            { label: 'Tous les 3 ans environ (rythme moyen en France)', value: 'tous_3ans' },
            { label: 'Tous les 1–2 ans', value: 'tous_ans' },
          ],
          carbonMeta: { dataType: 'device_renewal' },
        },
        {
          id: 'q-streaming',
          type: 'single',
          title: `Combien d'heures par semaine regardez-vous des vidéos en streaming (Netflix, YouTube, etc.) ?`,
          options: [
            { label: 'Moins de 5 h/semaine', value: 'moins_5' },
            { label: '5–15 h/semaine', value: '5_15' },
            { label: '15–30 h/semaine', value: '15_30' },
            { label: 'Plus de 30 h/semaine', value: 'plus_30' },
          ],
          carbonMeta: { dataType: 'streaming_hours_per_week' },
        },
        {
          id: 'q-visio-hours',
          type: 'single',
          title: 'Combien d\'heures par semaine passez-vous en visioconférence (travail, réunions, formations) ?',
          options: [
            { label: 'Moins de 2 h/semaine', value: 'moins_2' },
            { label: '2–5 h/semaine', value: '2_5' },
            { label: '5–10 h/semaine', value: '5_10' },
            { label: 'Plus de 10 h/semaine', value: 'plus_10' },
          ],
          carbonMeta: { dataType: 'visio_hours_per_week' },
        },
        {
          id: 'q-cloud-storage',
          type: 'single',
          title: 'Quel est votre usage du stockage cloud (Google Drive, OneDrive, iCloud, etc.) ?',
          options: [
            { label: 'Peu ou pas (moins de 10 Go)', value: 'peu' },
            { label: 'Modéré (10–100 Go)', value: 'moyen' },
            { label: 'Important (plus de 100 Go, sauvegardes, partage)', value: 'beaucoup' },
          ],
          carbonMeta: { dataType: 'cloud_storage_usage' },
        },
        {
          id: 'q-tv-size',
          type: 'single',
          title: 'Quelle est la taille de votre télévision principale ?',
          options: [
            { label: "Je n'ai pas de TV", value: 'none' },
            { label: 'Petite (moins de 32 pouces / 80 cm)', value: 'petite' },
            { label: 'Moyenne (32 à 50 pouces / 80 à 127 cm)', value: 'moyenne' },
            { label: 'Grande (plus de 50 pouces / 127 cm)', value: 'grande' },
          ],
          carbonMeta: { dataType: 'tv_screen_size' },
        },
      ],
    },
    {
      id: 'cat-services-epargne',
      name: 'SERVICES & FINANCES',
      questions: [
        {
          id: 'q-savings-amount',
          type: 'single',
          title: 'Quel est le montant approximatif de votre épargne (Livret A, assurance vie, PEA…) ?',
          options: [
            { label: 'Moins de 10 000 €', value: 'moins_10k' },
            { label: 'Entre 10 000 € et 50 000 €', value: '10k_50k' },
            { label: 'Plus de 50 000 €', value: 'plus_50k' },
          ],
          carbonMeta: { dataType: 'savings_volume' },
        },
        {
          id: 'q-savings-green',
          type: 'single',
          title: 'Avez-vous placé votre épargne dans des fonds ou des banques spécifiquement responsables/verts ?',
          showIf: { questionId: 'q-savings-amount', operator: 'neq', value: 'moins_10k' },
          options: [
            { label: 'Non, dans une banque classique', value: 'classique' },
            { label: 'Une partie (Livret LDDS, quelques fonds ISR)', value: 'mixte' },
            { label: 'Oui, majorité dans une banque éthique (Nef, Crédit Coopératif, Helios…)', value: 'ethique' },
          ],
          carbonMeta: { dataType: 'savings_green_ratio' },
        },
      ],
    },
  ],
}
