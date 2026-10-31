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
      ' ',
      {
        v: 'lastUpdated',
      },
    ],
  },
  {
    t: 'p',
    text: [
      "La présente Mention légale identifie l'opérateur du site web et de l'application de démonstration Blockallisto (le « Service »). Les mentions sociales affichées ci-dessous sont des données fictives de démonstration : forme juridique « Lda. » [DEMO], siège social « Rua da Demonstracao 0, 0000-000 Lisboa, Portugal » [DEMO], numéro d'enregistrement « 000 000 000 » [DEMO], capital social « EUR 0 » [DEMO], gérant « Nome Demonstracao » [DEMO]. La dénomination sociale, la forme juridique, l'adresse et le statut d'enregistrement de Blockallisto n'ont pas été vérifiés, et aucun enregistrement n'est affirmé. Contact : ",
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Opérateur'],
  },
  {
    t: 'table',
    head: [[['Champ'], ['Valeur']]],
    rows: [
      [['Nom commercial'], ['Blockallisto']],
      [['Forme juridique'], ['« Lda. » [DEMO]']],
      [['Siège social'], ['« Rua da Demonstracao 0, 0000-000 Lisboa, Portugal » [DEMO]']],
      [['Registre du commerce'], ['« Registo Comercial de [Lisboa], numéro 000 000 000 » [DEMO]']],
      [['Numéro de TVA'], ['« PT 000 000 000 » [DEMO]']],
      [['Gérant'], ['« Nome Demonstracao » [DEMO]']],
      [
        ['Contact'],
        [
          {
            v: 'contactEmail',
          },
        ],
      ],
    ],
  },
  {
    t: 'p',
    text: ["Remplacez chaque valeur [DEMO] par les mentions réelles enregistrées de l'opérateur avant toute publication au-delà du prototype."],
  },
  {
    t: 'h2',
    text: ['2. Statut réglementaire'],
  },
  {
    t: 'p',
    text: [
      "Blockallisto est aujourd'hui une ",
      {
        b: ['démonstration de prototype'],
      },
      " fonctionnant entièrement sur le réseau de test Stellar (testnet). L'opérateur n'est ",
      {
        b: ['pas'],
      },
      " autorisé en tant que prestataire de services de financement participatif au titre du règlement (UE) 2020/1503 (ECSPR), n'est ",
      {
        b: ['pas'],
      },
      ' supervisé par la CMVM ou toute autre autorité compétente en cette qualité, et ne fait ',
      {
        b: ['aucune offre'],
      },
      " d'investissement. Rien dans le Service ne constitue une offre, une sollicitation, une recommandation ou un conseil en investissement, juridique, fiscal ou financier. Aucun argent réel n'est en jeu ; les jetons du testnet n'ont aucune valeur monétaire.",
    ],
  },
  {
    t: 'p',
    text: [
      "Si et quand un lancement réel est préparé, la présente mention sera mise à jour avec le statut d'agrément de l'opérateur, son autorité de surveillance compétente et toute mention requise dans le marché unique avant toute offre réelle.",
    ],
  },
  {
    t: 'h2',
    text: ['3. Contenu et responsabilité'],
  },
  {
    t: 'p',
    text: [
      "Le contenu du Service est fourni tel quel pour l'évaluation d'un prototype. Les campagnes, émetteurs, chiffres et résultats d'exemple sont des illustrations fictives. L'opérateur décline toute responsabilité pour les décisions prises sur la base du contenu de la démonstration. Les liens externes, lorsqu'ils existent, mènent à des contenus de tiers que l'opérateur ne contrôle pas.",
    ],
  },
  {
    t: 'h2',
    text: ['4. Propriété intellectuelle'],
  },
  {
    t: 'p',
    text: [
      "Le Service, son contenu et son code sont Copyright (c) 2026 Nuno Ribeiro, tous droits réservés. Aucune licence open source ni concession de brevet n'est accordée. Vous pouvez consulter et utiliser la démonstration à des fins d'évaluation ; vous ne pouvez pas la copier, la republier ou la revendre.",
    ],
  },
  {
    t: 'h2',
    text: ['5. Cadre applicable [à revoir]'],
  },
  {
    t: 'p',
    text: [
      "Les clauses de droit applicable et de juridiction pour un lancement réel exigent un conseil juridique et dépendent de l'enregistrement final de l'opérateur. Ce modèle n'affirme délibérément aucune loi applicable pour le prototype.",
    ],
  },
];
