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
      "Ce modèle de politique décrit comment Blockallisto entend identifier, prévenir, gérer et divulguer les conflits d'intérêts. Blockallisto est aujourd'hui une démonstration de prototype sur le testnet Stellar : il n'existe ni investisseurs, ni émetteurs, ni fonds, ni offres réels, de sorte qu'aucun conflit effectif ne peut survenir aujourd'hui. Ce document est un artefact de conception préparé en regard des surfaces de conformité de plateformes européennes de financement participatif établies et n'est ",
      {
        b: ['pas'],
      },
      " une description d'un programme de conformité en fonctionnement.",
    ],
  },
  {
    t: 'h2',
    text: ['1. Pourquoi cette politique existe'],
  },
  {
    t: 'p',
    text: [
      "Les plateformes de financement participatif se situent entre des émetteurs en quête de fonds et des investisseurs qui les apportent. Le règlement (UE) 2020/1503 attend des plateformes agréées qu'elles évitent les conflits d'intérêts et, lorsqu'ils ne peuvent être évités, qu'elles les gèrent et les divulguent. Ce modèle anticipe cette attente.",
    ],
  },
  {
    t: 'h2',
    text: ['2. Conflits potentiels considérés'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Plateforme contre investisseur :'],
        },
        " la plateforme, rémunérée par des commissions sur les levées abouties, pourrait être tentée d'admettre des campagnes faibles. Atténuation prévue : critères d'admission publiés, étapes documentées de diligence raisonnable par campagne, et commissions indépendantes des allégations marketing des campagnes.",
      ],
      [
        {
          b: ['Parties liées :'],
        },
        " l'opérateur, ses dirigeants ou leurs proches agissant comme émetteurs ou investisseurs. Règle prévue : [les parties liées ne peuvent pas agir comme émetteurs sur la plateforme - à confirmer par un conseil juridique] ; tout investissement de parties liées, s'il était un jour permis, serait divulgué sur la page de la campagne.",
      ],
      [
        {
          b: ['Investissement pour compte propre :'],
        },
        " règle prévue : la plateforme n'investit ",
        {
          b: ['pas'],
        },
        ' dans ses propres campagnes et ne détient les fonds contribués à aucun moment ; le règlement transite par [des prestataires de services de paiement agréés - prévu, non actif].',
      ],
      [
        {
          b: ['Incitations du personnel :'],
        },
        ' règle prévue : aucune rémunération liée au succès de financement de campagnes spécifiques.',
      ],
      [
        {
          b: ["Asymétrie d'information :"],
        },
        " le contenu fourni par l'émetteur pourrait induire en erreur. Atténuation prévue : documents d'informations clés sur l'investissement par campagne, structure de données de campagne normalisée, et séparation claire entre données vérifiées par la plateforme et contenu fourni par l'émetteur.",
      ],
    ],
  },
  {
    t: 'h2',
    text: ['3. Identification, gestion, divulgation'],
  },
  {
    t: 'p',
    text: [
      "Processus prévu : (1) registre des conflits tenu par [le contact conformité de l'opérateur - à nommer] ; (2) évaluation avant toute admission de campagne et à toute modification substantielle ; (3) lorsqu'un conflit ne peut être évité, divulgation aux utilisateurs concernés en termes clairs avant qu'ils ne s'engagent ; (4) refus d'opérer l'activité en conflit lorsque l'évitement et la divulgation sont insuffisants.",
    ],
  },
  {
    t: 'h2',
    text: ['4. État actuel'],
  },
  {
    t: 'p',
    text: [
      "Rien de ce qui précède n'est opérationnel aujourd'hui. Le prototype n'accepte aucun fonds réel, ne liste aucun émetteur réel et ne verse aucune commission. Cette page existe pour que la surface de conformité prévue soit visible et révisable avant tout lancement réel.",
    ],
  },
];
