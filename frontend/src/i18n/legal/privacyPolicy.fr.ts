import type { LegalBlock } from './types';

export const blocks: LegalBlock[] = [
  {
    t: 'notice',
    text: [
      "Avis de confidentialité du prototype sur testnet, mis à jour le 3 novembre 2026. Il décrit le traitement réel des données de compte ; il ne constitue ni un conseil juridique ni une preuve d'autorisation réglementaire. Aucune opération en argent réel n'est activée.",
    ],
  },
  {
    t: 'h2',
    text: ['1. Responsable et contact'],
  },
  {
    t: 'p',
    text: [
      "Nuno Ribeiro est le responsable du traitement des données personnelles traitées par le prototype Blockallisto sur testnet. Contact pour les demandes relatives à la vie privée : blockallisto@gmail.com. Blockallisto est un nom de projet, et non l'affirmation de l'existence d'une société immatriculée. Les coordonnées fictives de société figurant dans d'autres modèles juridiques DEMO n'identifient pas le responsable des données de compte.",
    ],
  },
  {
    t: 'h2',
    text: ['2. Données de compte et de communauté'],
  },
  {
    t: 'p',
    text: [
      "L'inscription par e-mail et mot de passe enregistre dans la base de données de la communauté votre adresse e-mail normalisée, un hachage de mot de passe scrypt salé, l'identifiant de compte, la langue d'e-mail préférée, l'état de vérification, des horodatages et des enregistrements de connexions échouées et de verrouillages. Nous ne stockons pas votre mot de passe en clair. Les jetons de vérification et de réinitialisation sont hachés et à usage unique : les liens de vérification expirent après 24 heures et les liens de réinitialisation après une heure. Un compte e-mail reçoit un identifiant interne de clé publique ; sa clé privée générée est supprimée. Cela ne lui donne pas un portefeuille capable de signer des transactions blockchain.",
    ],
  },
  {
    t: 'p',
    text: [
      "La connexion par portefeuille reste facultative et utilise un défi signé à usage unique, valable cinq minutes. Lorsqu'un fournisseur de connexion sociale est configuré, nous enregistrons son nom, l'identifiant stable du sujet, l'e-mail vérifié s'il est renvoyé et les horodatages de connexion ; nous ne fusionnons pas automatiquement les comptes par e-mail. La nouvelle inscription sociale peut rester restreinte séparément de l'inscription par e-mail et mot de passe. Votre e-mail n'est pas utilisé comme libellé d'auteur des commentaires publics.",
    ],
  },
  {
    t: 'p',
    text: [
      "Les jetons de session sont hachés côté serveur ; le navigateur conserve le jeton de session dans le stockage local. Les sessions durent jusqu'à 30 jours et peuvent être révoquées. Si vous activez un second facteur par application d'authentification, sa graine est chiffrée côté serveur et les codes de récupération sont stockés sous forme de hachages. La réinitialisation du mot de passe révoque les sessions et les tickets de connexion à second facteur en attente, mais ne supprime pas un second facteur déjà enregistré.",
    ],
  },
  {
    t: 'p',
    text: [
      "Les enregistrements de compte, les identifiants e-mail et les données facultatives du second facteur n'ont actuellement aucun délai automatique de suppression de compte. Les jetons expirés cessent de fonctionner à l'expiration, mais l'expiration ne garantit pas la suppression immédiate de leurs enregistrements. Il n'existe pas encore d'outil de suppression de compte en libre-service. Écrivez à blockallisto@gmail.com pour demander l'accès, la rectification ou la suppression ; les demandes sont examinées au regard des obligations de sécurité et légales. Les journaux et sauvegardes des fournisseurs peuvent avoir une conservation distincte.",
    ],
  },
  {
    t: 'p',
    text: [
      "Les commentaires (identifiant de clé publique, nom d'affichage facultatif, texte, campagne et horodatage) sont publics. Les 100 derniers par campagne sont affichés ; les commentaires masqués sont supprimés après 30 jours. Les tickets d'assistance et de retour, les candidatures d'émetteurs et les notifications sont privés pour le compte et les rôles d'opérateur autorisés, et sont supprimés après 90 jours selon les règles de nettoyage de l'application. Évitez les informations personnelles sensibles dans les champs de texte libre.",
    ],
  },
  {
    t: 'h2',
    text: ["3. Transactions de test et données d'appareil"],
  },
  {
    t: 'p',
    text: [
      "La connexion d'un portefeuille ou la préparation de contributions de test enregistre dans le journal de sécurité des clés publiques de portefeuille, des identifiants de campagne, des montants, des enveloppes de transaction, des hachages, un statut et des horodatages. Les préparations non signées expirent après 24 heures ; les transactions finales sont purgées après 30 jours. Les transactions signées non résolues sont conservées jusqu'à leur résolution et les enveloppes signées sont effacées après la finalité. Nous ne pouvons pas effacer les enregistrements publics du testnet Stellar. Les clés secrètes du portefeuille restent dans votre portefeuille.",
    ],
  },
  {
    t: 'p',
    text: [
      "Le thème, la langue et les choix de session utilisent le stockage local du navigateur. Les hébergeurs traitent les adresses IP et les métadonnées de requête. La limitation de débit de l'application et la mise en cache de la réputation IP utilisent des adresses IP en mémoire transitoire ; les diagnostics de l'application utilisent des compteurs agrégés plutôt que des journaux d'IP brutes. Les journaux d'infrastructure des fournisseurs et la conservation des sauvegardes sont distincts. Nous n'utilisons ni traceurs publicitaires ni listes de diffusion de newsletters.",
    ],
  },
  {
    t: 'h2',
    text: ['4. Services de sécurité et destinataires'],
  },
  {
    t: 'p',
    text: [
      "Render héberge l'application à Francfort et Neon héberge ses données Postgres. Brevo reçoit les adresses e-mail des destinataires et le contenu des e-mails de vérification et de réinitialisation, et traite des métadonnées de livraison. Cloudflare Turnstile traite des signaux du navigateur et de l'appareil ainsi que des jetons de défi pour les contrôles anti-robots ; la validation côté serveur peut inclure l'IP du client. Après un contrôle anti-robots réussi, ipapi.is reçoit l'IP du client pour évaluer sa réputation d'abus. La réputation est d'abord en simple observation ; le statut de VPN, de proxy ou de Tor ne suffit pas à justifier un blocage. Des erreurs des fournisseurs ou l'épuisement du budget de requêtes peuvent réduire cette couche ; le CAPTCHA, les limites de débit et les budgets d'e-mails sont des garde-fous distincts.",
    ],
  },
  {
    t: 'p',
    text: [
      "Lorsque la connexion sociale est activée, le fournisseur d'identité choisi traite cette authentification selon ses propres conditions. Le testnet Stellar est public et mondial. GitHub héberge le code source, pas la base de données des comptes. Les fournisseurs de sécurité et d'e-mail peuvent traiter des données hors de l'EEE ; ne supposez pas que tous les sous-traitants se trouvent uniquement dans l'UE. Leurs politiques actuelles et les garanties applicables régissent leur propre traitement : https://www.brevo.com/legal/privacypolicy/ ; https://www.cloudflare.com/privacypolicy/ ; https://ipapi.is/privacy.html ; https://ipapi.is/terms.html .",
    ],
  },
  {
    t: 'h2',
    text: ['5. Finalités et droits'],
  },
  {
    t: 'p',
    text: [
      "Les données servent à fournir les fonctions de compte et de communauté demandées du prototype, à vérifier l'accès au compte, à répondre aux demandes d'assistance et à protéger le service contre les abus. Ces finalités opérationnelles et de sécurité reposent sur les intérêts légitimes au titre de l'article 6, paragraphe 1, point f), du RGPD, sous réserve de vos droits et de l'analyse exigée par la loi. Cet avis ne certifie pas la conformité et ne remplace pas un examen juridique. Nous ne vendons pas les données de compte et ne les utilisons pas à des fins publicitaires.",
    ],
  },
  {
    t: 'p',
    text: [
      "Vous pouvez demander l'accès, la rectification, l'effacement, la limitation ou la portabilité, ou vous opposer au traitement, en écrivant à blockallisto@gmail.com. Vous pouvez introduire une réclamation auprès de la CNPD portugaise ou de votre autorité de contrôle compétente. Les enregistrements publics de la blockchain ne peuvent pas être supprimés par l'opérateur. Le prototype ne s'adresse pas aux enfants. La collecte de pièces d'identité et le KYC, les offres d'investissement réelles, les paiements en monnaie fiduciaire et les opérations en argent réel ne sont pas activés. Toute modification ultérieure nécessitera un nouvel avis avant le début de ce traitement.",
    ],
  },
];
