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
      "La présente Politique de confidentialité explique quelles données personnelles le prototype Blockallisto (le « Service ») traite, pourquoi, et quels droits vous disposez. Le Service est un projet prototype exploité sous le nom Blockallisto. Les mentions sociales affichées pour Blockallisto dans ces documents sont des données fictives de démonstration (forme juridique [DEMO] « Lda. », siège social [DEMO] « Rua da Demonstracao 0, 0000-000 Lisboa, Portugal », numéro d'enregistrement [DEMO] « 000 000 000 ») ; l'identité juridique enregistrée derrière le nom Blockallisto n'a pas été vérifiée, et nommer le projet n'identifie pas en soi le responsable de traitement. [Le responsable de traitement - la personne ou l'entité effectivement responsable de ce traitement - sera confirmé avant publication.] Les demandes relatives à la vie privée reçoivent une réponse à l'adresse ",
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Portée : ce que la démonstration ne collecte pas'],
  },
  {
    t: 'p',
    text: [
      "Le prototype actuel n'a ",
      {
        b: ['ni KYC, ni newsletters ni paiements'],
      },
      ". La connexion à la communauté repose sur le portefeuille : elle utilise une signature de portefeuille Stellar, et non un mot de passe ou une adresse e-mail. Nous ne demandons ni votre nom complet, ni votre numéro de téléphone, ni vos documents d'identité, ni votre carte de paiement. Les fonctionnalités communautaires collectent en revanche les données décrites à la section 2b : une clé publique, un nom d'affichage optionnel, le contenu en texte libre que vous choisissez de soumettre, et un e-mail de contact optionnel sur les candidatures d'émetteurs. Nous n'utilisons ni outils d'analyse ni traceurs publicitaires, et les polices et ressources du site sont auto-hébergées.",
    ],
  },
  {
    t: 'h2',
    text: ['2. Données que nous traitons'],
  },
  {
    t: 'p',
    text: [
      {
        b: ['a) Données de portefeuille et de contributions.'],
      },
      ' Si vous connectez un portefeuille Freighter et effectuez une contribution de test, le backend enregistre, dans une base de données Postgres (hébergée par Neon), un journal de sécurité contenant : votre ',
      {
        b: ['clé publique'],
      },
      " Stellar (jamais votre clé secrète), l'identifiant de la campagne, l'action, le montant de la contribution, les enveloppes de transaction, le hash et le statut de la transaction, et des horodatages. Une clé publique Stellar est une donnée pseudonyme ; nous ne la relions pas à votre identité.",
    ],
  },
  {
    t: 'p',
    text: [
      {
        i: ['Conservation :'],
      },
      " les transactions préparées non signées expirent après 24 heures ; les transactions abouties ou échouées sont purgées après 30 jours ; une transaction signée dont le résultat n'est pas résolu est conservée jusqu'à sa résolution, car sa suppression pourrait faire perdre la trace d'une transaction diffusée. Les enveloppes signées sont expurgées une fois que la transaction atteint un état final. Ce sont les règles de nettoyage configurées dans le code même de l'application : elles décrivent ce que l'application supprime. Les journaux serveur et sauvegardes propres à nos hébergeurs peuvent conserver des données pendant des durées différentes selon leurs propres politiques de confidentialité, et ne sont pas couverts par ces règles.",
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['b) Compte communautaire et contenu communautaire.'],
      },
      ' Si vous vous connectez aux fonctionnalités communautaires, le backend stocke, dans la même base Postgres Neon : votre ',
      {
        b: ['clé publique'],
      },
      ', un horodatage de création du compte et un ',
      {
        b: ["nom d'affichage"],
      },
      " optionnel (jusqu'à 40 caractères). La connexion fonctionne en signant avec votre portefeuille un défi unique émis par le serveur (validité de 5 minutes, usage unique) ; aucun mot de passe ni e-mail n'est requis et votre clé secrète ne quitte jamais le portefeuille. Le serveur ne conserve qu'un hash SHA-256 du jeton de session ; le jeton brut réside dans le stockage local de votre navigateur. Les sessions durent 30 jours, la déconnexion supprime la session, et les défis et sessions expirés sont purgés toutes les heures.",
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['Les commentaires'],
      },
      " sont publics : chaque commentaire stocke votre clé publique, votre nom d'affichage s'il est défini, le corps (jusqu'à 1000 caractères), la campagne et un horodatage, et les 100 derniers commentaires par campagne sont visibles par chaque visiteur. Un commentaire masqué par l'opérateur quitte immédiatement la liste publique et est définitivement supprimé 30 jours après son masquage. ",
      {
        b: ['Les tickets de support/retour'],
      },
      " (nature, sujet jusqu'à 120 caractères, corps jusqu'à 4000 caractères, statut, horodatages) et les ",
      {
        b: ["candidatures d'émetteurs"],
      },
      " (nom du projet, pays, type d'instrument, montant visé, description et un e-mail de contact optionnel) ne sont visibles que par votre compte portefeuille et par l'administrateur de l'opérateur ; les deux sont définitivement supprimés après 90 jours (fenêtre de conservation configurable dans le code de l'application). Les ",
      {
        b: ['actualités'],
      },
      " des campagnes sont rédigées par l'opérateur et étiquetées comme contenu de démonstration de la plateforme. Votre adresse IP est utilisée en mémoire pour la limitation de débit et balayée sous 24 heures ; l'application ne la conserve pas (les journaux d'hébergement sont couverts au point e).",
    ],
  },
  {
    t: 'p',
    text: [
      "Une mise en garde : les clés publiques, les noms d'affichage et les contenus en texte libre peuvent vous identifier même si nous ne demandons jamais votre nom. Ne soumettez pas d'informations personnelles sensibles dans les champs communautaires.",
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['c) Données publiques de la blockchain.'],
      },
      ' Les contributions de test sont enregistrées publiquement sur le ',
      {
        b: ['testnet'],
      },
      ' Stellar et visibles sur des explorateurs publics. Les enregistrements blockchain ne peuvent être ni modifiés ni supprimés par nous.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ["d) Préférences de l'appareil."],
      },
      ' Vos choix de thème (clair/sombre) et de langue sont stockés dans le stockage local de votre navigateur. Ces données restent sur votre appareil et ne nous sont pas envoyées.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['e) Journaux techniques.'],
      },
      " Notre hébergeur (Render, région de Francfort) traite des journaux serveur standard (tels que l'adresse IP et les métadonnées des requêtes) pour fournir et protéger le Service.",
    ],
  },
  {
    t: 'h2',
    text: ["3. Données que nous prévoyons de traiter dans les versions futures (non collectées aujourd'hui)"],
  },
  {
    t: 'p',
    text: [
      'La conception indicative des versions futures de Blockallisto - suivant les surfaces de conformité des plateformes européennes de financement participatif établies - consiste à traiter des catégories supplémentaires de données personnelles ',
      {
        b: ['quand et si'],
      },
      ' ces fonctionnalités sont lancées. Les catégories exactes, les prestataires et les seuils peuvent évoluer avec les travaux de conception et les conseils juridiques :',
    ],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ["Données d'inscription :"],
        },
        " nom complet (exactement tel qu'il figure sur votre document d'identité), adresse e-mail, pays de résidence et résidence fiscale.",
      ],
      [
        {
          b: ["Vérification d'identité (KYC/AML) :"],
        },
        " images du document d'identité, un selfie, numéro de mobile et résultats de vérification, traités avec des prestataires tiers spécialisés en vérification ; pour les investisseurs personnes morales, les bénéficiaires effectifs (typiquement toute personne détenant plus de 25 %) et l'origine des fonds ; les déclarations de personne politiquement exposée (PPE).",
      ],
      [
        {
          b: ['Données de paiement et de reversement :'],
        },
        " coordonnées bancaires (telles que l'IBAN) traitées par des prestataires de services de paiement agréés, et non par nous détenant des fonds de clients.",
      ],
    ],
  },
  {
    t: 'p',
    text: [
      "À l'exception de l'e-mail de contact optionnel de l'émetteur décrit à la section 2b, aucune de ces données n'est collectée par la démonstration actuelle. Si ces fonctionnalités sont lancées, la présente Politique sera d'abord mise à jour, avec les prestataires, finalités, bases juridiques et durées de conservation de chaque catégorie.",
    ],
  },
  {
    t: 'h2',
    text: ['4. Finalités et bases juridiques (RGPD)'],
  },
  {
    t: 'p',
    text: [
      "Nous traitons les données de la section 2 pour exploiter, sécuriser et démontrer le prototype : préparer et suivre les transactions de test, empêcher les doubles dépenses et résoudre les transactions ambiguës, maintenir la fiabilité du Service, et faire fonctionner les fonctionnalités communautaires (publier et modérer les commentaires, répondre aux tickets de support et de retour, et examiner les candidatures d'émetteurs). La base juridique est notre intérêt légitime (art. 6, paragraphe 1, point f), du RGPD) à faire fonctionner une démonstration technique sûre. Nous n'utilisons pas vos données à des fins de marketing, de profilage ou de vente.",
    ],
  },
  {
    t: 'h2',
    text: ['5. Qui traite les données'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Render'],
        },
        " (hébergement, Francfort, UE) - exécute l'application.",
      ],
      [
        {
          b: ['Neon'],
        },
        ' (Postgres managé ; région AWS Europe (Francfort), UE - vérifié dans la console Neon le ',
        {
          v: 'lastUpdated',
        },
        ') - stocke le journal des contributions et le magasin de données communautaires.',
      ],
      [
        {
          b: ['Testnet Stellar'],
        },
        ' (réseau public exploité par la Stellar Development Foundation, mondial) - enregistre les transactions publiques de test.',
      ],
      [
        {
          b: ['GitHub'],
        },
        ' - héberge le code source (aucune donnée utilisateur).',
      ],
    ],
  },
  {
    t: 'p',
    text: ["Lorsque le traitement a lieu hors de l'UE/EEE (par exemple le réseau mondial Stellar), il ne porte que sur des données pseudonymes du testnet."],
  },
  {
    t: 'h2',
    text: ['6. Vos droits au titre du RGPD'],
  },
  {
    t: 'p',
    text: [
      "Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation ou d'opposition au traitement de vos données personnelles, ainsi qu'à la portabilité des données, au titre du règlement (UE) 2016/679 (RGPD). Vous avez également le droit d'introduire une réclamation auprès de l'autorité de contrôle portugaise, la ",
      {
        b: ['CNPD'],
      },
      ' (Comissao Nacional de Protecao de Dados).',
    ],
  },
  {
    t: 'p',
    text: [
      "Nous ne pouvons localiser les données qui vous sont liées que par votre clé publique Stellar (et tout nom d'affichage ou contenu en texte libre que vous avez choisi de soumettre). Les données déjà inscrites sur une blockchain publique ne peuvent pas être effacées ; nous pouvons rectifier ou effacer les enregistrements hors chaîne (le journal des contributions, votre compte communautaire, les commentaires, tickets et candidatures) sur demande, sous réserve des règles de conservation de la section 2.",
    ],
  },
  {
    t: 'h2',
    text: ['7. Brésil (LGPD)'],
  },
  {
    t: 'p',
    text: [
      "La démonstration est exploitée depuis le Portugal. La Lei Geral de Protecao de Dados du Brésil (Lei no 13.709/2018 - LGPD) peut s'appliquer aux traitements ciblant ou impliquant des personnes au Brésil ; son application à ce prototype est une question juridique à confirmer avec un conseil. Si et dans la mesure où la LGPD s'applique, elle vous accorde sur vos données personnelles des droits similaires à ceux ci-dessus, et vous pouvez contacter l'ANPD (Autoridade Nacional de Protecao de Dados). Utilisez le même contact ci-dessus pour toute demande.",
    ],
  },
  {
    t: 'h2',
    text: ['8. Sécurité'],
  },
  {
    t: 'p',
    text: [
      "Les clés de votre portefeuille ne quittent jamais votre extension Freighter ; le Service est conçu de sorte qu'il ne peut pas y accéder. L'application est servie en TLS et les points d'accès administratifs sont désactivés par défaut (fail-closed). Aucune méthode n'est absolue, mais la conception du prototype minimise les données exposées aux attaques.",
    ],
  },
  {
    t: 'h2',
    text: ['9. Enfants'],
  },
  {
    t: 'p',
    text: ["Le Service est une démonstration technique et ne s'adresse pas aux enfants."],
  },
  {
    t: 'h2',
    text: ['10. Modifications'],
  },
  {
    t: 'p',
    text: [
      "Nous pouvons mettre à jour la présente Politique au fil de l'évolution du prototype. La date de « Dernière mise à jour » indique la version en vigueur. Les modifications substantielles seront reflétées ici avant de prendre effet.",
    ],
  },
  {
    t: 'h2',
    text: ['11. Contact'],
  },
  {
    t: 'p',
    text: [
      'Questions et demandes relatives à la vie privée : ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
];
