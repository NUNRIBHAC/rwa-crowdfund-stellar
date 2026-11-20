// Generated from frontend/i18n-json/ by scripts/i18n-import.mjs.
// Edit the JSON (Weblate) or this file, then run npm run i18n:export / i18n:import to sync.

import type { LegalBlock } from './types';

export const blocks: LegalBlock[] = [
  {
    t: 'notice',
    text: [
      "Modèle de démonstration : cette page est un document illustratif pour le prototype Blockallisto, et non un conseil juridique. Elle n'a pas été relue par un avocat et ne constitue la preuve d'aucun enregistrement de société ni d'aucune autorisation réglementaire. Les mentions sociales marquées [DEMO] sont des données fictives de démonstration.",
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['Dernière mise à jour :'],
      },
      ' 2026-11-20',
    ],
  },
  {
    t: 'p',
    text: [
      "Cette page décrit ce qui maintient le prototype Blockallisto disponible et récupérable, et quelle planification de continuité est prévue pour une future plateforme agréée. La première section est factuelle sur la démonstration en fonctionnement ; la seconde relève de l'intention de conception, et non de la pratique actuelle.",
    ],
  },
  {
    t: 'h2',
    text: ['1. Posture de continuité du prototype (actuelle)'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Aucun actif de client en risque :'],
        },
        " la démonstration ne détient ni argent, ni fonds de clients, ni custodie. Les contributions sont des jetons du testnet sans valeur monétaire, réglées par un contrat intelligent Soroban sur le testnet public Stellar. L'état du contrat vit sur le registre du testnet, indépendamment de ce site web.",
      ],
      [
        "Le site et l'API fonctionnent sur une VM Oracle Cloud avec PostgreSQL 17 local pour les données opérationnelles. Cet hôte partagé ne garantit pas la disponibilité.",
      ],
      [
        'Une sauvegarde externe chiffrée et un test isolé de restauration des bases ont réussi le 20 novembre 2026. Cette vérification datée ne garantit ni délai de reprise, ni conservation automatique, ni restauration de tous les services externes.',
      ],
      [
        {
          b: ['Séparation des environnements :'],
        },
        ' la démonstration visible par les utilisateurs, un environnement de staging séparé et des copies jetables de la base de données sont tenus à part afin que les tests ne puissent pas corrompre la démonstration.',
      ],
      [
        {
          b: ['Si la démonstration est indisponible :'],
        },
        " aucun utilisateur ne perd quoi que ce soit de valeur. L'état de la campagne reste lisible sur les explorateurs publics du testnet Stellar, et les contributions restent régies par le contrat, et non par ce site.",
      ],
    ],
  },
  {
    t: 'h2',
    text: ['2. Plan de continuité prévu pour une plateforme agréée (non actif)'],
  },
  {
    t: 'p',
    text: [
      "Une plateforme réelle traitant des offres réglementées aurait besoin, avant le lancement : d'objectifs documentés de temps et de point de reprise [valeurs RTO/RPO à définir avec des conseils juridiques et d'infrastructure] ; de sauvegardes managées avec des procédures de restauration testées ; d'un montage de services de paiement dans lequel les fonds des clients ne sont jamais détenus par la plateforme, de sorte qu'une défaillance de la plateforme ne puisse pas bloquer l'argent des investisseurs ; d'un plan ordonné de cessation d'activité garantissant que les campagnes en cours puissent aboutir ou être remboursées si la plateforme cesse d'opérer ; et de procédures de communication pour les incidents affectant les utilisateurs.",
    ],
  },
  {
    t: 'p',
    text: ["Rien de tout cela n'est opérationnel aujourd'hui. Le publier comme modèle maintient la surface de conformité prévue visible et révisable."],
  },
  {
    t: 'h2',
    text: ["3. Contact en cas d'incident"],
  },
  {
    t: 'p',
    text: [
      'Pour signaler un incident de sécurité ou de disponibilité affectant le prototype : ',
      {
        v: 'contactEmail',
      },
      ', objet « Incident ».',
    ],
  },
];
