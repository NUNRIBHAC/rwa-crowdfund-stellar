// French (fr-FR). Structure is compiler-checked against ./en;
// array lengths and ids are checked by i18n/parity.test.ts.
import type { Messages } from './en';

export const fr: Messages = {
  meta: {
    title: 'Blockallisto - Des actifs réels. Des possibilités partagées.',
    skipLink: 'Aller au contenu principal',
  },
  nav: {
    ariaMain: 'Principal',
    home: 'Accueil',
    investments: 'Investir',
    howItWorks: 'Fonctionnement',
    learn: 'Apprendre',
    financing: 'Financement',
    faq: 'FAQ',
    about: 'À propos',
    account: 'Mon compte',
  },
  header: {
    testnetBadge: 'Testnet Stellar',
    connect: 'Connecter Freighter',
    connectedPrefix: 'Connecté',
    languageLabel: 'Langue du site',
    themeToLight: 'Passer au thème clair',
    themeToDark: 'Passer au thème sombre',
  },
  riskBanner:
    'Les investissements en crowdfunding comportent un risque de perte totale. Ceci est un prototype sur le testnet Stellar : aucune offre réelle, aucun fonds réel, aucun conseil en investissement.',
  hero: {
    eyebrow: 'Des actifs du monde réel tokenisés, sur Stellar',
    titleA: 'Des actifs réels.',
    titleB: 'Des possibilités partagées.',
    sub: "Blockallisto, c'est du crowdfunding tout-ou-rien appliqué par un contrat Soroban : chaque contribution reste en séquestre sur Stellar et la vérification du plafond de financement est exécutée dans la même transaction atomique. Le créateur ne lève les fonds que si l'objectif est atteint dans les délais ; sinon, chaque contributeur signe son propre remboursement. Du Portugal vers le monde.",
    ctaBrowse: 'Voir les campagnes',
    ctaHow: 'Fonctionnement',
    noteStrong: 'Prototype sur le testnet Stellar - aucun fonds réel.',
    noteLive:
      "Chaque campagne ci-dessous est un vrai contrat Soroban sur le testnet Stellar. Non audité, non prêt pour la production. Hébergé sur un plan gratuit : la première requête après inactivité peut prendre jusqu'à une minute le temps que l'instance se réveille.",
    noteSample: 'Les campagnes ci-dessous sont des exemples (fixtures), pas des contrats déployés. Non audité, non prêt pour la production.',
    noteUnknown: 'Non audité, non prêt pour la production.',
    unavailable:
      "Non disponible dans ce prototype : inscription avec identité/KYC, négociation sur un marché secondaire, tokens d'actifs ou de reçus transférables, paiements en monnaie fiduciaire, offres d'investissement réelles. Les registres de contribution sont incessibles - ceci est du crowdfunding, pas une bourse d'investissement.",
    fundingBlockAria: "Illustration : de petits blocs violets glissent un à un et remplissent le contour d'un actif partagé, token par token",
  },
  emptyState: {
    fixtureStrong: 'Aperçu avec exemples actif.',
    fixtureText:
      'Les campagnes ci-dessous sont des exemples pour montrer la mise en page. Ce ne sont pas des contrats déployés, pas des offres réelles et elles ne peuvent pas accepter de contributions.',
    fixtureBack: 'Retour au registre réel',
    emptyTitle: 'Aucune campagne déployée configurée',
    emptyText:
      'Un opérateur doit déployer et vérifier séparément le contrat révisé, puis définir SOROBAN_CAMPAIGNS_JSON. Le déploiement et la migration ne se font pas ici. Les anciennes campagnes sont en lecture seule et exigent une réconciliation.',
    emptyCta: 'Aperçu avec des campagnes exemples',
  },
  home: {
    stepsAria: "Comment fonctionne l'investissement",
    stepsTitle: '4 étapes pour votre première contribution',
    steps: [
      {
        title: 'Connecter',
        text: "Connectez un portefeuille Freighter sur le testnet Stellar. L'accès à la communauté est facultatif et ne demande ni e-mail ni mot de passe.",
      },
      {
        title: 'Découvrir',
        text: 'Parcourez les campagnes et lisez les conditions structurées sur la page de chaque campagne.',
      },
      {
        title: 'Contribuer',
        text: 'Signez une transaction. Le contrat place votre contribution en séquestre et applique le plafond de financement de façon atomique.',
      },
      {
        title: 'Suivre',
        text: "Suivez ici l'état du financement. Les remboursements sont signés par le contributeur si l'objectif n'est pas atteint.",
      },
    ],
    fullJourneyLink: "Parcours complet de l'investisseur, chaque étape marquée comme existante ou planifiée",
    latestAria: 'Campagnes récentes',
    latestTitle: 'Campagnes récentes',
    allInvestments: 'Tous les investissements',
    instrumentsAria: "Classes d'instruments",
    instrumentsTitle: "Classes d'instruments couvertes par cette conception",
    instrumentsIntro:
      "La conception de la plateforme couvre quatre catégories mères du côté de la participation (droit/certificat participatif - avec le Substanzgenussrecht comme sous-type - action, participation indirecte comme structure de détention et part de société en commandite) et deux catégories mères de dette, prêt et obligation, chacune émise en senior, subordonnée ou avec seniorité non spécifiée, plus des superpositions de structure comme zéro-coupon et convertible. Ce prototype n'implémente que le séquestre par contrat ; les classes ci-dessous sont éducatives.",
    whyAria: 'Pourquoi cette plateforme',
    whyTitle: 'Pourquoi cette approche',
    whyPoints: [
      'Règles de financement appliquées par un contrat public, pas par la comptabilité de la plateforme.',
      "Protection tout-ou-rien : les contributeurs signent leur propre remboursement si l'objectif n'est pas atteint.",
      'Chaque transaction est vérifiable sur un réseau de test public.',
      "Conception ouverte : classes d'instruments, parcours de l'investisseur et surface de conformité documentées dans le dépôt.",
    ],
  },
  invest: {
    title: 'Tous les investissements',
    noteFixture: 'Les campagnes exemples montrent la mise en page. Ce ne sont pas des contrats déployés et elles ne peuvent pas accepter de contributions.',
    noteLive: 'Les vraies campagnes sont des contrats Soroban sur le testnet Stellar. Les actifs de testnet sont sans valeur.',
    refresh: "Actualiser l'état du contrat",
    searchPlaceholder: 'Rechercher des campagnes par nom ou contrat',
    searchAria: 'Rechercher des campagnes',
    filterStatusAria: 'Filtrer par statut',
    all: 'Toutes',
    open: 'Ouvertes',
    funded: 'Financées',
    underfunded: 'Non financées',
    filterIndustryAria: 'Filtrer par secteur',
    allIndustries: 'Tous les secteurs',
    sortAria: 'Trier les campagnes',
    sortDeadline: 'Échéance la plus proche',
    sortProgress: 'Les plus financées',
    sortName: 'Nom A-Z',
    viewAria: "Mode d'affichage",
    grid: 'Grille',
    list: 'Liste',
    noMatches: 'Aucune campagne ne correspond à la recherche et aux filtres actuels.',
    activeAria: 'Investissements actifs',
    activeTitle: 'Investissements actifs',
    completedAria: 'Investissements terminés',
    completedTitle: 'Investissements terminés',
  },
  card: {
    demo: 'Démo',
    statusFunded: 'Financée',
    statusEnded: 'Non financée',
    statusOpen: 'Ouverte',
    withdrawn: 'Retiré',
    fundedPct: (percent: number) => `${percent}% financé`,
    progressUnavailable: 'Progression indisponible - données on-chain non chargées',
    progressAria: (pct: number) => `Progression du financement : ${pct}% de l'objectif`,
    interest: 'Intérêt',
    term: 'Durée',
    minimum: 'Minimum',
    raised: 'Collecté',
    goal: 'Objectif',
    deadline: 'Date limite',
    status: 'Statut',
    yourPosition: 'Votre registre de contribution :',
    viewDetails: 'Voir les détails',
    demoNote: 'Données de démonstration illustratives - pas une offre réelle.',
    photoAlt: "Photographie aérienne d'une ferme solaire (illustrative)",
    photoCaption: 'Photo illustrative - pas le projet réel.',
    contractData: 'Données du contrat',
    contract: 'Contrat',
    creator: 'Créateur',
    assetContract: "Contrat de l'actif",
    assetValidated: "validé par l'API comme USDC de testnet",
    exactRaisedGoal: 'Collecté / objectif exacts',
    unitsNote: 'unités à 7 décimales',
    creatorWithdrawn: 'Retrait par le créateur',
    yes: 'Oui',
    no: 'Non',
    amountLabel: 'Montant de la contribution (USDC de testnet)',
    amountRequired: 'Saisissez un montant de contribution.',
    amountInvalid: "Saisissez un montant valide : chiffres uniquement, jusqu'à 7 décimales, supérieur à zéro.",
    amountExceeds: (remaining: string) => `Le montant dépasse l'objectif restant de ${remaining} USDC (testnet).`,
    usdcTestnet: 'USDC (testnet)',
    contribute: 'Contribuer',
    refundMe: 'Me rembourser',
    creatorWithdraw: 'Retrait du créateur',
    rules:
      "Contribuez avant la date limite, jusqu'au montant restant de l'objectif. Passé le délai, le créateur ne lève les fonds que si l'objectif est entièrement atteint ; sinon, chaque contributeur signe son propre remboursement. Le contrat applique ces règles de façon atomique.",
  },
  grid: {
    ariaReady: (filled: number, count: number, percent: number) =>
      `Progression du financement : ${filled} sur ${count} blocs remplis, ${percent}% de l'objectif`,
    ariaUnavailable: 'Progression du financement indisponible : données on-chain non chargées',
    fundedTail: (filled: number, count: number) => `financé - ${filled} sur ${count} blocs`,
    captionUnavailable: 'Progression indisponible - données on-chain non chargées',
  },
  intent: {
    title: 'Transaction enregistrée',
    steps: ['Préparée', 'Signée', 'Envoyée', 'Confirmée'],
    action: 'Action',
    campaign: 'Campagne',
    contract: 'Contrat',
    maxFee: 'Frais max',
    checkWallet: 'vérifier le portefeuille',
    hash: 'Hash',
    usdcTestnet: 'USDC (testnet)',
    xlmTestnet: 'XLM de testnet',
    warningPending:
      "Envoyer n'est pas confirmer. Un résultat absent ne signifie pas un échec. Vérifiez le statut ou réessayez cette transaction signée exacte ; ne créez jamais de remplaçante tant que vous avez un doute.",
    confirmed: 'Confirmée sur le testnet Stellar. Cette transaction exacte est définitive ; le hash ci-dessus est votre preuve permanente.',
    notFound: "Résultat incertain conservé. Le RPC peut avoir un historique limité. N'effacez pas et ne remplacez pas sur la base d'une expiration.",
    retry: 'Réessayer la transaction identique',
    signSubmit: 'Signer et envoyer',
    checkLedger: 'Vérifier le résultat sur le ledger',
    cancelUnsigned: 'Annuler la transaction non signée',
    clearConfirmed: 'Effacer le registre confirmé',
    statusLabels: {
      BUILT: 'PRÉPARÉE',
      SIGNED: 'SIGNÉE',
      PENDING: 'EN ATTENTE',
      SUCCESS: 'CONFIRMÉE',
      FAILED: 'ÉCHOUÉE',
      NOT_FOUND: 'INTROUVABLE',
      CANCELLED_UNSIGNED: 'ANNULÉE SANS SIGNATURE',
    } as Record<string, string>,
    actionLabels: {
      contribute: 'contribuer',
      refund: 'remboursement',
      withdraw: 'retrait',
    } as Record<string, string>,
  },
  campaign: {
    loading: 'Chargement de la campagne…',
    notFound: 'Campagne introuvable',
    notFoundText: "Aucune campagne avec cet id n'est dans le registre actuel",
    notFoundFixtureSuffix: ' de campagnes exemples',
    backToAll: 'Retour à tous les investissements',
    issuerMissing:
      "L'identité de l'émetteur et les conditions off-chain ne sont pas disponibles dans ce prototype ; les données ci-dessous proviennent du contrat on-chain.",
    assetClass: "Classe d'actif",
    escrowTestnet: 'Séquestre par contrat (testnet)',
    interestRate: "Taux d'intérêt",
    noInterest: 'Aucun - uniquement séquestre de contributions',
    term: 'Durée',
    termDeadlinePrefix: 'Date limite',
    minInvestment: 'Investissement minimum',
    minNote: "Défini par transaction, limité au montant restant de l'objectif",
    additionalInfo: 'Informations complémentaires',
    factsAria: 'Faits de la plateforme',
    fundingModel: 'Modèle de financement',
    aonEnforced: 'Tout-ou-rien, appliqué par le contrat Soroban',
    goal: 'Objectif',
    deadline: 'Date limite',
    contract: 'Contrat',
    asset: 'Actif',
    assetValidated: "validé par l'API comme USDC de testnet",
    interestIsinDocs: 'Intérêt, ISIN, documents',
    interestIsinDocsNote: "Non disponible - ce prototype n'enregistre que des contributions et n'émet aucun titre",
    marketingDivider: "Contenu fourni par l'émetteur ci-dessous - non vérifié par la plateforme",
    marketingDividerAria: 'Contenu marketing ci-dessous',
    tabs: ["Vue d'ensemble", 'Détails', 'Documents', 'Actualités'],
    tabsAria: 'Sections de la campagne',
    overviewMissing:
      "Le contenu marketing de l'émetteur n'est pas disponible dans ce prototype. Sur une plateforme en production, cette zone afficherait la description, l'équipe et le modèle économique de l'émetteur lui-même, clairement séparés des faits de la plateforme par le séparateur ci-dessus.",
    detailsPre: "Le modèle économique, le marché, les finances et les jalons apparaîtraient ici comme sections fournies par l'émetteur.",
    detailsSample: "Cette campagne exemple n'inclut pas de contenu de détail.",
    detailsMissing: 'Non disponible dans ce prototype.',
    documentsMissing:
      "L'hébergement de documents n'est pas disponible dans ce prototype. Une plateforme en production hébergerait ici la fiche d'information fondamentale et les conditions de l'émission.",
    newsEmpty: 'Aucune actualité. Les nouvelles de la campagne apparaîtraient ici.',
    statusFunded: 'Financée avec succès',
    statusEnded: 'Sans succès',
    widgetContribute: 'Contribuer',
    widgetOverview: "Résumé de l'investissement",
    widgetFixture: "Aperçu d'exemple. Cette campagne est un exemple (fixture), pas un contrat déployé, et ne peut pas accepter de contributions.",
    widgetEnded: "Cette campagne est terminée. Les remboursements restent disponibles selon les règles d'échéance décrites sur la page des investissements.",
    widgetRisk:
      'Les investissements en crowdfunding comportent un risque de perte totale et sont illiquides. Ce prototype utilise des actifs de testnet sans valeur.',
    raised: 'Collecté',
    usdcTestnet: 'USDC (testnet)',
    explainerSuffix: "Ceci est un texte éducatif d'exemple, pas les conditions d'une offre réelle.",
    explainerConvertible:
      "Une obligation convertible paie des intérêts jusqu'à ce qu'un événement configuré permette aux porteurs de convertir en actions selon les conditions de l'émission. La conversion est une superposition de structure sur l'obligation, pas un instrument séparé.",
    explainerSeniorBond:
      "Une obligation senior est une dette non subordonnée : les obligataires ont priorité sur le capital subordonné et les capitaux propres en cas d'insolvabilité et reçoivent un coupon fixe, sans participation à la croissance de l'entreprise.",
    explainerSubBond:
      "Une obligation subordonnée paie un coupon défini, mais passe après les créanciers seniors en cas d'insolvabilité et ne participe pas à la croissance de l'entreprise.",
    explainerDefault: "Cette classe d'instrument est décrite dans le hub Apprendre.",
  },
  howItWorks: {
    title: 'Fonctionnement',
    intro:
      "Le parcours qu'une vraie plateforme de crowdfunding doit prendre en charge, et exactement quelles parties ce prototype implémente déjà. Les étapes marquées comme planifiées n'existent pas dans le code et rien sur ce site ne prétend qu'elles existent.",
    investorTitle: "Parcours de l'investisseur",
    issuerTitle: "Parcours de l'émetteur",
    live: 'Existe dans le prototype',
    planned: 'Planifié - non construit',
    investorSteps: [
      {
        title: 'Inscription et connexion',
        text: "Une plateforme en production exige un compte avec confirmation d'email et identifiants. Ce prototype propose à la place une connexion communautaire optionnelle : vous prouvez le contrôle de votre portefeuille Freighter en signant un défi unique - sans inscription par email, sans mot de passe. Le portefeuille est la seule identité.",
      },
      {
        title: "Vérification d'identité (KYC)",
        text: "Vérification de document et selfie avec un prestataire de vérification, plus des données AML lorsqu'exigées. Non implémenté ; aucune donnée d'identité n'est collectée ici.",
      },
      {
        title: "Catégorisation de l'investisseur",
        text: "Lorsque le régime applicable l'exige : test de connaissances et simulation de capacité à supporter des pertes avant d'investir, avec des avertissements renforcés au-delà des seuils légaux.",
      },
      {
        title: 'Découvrir les campagnes',
        text: 'Parcourez le registre, filtrez et triez, et lisez les conditions structurées sur la page de chaque campagne.',
      },
      {
        title: 'Investir',
        text: "Connectez Freighter, saisissez un montant et signez une transaction. Le contrat place la contribution en séquestre et applique le plafond de façon atomique. Sur une plateforme en production, le clic est une offre ferme à l'émetteur.",
      },
      {
        title: 'Délai de réflexion',
        text: "Lorsque le régime applicable l'exige, les investisseurs couverts peuvent révoquer une offre dans un délai configuré (4 jours calendaires dans le régime de l'UE pour les investisseurs non avertis). Non implémenté ; les contributions de testnet ne sont pas des offres.",
      },
      {
        title: 'Paiement',
        text: 'Une plateforme en production règle via un prestataire de paiement agréé avec des références par investissement. Ici, la transaction sur le testnet Stellar est le règlement, avec des actifs sans valeur.',
      },
      {
        title: 'Tableau de bord et paiements',
        text: "Un tableau de bord personnel avec l'état des investissements, les documents et les paiements d'intérêts. Non implémenté ; les registres de contribution se lisent par campagne avec le portefeuille connecté.",
      },
      {
        title: 'Transferts et sortie',
        text: "Transfert de positions entre utilisateurs vérifiés et, éventuellement, un marché d'annonces. Les registres de contribution dans ce prototype sont délibérément incessibles.",
      },
    ],
    issuerSteps: [
      {
        title: 'Candidature et analyse',
        text: "L'émetteur candidate, passe l'analyse d'éligibilité et de documents et signe les conditions de la plateforme.",
      },
      {
        title: 'Construction de la campagne',
        text: "Les conditions de l'instrument, les seuils, les documents et le contenu marketing sont configurés et relus.",
      },
      {
        title: 'Campagne active',
        text: "La démo montre la page publique de la campagne avec l'état de financement on-chain en temps réel.",
      },
      {
        title: 'Règlement',
        text: "Tout-ou-rien : le créateur ne lève les fonds que si l'objectif est atteint dans les délais, appliqué par le contrat.",
      },
      {
        title: 'Obligations post-financement',
        text: "Rapports, paiements d'intérêts et remboursement, et un état séparé du cycle de vie de l'émetteur. Non implémenté.",
      },
    ],
  },
  learn: {
    title: 'Apprendre',
    intro:
      "Des explications en langage simple du modèle d'instruments sur lequel cette plateforme se base : quatre catégories mères du côté de la participation et deux catégories mères de dette (prêt et obligation), chacune de dette émise en senior, subordonnée ou avec seniorité non spécifiée. Les superpositions de structure se combinent avec une catégorie mère de dette ; les qualificatifs de rang et d'étiquette sont une terminologie de plateformes, préservés tels quels. Contenu uniquement éducatif : ce n'est ni une offre ni un conseil en investissement.",
    seniorityStatesLabel: 'États de seniorité :',
    opportunities: 'Opportunités',
    risks: 'Risques',
    suitableLabel: 'Pour qui est-ce adapté :',
    overlaysAria: 'Superpositions de structure',
    overlaysTitle: 'Superpositions de structure',
    overlaysIntro: "Les superpositions se combinent avec une catégorie mère de prêt ou d'obligation et n'existent jamais seules comme instruments.",
    qualifiersAria: "Qualificatifs de rang et d'étiquette",
    qualifiersTitle: "Qualificatifs de rang et d'étiquette",
    qualifiersIntro:
      "Terminologie de plateformes que vous pouvez rencontrer dans des offres. Ces étiquettes qualifient un instrument ; ce ne sont pas des classes d'instruments en soi.",
  },
  glossaryPage: {
    title: 'Glossaire',
    intro:
      "Termes clés utilisés sur cette plateforme et dans les offres de crowdfunding en général. Contenu uniquement éducatif : ce n'est ni une offre ni un conseil en investissement.",
    sectionAria: 'Termes du glossaire',
    backPre: 'Retour à la page',
    backLink: 'Apprendre',
    riskPre: "Avant toute décision avec de l'argent réel, lisez les",
    riskLink: 'avertissements de risque',
  },
  riskWarnings: {
    title: 'Avertissements de risque',
    items: [
      {
        h: 'Perte totale',
        p: "Les investissements en crowdfunding peuvent perdre toute leur valeur. N'investissez jamais d'argent dont vous ne pouvez pas supporter la perte.",
      },
      {
        h: 'Illiquidité',
        p: "Ces instruments ne sont généralement pas négociables. Partez du principe que vous ne pouvez pas sortir avant l'échéance ou un événement défini.",
      },
      {
        h: 'Diversification',
        p: "Répartissez les investissements dans cette classe d'actifs entre plusieurs émetteurs.",
      },
      {
        h: 'Aucun mécanisme de protection',
        p: "Les investissements en crowdfunding ne sont couverts ni par des mécanismes de garantie des dépôts ni par des mécanismes d'indemnisation des investisseurs.",
      },
      {
        h: 'Aucun conseil',
        p: 'Rien sur ce site ne constitue un conseil en investissement, juridique ou fiscal. Ce site est un prototype logiciel sur un réseau de test et ne liste aucune offre réelle.',
      },
      {
        h: 'Statut de prototype',
        p: 'Les actifs de testnet sont sans valeur. Les contrats intelligents ici ne sont pas audités et ne doivent pas être utilisés avec des fonds réels.',
      },
    ],
  },
  faqPage: {
    title: 'Questions fréquentes',
    introPre: 'Les réponses sont marquées comme sur la page Fonctionnement :',
    introLive: 'Existe dans le prototype',
    introMid1: "décrit ce que le code fait aujourd'hui,",
    introPlanned: 'Planifié - non construit',
    introMid2: "n'est implémenté nulle part, et",
    introInfo: 'Contexte général',
    introPost: 'explique la pratique du crowdfunding sans affirmer que cette plateforme le fait.',
    searchPlaceholder: 'Rechercher des questions et réponses',
    searchAria: 'Rechercher des questions',
    categoryAria: 'Catégorie de la FAQ',
    all: 'Toutes',
    noMatches: 'Aucune question ne correspond à votre recherche.',
  },
  about: {
    title: 'À propos de ce projet',
    p1: 'Blockallisto (dépôt rwa-crowdfund-stellar) est un prototype personnel qui explore le crowdfunding tokenisé sur le réseau Stellar : financement de campagnes appliqué par un contrat intelligent Soroban, avec la plateforme plus large - comptes, vérification, instruments, paiements - conçue et documentée ouvertement dans le dépôt.',
    p2: "Ce n'est ni une entreprise, ni un prestataire de services de crowdfunding agréé, ni une offre de titres. Contexte de marché : du Portugal vers le monde.",
    ethicsAria: "Politique d'exclusion éthique",
    ethicsTitle: "Politique d'exclusion éthique",
    ethicsIntro:
      'Une politique au niveau du produit pour la plateforme que ce prototype explore. Les émetteurs des secteurs suivants sont hors de portée par conception :',
    ethicsPoints: [
      'Tabac, jeux de hasard et armes',
      'Combustibles fossiles, mines et énergie nucléaire',
      'Prisons et services de détention',
      'Organismes génétiquement modifiés et industries liées aux minerais de conflit',
    ],
    ethicsNote: 'Ceci est un engagement de conception du projet, pas une affirmation sur une quelconque opération réelle.',
    techAria: 'Technologie',
    techTitle: 'Technologie',
    techText:
      "Frontend en React, backend en Node, contrat Soroban (Rust) pour le séquestre, portefeuille Freighter pour la signature, USDC sur le testnet Stellar. L'hébergement et la base de données fonctionnent sur des plans gratuits. Les détails et les rapports de tests sont dans la documentation du dépôt.",
    behindAria: 'Derrière le nom',
    behindTitle: 'Derrière le nom',
    behindText:
      "Dans la Grèce antique, Callisto est devenue la Grande Ourse - une constellation où des points de lumière individuels s'unissent pour former une figure plus grande et impérissable. Chez Blockallisto, nous portons cette même vérité vers la finance mondiale à travers le réseau Stellar. Nous connectons les petits investisseurs pour remplir des blocs d'actifs réels. Ensemble, nous sommes la démocratisation de l'investissement : des points individuels qui se rejoignent en un tout plus grand.",
  },
  financing: {
    title: 'Financement pour les entreprises',
    intro:
      "Levez des capitaux auprès de la foule via un contrat Soroban à financement tout-ou-rien. Les portefeuilles connectés peuvent soumettre une candidature d'émetteur ci-dessous ; les candidatures sont conservées pour examen par l'opérateur. Soumettre ne constitue ni une intégration, ni une cotation, ni une approbation, et aucun financement n'est proposé.",
    journeyAria: "Résumé du parcours de l'émetteur",
    journeyTitle: 'Le parcours prévu',
    steps: [
      {
        h: 'Candidater',
        p: "Parlez-nous de votre entreprise, du montant et de l'instrument que vous envisagez.",
      },
      {
        h: 'Analyse',
        p: "Analyse d'éligibilité et de documents, suivie d'une proposition de financement structurée.",
      },
      {
        h: 'Construire',
        p: "Page de campagne, conditions de l'instrument, documents et contenu marketing préparés ensemble.",
      },
      {
        h: 'Financer',
        p: "Campagne tout-ou-rien. Les fonds ne sont débloqués que si l'objectif est atteint dans les délais.",
      },
    ],
  },
  account: {
    title: 'Mon compte',
    note: "Votre espace compte: les positions testnet de ce portefeuille et l'activité communautaire enregistrée sous celui-ci (actifs testnet uniquement - aucun fonds ni rendement réel). Les positions proviennent de votre portefeuille Freighter connecté sur le testnet Stellar et sont sans valeur. La connexion communautaire optionnelle et les formulaires de support et d'émetteur de cette page traitent les données saisies comme décrit dans la politique de confidentialité.",
    summaryAria: 'Résumé du portefeuille',
    totalContributed: 'Total contribué',
    totalSub: 'En séquestre on-chain, additionné sur les campagnes',
    returnReceived: 'Rendement reçu',
    returnNa: 'Non disponible',
    returnSub: 'Ce prototype ne suit aucun historique de paiements',
    activeInvestments: 'Investissements actifs',
    activeSub: 'Positions en séquestre dans des campagnes ouvertes ou financées',
    connectNote: "Connectez votre portefeuille Freighter pour voir vos positions de testnet. Sans portefeuille, cette page n'affiche que la structure.",
    fixtureNote: "Les campagnes exemples sont à l'écran ; les données d'exemple n'ont pas de positions par portefeuille.",
    investmentsAria: 'Mes investissements',
    myInvestments: 'Mes investissements',
    newInvestments: 'Nouveaux investissements',
    filterAria: 'Filtrer le portefeuille par statut',
    tabs: {
      all: 'Tous',
      canceled: 'Annulés',
      pending: 'En attente',
      paid: 'Payés',
      completed: 'Terminés',
    },
    tabNote:
      "Correspondance du prototype : En attente = contribution en séquestre, campagne ouverte. Payé = campagne financée, encore en cours. Terminé = campagne terminée après financement. Annulé = terminée sans atteindre l'objectif ; un remboursement signé par le contributeur est disponible sur la page de la campagne.",
    noInvestments: 'Aucun investissement trouvé.',
    activityAria: 'Activité récente',
    recentActivity: 'Activité récente',
    savedTxPre: 'Transaction enregistrée :',
    savedTxOn: 'sur la campagne',
    savedTxStatus: 'statut',
    savedTxPost: 'Reprenez-la ou effacez-la depuis le panneau de transactions ci-dessus.',
    savedTxUnknown: 'inconnu',
    noActivity: 'Aucune activité trouvée.',
    walletAria: 'Portefeuille',
    myWallet: 'Mon portefeuille',
    walletConnectedPre: 'Connecté :',
    walletConnectedPost:
      "Les contributions sont en séquestre dans les contrats des campagnes ; les remboursements sont signés par le contributeur on-chain. Aucun fonds détenu par la plateforme n'existe dans ce prototype.",
    noWallet: 'Aucun portefeuille connecté.',
    checklistAria: 'Liste de contrôle compte et profil',
    checklistTitle: "Vue d'ensemble du compte et données de profil",
    checklistIntro:
      "La plateforme de référence conditionne l'investissement à la complétion du profil, à la vérification et aux coordonnées bancaires. Ce prototype ne conditionne pas l'investissement ; la liste présente ces exigences de vérification de l'investisseur comme des emplacements planifiés.",
    notSetUp: 'Non configuré',
    checklist: [
      {
        label: 'Données personnelles',
        note: "Non requis pour investir dans ce prototype ; une exigence planifiée de vérification de l'investisseur.",
      },
      {
        label: 'Adresse',
        note: "Non requis pour investir dans ce prototype ; une exigence planifiée de vérification de l'investisseur.",
      },
      {
        label: 'Coordonnées',
        note: "Non requis pour investir dans ce prototype ; une exigence planifiée de vérification de l'investisseur.",
      },
      {
        label: "Qualification de l'investisseur",
        note: 'Le test de connaissances et la vérification de capacité de pertes sont des étapes de conformité planifiées ; non implémentés ici.',
      },
      {
        label: 'Vérification (KYC)',
        note: 'Non implémentée. Ce prototype de testnet ne vérifie aucune identité.',
      },
      {
        label: 'Coordonnées bancaires',
        note: 'Non collectées. Les contributions et remboursements se font en USDC de testnet on-chain.',
      },
      {
        label: 'Compte-titres',
        note: 'Référence optionnelle à un compte-titres sur la plateforme de référence ; non collectée ici.',
      },
      {
        label: 'Coffre numérique',
        note: 'Vue de conservation planifiée des positions détenues. Ici, les positions vivent dans chaque contrat de campagne et se lisent par portefeuille connecté.',
      },
    ],
  },
  footer: {
    communication: 'Communication',
    platform: 'Plateforme',
    legal: 'Légal',
    termsOfService: "Conditions d'Utilisation",
    privacyPolicy: 'Politique de Confidentialité',
    riskDisclosure: 'Avertissement sur les Risques',
    legalNotice: 'Mentions Légales',
    conflictsOfInterest: "Conflits d'Intérêts",
    complaintsManagement: 'Gestion des Réclamations',
    businessContinuity: "Continuité d'Activité",
    invest: 'Investir',
    howItWorks: 'Fonctionnement',
    financingIssuers: 'Financement pour émetteurs',
    learn: 'Apprendre',
    instrumentHub: 'Hub des instruments',
    riskWarnings: 'Avertissements de risque',
    glossary: 'Glossaire',
    faq: 'FAQ',
    aboutProject: 'À propos de ce projet',
    status: 'Statut',
    statusText:
      "Prototype de testnet. Aucun déploiement automatique ni conversion de soldes hérités. Les intents et soldes classiques existants sont préservés, pas effacés. L'infrastructure séparée d'identité/valorisation reste uniquement simulée.",
    legalPre: "Contexte de marché : l'UE régule le crowdfunding sous le régime ECSPR ; les prestataires agréés figurent dans le",
    legalLink: "registre de l'AEMF",
    legalPost: ". Cette application n'est pas un prestataire de services de crowdfunding agréé et ne liste aucune offre réelle.",
    tagline: 'Des actifs réels. Des possibilités partagées.',
  },
  time: {
    ended: 'Terminée',
    underMinute: "Moins d'une minute restante",
    minutesLeft: (n: number) => (n === 1 ? `${n} minute restante` : `${n} minutes restantes`),
    hoursLeft: (n: number) => (n === 1 ? `${n} heure restante` : `${n} heures restantes`),
    daysLeft: (n: number) => (n === 1 ? `${n} jour restant` : `${n} jours restants`),
  },
  errors: {
    freighterMissing: 'Extension de portefeuille Freighter non détectée. Installez Freighter, puis réessayez Connecter.',
    walletAccessFailed: "L'accès au portefeuille a échoué",
    connectFirst: "Connectez d'abord Freighter.",
    resolveSaved: "Réglez la transaction enregistrée avant d'en préparer une autre.",
    walletMismatch: 'Connectez le portefeuille qui a préparé cette transaction.',
    walletNoSign: "Le portefeuille n'a pas signé",
    apiFailed: 'La requête API a échoué',
  },
  instruments: {
    groups: [
      {
        id: 'participation',
        title: 'Instruments de participation',
        intro:
          "Instruments dont le rendement dépend du succès de l'activité de l'émetteur : droits participatifs aux bénéfices et capitaux propres. La participation indirecte figure ici comme structure de détention, pas comme instrument séparé.",
      },
      {
        id: 'debt',
        title: 'Instruments de dette',
        intro:
          'Deux catégories mères génériques - prêt et obligation - chacune émise dans un de trois états de seniorité : senior, subordonnée ou seniorité non spécifiée. Les investisseurs se positionnent comme créanciers.',
      },
    ],
    seniorityLabels: {
      senior: 'Senior (non subordonnée)',
      subordinated: "Subordonnée (passe après les créanciers seniors en cas d'insolvabilité)",
      unspecified: 'Seniorité non spécifiée dans les conditions',
    },
    classes: [
      {
        id: 'participation-certificate',
        label: 'Droit / certificat participatif',
        subtypeOf: '',
        note: '',
        group: 'participation',
        seniorityStates: [] as string[],
        summary:
          "Un droit (souvent titrisé comme certificat participatif) à une part des bénéfices et au remboursement de la valeur nominale, sans les droits de gouvernance complets d'un actionnaire.",
        opportunities: [
          'Part aux bénéfices sans acheter des capitaux propres complets',
          'Combine souvent un droit de remboursement de base avec une participation aux bénéfices',
        ],
        risks: [
          "La part des bénéfices dépend entièrement de la performance de l'émetteur",
          'Peut passer après les créanciers ordinaires',
          "Généralement illiquide jusqu'à l'échéance",
        ],
        suitableFor: 'Investisseurs qui veulent une exposition aux résultats de l\u2019entreprise et acceptent un risque proche des capitaux propres.',
      },
      {
        id: 'substanzgenussrecht',
        label: 'Substanzgenussrecht',
        subtypeOf: 'Sous-type de droit / certificat participatif',
        note: '',
        group: 'participation',
        seniorityStates: [] as string[],
        summary:
          "Un droit participatif lié à la base d'actifs (la « substance ») de l'émetteur plutôt qu'à son seul bénéfice annuel. La structuration et les émetteurs éligibles varient selon la juridiction et les statuts.",
        opportunities: [
          "Participation à la valeur des actifs de l'émetteur",
          'Peut être structuré pour de plus petits émetteurs lorsque les statuts le permettent',
        ],
        risks: [
          "La forme juridique et la protection de l'investisseur varient fortement selon la juridiction",
          "Peut impliquer un fiduciaire ou un véhicule entre l'investisseur et l'émetteur",
          'Généralement illiquide',
        ],
        suitableFor: "Investisseurs à l'aise avec des structures sur mesure, qui lisent d'abord les conditions exactes du contrat.",
      },
      {
        id: 'share',
        label: 'Action',
        subtypeOf: '',
        note: "Une augmentation de capital est l'opération sociétaire qui crée de nouvelles actions ; ce n'est pas un instrument séparé.",
        group: 'participation',
        seniorityStates: [] as string[],
        summary:
          "Capitaux propres directs de la société émettrice : droit aux dividendes et participation à la valeur de l'entreprise, avec des droits fixés par les statuts. Les nouvelles actions parviennent aux investisseurs via une augmentation de capital.",
        opportunities: ["Participation pleine à la croissance de l'entreprise", "Droits de vote ou d'information selon la classe d'actions"],
        risks: [
          'Aucun droit de remboursement fixe ; les dividendes ne sont pas garantis',
          'Perte totale possible',
          'Les actions de crowdfunding ne sont généralement pas négociables en bourse',
        ],
        suitableFor: 'Investisseurs à horizon long qui veulent la propriété et acceptent le risque entrepreneurial plein.',
      },
      {
        id: 'indirect-participation',
        label: 'Participation indirecte',
        subtypeOf: '',
        note: "Une structure de détention, pas un instrument distinct : l'investisseur détient la participation sous-jacente via un véhicule ou un fiduciaire, et l'intérêt sous-jacent décide de l'économie.",
        group: 'participation',
        seniorityStates: [] as string[],
        summary:
          'Les investisseurs participent indirectement à un investissement dans une PME - par exemple via un véhicule ou un fiduciaire - avec un traitement simplifié.',
        opportunities: ['Accès à des opérations difficiles à détenir directement', 'Administration simplifiée via la structure intermédiaire'],
        risks: [
          "Une couche supplémentaire entre l'investisseur et l'émetteur",
          "Le rendement dépend de la performance de l'émetteur",
          'Les conditions du véhicule régissent les paiements et la sortie',
        ],
        suitableFor: "Investisseurs qui veulent l'économie de la participation sans détenir directement l'intérêt sous-jacent.",
      },
      {
        id: 'limited-partnership',
        label: 'Part de société en commandite',
        subtypeOf: '',
        note: '',
        group: 'participation',
        seniorityStates: [] as string[],
        summary:
          "Une part de commanditaire dans une société de personnes : participation aux bénéfices et aux pertes selon le contrat de société, responsabilité limitée à l'apport.",
        opportunities: ['Transmission directe des résultats de la société', "Responsabilité plafonnée à l'apport"],
        risks: [
          'La participation aux pertes peut réduire ou annuler la part',
          'La sortie est souvent restreinte par le contrat de société',
          'Les obligations fiscales et de reporting peuvent être plus lourdes',
        ],
        suitableFor: 'Investisseurs qui comprennent les structures de sociétés de personnes et acceptent le risque entrepreneurial.',
      },
      {
        id: 'loan',
        label: 'Prêt',
        subtypeOf: '',
        note: '',
        group: 'debt',
        seniorityStates: ['senior', 'subordinated', 'unspecified'],
        summary:
          "Un prêt direct à l'émetteur avec un taux d'intérêt et un calendrier de remboursement définis. La même catégorie mère de prêt peut être senior, subordonnée (y compris des variantes participatives aux bénéfices) ou laisser la seniorité non spécifiée.",
        opportunities: [
          'Un calendrier fixe est plus facile à modéliser que des capitaux propres',
          'Les variantes subordonnées paient un intérêt plus élevé en échange du rang inférieur',
        ],
        risks: [
          "Le défaut de l'émetteur peut signifier une perte totale",
          "Les créances subordonnées ne sont payées qu'après les créanciers seniors en cas d'insolvabilité",
          'Aucune garantie de dépôts',
        ],
        suitableFor: 'Investisseurs qui acceptent le risque de crédit sans protection bancaire.',
      },
      {
        id: 'bond',
        label: 'Obligation',
        subtypeOf: '',
        note: '',
        group: 'debt',
        seniorityStates: ['senior', 'subordinated', 'unspecified'],
        summary:
          'Un instrument de dette titrisé avec coupon et durée définis. Émise en senior (non subordonnée), subordonnée (y compris obligations qualifiées explicitement subordonnées et Mini Bonds subordonnés) ou avec seniorité non spécifiée.',
        opportunities: [
          'Coupon et calendrier de remboursement définis',
          "Les émissions senior ont priorité sur le capital subordonné et les capitaux propres en cas d'insolvabilité",
        ],
        risks: [
          "La subordination augmente la gravité de la perte en cas d'insolvabilité",
          'Reste non garantie sauf si une sûreté est indiquée',
          "Pas de participation à la croissance de l'entreprise",
        ],
        suitableFor: "Investisseurs orientés rendement qui supportent une perte totale et n'ont pas besoin du capital avant l'échéance.",
      },
    ],
    overlays: [
      {
        id: 'zero-coupon',
        label: 'Zéro-coupon (Zero Bond)',
        summary:
          "Une structure de coupon sur un prêt ou une obligation, pas une seniorité : pas d'intérêts périodiques ; le rendement vient de l'émission sous la valeur nominale et du remboursement au pair. Se combine avec une catégorie mère de dette, n'existe jamais seule.",
      },
      {
        id: 'convertible',
        label: 'Convertible',
        summary:
          "Une clause de conversion sur une obligation : selon les conditions configurées (événement déclencheur, fenêtre d'exercice, prix de conversion, règles d'arrêt des intérêts), l'obligation se convertit en actions. Se combine avec la catégorie mère obligation, n'existe jamais seule.",
      },
    ],
    qualifiers: [
      {
        id: 'junior',
        label: '« Junior »',
        summary:
          "Une étiquette de rang inférieur dans la terminologie des plateformes. Elle indique un rang subordonné mais n'établit pas à elle seule une subordination qualifiée contractuelle.",
      },
      {
        id: 'qualified',
        label: '« Qualifiée / qualifiziert »',
        summary:
          'Terminologie de plateformes rencontrée sur des prêts et obligations. Sur les obligations, ne la lisez pas comme subordination qualifiée sauf si les conditions elles-mêmes disent subordonnée.',
      },
      {
        id: 'mini-bond',
        label: '« Mini Bond »',
        summary: 'Étiquette de plateforme pour une obligation de faible valeur unitaire.',
      },
    ],
    chipZeroCoupon: 'Zéro-coupon',
    chipConvertible: 'Convertible',
    chipSenior: 'Senior',
    chipSubordinated: 'Subordonnée',
    chipUnspecifiedSuffix: '(seniorité non spécifiée)',
    composeChip: (parts: string[], base: string) => (parts.length > 0 ? `${parts.join(' ')} ${base.toLowerCase()}` : base),
  },
  glossary: [
    {
      term: 'Financement tout-ou-rien',
      definition:
        "L'émetteur ne reçoit les fonds que si l'objectif est atteint dans les délais ; sinon, les contributions sont restituées. Le contrat Soroban de ce prototype l'applique on-chain.",
    },
    {
      term: 'Seuil de financement',
      definition: "Le montant minimum qu'une émission doit lever pour être bouclée. Distinct de l'investissement minimum par investisseur.",
    },
    {
      term: 'Investissement minimum',
      definition: 'Le plus petit montant qu\u2019un investisseur peut souscrire, généralement une unité.',
    },
    {
      term: 'Subordination',
      definition:
        "Une règle de rang : les créances subordonnées ne sont payées qu'après les créanciers seniors en cas d'insolvabilité, ce qui augmente le risque de perte.",
    },
    {
      term: 'ISIN',
      definition: "Numéro international d'identification des titres. Identifie un titre. Ce prototype n'émet ni titres ni ISIN.",
    },
    {
      term: "Fiche d'information fondamentale (KIIS)",
      definition: "Un document court standardisé avec les faits et risques clés d'une offre, exigé pour de nombreuses offres de crowdfunding dans l'UE.",
    },
    {
      term: 'Délai de réflexion',
      definition:
        "Une fenêtre après une offre d'investissement pendant laquelle certains investisseurs peuvent révoquer gratuitement lorsque le régime applicable l'exige. La durée et l'applicabilité dépendent de la classe de l'investisseur et du régime.",
    },
    {
      term: 'Test de connaissances',
      definition:
        "Une vérification de la compréhension des risques du crowdfunding par l'investisseur, exigée par certains régimes avant que des investisseurs non avertis puissent investir.",
    },
    {
      term: 'Simulation de capacité à supporter des pertes',
      definition:
        "Une estimation de la capacité de l'investisseur à supporter la perte de l'investissement, exigée par certains régimes pour les investisseurs non avertis.",
    },
    {
      term: 'ECSPR',
      definition:
        "Règlement (UE) 2020/1503 sur les prestataires européens de services de financement participatif. Les prestataires agréés figurent dans le registre de l'AEMF. Ce prototype n'est pas un prestataire agréé.",
    },
    {
      term: 'Séquestre (escrow)',
      definition:
        "Fonds détenus par un mécanisme neutre jusqu'à ce que les conditions soient remplies. Ici, le contrat de la campagne lui-même conserve les contributions en séquestre sur le testnet Stellar.",
    },
    {
      term: 'Soroban',
      definition: 'La plateforme de contrats intelligents du réseau Stellar utilisée par ce prototype.',
    },
    {
      term: 'Testnet',
      definition: 'Un réseau de test public avec des actifs sans valeur, utilisé pour essayer des logiciels sans argent réel.',
    },
    {
      term: 'Valeur nominale',
      definition: "La valeur faciale d'une unité d'un instrument, sur laquelle se calculent intérêts et remboursement.",
    },
    {
      term: 'Remboursement in fine',
      definition: "Remboursement du montant nominal total en un seul paiement à l'échéance.",
    },
    {
      term: 'act/act, 30E/360',
      definition: 'Conventions de décompte des jours qui définissent comment les intérêts courent entre les dates de paiement.',
    },
    {
      term: 'Obligation zéro-coupon (Zero Bond)',
      definition:
        'Une obligation sans intérêts périodiques : elle est émise sous sa valeur nominale et remboursée au pair, donc le rendement est la différence. Une structure de coupon, pas une seniorité.',
    },
    {
      term: 'Obligation convertible',
      definition:
        "Une obligation avec clause de conversion : selon les conditions de l'émission (déclencheur, fenêtre, prix de conversion), elle peut se convertir en actions. Une superposition de structure sur une obligation, pas un instrument autonome.",
    },
    {
      term: 'Dette junior',
      definition:
        "Terminologie de plateformes pour une créance de rang inférieur. Elle indique un rang subordonné mais n'établit pas à elle seule une subordination qualifiée contractuelle.",
    },
    {
      term: 'Subordination qualifiée',
      definition:
        "Une forme contractuelle de subordination selon laquelle les intérêts et parfois les paiements de principal cessent lorsque l'émetteur deviendrait surendetté. Une terminologie de plateforme comme « qualifiée » à elle seule ne la prouve pas ; les conditions doivent dire subordonnée.",
    },
    {
      term: 'Mini Bond',
      definition: 'Étiquette de plateforme pour une obligation de faible valeur unitaire.',
    },
    {
      term: 'Know your customer (KYC)',
      definition:
        "Vérification d'identité que les plateformes régulées doivent compléter avant qu'un investisseur puisse investir. Ce prototype n'effectue aucun KYC.",
    },
    {
      term: 'Personne politiquement exposée (PPE)',
      definition: 'Une personne exerçant des fonctions publiques importantes, soumise à des vérifications renforcées selon les règles antiblanchiment.',
    },
    {
      term: 'Coffre numérique',
      definition:
        "Une vue de conservation où la plateforme montre à l'investisseur les titres qu'il détient, liée à son identité vérifiée. Ce prototype conserve les positions dans le contrat de la campagne lui-même, visibles par portefeuille.",
    },
  ],
  faq: {
    stateLabels: {
      live: 'Existe dans le prototype',
      planned: 'Planifié - non construit',
      info: 'Contexte général',
    },
    categories: [
      {
        id: 'about',
        title: 'À propos de cette plateforme',
        entries: [
          {
            q: "Est-ce une vraie plateforme d'investissement ?",
            a: "Non. C'est un prototype technique sur le testnet Stellar. Il ne liste aucune offre réelle, n'accepte aucun fonds réel et n'est pas un prestataire de services de crowdfunding agréé. Les prestataires agréés dans l'UE figurent dans le registre de l'AEMF.",
            state: 'info',
          },
          {
            q: "Que faut-il pour l'essayer ?",
            a: "Installez l'extension de portefeuille Freighter, passez-la en testnet, alimentez-la avec du XLM et de l'USDC de testnet gratuits depuis un faucet ou un ami, puis connectez-la ici. Les actifs de testnet sont sans valeur.",
            state: 'live',
          },
          {
            q: 'Ai-je besoin de mon propre portefeuille ?',
            a: "Oui. Cette conception garde les clés chez l'utilisateur : le portefeuille Freighter est la seule identité et signe chaque transaction. La plateforme ne détient ni clés ni soldes propres. Certaines plateformes en production conservent les actifs via des partenaires spécialisés ; ce prototype ne le fait délibérément pas.",
            state: 'live',
          },
          {
            q: 'Qui peut investir sur une plateforme comme celle-ci en production ?',
            a: "Une plateforme en production doit vérifier l'identité de chaque investisseur (KYC) et, lorsque le régime l'exige, tester les connaissances et simuler la capacité à supporter des pertes avant des montants plus importants. Des restrictions de résidence peuvent aussi s'appliquer. Rien de tout cela n'existe ici, car les fonds de testnet sont sans valeur.",
            state: 'info',
          },
        ],
      },
      {
        id: 'contributing',
        title: 'Contribuer et paiements',
        entries: [
          {
            q: 'Comment fonctionne une contribution ?',
            a: "Vous choisissez une campagne, saisissez un montant et signez une transaction dans Freighter. Le contrat Soroban place votre contribution en séquestre et applique le plafond de financement de façon atomique. L'application conserve la transaction signée exacte pour qu'une erreur réseau ne crée jamais de doublon.",
            state: 'live',
          },
          {
            q: 'Quels moyens de paiement puis-je utiliser ?',
            a: "Uniquement de l'USDC de testnet envoyé via votre portefeuille Freighter. Pas de cartes, pas de virements bancaires, aucune monnaie fiduciaire. Une version en production règlerait via un prestataire de paiement agréé avec une référence par investissement ; cette étape est planifiée, pas construite.",
            state: 'live',
          },
          {
            q: 'Puis-je contribuer plusieurs fois à la même campagne ?',
            a: "Oui. Chaque contribution est sa propre transaction signée, et le contrat vérifie l'espace restant sous le plafond à chacune. Un montant qui ferait dépasser l'objectif est rejeté par le contrat, pas par la comptabilité de la plateforme.",
            state: 'live',
          },
          {
            q: 'Que se passe-t-il quand une campagne atteint son objectif ?',
            a: "Le plafond est appliqué par le contrat, donc pas de sursouscription : une fois l'objectif atteint, les contributions suivantes sont rejetées. Passé le délai, le créateur de la campagne peut retirer les fonds en séquestre.",
            state: 'live',
          },
          {
            q: 'Comment vérifier que ma contribution est passée ?',
            a: 'Connectez votre portefeuille et ouvrez la page de la campagne pour voir les totaux en séquestre rapportés par le contrat. Comme le règlement est une transaction sur le testnet Stellar, vous pouvez aussi la vérifier indépendamment sur un explorateur public de testnet.',
            state: 'live',
          },
        ],
      },
      {
        id: 'refunds',
        title: 'Remboursements et annulation',
        entries: [
          {
            q: 'Comment fonctionnent les remboursements ?',
            a: "Si une campagne n'atteint pas son objectif dans les délais, chaque contributeur signe sa propre transaction de remboursement. Si l'objectif est atteint, seul le créateur de la campagne peut retirer, et seulement après le délai.",
            state: 'live',
          },
          {
            q: 'Puis-je annuler une contribution après signature ?',
            a: "Pas dans ce prototype : une transaction de testnet signée est définitive. L'annulation est une étape planifiée. À titre de comparaison, le régime européen de crowdfunding donne aux investisseurs non avertis un délai de réflexion de 4 jours calendaires pour se rétracter d'une offre ferme sur une vraie plateforme.",
            state: 'planned',
          },
          {
            q: 'Qui détient les fonds pendant la campagne ?',
            a: "Le contrat Soroban lui-même conserve les contributions en séquestre jusqu'au délai. Aucun compte opérateur ne peut les déplacer : le code n'autorise qu'un retrait par le créateur après un délai réussi, ou des remboursements aux contributeurs après un délai échoué.",
            state: 'live',
          },
        ],
      },
      {
        id: 'tokenization',
        title: 'Tokenisation sur Stellar',
        entries: [
          {
            q: 'Que signifie la tokenisation ici ?',
            a: "La tokenisation signifie représenter numériquement les droits et obligations d'un investissement, afin que la propriété et les transferts puissent être enregistrés et vérifiés sur un registre partagé. Ce prototype fait un premier pas : les registres de contribution vivent dans un contrat intelligent Soroban sur le réseau de test Stellar, appliqués par du code plutôt que par la comptabilité de la plateforme.",
            state: 'info',
          },
          {
            q: 'Que fait exactement le contrat intelligent ?',
            a: "Le séquestre des contributions, le plafond de financement à chaque transaction, le délai de la campagne, le règlement tout-ou-rien (retrait par le créateur uniquement après un délai réussi) et les remboursements signés par les contributeurs après un délai échoué. Ce qu'il ne fait pas est couvert par les étapes planifiées de la page Fonctionnement.",
            state: 'live',
          },
          {
            q: 'Y a-t-il un token négociable ?',
            a: 'Non. Les soldes de contribution dans ce premier contrat sont délibérément incessibles. Un token de titre négociable nécessiterait un registre légalement reconnu, des détenteurs vérifiés et la surface de conformité décrite dans les documents du projet avant de pouvoir représenter un investissement réel.',
            state: 'planned',
          },
          {
            q: 'Où mes contributions sont-elles conservées ?',
            a: "Dans le séquestre du contrat sur le réseau de test public, pas chez l'opérateur de la plateforme. Les clés de votre portefeuille restent dans Freighter sur votre propre appareil ; les perdre ferait perdre l'accès au registre de contribution, exactement comme toute configuration d'autoconservation.",
            state: 'live',
          },
        ],
      },
      {
        id: 'risks',
        title: 'Risques et éligibilité',
        entries: [
          {
            q: 'Quels sont les risques du crowdfunding réel ?',
            a: "La perte totale est possible, les investissements sont illiquides et aucune garantie de dépôts ne s'applique. Une règle pratique courante est de n'investir qu'une petite part des fonds librement disponibles et de diversifier. La page des avertissements de risque couvre cela en détail.",
            state: 'info',
          },
          {
            q: 'Pourquoi les investisseurs devraient-ils diversifier ?',
            a: "Répartir l'argent entre plusieurs projets, secteurs et types d'instruments réduit l'impact quand un projet échoue. Tout concentrer sur une seule offre fait dépendre le résultat d'une seule entreprise.",
            state: 'info',
          },
          {
            q: 'Cette plateforme est-elle régulée ?',
            a: "Non. Ce n'est pas un prestataire de services de crowdfunding agréé et elle ne liste aucune offre réelle. Dans l'UE, les prestataires de crowdfunding sont agréés sous le régime ECSPR et listés dans le registre public de l'AEMF, lié en pied de page de chaque page.",
            state: 'info',
          },
        ],
      },
      {
        id: 'transfers',
        title: 'Transferts et vente',
        entries: [
          {
            q: 'Puis-je vendre, offrir ou transférer une contribution ?',
            a: "Non. Les registres de contribution dans ce prototype sont incessibles par conception. Sur les plateformes en production, les transferts dépendent des conditions contractuelles de chaque instrument, nécessitent souvent le consentement de l'émetteur et exigent toujours que le destinataire soit identifié. Il n'y a pas de marché secondaire ici.",
            state: 'live',
          },
          {
            q: 'Les transferts seront-ils possibles plus tard ?',
            a: "Les transferts entre utilisateurs vérifiés, et éventuellement un marché de type babillard, sont des étapes de conception planifiées. Ils nécessitent d'abord une vérification d'identité et des règles contractuelles par instrument, et rien de tout cela n'existe dans le code aujourd'hui.",
            state: 'planned',
          },
        ],
      },
      {
        id: 'account',
        title: 'Compte et données',
        entries: [
          {
            q: 'Ai-je besoin d\u2019un compte ?',
            a: "Pas d'inscription par email et pas de mot de passe. Une connexion communautaire optionnelle prouve le contrôle de votre portefeuille Freighter en signant un défi unique. Le portefeuille est la seule identité, et le connecter ou signer ne partage jamais vos clés avec le site.",
            state: 'live',
          },
          {
            q: 'Quelles données personnelles ce prototype collecte-t-il ?',
            a: "Uniquement ce que les fonctions communautaires stockent si vous les utilisez : votre clé publique Stellar, un nom d'affichage optionnel, et les commentaires, tickets de support ou candidatures d'émetteur que vous soumettez (les candidatures peuvent inclure un email de contact optionnel). Les commentaires sont publics. Aucun nom complet ni document d'identité n'est demandé. Votre navigateur garde un enregistrement local d'une transaction en cours pour éviter les doublons, et le backend conserve un journal technique des requêtes ; la Politique de confidentialité détaille stockage et durées de conservation. Une plateforme en production devrait respecter les obligations du RGPD : accès, rectification, effacement et portabilité de vos données.",
            state: 'live',
          },
        ],
      },
      {
        id: 'documents',
        title: 'Documents et impôts',
        entries: [
          {
            q: 'Où sont mes documents contractuels et reçus ?',
            a: "Nulle part pour l'instant : l'hébergement de documents et un portefeuille personnel sont des étapes planifiées. Une plateforme en production conserve les documents contractuels par investissement et émet une confirmation une fois l'investissement conclu.",
            state: 'planned',
          },
          {
            q: 'Les impôts sont-ils déduits des rendements ?',
            a: "Ce prototype ne verse aucun rendement, donc rien n'est imposé ni retenu. Sur les vraies plateformes, le traitement dépend de votre pays de résidence, de l'instrument et du pays de l'émetteur ; certains prestataires retiennent l'impôt ou émettent des attestations annuelles, et l'investisseur reste responsable de la déclaration correcte.",
            state: 'info',
          },
        ],
      },
      {
        id: 'issuers',
        title: 'Pour les entreprises',
        entries: [
          {
            q: "Puis-je lister mon entreprise aujourd'hui ?",
            a: "Vous pouvez soumettre une candidature d'émetteur depuis la page Financement ; l'opérateur examine les candidatures hors plateforme et rien n'est coté automatiquement. Le registre des campagnes ne contient actuellement que la campagne de démonstration.",
            state: 'planned',
          },
          {
            q: 'Quels modèles de financement la conception couvre-t-elle ?',
            a: 'Quatre catégories mères du côté de la participation - droit / certificat participatif (avec le Substanzgenussrecht comme sous-type), action, participation indirecte comme structure de détention et part de société en commandite - et deux catégories mères de dette, prêt et obligation, chacune émise en senior, subordonnée ou avec seniorité non spécifiée. Zéro-coupon et convertible sont des superpositions de structure sur la dette. Le hub Apprendre explique chacune.',
            state: 'info',
          },
          {
            q: 'Comment un émetteur recevrait-il les fonds ?',
            a: "Tout-ou-rien : le créateur de la campagne ne peut retirer les fonds en séquestre que si l'objectif est atteint, et seulement après le délai. La règle est appliquée par le contrat intelligent, pas par une promesse de la plateforme.",
            state: 'live',
          },
          {
            q: 'Que faudrait-il pour un lancement réel ?',
            a: "Une voie d'agrément (autorisation propre ou partenariat avec un prestataire agréé), un registre légalement reconnu pour chaque instrument et juridiction, un traitement des paiements via un prestataire agréé, KYC/AML et les pages et documents de conformité décrits dans les documents du projet. Ce sont des décisions ouvertes, pas des fonctionnalités implémentées.",
            state: 'info',
          },
          {
            q: 'Combien ça coûte ?',
            a: "Le prototype fonctionne sur un hébergement gratuit et une infrastructure de testnet. Aucun modèle de frais pour les émetteurs ou investisseurs n'est défini ni facturé.",
            state: 'info',
          },
        ],
      },
    ],
  },
  profiles: {
    sampleMarker: "Données d'exemple - pas une offre réelle",
    list: [
      {
        campaignId: 'fixture-lisbon-riverside',
        issuer: "Riverside Development Lda (émetteur d'exemple)",
        country: 'PT',
        category: 'Construction',
        teaser:
          "Réhabilitation d'un immeuble d'appartements au bord du fleuve à Lisbonne, financée par une obligation senior à taux fixe. Toutes les conditions de cette page sont des données d'exemple.",
        instrumentClass: 'bond',
        instrumentSeniority: 'senior',
        instrumentOverlays: [] as string[],
        interestRate: '6,5% par an (exemple)',
        term: "Jusqu'au 2030-12-31 (exemple)",
        minInvestment: '250 USDC de testnet (exemple)',
        additionalInfo: [
          {
            label: "Produit d'investissement",
            value: "Obligation senior (non subordonnée, non garantie). Données d'exemple - pas une offre réelle",
          },
          {
            label: 'ISIN / WKN',
            value: "Non émis - ce prototype n'émet aucun identifiant de titres",
          },
          {
            label: 'Montant nominal par unité',
            value: '250 USDC de testnet (exemple)',
          },
          { label: 'Souscription minimale', value: '1 unité (exemple)' },
          {
            label: 'Seuil de financement',
            value: "Égal à l'objectif de la campagne ; tout-ou-rien appliqué par le contrat en mode réel",
          },
          {
            label: "Volume de l'émission",
            value: 'Objectif de 250 000 USDC de testnet (exemple)',
          },
          { label: 'Calcul des intérêts', value: '30E/360 (exemple)' },
          {
            label: 'Dates de paiement des intérêts',
            value: 'Annuellement le 31 décembre, premier paiement en 2027 (exemple)',
          },
          { label: 'Remboursement', value: "À l'échéance (exemple)" },
          {
            label: 'Offert en',
            value: "Aucun pays d'offre - données d'exemple uniquement",
          },
          {
            label: 'Intermédiaire',
            value: "Aucun. Ce prototype n'est pas un prestataire de services de crowdfunding",
          },
        ],
        overview: [
          "Ce panneau montre comment le contenu marketing fourni par l'émetteur est séparé des faits de la plateforme par le séparateur ci-dessus.",
          "Données d'exemple - pas une offre réelle. La description de l'émetteur, l'équipe, le modèle économique et les finances affichés sur une vraie plateforme seraient fournis par l'émetteur et clairement attribués.",
        ],
        documents: [
          {
            label: "Fiche d'information fondamentale (entrée d'exemple)",
            note: 'Aucun fichier hébergé dans ce prototype',
          },
          {
            label: "Conditions de l'obligation (entrée d'exemple)",
            note: 'Aucun fichier hébergé dans ce prototype',
          },
          {
            label: "Pitch deck (entrée d'exemple)",
            note: 'Aucun fichier hébergé dans ce prototype',
          },
        ],
        news: [
          {
            date: 'Exemple',
            text: 'Les actualités de la campagne apparaîtraient ici. Cette entrée est un espace réservé, pas une vraie actualité.',
          },
        ],
      },
      {
        campaignId: 'fixture-alentejo-solar',
        issuer: "Alentejo Solar Cooperative (émetteur d'exemple)",
        country: 'PT',
        category: 'Énergie et services publics',
        teaser:
          "Installation solaire communautaire dans l'Alentejo, financée par une obligation subordonnée avec variante d'intérêts en numéraire. Toutes les conditions de cette page sont des données d'exemple.",
        instrumentClass: 'bond',
        instrumentSeniority: 'subordinated',
        instrumentOverlays: [] as string[],
        interestRate: '7,0% par an en numéraire (exemple)',
        term: "Jusqu'au 2032-06-30 (exemple)",
        minInvestment: '250 USDC de testnet (exemple)',
        additionalInfo: [
          {
            label: "Produit d'investissement",
            value: "Obligation subordonnée. Données d'exemple - pas une offre réelle",
          },
          {
            label: 'ISIN / WKN',
            value: "Non émis - ce prototype n'émet aucun identifiant de titres",
          },
          {
            label: 'Montant nominal par unité',
            value: '250 USDC de testnet (exemple)',
          },
          {
            label: 'Seuil de financement',
            value: 'Objectif de 900 000 USDC de testnet (exemple) ; tout-ou-rien en mode réel',
          },
          {
            label: 'Subordination',
            value: "Les créances passent après les créanciers seniors en cas d'insolvabilité (conditions d'exemple)",
          },
          { label: 'Calcul des intérêts', value: 'act/act (exemple)' },
          {
            label: 'Dates de paiement des intérêts',
            value: 'Annuellement le 30 juin, premier paiement en 2028 (exemple)',
          },
          { label: 'Remboursement', value: "À l'échéance (exemple)" },
          {
            label: 'Offert en',
            value: "Aucun pays d'offre - données d'exemple uniquement",
          },
          {
            label: 'Intermédiaire',
            value: "Aucun. Ce prototype n'est pas un prestataire de services de crowdfunding",
          },
        ],
        overview: [
          "Données d'exemple - pas une offre réelle. Une vraie page de campagne porterait la description de la coopérative, du site et de la vente d'énergie par l'émetteur lui-même.",
        ],
        documents: [
          {
            label: "Fiche d'information fondamentale (entrée d'exemple)",
            note: 'Aucun fichier hébergé dans ce prototype',
          },
          {
            label: "Conditions d'émission (entrée d'exemple)",
            note: 'Aucun fichier hébergé dans ce prototype',
          },
        ],
        news: [] as { date: string; text: string }[],
      },
      {
        campaignId: 'fixture-porto-logistics',
        issuer: "Porto Logistics Hub SA (émetteur d'exemple)",
        country: 'PT',
        category: 'Transport et logistique',
        teaser:
          "Étude de tokenisation pour un hub logistique près de Porto, structurée comme obligation convertible. Cet exemple montre une campagne terminée. Toutes les conditions sont des données d'exemple.",
        instrumentClass: 'bond',
        instrumentSeniority: 'unspecified',
        instrumentOverlays: ['convertible'],
        interestRate: "8,0% par an jusqu'à la conversion (exemple)",
        term: "Jusqu'au 2031-12-31 (exemple)",
        minInvestment: '500 USDC de testnet (exemple)',
        additionalInfo: [
          {
            label: "Produit d'investissement",
            value:
              "Obligation avec clause de conversion (convertible) ; seniorité non spécifiée dans les conditions d'exemple. Données d'exemple - pas une offre réelle",
          },
          {
            label: 'ISIN / WKN',
            value: "Non émis - ce prototype n'émet aucun identifiant de titres",
          },
          {
            label: 'Montant nominal par unité',
            value: '500 USDC de testnet (exemple)',
          },
          {
            label: 'Seuil de financement',
            value: 'Objectif de 500 000 USDC de testnet (exemple)',
          },
          {
            label: 'Déclencheur de conversion',
            value: "Configurable par émission ; exemple : un événement de financement qualifié annoncé par l'émetteur",
          },
          {
            label: 'Fenêtre de conversion',
            value: "Configurable par émission ; exemple : 30 jours après l'annonce du déclencheur",
          },
          {
            label: 'Arrêt des intérêts',
            value: "Les intérêts courent jusqu'au jour de la conversion (exemple)",
          },
          {
            label: 'Remboursement si non convertie',
            value: "À l'échéance (exemple)",
          },
          {
            label: 'Offert en',
            value: "Aucun pays d'offre - données d'exemple uniquement",
          },
          {
            label: 'Intermédiaire',
            value: "Aucun. Ce prototype n'est pas un prestataire de services de crowdfunding",
          },
        ],
        overview: ["Données d'exemple - pas une offre réelle. Les campagnes terminées restent visibles avec leur statut final de financement, comme celle-ci."],
        documents: [
          {
            label: "Conditions de l'obligation convertible (entrée d'exemple)",
            note: 'Aucun fichier hébergé dans ce prototype',
          },
        ],
        news: [
          {
            date: 'Exemple',
            text: "Cette campagne s'est clôturée avec succès dans les données d'exemple. Les événements de l'émetteur post-financement seraient suivis séparément.",
          },
        ],
      },
    ],
  },
  contentPages: {
    eventsTitle: 'Événements',
    eventsIntro:
      "Soirées de pitch, rencontres d'investisseurs et webinaires. Cet environnement de démonstration présente les formats prévus; il n'y a aucun événement réel à réserver.",
    eventsLive: 'À venir',
    eventsPast: 'Passés',
    eventsEmptyLive: 'Aucun événement à venir dans cette démo.',
    eventsEmptyPast: 'Aucun événement passé pour le moment.',
    eventsFilterAll: 'Tous',
    eventsFormatsTitle: 'Formats prévus',
    eventsFormatPitch: 'Soirées de pitch',
    eventsFormatPitchDesc: 'Les émetteurs présentent leur projet en cinq minutes et répondent en direct aux questions des investisseurs.',
    eventsFormatLounge: "Rencontres d'investisseurs",
    eventsFormatLoungeDesc: 'Petites rencontres locales pour discuter du financement participatif et des campagnes en cours.',
    eventsFormatWebinar: 'Webinaires',
    eventsFormatWebinarDesc: 'Sessions en ligne sur les fonctionnalités de la plateforme, les instruments et les bases du risque.',
    eventsDemoNote: 'Page de démonstration: les dates, lieux et inscriptions apparaîtront ici lorsque la plateforme programmera de vrais événements.',
    blogTitle: 'Blog',
    blogIntro: 'Articles de fond sur le financement participatif, les instruments et la plateforme.',
    blogEmpty: 'Aucun article publié pour le moment.',
    blogDemoNote: 'Page de démonstration: les articles éditoriaux apparaîtront ici. Rien sur cette page ne constitue un conseil en investissement.',
    pressTitle: 'Presse',
    pressIntro: 'Communiqués de presse, contact médias et documents de presse.',
    pressContactLabel: 'Contact presse',
    pressKitLabel: 'Dossier de presse',
    pressKitNote: 'Le logo et les éléments de la marque seront proposés ici en téléchargement.',
    pressEmpty: 'Aucun communiqué de presse pour le moment.',
    pressDemoNote: "Page de démonstration: aucun communiqué n'a été publié; rien ici ne peut être cité comme une déclaration réelle de l'entreprise.",
    jobsTitle: 'Emplois',
    jobsIntro: 'Travailler sur la plateforme.',
    jobsEmpty: 'Aucun poste ouvert pour le moment.',
    jobsSpeculativeNote: 'Les candidatures spontanées ne sont pas collectées dans cette démo.',
    jobsDemoNote: "Page de démonstration: les postes publiés apparaîtront ici. Il n'y a actuellement aucun poste réel à pourvoir.",
  },
  tour: {
    tourTitle: 'Visite guidée de la campagne',
    tourStepOf: (current: number, total: number) => `Étape ${current} sur ${total}`,
    tourNext: 'Suivant',
    tourBack: 'Retour',
    tourDone: 'Terminer',
    tourSkip: 'Passer la visite',
    tourRepeat: 'Rejouer la visite',
    tourStepFundingTitle: 'État du financement',
    tourStepFundingBody: 'Montant collecté, objectif et temps restant. Le panneau se met à jour lorsque les contributions sont confirmées sur la chaîne.',
    tourStepTabsTitle: 'Détails et documents',
    tourStepTabsBody: "Vue d'ensemble, conditions et documents de la campagne comme les conditions d'émission et les fiches d'information.",
    tourStepRiskTitle: 'Avertissement sur les risques',
    tourStepRiskBody: "Chaque campagne peut perdre l'intégralité de sa valeur. Lisez les avertissements sur les risques avant d'investir.",
    tourStepNewsTitle: 'Actualités et questions',
    tourStepNewsBody: 'Mises à jour de la campagne et commentaires publics. Les actualités de démo sont toujours étiquetées platform-demo.',
  },
  categorisation: {
    catTitle: "Catégorisation de l'investisseur",
    catPrototypeNote: "Prototype non contraignant: ce test n'accorde ni ne restreint l'accès et n'est enregistré que dans ce navigateur.",
    catKnowledgeTitle: 'Test de connaissances',
    catKnowledgeIntro: 'Cinq questions courtes sur les risques du financement participatif.',
    catSubmit: 'Vérifier les réponses',
    catRetake: 'Refaire le test',
    catResultPass: 'Toutes les réponses sont correctes.',
    catResultReview: (n: number) => `${n} réponse(s) à revoir - lisez les explications et réessayez.`,
    catScoreLabel: (correct: number, total: number) => `${correct} sur ${total} correctes`,
    catSimTitle: 'Simulation de capacité à supporter une perte',
    catSimIntro: 'Comparez un investissement envisagé à vos fonds librement disponibles.',
    catAssetsLabel: 'Fonds librement disponibles (EUR)',
    catIncomeLabel: 'Revenu net mensuel (EUR)',
    catPlannedLabel: 'Investissement envisagé (EUR)',
    catSimRun: 'Lancer la simulation',
    catSimResult: ({ pct }: { pct: string }) => `Le montant prévu correspond à ${pct} % des fonds librement disponibles saisis.`,
    catSimNote:
      "Simple calcul arithmétique sur les montants saisis. Il ne s'agit pas d'une évaluation réglementaire de la capacité à supporter des pertes, d'adéquation ou d'éligibilité, et aucun seuil n'est appliqué.",
    catSavedNote: 'Résultat enregistré uniquement localement dans ce navigateur.',
    catQuestions: [
      {
        q: 'Quel est le maximum que vous pouvez perdre avec un investissement participatif?',
        options: ['Seulement les frais', "La totalité de l'investissement", "La moitié de l'investissement"],
        correct: 1,
        why: 'Les investissements participatifs peuvent perdre toute leur valeur (perte totale).',
      },
      {
        q: 'Avec quelle facilité pouvez-vous généralement revendre un investissement participatif?',
        options: ['À tout moment en bourse', 'En général pas du tout - il est illiquide', "Seulement en fin d'année"],
        correct: 1,
        why: "Il n'existe généralement pas de marché secondaire; prévoyez de conserver jusqu'à la fin du terme.",
      },
      {
        q: "Qui supporte la perte si l'entreprise émettrice fait faillite?",
        options: ['La plateforme', 'Le prestataire de paiement', "L'investisseur"],
        correct: 2,
        why: "L'investissement est un contrat avec l'émetteur; la plateforme ne couvre pas les pertes.",
      },
      {
        q: 'Que signifie la diversification?',
        options: ['Répartir son argent sur plusieurs investissements', 'Tout investir dans une seule campagne', 'Garder tout son argent en liquide'],
        correct: 0,
        why: "Répartir les investissements réduit l'impact d'une seule perte totale.",
      },
      {
        q: 'Les rendements des investissements participatifs sont-ils garantis?',
        options: ['Oui, par la loi', 'Oui, par la plateforme', 'Non'],
        correct: 2,
        why: "Les intérêts et le remboursement dépendent de l'émetteur; aucun rendement n'est garanti.",
      },
    ],
  },
  community: {
    loading: 'Chargement...',
    demoBadge: 'DEMO',
    documentsTitle: 'Documents',
    documentsNote:
      "Les documents marqués DEMO sont des modèles fictifs de ce prototype - ce ne sont ni des offres, ni des conseils, ni des informations vérifiées de l'émetteur.",
    documentKinds: {
      kiis: 'KIIS',
      terms: 'Conditions',
      project: 'Projet',
      other: 'Document',
    },
    newsTitle: 'Actualités',
    newsAuthorDemo: "publié par la plateforme (contenu de démonstration - aucune identité d'émetteur vérifiée)",
    commentsTitle: 'Commentaires',
    commentsEmpty: 'Aucun commentaire pour le moment.',
    commentLabel: 'Votre commentaire',
    commentSubmit: 'Publier le commentaire',
    commentPostingAs: (name: string) => `Publication en tant que ${name}. Les commentaires sont publics.`,
    commentsSignInHint: 'Connectez-vous avec votre portefeuille ci-dessous pour participer à la discussion.',
    signInTitle: 'Connexion à la communauté',
    signInExplainer:
      "Signez un défi unique avec votre portefeuille Freighter pour prouver que vous contrôlez l'adresse. Aucune transaction n'est créée et aucun fonds ne bouge. La session débloque les commentaires, les tickets de support et les candidatures d'émetteur.",
    signInButton: 'Se connecter avec le portefeuille',
    signInConnectFirst: "Connectez d'abord votre portefeuille Freighter (en haut de la page).",
    signedInTitle: 'Compte de la communauté',
    signedInAs: 'Connecté en tant que',
    displayNameLabel: "Nom d'affichage (visible sur vos commentaires)",
    displayNameSave: 'Enregistrer le nom',
    signOutButton: 'Se déconnecter',
    ticketsTitle: 'Support et feedback',
    ticketsNote:
      "Les tickets ne sont visibles que par votre compte de portefeuille et l'opérateur du site. Ceci est un prototype : n'incluez ni données personnelles, ni mots de passe, ni vraies informations de paiement.",
    ticketKindLabel: 'Type',
    ticketKinds: {
      support: 'Demande de support',
      feedback: 'Feedback',
    },
    ticketSubjectLabel: 'Sujet',
    ticketBodyLabel: 'Message',
    ticketSubmit: 'Envoyer',
    ticketsEmpty: 'Aucun ticket pour le moment.',
    ticketStatus: {
      open: 'Ouvert',
      closed: 'Fermé',
    },
    applicationTitle: 'Candidater comme émetteur',
    applicationNote:
      "Présentez à l'opérateur le projet que vous souhaitez lister. Envoyer ce formulaire n'est ni une offre, ni un listage, ni une approbation - cela ouvre une conversation. Environnement de démonstration : ne soumettez pas de vrais secrets commerciaux.",
    applicationFields: {
      projectName: 'Nom du projet',
      country: 'Pays',
      instrumentType: "Type d'instrument (p. ex. obligation, actions, partage de revenus)",
      targetAmount: 'Montant cible',
      description: 'Description du projet',
      contactEmail: 'Email de contact (optionnel)',
    },
    newsFeedTitle: 'Dernières actualités de la campagne',
    newsFeedEmpty: "Pas encore d'actualités sur la campagne.",
    myApplicationsTitle: "Mes candidatures d'émetteur",
    myApplicationsEmpty: 'Aucune candidature pour le moment.',
    applicationStatus: { received: 'Reçue', under_review: "À l'étude", closed: 'Clôturée' },
    myTicketsTitle: 'Mes tickets de support et feedback',
    myCommentsTitle: 'Mes commentaires',
    commentHidden: 'Masqué par la modération',
    applicationValidation: {
      required: 'Veuillez remplir ce champ.',
      emailInvalid: 'Saisissez une adresse e-mail valide.',
    },
    company: {
      title: "Comptes d'entreprise",
      note: "Demandez un compte d'entreprise lié à votre portefeuille. L'examen est manuel, comme pour les candidatures d'émetteur. Transparence de la démo : les informations de registre saisies sont déclaratives ; aucun extrait de registre ni pièce d'identité des propriétaires n'est téléversé ou vérifié dans ce prototype. Investir depuis un contexte d'entreprise est prévu et n'est pas actif ici.",
      listTitle: "Mes demandes d'entreprise",
      empty: "Aucune demande d'entreprise pour le moment.",
      formTitle: "Demander un compte d'entreprise",
      fields: {
        companyName: "Nom de l'entreprise",
        legalForm: 'Forme juridique (p. ex. SARL, SA)',
        registrationNumber: "Numéro d'immatriculation",
        country: "Pays d'immatriculation",
      },
      submit: 'Envoyer la demande',
      submitting: 'Envoi en cours...',
      submitted: "Demande reçue. Elle apparaît ci-dessus comme en attente d'examen.",
      status: { pending: "En attente d'examen", approved: 'Approuvée', rejected: 'Rejetée' },
    },
    security: {
      title: 'Sécurité',
      authMethodNote:
        "Vous vous connectez en signant un message avec votre portefeuille Stellar : le portefeuille fait office d'identifiant. Ce prototype n'a ni mot de passe ni application à double facteur.",
      sessionsTitle: 'Sessions actives',
      sessionLabel: 'Session',
      currentBadge: 'Cette session',
      createdLabel: 'Connexion',
      expiresLabel: 'Expire',
      revoke: 'Terminer la session',
      revokeOthers: 'Déconnecter toutes les autres sessions',
      revokedOthers: ({ count }: { count: number }) => `${count} ${count === 1 ? 'autre session terminée' : 'autres sessions terminées'}.`,
      empty: 'Aucune session active.',
    },
    notifications: {
      title: 'Notifications',
      empty: 'Aucune notification pour le moment.',
      markAllRead: 'Tout marquer comme lu',
      markRead: 'Marquer comme lue',
      kinds: {
        applicationReceived: "Candidature d'émetteur reçue",
        applicationStatus: "Mise à jour de la candidature d'émetteur",
        commentModerated: 'Commentaire masqué par la modération',
        ticketClosed: 'Ticket de support clôturé',
        companyReceived: "Demande de compte d'entreprise reçue",
        companyStatus: "Mise à jour de la demande de compte d'entreprise",
      },
      bodies: {
        applicationReceived: ({ projectName }: { projectName: string }) =>
          `Votre candidature d'émetteur pour "${projectName}" a été reçue. L'opérateur examine les candidatures manuellement ; la soumission n'est ni une approbation, ni une cotation, ni une offre.`,
        applicationStatus: ({ projectName, statusLabel }: { projectName: string; statusLabel: string }) =>
          `Votre candidature d'émetteur pour "${projectName}" est maintenant "${statusLabel}".`,
        commentModerated: ({ campaignId }: { campaignId: string }) => `Votre commentaire sur la campagne "${campaignId}" a été masqué par le modérateur.`,
        commentModeratedReason: ({ reason }: { reason: string }) => `Motif : ${reason}`,
        ticketClosed: ({ kindLabel, subject }: { kindLabel: string; subject: string }) => `Votre ticket (${kindLabel}) "${subject}" a été clôturé.`,
        companyReceived: ({ companyName }: { companyName: string }) =>
          `Votre demande de compte d'entreprise pour « ${companyName} » a bien été reçue. L'examen est manuel ; l'envoi ne vaut pas approbation.`,
        companyStatus: ({ companyName, statusLabel }: { companyName: string; statusLabel: string }) =>
          `Votre demande de compte d'entreprise pour « ${companyName} » est désormais « ${statusLabel} ».`,
      },
    },
    operator: {
      title: "Tableau de bord de l'opérateur",
      demoNote:
        "Outils d'opérateur de l'environnement de test. Les actualités sont toujours étiquetées comme contenu de démonstration de la plateforme ; il n'existe aucune identité d'émetteur vérifiée. Ne publiez aucune affirmation d'approbation, de cotation ou de rendement.",
      loadError: "Les données de l'opérateur n'ont pas pu être chargées.",
      retry: 'Réessayer',
      tabs: { applications: 'Candidatures', comments: 'Commentaires', tickets: 'Tickets', news: 'Actualités' },
      applicationsEmpty: "Aucune candidature d'émetteur pour le moment.",
      commentsEmpty: 'Aucun commentaire pour le moment.',
      ticketsEmpty: 'Aucun ticket pour le moment.',
      colProject: 'Projet',
      colCountry: 'Pays',
      colInstrument: 'Instrument',
      colTarget: 'Objectif',
      colSubmitted: 'Envoyé',
      colStatus: 'Statut',
      colActions: 'Actions',
      colCampaign: 'Campagne',
      colAuthor: 'Auteur',
      colComment: 'Commentaire',
      colPosted: 'Publié',
      colState: 'État',
      colKind: 'Type',
      colSubject: 'Sujet',
      colMessage: 'Message',
      colOpened: 'Ouvert',
      stateVisible: 'Visible',
      stateHidden: 'Masqué',
      markUnderReview: "Marquer en cours d'examen",
      closeApplication: 'Clôturer',
      reopenApplication: 'Rouvrir',
      statusUpdated: 'Statut mis à jour.',
      hide: 'Masquer',
      unhide: 'Afficher',
      hideReasonLabel: "Motif du masquage (facultatif, visible par l'auteur)",
      hideReasonPlaceholder: 'Motif de modération court',
      confirmHide: 'Confirmer le masquage',
      cancel: 'Annuler',
      closeTicket: 'Clôturer le ticket',
      closedNote: "La clôture notifie l'auteur et ne peut pas être annulée ici.",
      newsFormTitle: 'Publier une actualité de campagne',
      newsCampaignLabel: 'Campagne',
      newsTitleLabel: 'Titre',
      newsBodyLabel: 'Texte',
      newsSubmit: "Publier l'actualité",
      newsPosted: 'Actualité publiée.',
      newsValidation: 'Le titre et le texte sont obligatoires.',
      actionFailed: "L'action a échoué. Réessayez.",
    },
    applicationSubmit: 'Envoyer la candidature',
    applicationDone: "Candidature reçue. L'opérateur examine les candidatures hors du site ; rien n'est listé automatiquement.",
    feedbackTabLabel: 'Feedback',
    feedbackPanelTitle: 'Envoyer un feedback',
    feedbackPanelIntro:
      "Dites-nous ce qui fonctionne et ce qui ne fonctionne pas. Le feedback est enregistré comme un ticket de support visible uniquement par vous et l'opérateur.",
    feedbackSignInPrompt: 'Connectez-vous avec votre portefeuille pour envoyer un feedback.',
    feedbackSubmitted: 'Merci - votre feedback a été envoyé.',
    feedbackClose: 'Fermer',
  },
};
