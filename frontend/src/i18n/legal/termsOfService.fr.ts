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
      ' ',
      {
        v: 'lastUpdated',
      },
    ],
  },
  {
    t: 'p',
    text: [
      "Les présentes Conditions d'utilisation (les « Conditions ») régissent votre utilisation du site web et de l'application de démonstration Blockallisto (le « Service »), un projet prototype exploité par Blockallisto (« nous »). Les mentions sociales affichées pour Blockallisto dans ces Conditions sont des données fictives de démonstration : forme juridique « Lda. » [DEMO], siège social « Rua da Demonstracao 0, 0000-000 Lisboa, Portugal » [DEMO], numéro d'enregistrement « 000 000 000 » [DEMO]. La dénomination sociale, la forme, l'adresse et le statut d'enregistrement de Blockallisto n'ont pas été vérifiés, et aucun enregistrement n'est affirmé. Contact : ",
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
  {
    t: 'p',
    text: ["En utilisant le Service, vous acceptez les présentes Conditions. Si vous n'êtes pas d'accord, n'utilisez pas le Service."],
  },
  {
    t: 'h2',
    text: ["1. Ce qu'est Blockallisto aujourd'hui"],
  },
  {
    t: 'p',
    text: [
      'Blockallisto est une ',
      {
        b: ['démonstration de prototype'],
      },
      " d'un concept de financement participatif d'actifs du monde réel tokenisés, fonctionnant entièrement sur le ",
      {
        b: ['réseau de test Stellar (testnet)'],
      },
      '.',
    ],
  },
  {
    t: 'p',
    text: ['Concrètement, cela signifie :'],
  },
  {
    t: 'ul',
    items: [
      [
        "Le Service n'est ",
        {
          b: ['pas'],
        },
        ' une plateforme de financement participatif au sens juridique. Nous ne sommes ',
        {
          b: ['pas'],
        },
        ' un prestataire de services de financement participatif agréé au titre du règlement (UE) 2020/1503 (ECSPR) ou de tout autre régime, et nous ne faisons ',
        {
          b: ['aucune offre réelle'],
        },
        " d'investissement.",
      ],
      [
        'Rien dans le Service ne constitue une offre, une sollicitation, une recommandation ou un conseil en investissement, juridique, fiscal ou financier, dans quelque juridiction que ce soit.',
      ],
      [
        "Aucun argent réel n'est en jeu. Les contributions sur la démonstration utilisent des ",
        {
          b: ["jetons du testnet Stellar (USDC de test) qui n'ont aucune valeur monétaire"],
        },
        ' et ne peuvent pas être échangés contre des fonds réels.',
      ],
      [
        "Les campagnes d'exemple sont des illustrations fictives. Les identités des émetteurs, les valorisations, les chiffres et les résultats affichés sur la démonstration sont des ",
        {
          b: ['données fictives'],
        },
        ', et non de véritables opportunités.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['2. Ce que le Service vous permet de faire'],
  },
  {
    t: 'ul',
    items: [
      ["Parcourir et filtrer des campagnes d'investissement d'exemple et lire leurs conditions structurées."],
      ["Utiliser le centre d'apprentissage, le glossaire et la FAQ pour comprendre les instruments d'investissement."],
      [
        'Connecter un portefeuille ',
        {
          b: ['Freighter'],
        },
        ' (une extension de navigateur) et effectuer des ',
        {
          b: ['contributions de test'],
        },
        ' à la campagne de démonstration sur le testnet Stellar.',
      ],
    ],
  },
  {
    t: 'p',
    text: [
      "Les contributions de test sont traitées par un contrat intelligent Soroban au comportement suivant : financement de tout ou rien, versement à la campagne uniquement après sa date limite, contributions plafonnées à l'objectif de la campagne, et soldes enregistrés dans le contrat. Aucun jeton transférable n'est émis.",
    ],
  },
  {
    t: 'h2',
    text: ['3. Fonctions de test et limites de production'],
  },
  {
    t: 'p',
    text: [
      'Le prototype propose une connexion communautaire, des comptes email et mot de passe, une vue investisseur sur testnet et des écrans de démonstration du test de connaissances et de simulation des pertes. Leur accès peut être restreint ; ce ne sont pas des protections validées juridiquement.',
    ],
  },
  {
    t: 'p',
    text: [
      'La vérification KYC/AML réelle, les paiements par des prestataires agréés et un délai de réflexion ayant un effet juridique ne sont pas actifs. Les documents et écrans de test ne prouvent ni agrément ni droits opposables. La production exige une revue juridique et les autorisations nécessaires.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Éligibilité et usage acceptable'],
  },
  {
    t: 'p',
    text: [
      "Le Service est destiné aux adultes (18+). Il ne s'adresse à aucune personne se trouvant dans une juridiction où la consultation d'un contenu d'investissement participatif de ce type serait restreinte, et il ne doit pas être présenté à des personnes américaines comme une opportunité d'investissement.",
    ],
  },
  {
    t: 'p',
    text: [
      "Vous vous engagez à ne pas : attaquer, sonder ou perturber le Service ou son infrastructure ; en abuser, extraire des données à des rythmes abusifs ou interférer avec d'autres utilisateurs ; présenter faussement la démonstration comme un service d'investissement réel ; ou utiliser le Service à des fins illicites.",
    ],
  },
  {
    t: 'h2',
    text: ['5. Votre portefeuille et vos clés'],
  },
  {
    t: 'ul',
    items: [
      [
        'Votre portefeuille est ',
        {
          b: ['non custodial'],
        },
        ' : votre clé secrète et votre phrase de récupération restent dans votre propre extension Freighter. Nous ne les voyons, ne les stockons et ne les demandons jamais.',
      ],
      [
        {
          b: ["N'entrez jamais"],
        },
        ' votre clé secrète ou votre phrase de récupération sur un site web, y compris celui-ci. Quiconque la demande cherche à vous voler.',
      ],
      [
        'Chaque transaction est signée par vous dans votre portefeuille. Les transactions sur le testnet Stellar sont enregistrées publiquement et consultables sur des explorateurs publics du testnet.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['6. Propriété intellectuelle'],
  },
  {
    t: 'p',
    text: [
      "Le Service, son contenu et son code sont Copyright (c) 2026 Nuno Ribeiro, tous droits réservés. Aucune licence open source ni concession de brevet n'est accordée. Vous pouvez consulter et utiliser la démonstration à des fins d'évaluation ; vous ne pouvez pas la copier, la republier ou la revendre.",
    ],
  },
  {
    t: 'h2',
    text: ['7. Disponibilité et modifications'],
  },
  {
    t: 'p',
    text: [
      'Le Service utilise un hébergement gratuit et peut être lent, indisponible, modifié ou arrêté. Les fonctions de test ne prouvent pas une aptitude à la production ; la vérification réelle d’identité et les paiements en monnaie fiduciaire restent inactifs.',
    ],
  },
  {
    t: 'h2',
    text: ['8. Exclusions de garantie et limitation de responsabilité'],
  },
  {
    t: 'p',
    text: [
      'Le Service est fourni ',
      {
        b: ['« tel quel » et « selon disponibilité »'],
      },
      ", sans garantie d'aucune sorte, expresse ou implicite, y compris d'exactitude, d'adéquation à un usage particulier ou d'absence de contrefaçon. Dans la mesure maximale permise par la loi, nous ne sommes pas responsables des dommages indirects, accessoires ou consécutifs, ni d'aucune perte résultant de votre utilisation du Service, de votre portefeuille ou du réseau Stellar. Rien dans les présentes Conditions n'exclut une responsabilité qui ne peut être exclue par la loi.",
    ],
  },
  {
    t: 'h2',
    text: ['9. Droit applicable'],
  },
  {
    t: 'p',
    text: [
      'Les présentes Conditions sont régies par les lois du ',
      {
        b: ['Portugal'],
      },
      " et par le droit de l'Union européenne applicable, sans préjudice des règles impératives de protection des consommateurs de votre pays de résidence.",
    ],
  },
  {
    t: 'h2',
    text: ['10. Modifications des présentes Conditions'],
  },
  {
    t: 'p',
    text: [
      "Nous pouvons mettre à jour ces Conditions à tout moment. La date de « Dernière mise à jour » indique la version en vigueur. L'utilisation continue après une modification vaut acceptation des nouvelles Conditions.",
    ],
  },
  {
    t: 'h2',
    text: ['11. Contact'],
  },
  {
    t: 'p',
    text: [
      'Questions sur les présentes Conditions : ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ["Mentions de l'opérateur non résolues :"],
      },
      " les mentions DEMO de l'opérateur figurant dans ces Conditions sont illustratives et ne satisfont à aucune obligation impérative d'identification de l'opérateur (telle qu'un imprimé ou une mention légale au titre des règles portugaises ou européennes sur le commerce électronique, les médias ou la consommation). L'application d'une telle obligation à ce service prototype n'a pas été déterminée ; toute mention requise sera ajoutée ici ou sur une page liée avant tout lancement réel.",
    ],
  },
];
