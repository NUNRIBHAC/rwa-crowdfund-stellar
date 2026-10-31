// Spanish (es-ES). Structure is compiler-checked against ./en;
// array lengths and ids are checked by i18n/parity.test.ts.
import type { Messages } from './en';

export const es: Messages = {
  meta: {
    title: 'Blockallisto - Activos reales. Posibilidades compartidas.',
    skipLink: 'Saltar al contenido principal',
  },
  nav: {
    ariaMain: 'Principal',
    home: 'Inicio',
    investments: 'Invertir',
    howItWorks: 'Cómo funciona',
    learn: 'Aprender',
    financing: 'Financiación',
    faq: 'FAQ',
    about: 'Acerca de',
    account: 'Mi cuenta',
  },
  header: {
    testnetBadge: 'Testnet de Stellar',
    connect: 'Conectar Freighter',
    connectedPrefix: 'Conectado',
    languageLabel: 'Idioma del sitio',
    themeToLight: 'Cambiar al tema claro',
    themeToDark: 'Cambiar al tema oscuro',
  },
  riskBanner:
    'Las inversiones en crowdfunding conllevan riesgo de pérdida total. Esto es un prototipo en la testnet de Stellar: sin ofertas reales, sin fondos reales, sin asesoramiento de inversión.',
  hero: {
    eyebrow: 'Activos del mundo real tokenizados, en Stellar',
    titleA: 'Activos reales.',
    titleB: 'Posibilidades compartidas.',
    sub: 'Blockallisto es crowdfunding todo-o-nada aplicado por un contrato Soroban: cada contribución queda en escrow en Stellar y la comprobación del límite de financiación se ejecuta en la misma transacción atómica. El creador solo retira los fondos si el objetivo se alcanza dentro del plazo; en caso contrario, cada contribuyente firma su propio reembolso. De Portugal para el mundo.',
    ctaBrowse: 'Ver campañas',
    ctaHow: 'Cómo funciona',
    noteStrong: 'Prototipo en la testnet de Stellar - sin fondos reales.',
    noteLive:
      'Cada campaña a continuación es un contrato Soroban real en la testnet de Stellar. No auditado, no listo para producción. Alojado en un plan gratuito: la primera solicitud tras inactividad puede tardar hasta un minuto mientras la instancia despierta.',
    noteSample: 'Las campañas a continuación son ejemplos (fixtures), no contratos desplegados. No auditado, no listo para producción.',
    noteUnknown: 'No auditado, no listo para producción.',
    unavailable:
      'No disponible en este prototipo: registro con identidad/KYC, negociación en mercado secundario, tokens de activos o de recibos transferibles, pagos en moneda fiduciaria, ofertas de inversión reales. Los registros de contribución son intransferibles - esto es crowdfunding, no una bolsa de inversión.',
    fundingBlockAria: 'Ilustración: pequeños bloques púrpura se deslizan uno a uno y completan el contorno de un activo compartido, token a token',
  },
  emptyState: {
    fixtureStrong: 'Vista previa de ejemplo activa.',
    fixtureText:
      'Las campañas a continuación son ejemplos para mostrar el diseño. No son contratos desplegados, no son ofertas reales y no pueden aceptar contribuciones.',
    fixtureBack: 'Volver al registro real',
    emptyTitle: 'Ninguna campaña desplegada configurada',
    emptyText:
      'Un operador debe desplegar y verificar el contrato revisado por separado y luego definir SOROBAN_CAMPAIGNS_JSON. El despliegue y la migración no se hacen aquí. Las campañas antiguas son de solo lectura y requieren reconciliación.',
    emptyCta: 'Vista previa con campañas de ejemplo',
  },
  home: {
    stepsAria: 'Cómo funciona la inversión',
    stepsTitle: '4 pasos para tu primera contribución',
    steps: [
      {
        title: 'Conectar',
        text: 'Conecta una cartera Freighter en la testnet de Stellar. El acceso a la comunidad es opcional y no necesita correo electrónico ni contraseña.',
      },
      {
        title: 'Descubrir',
        text: 'Explora las campañas y lee las condiciones estructuradas en la página de cada campaña.',
      },
      {
        title: 'Contribuir',
        text: 'Firma una transacción. El contrato pone tu contribución en escrow y aplica el límite de financiación de forma atómica.',
      },
      {
        title: 'Seguir',
        text: 'Sigue aquí el estado de la financiación. Los reembolsos los firma el contribuyente si el objetivo no se alcanza.',
      },
    ],
    fullJourneyLink: 'Recorrido completo del inversor, con cada paso marcado como existente o planeado',
    latestAria: 'Campañas más recientes',
    latestTitle: 'Campañas más recientes',
    allInvestments: 'Todas las inversiones',
    instrumentsAria: 'Clases de instrumentos',
    instrumentsTitle: 'Clases de instrumentos cubiertas por este diseño',
    instrumentsIntro:
      'El diseño de la plataforma cubre cuatro categorías madre del lado de la participación (derecho/certificado participativo - con el Substanzgenussrecht como subtipo - acción, participación indirecta como estructura de titularidad y participación en sociedad comanditaria) y dos categorías madre de deuda, préstamo y bono, cada una emitida como sénior, subordinada o con senioridad no especificada, más capas de estructura como cupón cero y convertible. Este prototipo implementa solo el escrow por contrato; las clases siguientes son educativas.',
    whyAria: 'Por qué esta plataforma',
    whyTitle: 'Por qué este enfoque',
    whyPoints: [
      'Reglas de financiación aplicadas por un contrato público, no por la contabilidad de la plataforma.',
      'Protección todo-o-nada: los contribuyentes firman su propio reembolso si el objetivo no se alcanza.',
      'Cada transacción es verificable en una red de pruebas pública.',
      'Diseño abierto: clases de instrumentos, recorrido del inversor y superficie de cumplimiento documentados en el repositorio.',
    ],
  },
  invest: {
    title: 'Todas las inversiones',
    noteFixture: 'Las campañas de ejemplo demuestran el diseño. No son contratos desplegados y no pueden aceptar contribuciones.',
    noteLive: 'Las campañas reales son contratos Soroban en la testnet de Stellar. Los activos de testnet no tienen valor.',
    refresh: 'Actualizar estado del contrato',
    searchPlaceholder: 'Buscar campañas por nombre o contrato',
    searchAria: 'Buscar campañas',
    filterStatusAria: 'Filtrar por estado',
    all: 'Todas',
    open: 'Abiertas',
    funded: 'Financiadas',
    underfunded: 'No financiadas',
    filterIndustryAria: 'Filtrar por sector',
    allIndustries: 'Todos los sectores',
    sortAria: 'Ordenar campañas',
    sortDeadline: 'Plazo más próximo',
    sortProgress: 'Más financiadas',
    sortName: 'Nombre A-Z',
    viewAria: 'Modo de vista',
    grid: 'Cuadrícula',
    list: 'Lista',
    noMatches: 'Ninguna campaña coincide con la búsqueda y los filtros actuales.',
    activeAria: 'Inversiones activas',
    activeTitle: 'Inversiones activas',
    completedAria: 'Inversiones completadas',
    completedTitle: 'Inversiones completadas',
  },
  card: {
    demo: 'Demo',
    statusFunded: 'Financiada',
    statusEnded: 'No financiada',
    statusOpen: 'Abierta',
    withdrawn: 'Retirado',
    fundedPct: (percent: number) => `${percent}% financiado`,
    progressUnavailable: 'Progreso no disponible - datos on-chain no cargados',
    progressAria: (pct: number) => `Progreso de financiación: ${pct}% del objetivo`,
    interest: 'Interés',
    term: 'Plazo',
    minimum: 'Mínimo',
    raised: 'Recaudado',
    goal: 'Objetivo',
    deadline: 'Fecha límite',
    status: 'Estado',
    yourPosition: 'Tu registro de contribución:',
    viewDetails: 'Ver detalles',
    demoNote: 'Datos ilustrativos de demostración - no es una oferta real.',
    photoAlt: 'Fotografía aérea de un parque solar (ilustrativa)',
    photoCaption: 'Foto ilustrativa - no es el proyecto real.',
    contractData: 'Datos del contrato',
    contract: 'Contrato',
    creator: 'Creador',
    assetContract: 'Contrato del activo',
    assetValidated: 'validado por la API como USDC de testnet',
    exactRaisedGoal: 'Recaudado / objetivo exactos',
    unitsNote: 'unidades de 7 decimales',
    creatorWithdrawn: 'Retirada por el creador',
    yes: 'Sí',
    no: 'No',
    amountLabel: 'Importe de la contribución (USDC de testnet)',
    amountRequired: 'Introduzca un importe de contribución.',
    amountInvalid: 'Introduzca un importe válido: solo números, hasta 7 decimales, mayor que cero.',
    amountExceeds: (remaining: string) => `El importe supera el objetivo restante de ${remaining} USDC (testnet).`,
    usdcTestnet: 'USDC (testnet)',
    contribute: 'Contribuir',
    refundMe: 'Reembolsarme',
    creatorWithdraw: 'Retirada del creador',
    rules:
      'Contribuye antes de la fecha límite, hasta el importe restante del objetivo. Tras el plazo, el creador solo retira los fondos si el objetivo se alcanzó por completo; en caso contrario, cada contribuyente firma su propio reembolso. El contrato aplica estas reglas de forma atómica.',
  },
  grid: {
    ariaReady: (filled: number, count: number, percent: number) =>
      `Progreso de financiación: ${filled} de ${count} bloques completados, ${percent}% del objetivo`,
    ariaUnavailable: 'Progreso de financiación no disponible: datos on-chain no cargados',
    fundedTail: (filled: number, count: number) => `financiado - ${filled} de ${count} bloques`,
    captionUnavailable: 'Progreso no disponible - datos on-chain no cargados',
  },
  intent: {
    title: 'Transacción guardada',
    steps: ['Preparada', 'Firmada', 'Enviada', 'Confirmada'],
    action: 'Acción',
    campaign: 'Campaña',
    contract: 'Contrato',
    maxFee: 'Comisión máxima',
    checkWallet: 'comprobar cartera',
    hash: 'Hash',
    usdcTestnet: 'USDC (testnet)',
    xlmTestnet: 'XLM de testnet',
    warningPending:
      'Enviar no es confirmar. Un resultado ausente no significa fallo. Comprueba el estado o reintenta esta transacción firmada exacta; nunca crees una sustituta mientras tengas dudas.',
    confirmed: 'Confirmada en la testnet de Stellar. Esta transacción exacta es final; el hash anterior es tu prueba permanente.',
    notFound: 'Resultado incierto conservado. El RPC puede tener historial limitado. No lo borres ni lo sustituyas por una expiración.',
    retry: 'Reintentar transacción idéntica',
    signSubmit: 'Firmar y enviar',
    checkLedger: 'Comprobar resultado en el ledger',
    cancelUnsigned: 'Cancelar transacción sin firmar',
    clearConfirmed: 'Borrar registro confirmado',
    statusLabels: {
      BUILT: 'PREPARADA',
      SIGNED: 'FIRMADA',
      PENDING: 'PENDIENTE',
      SUCCESS: 'CONFIRMADA',
      FAILED: 'FALLÓ',
      NOT_FOUND: 'NO ENCONTRADA',
      CANCELLED_UNSIGNED: 'CANCELADA SIN FIRMA',
    } as Record<string, string>,
    actionLabels: {
      contribute: 'contribuir',
      refund: 'reembolso',
      withdraw: 'retirada',
    } as Record<string, string>,
  },
  campaign: {
    loading: 'Cargando la campaña…',
    notFound: 'Campaña no encontrada',
    notFoundText: 'Ninguna campaña con este id está en el registro actual',
    notFoundFixtureSuffix: ' de campañas de ejemplo',
    backToAll: 'Volver a todas las inversiones',
    issuerMissing:
      'La identidad del emisor y las condiciones off-chain no están disponibles en este prototipo; los datos siguientes provienen del contrato on-chain.',
    assetClass: 'Clase de activo',
    escrowTestnet: 'Escrow por contrato (testnet)',
    interestRate: 'Tipo de interés',
    noInterest: 'Ninguno - solo escrow de contribuciones',
    term: 'Plazo',
    termDeadlinePrefix: 'Fecha límite',
    minInvestment: 'Inversión mínima',
    minNote: 'Definida por transacción, limitada al importe restante del objetivo',
    additionalInfo: 'Información adicional',
    factsAria: 'Hechos de la plataforma',
    fundingModel: 'Modelo de financiación',
    aonEnforced: 'Todo-o-nada, aplicado por el contrato Soroban',
    goal: 'Objetivo',
    deadline: 'Fecha límite',
    contract: 'Contrato',
    asset: 'Activo',
    assetValidated: 'validado por la API como USDC de testnet',
    interestIsinDocs: 'Interés, ISIN, documentos',
    interestIsinDocsNote: 'No disponible - este prototipo solo registra contribuciones y no emite valores',
    marketingDivider: 'Contenido proporcionado por el emisor a continuación - no verificado por la plataforma',
    marketingDividerAria: 'Contenido de marketing a continuación',
    tabs: ['Resumen', 'Detalles', 'Documentos', 'Noticias'],
    tabsAria: 'Secciones de la campaña',
    overviewMissing:
      'El contenido de marketing del emisor no está disponible en este prototipo. En una plataforma en producción, esta zona mostraría la descripción, el equipo y el modelo de negocio del propio emisor, claramente separados de los hechos de la plataforma por el separador anterior.',
    detailsPre: 'El modelo de negocio, el mercado, las finanzas y los hitos aparecerían aquí como secciones proporcionadas por el emisor.',
    detailsSample: 'Esta campaña de ejemplo no incluye contenido de detalle.',
    detailsMissing: 'No disponible en este prototipo.',
    documentsMissing:
      'El alojamiento de documentos no está disponible en este prototipo. Una plataforma en producción alojaría aquí la ficha de información fundamental y las condiciones de la emisión.',
    newsEmpty: 'Sin actualizaciones. Las noticias de la campaña aparecerían aquí.',
    statusFunded: 'Financiada con éxito',
    statusEnded: 'Sin éxito',
    widgetContribute: 'Contribuir',
    widgetOverview: 'Resumen de la inversión',
    widgetFixture: 'Vista previa de ejemplo. Esta campaña es un ejemplo (fixture), no un contrato desplegado, y no puede aceptar contribuciones.',
    widgetEnded: 'Esta campaña ha terminado. Los reembolsos siguen disponibles según las reglas de plazo descritas en la página de inversiones.',
    widgetRisk: 'Las inversiones en crowdfunding conllevan riesgo de pérdida total y son ilíquidas. Este prototipo usa activos de testnet sin valor.',
    raised: 'Recaudado',
    usdcTestnet: 'USDC (testnet)',
    explainerSuffix: 'Esto es texto educativo de ejemplo, no las condiciones de una oferta real.',
    explainerConvertible:
      'Un bono convertible paga intereses hasta que un evento configurado permite a los titulares convertirlo en acciones según las condiciones de la emisión. La conversión es una capa de estructura sobre el bono, no un instrumento separado.',
    explainerSeniorBond:
      'Un bono sénior es deuda no subordinada: los bonistas tienen prioridad sobre el capital subordinado y los fondos propios en caso de insolvencia y reciben un cupón fijo, sin participación en el crecimiento de la empresa.',
    explainerSubBond:
      'Un bono subordinado paga un cupón definido, pero queda por detrás de los acreedores sénior en caso de insolvencia y no participa en el crecimiento de la empresa.',
    explainerDefault: 'Esta clase de instrumento se describe en el hub Aprender.',
  },
  howItWorks: {
    title: 'Cómo funciona',
    intro:
      'El recorrido que una plataforma de crowdfunding real tiene que soportar, y exactamente qué partes implementa ya este prototipo. Los pasos marcados como planeados no existen en el código y nada en este sitio finge que existan.',
    investorTitle: 'Recorrido del inversor',
    issuerTitle: 'Recorrido del emisor',
    live: 'Existe en el prototipo',
    planned: 'Planeado - no construido',
    investorSteps: [
      {
        title: 'Registro e inicio de sesión',
        text: 'Una plataforma en producción exige una cuenta con confirmación de correo y credenciales. Este prototipo tiene en su lugar un inicio de sesión comunitario opcional: demuestras el control de tu cartera Freighter firmando un reto único - sin registro por correo, sin contraseña. La cartera es la única identidad.',
      },
      {
        title: 'Verificación de identidad (KYC)',
        text: 'Verificación de documento y selfie con un proveedor de verificación, más datos AML cuando se exijan. No implementado; aquí no se recogen datos de identidad.',
      },
      {
        title: 'Categorización del inversor',
        text: 'Cuando el régimen aplicable lo exige: prueba de conocimientos y simulación de capacidad de soportar pérdidas antes de invertir, con avisos más fuertes por encima de los límites legales.',
      },
      {
        title: 'Descubrir campañas',
        text: 'Explora el registro, filtra y ordena, y lee las condiciones estructuradas en la página de cada campaña.',
      },
      {
        title: 'Invertir',
        text: 'Conecta Freighter, introduce un importe y firma una transacción. El contrato pone la contribución en escrow y aplica el límite de forma atómica. En una plataforma en producción, el clic es una oferta vinculante al emisor.',
      },
      {
        title: 'Periodo de reflexión',
        text: 'Cuando el régimen aplicable lo exige, los inversores cubiertos pueden revocar una oferta dentro de un periodo configurado (4 días naturales en el régimen de la UE para inversores no sofisticados). No implementado; las contribuciones de testnet no son ofertas.',
      },
      {
        title: 'Pago',
        text: 'Una plataforma en producción liquida a través de un proveedor de pagos autorizado con referencias por inversión. Aquí, la transacción en la testnet de Stellar es la liquidación, con activos sin valor.',
      },
      {
        title: 'Panel y pagos',
        text: 'Un panel personal con el estado de las inversiones, documentos y pagos de intereses. No implementado; los registros de contribución se leen por campaña con la cartera conectada.',
      },
      {
        title: 'Transferencias y salida',
        text: 'Transferencia de posiciones entre usuarios verificados y, posiblemente, un mercado de anuncios. Los registros de contribución en este prototipo son deliberadamente intransferibles.',
      },
    ],
    issuerSteps: [
      {
        title: 'Solicitud y análisis',
        text: 'El emisor solicita, supera el análisis de elegibilidad y documentos y firma las condiciones de la plataforma.',
      },
      {
        title: 'Construcción de la campaña',
        text: 'Las condiciones del instrumento, los límites, los documentos y el contenido de marketing se configuran y revisan.',
      },
      {
        title: 'Campaña activa',
        text: 'La demostración muestra la página pública de la campaña con el estado de financiación on-chain en tiempo real.',
      },
      {
        title: 'Liquidación',
        text: 'Todo-o-nada: el creador solo retira los fondos si el objetivo se alcanza dentro del plazo, aplicado por el contrato.',
      },
      {
        title: 'Deberes post-financiación',
        text: 'Informes, pagos de intereses y reembolso, y un estado separado del ciclo de vida del emisor. No implementado.',
      },
    ],
  },
  learn: {
    title: 'Aprender',
    intro:
      'Explicaciones en lenguaje sencillo del modelo de instrumentos en el que se basa esta plataforma: cuatro categorías madre del lado de la participación y dos categorías madre de deuda (préstamo y bono), cada una de deuda emitida como sénior, subordinada o con senioridad no especificada. Las capas de estructura se combinan con una categoría madre de deuda; los calificadores de rango y de etiqueta son terminología de plataformas, preservados tal cual. Contenido solo educativo: no es una oferta ni asesoramiento de inversión.',
    seniorityStatesLabel: 'Estados de senioridad:',
    opportunities: 'Oportunidades',
    risks: 'Riesgos',
    suitableLabel: 'Para quién es adecuado:',
    overlaysAria: 'Capas de estructura',
    overlaysTitle: 'Capas de estructura',
    overlaysIntro: 'Las capas se combinan con una categoría madre de préstamo o bono y nunca existen solas como instrumentos.',
    qualifiersAria: 'Calificadores de rango y de etiqueta',
    qualifiersTitle: 'Calificadores de rango y de etiqueta',
    qualifiersIntro:
      'Terminología de plataformas que puedes encontrar en ofertas. Estas etiquetas califican un instrumento; no son clases de instrumentos en sí mismas.',
  },
  glossaryPage: {
    title: 'Glosario',
    intro:
      'Términos clave usados en esta plataforma y en ofertas de crowdfunding en general. Contenido solo educativo: no es una oferta ni asesoramiento de inversión.',
    sectionAria: 'Términos del glosario',
    backPre: 'Volver a la página',
    backLink: 'Aprender',
    riskPre: 'Antes de cualquier decisión con dinero real, lee los',
    riskLink: 'avisos de riesgo',
  },
  riskWarnings: {
    title: 'Avisos de riesgo',
    items: [
      {
        h: 'Pérdida total',
        p: 'Las inversiones en crowdfunding pueden perder todo su valor. Nunca inviertas dinero cuya pérdida no puedas soportar.',
      },
      {
        h: 'Iliquidez',
        p: 'Estos instrumentos normalmente no son negociables. Asume que no puedes salir antes del vencimiento o de un evento definido.',
      },
      {
        h: 'Diversificación',
        p: 'Una orientación común es no invertir más del 10% de los fondos libremente disponibles en esta clase de activos y repartirlos entre varios emisores.',
      },
      {
        h: 'Sin esquema de protección',
        p: 'Las inversiones en crowdfunding no están cubiertas por esquemas de garantía de depósitos ni de compensación de inversores.',
      },
      {
        h: 'Sin asesoramiento',
        p: 'Nada en este sitio es asesoramiento de inversión, jurídico o fiscal. Este sitio es un prototipo de software en una red de pruebas y no lista ofertas reales.',
      },
      {
        h: 'Estado de prototipo',
        p: 'Los activos de testnet no tienen valor. Los contratos inteligentes aquí no están auditados y no deben usarse con fondos reales.',
      },
    ],
  },
  faqPage: {
    title: 'Preguntas frecuentes',
    introPre: 'Las respuestas están marcadas como en la página Cómo funciona:',
    introLive: 'Existe en el prototipo',
    introMid1: 'describe lo que el código hace hoy,',
    introPlanned: 'Planeado - no construido',
    introMid2: 'no está implementado en ninguna parte, y',
    introInfo: 'Contexto general',
    introPost: 'explica la práctica del crowdfunding sin afirmar que esta plataforma lo haga.',
    searchPlaceholder: 'Buscar preguntas y respuestas',
    searchAria: 'Buscar preguntas',
    categoryAria: 'Categoría de las FAQ',
    all: 'Todas',
    noMatches: 'Ninguna pregunta coincide con tu búsqueda.',
  },
  about: {
    title: 'Sobre este proyecto',
    p1: 'Blockallisto (repositorio rwa-crowdfund-stellar) es un prototipo personal que explora el crowdfunding tokenizado en la red Stellar: financiación de campañas aplicada por un contrato inteligente Soroban, con la plataforma más amplia - cuentas, verificación, instrumentos, pagos - diseñada y documentada abiertamente en el repositorio.',
    p2: 'No es una empresa, no es un proveedor de servicios de crowdfunding autorizado y no es una oferta de valores. Contexto de mercado: de Portugal para el mundo.',
    ethicsAria: 'Política de exclusión ética',
    ethicsTitle: 'Política de exclusión ética',
    ethicsIntro:
      'Una política a nivel de producto para la plataforma que este prototipo explora. Los emisores de los siguientes sectores quedan fuera de alcance por diseño:',
    ethicsPoints: [
      'Tabaco, juego y armas',
      'Combustibles fósiles, minería y energía nuclear',
      'Prisiones y servicios de detención',
      'Organismos modificados genéticamente e industrias ligadas a minerales de conflicto',
    ],
    ethicsNote: 'Esto es un compromiso de diseño del proyecto, no una afirmación sobre ninguna operación real.',
    techAria: 'Tecnología',
    techTitle: 'Tecnología',
    techText:
      'Frontend en React, backend en Node, contrato Soroban (Rust) para escrow, cartera Freighter para firmar, USDC en la testnet de Stellar. El alojamiento y la base de datos funcionan en planes gratuitos. Los detalles y los informes de pruebas están en la documentación del repositorio.',
    behindAria: 'Detrás del nombre',
    behindTitle: 'Detrás del nombre',
    behindText:
      'En la Antigua Grecia, Calisto se convirtió en la Osa Mayor: una constelación donde puntos individuales de luz se unen para formar una figura mayor e imperecedera. En Blockallisto, llevamos esa misma verdad a las finanzas globales a través de la red Stellar. Conectamos a pequeños inversores para completar bloques de activos reales. Juntos, somos la democratización de la inversión: puntos individuales que se unen en un todo mayor.',
  },
  financing: {
    title: 'Financiación para empresas',
    intro:
      'Capta capital de la multitud a través de un contrato Soroban con financiación todo-o-nada. Las carteras con sesión iniciada pueden enviar una solicitud de emisor abajo; las solicitudes se almacenan para su revisión por el operador. Enviar no constituye incorporación, cotización ni aprobación, y no se ofrece financiación.',
    journeyAria: 'Resumen del recorrido del emisor',
    journeyTitle: 'El recorrido previsto',
    steps: [
      {
        h: 'Solicitar',
        p: 'Cuéntanos tu empresa, el importe y el instrumento que tienes en mente.',
      },
      {
        h: 'Análisis',
        p: 'Análisis de elegibilidad y documentos, seguido de una propuesta de financiación estructurada.',
      },
      {
        h: 'Construir',
        p: 'Página de campaña, condiciones del instrumento, documentos y contenido de marketing preparados en conjunto.',
      },
      {
        h: 'Financiar',
        p: 'Campaña todo-o-nada. Los fondos solo se liquidan si el objetivo se alcanza dentro del plazo.',
      },
    ],
  },
  account: {
    title: 'Mi cuenta',
    notePre:
      'Su área de cuenta: las posiciones de testnet de esta cartera y la actividad de la comunidad guardada bajo ella (solo activos de testnet: sin fondos reales ni rendimientos). Diseño inspirado en el panel con sesión iniciada documentado en',
    notePost:
      '(sección 7A). Las posiciones proceden de tu cartera Freighter conectada en la testnet de Stellar y no tienen valor. El acceso opcional a la comunidad y los formularios de soporte y de emisor de esta página tratan los datos que introduzcas como describe la política de privacidad.',
    summaryAria: 'Resumen de la cartera',
    totalContributed: 'Total contribuido',
    totalSub: 'En escrow on-chain, sumado por campañas',
    returnReceived: 'Retorno recibido',
    returnNa: 'No disponible',
    returnSub: 'Este prototipo no registra historial de pagos',
    activeInvestments: 'Inversiones activas',
    activeSub: 'Posiciones en escrow en campañas abiertas o financiadas',
    connectNote: 'Conecta tu cartera Freighter para ver tus posiciones de testnet. Sin cartera, esta página solo muestra la estructura.',
    fixtureNote: 'Las campañas de ejemplo están en pantalla; los datos de ejemplo no tienen posiciones por cartera.',
    investmentsAria: 'Mis inversiones',
    myInvestments: 'Mis inversiones',
    newInvestments: 'Nuevas inversiones',
    filterAria: 'Filtrar cartera por estado',
    tabs: {
      all: 'Todas',
      canceled: 'Canceladas',
      pending: 'Pendientes',
      paid: 'Pagadas',
      completed: 'Completadas',
    },
    tabNote:
      'Correspondencia del prototipo: Pendiente = contribución en escrow, campaña abierta. Pagada = campaña financiada, aún en curso. Completada = campaña terminada tras la financiación. Cancelada = terminada sin alcanzar el objetivo; hay un reembolso firmado por el contribuyente disponible en la página de la campaña.',
    noInvestments: 'No se encontraron inversiones.',
    activityAria: 'Actividad reciente',
    recentActivity: 'Actividad reciente',
    savedTxPre: 'Transacción guardada:',
    savedTxOn: 'en la campaña',
    savedTxStatus: 'estado',
    savedTxPost: 'Reanúdala o bórrala desde el panel de transacciones anterior.',
    savedTxUnknown: 'desconocido',
    noActivity: 'No se encontró actividad.',
    walletAria: 'Cartera',
    myWallet: 'Mi cartera',
    walletConnectedPre: 'Conectada:',
    walletConnectedPost:
      'Las contribuciones quedan en escrow en los contratos de las campañas; los reembolsos los firma el contribuyente on-chain. No existen fondos custodiados por la plataforma en este prototipo.',
    noWallet: 'Ninguna cartera conectada.',
    checklistAria: 'Lista de verificación de cuenta y perfil',
    checklistTitle: 'Visión general de la cuenta y datos de perfil',
    checklistIntro:
      'La plataforma de referencia condiciona la inversión a completar el perfil, la verificación y los datos bancarios. Este prototipo no condiciona la inversión; la lista muestra esos requisitos de verificación del inversor como marcadores planificados.',
    notSetUp: 'No configurado',
    checklist: [
      {
        label: 'Datos personales',
        note: 'No es necesario para invertir en este prototipo; un requisito planificado de verificación del inversor.',
      },
      {
        label: 'Datos de dirección',
        note: 'No es necesario para invertir en este prototipo; un requisito planificado de verificación del inversor.',
      },
      {
        label: 'Datos de contacto',
        note: 'No es necesario para invertir en este prototipo; un requisito planificado de verificación del inversor.',
      },
      {
        label: 'Seguridad',
        note: 'Acceso basado en cartera (Freighter). Sin contraseña ni aplicación de dos factores en este prototipo.',
      },
      {
        label: 'Cualificación del inversor',
        note: 'La prueba de conocimientos y la comprobación de capacidad de pérdidas son pasos de cumplimiento planeados; no implementados aquí.',
      },
      {
        label: 'Verificación (KYC)',
        note: 'No implementada. Este prototipo de testnet no verifica ninguna identidad.',
      },
      {
        label: 'Datos bancarios',
        note: 'No recogidos. Las contribuciones y los reembolsos se mueven como USDC de testnet on-chain.',
      },
      {
        label: 'Datos de cuenta de valores',
        note: 'Referencia opcional a cuenta de valores en la plataforma de referencia; no recogida aquí.',
      },
      {
        label: 'Taquilla digital',
        note: 'Vista planificada de custodia de las posiciones mantenidas. Aquí, las posiciones viven en cada contrato de campaña y se leen por cartera conectada.',
      },
      {
        label: 'Cuentas de empresa',
        note: 'La plataforma de referencia permite a un inversor verificado añadir una cuenta de empresa; no implementado en este prototipo.',
      },
    ],
  },
  footer: {
    platform: 'Plataforma',
    legal: 'Legal',
    termsOfService: 'Condiciones de Uso',
    privacyPolicy: 'Política de Privacidad',
    riskDisclosure: 'Advertencia de Riesgo',
    legalNotice: 'Aviso Legal',
    conflictsOfInterest: 'Conflictos de Intereses',
    complaintsManagement: 'Gestión de Reclamaciones',
    businessContinuity: 'Continuidad del Negocio',
    invest: 'Invertir',
    howItWorks: 'Cómo funciona',
    financingIssuers: 'Financiación para emisores',
    learn: 'Aprender',
    instrumentHub: 'Hub de instrumentos',
    riskWarnings: 'Avisos de riesgo',
    glossary: 'Glosario',
    faq: 'FAQ',
    aboutProject: 'Sobre este proyecto',
    status: 'Estado',
    statusText:
      'Prototipo de testnet. Sin despliegue automático ni conversión de saldos heredados. Los intents y saldos clásicos existentes se conservan, no se borran. La infraestructura separada de identidad/valoración sigue siendo solo simulada.',
    legalPre: 'Contexto de mercado: la UE regula el crowdfunding bajo el ECSPR; los proveedores autorizados figuran en el',
    legalLink: 'registro de la ESMA',
    legalPost: '. Esta aplicación no es un proveedor de servicios de crowdfunding autorizado y no lista ofertas reales.',
    tagline: 'Activos reales. Posibilidades compartidas.',
  },
  time: {
    ended: 'Terminó',
    underMinute: 'Queda menos de un minuto',
    minutesLeft: (n: number) => (n === 1 ? `Queda ${n} minuto` : `Quedan ${n} minutos`),
    hoursLeft: (n: number) => (n === 1 ? `Queda ${n} hora` : `Quedan ${n} horas`),
    daysLeft: (n: number) => (n === 1 ? `Queda ${n} día` : `Quedan ${n} días`),
  },
  errors: {
    freighterMissing: 'Extensión de cartera Freighter no detectada. Instala Freighter y vuelve a intentar Conectar.',
    walletAccessFailed: 'Falló el acceso a la cartera',
    connectFirst: 'Conecta primero Freighter.',
    resolveSaved: 'Resuelve la transacción guardada antes de preparar otra.',
    walletMismatch: 'Conecta la cartera que preparó esta transacción.',
    walletNoSign: 'La cartera no firmó',
    apiFailed: 'La solicitud a la API falló',
  },
  instruments: {
    groups: [
      {
        id: 'participation',
        title: 'Instrumentos de participación',
        intro:
          'Instrumentos cuyo rendimiento depende del éxito del negocio del emisor: derechos participativos en los beneficios y capital propio. La participación indirecta figura aquí como estructura de titularidad, no como instrumento separado.',
      },
      {
        id: 'debt',
        title: 'Instrumentos de deuda',
        intro:
          'Dos categorías madre genéricas - préstamo y bono - cada una emitida en uno de tres estados de senioridad: sénior, subordinada o senioridad no especificada. Los inversores se posicionan como acreedores.',
      },
    ],
    seniorityLabels: {
      senior: 'Sénior (no subordinada)',
      subordinated: 'Subordinada (queda por detrás de los acreedores sénior en caso de insolvencia)',
      unspecified: 'Senioridad no especificada en las condiciones',
    },
    classes: [
      {
        id: 'participation-certificate',
        label: 'Derecho / certificado participativo',
        subtypeOf: '',
        note: '',
        group: 'participation',
        seniorityStates: [] as string[],
        summary:
          'Un derecho (a menudo titulizado como certificado participativo) a una parte de los beneficios y al reembolso del valor nominal, sin los derechos de gobierno plenos de un accionista.',
        opportunities: [
          'Participación en los beneficios sin comprar capital propio pleno',
          'A menudo combina un derecho base de reembolso con participación en los beneficios',
        ],
        risks: [
          'La parte de los beneficios depende por completo del rendimiento del emisor',
          'Puede quedar por detrás de los acreedores ordinarios',
          'Normalmente ilíquido hasta el vencimiento',
        ],
        suitableFor: 'Inversores que quieren exposición a los resultados del negocio y aceptan un riesgo similar al del capital propio.',
      },
      {
        id: 'substanzgenussrecht',
        label: 'Substanzgenussrecht',
        subtypeOf: 'Subtipo de derecho / certificado participativo',
        note: '',
        group: 'participation',
        seniorityStates: [] as string[],
        summary:
          'Un derecho participativo ligado a la base de activos ("sustancia") del emisor y no solo a su beneficio anual. La estructuración y los emisores elegibles varían según la jurisdicción y los estatutos.',
        opportunities: [
          'Participación en el valor de los activos del emisor',
          'Puede estructurarse para emisores más pequeños cuando los estatutos lo permiten',
        ],
        risks: [
          'La forma jurídica y la protección del inversor varían mucho según la jurisdicción',
          'Puede implicar un fiduciario o vehículo entre el inversor y el emisor',
          'Normalmente ilíquido',
        ],
        suitableFor: 'Inversores cómodos con estructuras a medida que leen primero las condiciones exactas del contrato.',
      },
      {
        id: 'share',
        label: 'Acción',
        subtypeOf: '',
        note: 'Una ampliación de capital es la operación societaria que crea nuevas acciones; no es un instrumento separado.',
        group: 'participation',
        seniorityStates: [] as string[],
        summary:
          'Capital propio directo de la empresa emisora: derecho a dividendos y participación en el valor de la empresa, con derechos fijados por los estatutos. Las nuevas acciones llegan a los inversores mediante una ampliación de capital.',
        opportunities: ['Participación plena en el crecimiento de la empresa', 'Derechos de voto o de información según la clase de acciones'],
        risks: [
          'Sin derecho fijo de reembolso; los dividendos no están garantizados',
          'Pérdida total posible',
          'Las acciones de crowdfunding normalmente no son negociables en bolsa',
        ],
        suitableFor: 'Inversores con horizonte largo que quieren propiedad y aceptan el riesgo empresarial pleno.',
      },
      {
        id: 'indirect-participation',
        label: 'Participación indirecta',
        subtypeOf: '',
        note: 'Una estructura de titularidad, no un instrumento distinto: el inversor mantiene la participación subyacente a través de un vehículo o fiduciario, y el interés subyacente decide la economía.',
        group: 'participation',
        seniorityStates: [] as string[],
        summary:
          'Los inversores participan indirectamente en una inversión en una PYME - por ejemplo a través de un vehículo o fiduciario - con tramitación simplificada.',
        opportunities: ['Acceso a operaciones difíciles de mantener directamente', 'Administración simplificada a través de la estructura intermediaria'],
        risks: [
          'Hay una capa adicional entre el inversor y el emisor',
          'El rendimiento depende del desempeño del emisor',
          'Las condiciones del vehículo rigen los pagos y la salida',
        ],
        suitableFor: 'Inversores que quieren la economía de la participación sin mantener directamente el interés subyacente.',
      },
      {
        id: 'limited-partnership',
        label: 'Participación en sociedad comanditaria',
        subtypeOf: '',
        note: '',
        group: 'participation',
        seniorityStates: [] as string[],
        summary:
          'Una participación como socio comanditario en una sociedad: participación en beneficios y pérdidas según el contrato social, con responsabilidad limitada a la aportación.',
        opportunities: ['Traslado directo de los resultados de la sociedad', 'Responsabilidad limitada a la aportación'],
        risks: [
          'La participación en pérdidas puede reducir o anular la participación',
          'La salida suele estar restringida por el contrato social',
          'Las obligaciones fiscales y de información pueden ser más exigentes',
        ],
        suitableFor: 'Inversores que entienden las estructuras societarias y aceptan el riesgo empresarial.',
      },
      {
        id: 'loan',
        label: 'Préstamo',
        subtypeOf: '',
        note: '',
        group: 'debt',
        seniorityStates: ['senior', 'subordinated', 'unspecified'],
        summary:
          'Un préstamo directo al emisor con tipo de interés y calendario de reembolso definidos. La misma categoría madre de préstamo puede ser sénior, subordinada (incluidas variantes participativas en beneficios) o dejar la senioridad sin especificar.',
        opportunities: [
          'Un calendario fijo es más fácil de modelar que el capital propio',
          'Las variantes subordinadas pagan más interés a cambio del rango inferior',
        ],
        risks: [
          'El impago del emisor puede significar pérdida total',
          'Los créditos subordinados solo se pagan después de los acreedores sénior en caso de insolvencia',
          'Sin garantía de depósitos',
        ],
        suitableFor: 'Inversores que aceptan riesgo de crédito sin protección bancaria.',
      },
      {
        id: 'bond',
        label: 'Bono',
        subtypeOf: '',
        note: '',
        group: 'debt',
        seniorityStates: ['senior', 'subordinated', 'unspecified'],
        summary:
          'Un instrumento de deuda titulizado con cupón y plazo definidos. Emitido como sénior (no subordinado), subordinado (incluidos bonos cualificados explícitamente subordinados y Mini Bonds subordinados) o con senioridad no especificada.',
        opportunities: [
          'Cupón y calendario de reembolso definidos',
          'Las emisiones sénior tienen prioridad sobre el capital subordinado y los fondos propios en caso de insolvencia',
        ],
        risks: [
          'La subordinación aumenta la gravedad de la pérdida en caso de insolvencia',
          'Sigue sin garantías salvo indicación de colateral',
          'Sin participación en el crecimiento de la empresa',
        ],
        suitableFor: 'Inversores orientados al rendimiento que soportan una pérdida total y no necesitan el dinero antes del vencimiento.',
      },
    ],
    overlays: [
      {
        id: 'zero-coupon',
        label: 'Cupón cero (Zero Bond)',
        summary:
          'Una estructura de cupón en un préstamo o bono, no una senioridad: sin intereses periódicos; el rendimiento proviene de la emisión por debajo del valor nominal y del reembolso a la par. Se combina con una categoría madre de deuda, nunca existe sola.',
      },
      {
        id: 'convertible',
        label: 'Convertible',
        summary:
          'Una cláusula de conversión en un bono: según las condiciones configuradas (evento de activación, ventana de ejercicio, precio de conversión, reglas de cese de intereses) el bono se convierte en acciones. Se combina con la categoría madre bono, nunca existe sola.',
      },
    ],
    qualifiers: [
      {
        id: 'junior',
        label: '"Junior"',
        summary:
          'Una etiqueta de rango inferior en la terminología de las plataformas. Indica rango subordinado, pero no establece por sí sola subordinación cualificada contractual.',
      },
      {
        id: 'qualified',
        label: '"Cualificada / qualifiziert"',
        summary:
          'Terminología de plataformas encontrada en préstamos y bonos. En los bonos, no la leas como subordinación cualificada salvo que las propias condiciones digan subordinada.',
      },
      {
        id: 'mini-bond',
        label: '"Mini Bond"',
        summary: 'Etiqueta de plataforma para un bono de bajo valor unitario.',
      },
    ],
    chipZeroCoupon: 'Cupón cero',
    chipConvertible: 'Convertible',
    chipSenior: 'Sénior',
    chipSubordinated: 'Subordinada',
    chipUnspecifiedSuffix: '(senioridad no especificada)',
    composeChip: (parts: string[], base: string) => (parts.length > 0 ? `${parts.join(' ')} ${base.toLowerCase()}` : base),
  },
  glossary: [
    {
      term: 'Financiación todo-o-nada',
      definition:
        'El emisor recibe los fondos solo si el objetivo se alcanza dentro del plazo; en caso contrario, las contribuciones se devuelven. El contrato Soroban de este prototipo lo aplica on-chain.',
    },
    {
      term: 'Umbral de financiación',
      definition: 'El importe mínimo que una emisión debe captar para cerrar. Distinto de la inversión mínima por inversor.',
    },
    {
      term: 'Inversión mínima',
      definition: 'El menor importe que un inversor puede suscribir, normalmente una unidad.',
    },
    {
      term: 'Subordinación',
      definition:
        'Una regla de rango: los créditos subordinados solo se pagan después de los acreedores sénior en caso de insolvencia, lo que aumenta el riesgo de pérdida.',
    },
    {
      term: 'ISIN',
      definition: 'Número internacional de identificación de valores. Identifica un título. Este prototipo no emite valores ni ISINs.',
    },
    {
      term: 'Ficha de información fundamental (KIIS)',
      definition: 'Un documento corto estandarizado con los hechos y riesgos clave de una oferta, exigido para muchas ofertas de crowdfunding en la UE.',
    },
    {
      term: 'Periodo de reflexión',
      definition:
        'Una ventana tras una oferta de inversión durante la cual ciertos inversores pueden revocar gratuitamente cuando el régimen aplicable lo exige. La duración y la aplicabilidad dependen de la clase del inversor y del régimen.',
    },
    {
      term: 'Prueba de conocimientos',
      definition:
        'Una comprobación de la comprensión de los riesgos del crowdfunding por parte del inversor, exigida por algunos regímenes antes de que inversores no sofisticados puedan invertir.',
    },
    {
      term: 'Simulación de capacidad de soportar pérdidas',
      definition: 'Una estimación de si el inversor puede soportar la pérdida de la inversión, exigida por algunos regímenes para inversores no sofisticados.',
    },
    {
      term: 'ECSPR',
      definition:
        'Reglamento (UE) 2020/1503 sobre los proveedores europeos de servicios de crowdfunding. Los proveedores autorizados figuran en el registro de la ESMA. Este prototipo no es un proveedor autorizado.',
    },
    {
      term: 'Escrow',
      definition:
        'Fondos retenidos por un mecanismo neutral hasta que se cumplen las condiciones. Aquí, el propio contrato de la campaña custodia las contribuciones en escrow en la testnet de Stellar.',
    },
    {
      term: 'Soroban',
      definition: 'La plataforma de contratos inteligentes de la red Stellar usada por este prototipo.',
    },
    {
      term: 'Testnet',
      definition: 'Una red de pruebas pública con activos sin valor, usada para probar software sin dinero real.',
    },
    {
      term: 'Valor nominal',
      definition: 'El valor facial de una unidad de un instrumento, sobre el que se calculan intereses y reembolso.',
    },
    {
      term: 'Reembolso bullet',
      definition: 'Reembolso del importe nominal total en un único pago al vencimiento.',
    },
    {
      term: 'act/act, 30E/360',
      definition: 'Convenciones de cómputo de días que definen cómo se acumulan los intereses entre fechas de pago.',
    },
    {
      term: 'Bono cupón cero (Zero Bond)',
      definition:
        'Un bono sin intereses periódicos: se emite por debajo de su valor nominal y se reembolsa a la par, por lo que el rendimiento es la diferencia. Una estructura de cupón, no una senioridad.',
    },
    {
      term: 'Bono convertible',
      definition:
        'Un bono con cláusula de conversión: según las condiciones de la emisión (activación, ventana, precio de conversión) puede convertirse en acciones. Una capa de estructura sobre un bono, no un instrumento autónomo.',
    },
    {
      term: 'Deuda junior',
      definition:
        'Terminología de plataformas para un crédito de rango inferior. Indica rango subordinado, pero no establece por sí sola subordinación cualificada contractual.',
    },
    {
      term: 'Subordinación cualificada',
      definition:
        'Una forma contractual de subordinación según la cual los intereses y, a veces, los pagos de principal cesan cuando el emisor quedaría sobreendeudado. La terminología de plataforma como "cualificada" por sí sola no la prueba; las condiciones deben decir subordinada.',
    },
    {
      term: 'Mini Bond',
      definition: 'Etiqueta de plataforma para un bono de bajo valor unitario.',
    },
    {
      term: 'Know your customer (KYC)',
      definition:
        'Verificación de identidad que las plataformas reguladas deben completar antes de que un inversor pueda invertir. Este prototipo no realiza KYC.',
    },
    {
      term: 'Persona políticamente expuesta (PEP)',
      definition: 'Una persona que desempeña funciones públicas prominentes, sujeta a comprobaciones reforzadas bajo las normas antiblanqueo.',
    },
    {
      term: 'Taquilla digital',
      definition:
        'Una vista de custodia donde la plataforma muestra al inversor los títulos que mantiene, vinculada a su identidad verificada. Este prototipo guarda las posiciones en el propio contrato de la campaña, visibles por cartera.',
    },
  ],
  faq: {
    stateLabels: {
      live: 'Existe en el prototipo',
      planned: 'Planeado - no construido',
      info: 'Contexto general',
    },
    categories: [
      {
        id: 'about',
        title: 'Sobre esta plataforma',
        entries: [
          {
            q: '¿Es esto una plataforma de inversión real?',
            a: 'No. Es un prototipo técnico en la testnet de Stellar. No lista ofertas reales, no acepta fondos reales y no es un proveedor de servicios de crowdfunding autorizado. Los proveedores autorizados en la UE figuran en el registro de la ESMA.',
            state: 'info',
          },
          {
            q: '¿Qué necesito para probarlo?',
            a: 'Instala la extensión de cartera Freighter, cámbiala a testnet, cárgala con XLM y USDC de testnet gratuitos desde un faucet o un amigo y conéctala aquí. Los activos de testnet no tienen valor.',
            state: 'live',
          },
          {
            q: '¿Necesito mi propia cartera?',
            a: 'Sí. Este diseño mantiene las claves con el usuario: la cartera Freighter es la única identidad y firma cada transacción. La plataforma no guarda claves ni saldos propios. Algunas plataformas en producción custodian activos a través de socios especializados; este prototipo deliberadamente no lo hace.',
            state: 'live',
          },
          {
            q: '¿Quién puede invertir en una plataforma así en producción?',
            a: 'Una plataforma en producción debe verificar la identidad de cada inversor (KYC) y, cuando el régimen lo exige, probar conocimientos y simular la capacidad de soportar pérdidas antes de importes mayores. También pueden aplicarse restricciones de residencia. Nada de eso existe aquí, porque los fondos de testnet no tienen valor.',
            state: 'info',
          },
        ],
      },
      {
        id: 'contributing',
        title: 'Contribuir y pagos',
        entries: [
          {
            q: '¿Cómo funciona una contribución?',
            a: 'Eliges una campaña, introduces un importe y firmas una transacción en Freighter. El contrato Soroban pone tu contribución en escrow y aplica el límite de financiación de forma atómica. La aplicación guarda la transacción firmada exacta para que un error de red nunca cree un duplicado.',
            state: 'live',
          },
          {
            q: '¿Qué métodos de pago puedo usar?',
            a: 'Solo USDC de testnet enviado a través de tu cartera Freighter. No hay tarjetas, transferencias bancarias ni dinero fiduciario. Una versión en producción liquidaría a través de un proveedor de pagos autorizado con una referencia por inversión; ese paso está planeado, no construido.',
            state: 'live',
          },
          {
            q: '¿Puedo contribuir más de una vez a la misma campaña?',
            a: 'Sí. Cada contribución es su propia transacción firmada, y el contrato comprueba el espacio restante hasta el límite en cada una. Un importe que hiciera superar el objetivo es rechazado por el contrato, no por la contabilidad de la plataforma.',
            state: 'live',
          },
          {
            q: '¿Qué pasa cuando una campaña alcanza su objetivo?',
            a: 'El límite lo aplica el contrato, así que no hay sobresuscripción: una vez alcanzado el objetivo, las siguientes contribuciones se rechazan. Tras la fecha límite, el creador de la campaña puede retirar los fondos en escrow.',
            state: 'live',
          },
          {
            q: '¿Cómo compruebo que mi contribución se registró?',
            a: 'Conecta tu cartera y abre la página de la campaña para ver los totales en escrow que reporta el contrato. Como la liquidación es una transacción en la testnet de Stellar, también puedes verificarla de forma independiente en un explorador público de testnet.',
            state: 'live',
          },
        ],
      },
      {
        id: 'refunds',
        title: 'Reembolsos y cancelación',
        entries: [
          {
            q: '¿Cómo funcionan los reembolsos?',
            a: 'Si una campaña no alcanza su objetivo dentro del plazo, cada contribuyente firma su propia transacción de reembolso. Si el objetivo se alcanza, solo el creador de la campaña puede retirar, y solo tras el plazo.',
            state: 'live',
          },
          {
            q: '¿Puedo cancelar una contribución después de firmar?',
            a: 'No en este prototipo: una transacción de testnet firmada es final. La cancelación es un paso planeado. A modo de comparación, el régimen europeo de crowdfunding da a los inversores no sofisticados un periodo de reflexión de 4 días naturales para desistir de una oferta vinculante en una plataforma real.',
            state: 'planned',
          },
          {
            q: '¿Quién custodia el dinero mientras la campaña está en curso?',
            a: 'El propio contrato Soroban custodia las contribuciones en escrow hasta el plazo. Ninguna cuenta de operador puede moverlas: el código solo permite una retirada por el creador tras un plazo con éxito, o reembolsos a los contribuyentes tras un plazo sin éxito.',
            state: 'live',
          },
        ],
      },
      {
        id: 'tokenization',
        title: 'Tokenización en Stellar',
        entries: [
          {
            q: '¿Qué significa tokenización aquí?',
            a: 'Tokenización significa representar digitalmente los derechos y obligaciones de una inversión, de modo que la titularidad y las transferencias puedan registrarse y verificarse en un ledger compartido. Este prototipo da un primer paso: los registros de contribución viven en un contrato inteligente Soroban en la red de pruebas de Stellar, aplicados por código y no por contabilidad de la plataforma.',
            state: 'info',
          },
          {
            q: '¿Qué aplica exactamente el contrato inteligente?',
            a: 'El escrow de las contribuciones, el límite de financiación en cada transacción, el plazo de la campaña, la liquidación todo-o-nada (retirada por el creador solo tras un plazo con éxito) y los reembolsos firmados por los contribuyentes tras un plazo sin éxito. Lo que no hace está cubierto por los pasos planeados en la página Cómo funciona.',
            state: 'live',
          },
          {
            q: '¿Existe un token negociable?',
            a: 'No. Los saldos de contribución en este primer contrato son deliberadamente intransferibles. Un token de valor negociable necesitaría un registro legalmente reconocido, titulares verificados y la capa de cumplimiento descrita en los documentos del proyecto antes de poder representar una inversión real.',
            state: 'planned',
          },
          {
            q: '¿Dónde se guardan mis contribuciones?',
            a: 'En el escrow del contrato en la red de pruebas pública, no con el operador de la plataforma. Las claves de tu cartera permanecen en Freighter en tu propio dispositivo; perderlas significaría perder el acceso al registro de contribución, exactamente como en cualquier configuración de autocustodia.',
            state: 'live',
          },
        ],
      },
      {
        id: 'risks',
        title: 'Riesgos y elegibilidad',
        entries: [
          {
            q: '¿Cuáles son los riesgos del crowdfunding real?',
            a: 'La pérdida total es posible, las inversiones son ilíquidas y no hay garantía de depósitos. Una regla práctica común es invertir solo una pequeña parte de los fondos libremente disponibles y diversificar. La página de avisos de riesgo lo cubre en detalle.',
            state: 'info',
          },
          {
            q: '¿Por qué deberían diversificar los inversores?',
            a: 'Repartir el dinero entre varios proyectos, sectores y tipos de instrumentos reduce el impacto cuando un proyecto falla. Concentrarlo todo en una sola oferta hace que el resultado dependa de una sola empresa.',
            state: 'info',
          },
          {
            q: '¿Está regulada esta plataforma?',
            a: 'No. No es un proveedor de servicios de crowdfunding autorizado y no lista ofertas reales. En la UE, los proveedores de crowdfunding están autorizados bajo el régimen ECSPR y figuran en el registro público de la ESMA, enlazado en el pie de página de todas las páginas.',
            state: 'info',
          },
        ],
      },
      {
        id: 'transfers',
        title: 'Transferencias y venta',
        entries: [
          {
            q: '¿Puedo vender, regalar o transferir una contribución?',
            a: 'No. Los registros de contribución en este prototipo son intransferibles por diseño. En plataformas en producción, las transferencias dependen de las condiciones contractuales de cada instrumento, a menudo necesitan el consentimiento del emisor y siempre exigen que el receptor esté identificado. No hay mercado secundario aquí.',
            state: 'live',
          },
          {
            q: '¿Serán posibles las transferencias más adelante?',
            a: 'Las transferencias entre usuarios verificados, y posiblemente un mercado de anuncios, son pasos de diseño planeados. Primero necesitan verificación de identidad y reglas contractuales por instrumento, y ninguna existe en el código hoy.',
            state: 'planned',
          },
        ],
      },
      {
        id: 'account',
        title: 'Cuenta y datos',
        entries: [
          {
            q: '¿Necesito una cuenta?',
            a: 'Sin registro por correo y sin contraseña. Un inicio de sesión comunitario opcional demuestra el control de tu cartera Freighter firmando un reto único. La cartera es la única identidad, y conectar o firmar nunca comparte tus claves con el sitio.',
            state: 'live',
          },
          {
            q: '¿Qué datos personales recoge este prototipo?',
            a: 'Solo lo que las funciones comunitarias guardan si las usas: tu clave pública de Stellar, un nombre visible opcional y los comentarios, tickets de soporte o solicitudes de emisor que envíes (las solicitudes pueden incluir un email de contacto opcional). Los comentarios son públicos. No se pide nombre completo ni documento de identidad. Tu navegador guarda un registro local de una transacción pendiente para que no se duplique, y el backend mantiene un diario técnico de solicitudes; la Política de Privacidad detalla almacenamiento y retención. Una plataforma en producción tendría que cumplir los deberes del RGPD: acceso, rectificación, supresión y portabilidad de tus datos.',
            state: 'live',
          },
        ],
      },
      {
        id: 'documents',
        title: 'Documentos e impuestos',
        entries: [
          {
            q: '¿Dónde están mis documentos contractuales y justificantes?',
            a: 'Todavía en ninguna parte: el alojamiento de documentos y una cartera personal son pasos planeados. Una plataforma en producción guarda los documentos contractuales por inversión y emite una confirmación cuando una inversión se concluye.',
            state: 'planned',
          },
          {
            q: '¿Se deducen impuestos de los rendimientos?',
            a: 'Este prototipo no paga rendimientos, así que nada se tributa ni se retiene. En plataformas reales, el tratamiento depende de tu país de residencia, del instrumento y del país del emisor; algunos proveedores retienen impuestos o emiten certificados anuales, y el inversor sigue siendo responsable de la declaración correcta.',
            state: 'info',
          },
        ],
      },
      {
        id: 'issuers',
        title: 'Para empresas',
        entries: [
          {
            q: '¿Puedo listar mi empresa hoy?',
            a: 'Puedes enviar una solicitud de emisor desde la página Financiación; el operador revisa las solicitudes fuera de la plataforma y nada se lista automáticamente. El registro de campañas actualmente solo contiene la campaña de demostración.',
            state: 'planned',
          },
          {
            q: '¿Qué modelos de financiación cubre el diseño?',
            a: 'Cuatro categorías madre del lado de la participación - derecho / certificado participativo (con Substanzgenussrecht como subtipo), acción, participación indirecta como estructura de titularidad y participación en sociedad comanditaria - y dos categorías madre de deuda, préstamo y bono, cada una emitida como sénior, subordinada o con senioridad no especificada. Cupón cero y convertible son capas de estructura sobre deuda. El hub Aprender explica cada una.',
            state: 'info',
          },
          {
            q: '¿Cómo recibiría un emisor los fondos?',
            a: 'Todo-o-nada: el creador de la campaña solo puede retirar los fondos en escrow si el objetivo se alcanza, y solo tras el plazo. La regla la aplica el contrato inteligente, no una promesa de la plataforma.',
            state: 'live',
          },
          {
            q: '¿Qué exigiría un lanzamiento real?',
            a: 'Una vía de licencia (autorización propia o asociación con un proveedor autorizado), un registro legalmente reconocido para cada instrumento y jurisdicción, procesamiento de pagos a través de un proveedor autorizado, KYC/AML y las páginas y documentos de cumplimiento descritos en los documentos del proyecto. Son decisiones abiertas, no funciones implementadas.',
            state: 'info',
          },
          {
            q: '¿Cuánto cuesta?',
            a: 'El prototipo funciona en alojamiento de nivel gratuito e infraestructura de testnet. No se define ni se cobra ningún modelo de comisiones para emisores o inversores.',
            state: 'info',
          },
        ],
      },
    ],
  },
  profiles: {
    sampleMarker: 'Datos de ejemplo - no es una oferta real',
    list: [
      {
        campaignId: 'fixture-lisbon-riverside',
        issuer: 'Riverside Development Lda (emisor de ejemplo)',
        country: 'PT',
        category: 'Construcción',
        teaser:
          'Rehabilitación de un edificio de apartamentos junto al río en Lisboa, financiada mediante un bono sénior de tipo fijo. Todas las condiciones de esta página son datos de ejemplo.',
        instrumentClass: 'bond',
        instrumentSeniority: 'senior',
        instrumentOverlays: [] as string[],
        interestRate: '6,5% anual (ejemplo)',
        term: 'Hasta 2030-12-31 (ejemplo)',
        minInvestment: '250 USDC de testnet (ejemplo)',
        additionalInfo: [
          {
            label: 'Producto de inversión',
            value: 'Bono sénior (no subordinado, sin garantías). Datos de ejemplo - no es una oferta real',
          },
          {
            label: 'ISIN / WKN',
            value: 'No emitido - este prototipo no emite identificadores de valores',
          },
          {
            label: 'Importe nominal por unidad',
            value: '250 USDC de testnet (ejemplo)',
          },
          { label: 'Suscripción mínima', value: '1 unidad (ejemplo)' },
          {
            label: 'Umbral de financiación',
            value: 'Igual al objetivo de la campaña; todo-o-nada aplicado por el contrato en modo real',
          },
          {
            label: 'Volumen de la emisión',
            value: 'Objetivo de 250.000 USDC de testnet (ejemplo)',
          },
          { label: 'Cálculo de intereses', value: '30E/360 (ejemplo)' },
          {
            label: 'Fechas de pago de intereses',
            value: 'Anualmente el 31 de diciembre, primer pago en 2027 (ejemplo)',
          },
          { label: 'Reembolso', value: 'Al vencimiento (ejemplo)' },
          {
            label: 'Ofrecido en',
            value: 'Sin países de oferta - solo datos de ejemplo',
          },
          {
            label: 'Intermediario',
            value: 'Ninguno. Este prototipo no es un proveedor de servicios de crowdfunding',
          },
        ],
        overview: [
          'Este panel demuestra cómo el contenido de marketing proporcionado por el emisor se separa de los hechos de la plataforma mediante el separador anterior.',
          'Datos de ejemplo - no es una oferta real. La descripción del emisor, el equipo, el modelo de negocio y las finanzas mostrados en una plataforma real serían proporcionados por el emisor y claramente atribuidos.',
        ],
        documents: [
          {
            label: 'Ficha de información fundamental (entrada de ejemplo)',
            note: 'Ningún archivo alojado en este prototipo',
          },
          {
            label: 'Condiciones del bono (entrada de ejemplo)',
            note: 'Ningún archivo alojado en este prototipo',
          },
          {
            label: 'Pitch deck (entrada de ejemplo)',
            note: 'Ningún archivo alojado en este prototipo',
          },
        ],
        news: [
          {
            date: 'Ejemplo',
            text: 'Las actualizaciones de la campaña aparecerían aquí. Esta entrada es un marcador, no una actualización real.',
          },
        ],
      },
      {
        campaignId: 'fixture-alentejo-solar',
        issuer: 'Alentejo Solar Cooperative (emisor de ejemplo)',
        country: 'PT',
        category: 'Energía y servicios públicos',
        teaser:
          'Instalación solar comunitaria en el Alentejo, financiada mediante un bono subordinado con variante de intereses en efectivo. Todas las condiciones de esta página son datos de ejemplo.',
        instrumentClass: 'bond',
        instrumentSeniority: 'subordinated',
        instrumentOverlays: [] as string[],
        interestRate: '7,0% anual en efectivo (ejemplo)',
        term: 'Hasta 2032-06-30 (ejemplo)',
        minInvestment: '250 USDC de testnet (ejemplo)',
        additionalInfo: [
          {
            label: 'Producto de inversión',
            value: 'Bono subordinado. Datos de ejemplo - no es una oferta real',
          },
          {
            label: 'ISIN / WKN',
            value: 'No emitido - este prototipo no emite identificadores de valores',
          },
          {
            label: 'Importe nominal por unidad',
            value: '250 USDC de testnet (ejemplo)',
          },
          {
            label: 'Umbral de financiación',
            value: 'Objetivo de 900.000 USDC de testnet (ejemplo); todo-o-nada en modo real',
          },
          {
            label: 'Subordinación',
            value: 'Los créditos quedan por detrás de los acreedores sénior en caso de insolvencia (condiciones de ejemplo)',
          },
          { label: 'Cálculo de intereses', value: 'act/act (ejemplo)' },
          {
            label: 'Fechas de pago de intereses',
            value: 'Anualmente el 30 de junio, primer pago en 2028 (ejemplo)',
          },
          { label: 'Reembolso', value: 'Al vencimiento (ejemplo)' },
          {
            label: 'Ofrecido en',
            value: 'Sin países de oferta - solo datos de ejemplo',
          },
          {
            label: 'Intermediario',
            value: 'Ninguno. Este prototipo no es un proveedor de servicios de crowdfunding',
          },
        ],
        overview: [
          'Datos de ejemplo - no es una oferta real. Una página de campaña real incluiría la descripción de la cooperativa, el sitio y la venta de energía por el propio emisor.',
        ],
        documents: [
          {
            label: 'Ficha de información fundamental (entrada de ejemplo)',
            note: 'Ningún archivo alojado en este prototipo',
          },
          {
            label: 'Condiciones de emisión (entrada de ejemplo)',
            note: 'Ningún archivo alojado en este prototipo',
          },
        ],
        news: [] as { date: string; text: string }[],
      },
      {
        campaignId: 'fixture-porto-logistics',
        issuer: 'Porto Logistics Hub SA (emisor de ejemplo)',
        country: 'PT',
        category: 'Transporte y logística',
        teaser:
          'Estudio de tokenización para un hub logístico cerca de Oporto, estructurado como bono convertible. Este ejemplo muestra una campaña completada. Todas las condiciones son datos de ejemplo.',
        instrumentClass: 'bond',
        instrumentSeniority: 'unspecified',
        instrumentOverlays: ['convertible'],
        interestRate: '8,0% anual hasta la conversión (ejemplo)',
        term: 'Hasta 2031-12-31 (ejemplo)',
        minInvestment: '500 USDC de testnet (ejemplo)',
        additionalInfo: [
          {
            label: 'Producto de inversión',
            value:
              'Bono con cláusula de conversión (convertible); senioridad no especificada en las condiciones de ejemplo. Datos de ejemplo - no es una oferta real',
          },
          {
            label: 'ISIN / WKN',
            value: 'No emitido - este prototipo no emite identificadores de valores',
          },
          {
            label: 'Importe nominal por unidad',
            value: '500 USDC de testnet (ejemplo)',
          },
          {
            label: 'Umbral de financiación',
            value: 'Objetivo de 500.000 USDC de testnet (ejemplo)',
          },
          {
            label: 'Activación de la conversión',
            value: 'Configurable por emisión; ejemplo: un evento de financiación cualificado anunciado por el emisor',
          },
          {
            label: 'Ventana de conversión',
            value: 'Configurable por emisión; ejemplo: 30 días tras el anuncio de la activación',
          },
          {
            label: 'Cese de intereses',
            value: 'Los intereses se acumulan hasta el día de la conversión (ejemplo)',
          },
          {
            label: 'Reembolso si no se convierte',
            value: 'Al vencimiento (ejemplo)',
          },
          {
            label: 'Ofrecido en',
            value: 'Sin países de oferta - solo datos de ejemplo',
          },
          {
            label: 'Intermediario',
            value: 'Ninguno. Este prototipo no es un proveedor de servicios de crowdfunding',
          },
        ],
        overview: ['Datos de ejemplo - no es una oferta real. Las campañas completadas permanecen visibles con su estado final de financiación, como esta.'],
        documents: [
          {
            label: 'Condiciones del bono convertible (entrada de ejemplo)',
            note: 'Ningún archivo alojado en este prototipo',
          },
        ],
        news: [
          {
            date: 'Ejemplo',
            text: 'Esta campaña cerró con éxito en los datos de ejemplo. Los eventos del emisor post-financiación se seguirían por separado.',
          },
        ],
      },
    ],
  },
  community: {
    loading: 'Cargando...',
    demoBadge: 'DEMO',
    documentsTitle: 'Documentos',
    documentsNote:
      'Los documentos marcados DEMO son plantillas ficticias de este prototipo: no son ofertas, ni asesoramiento, ni información verificada del emisor.',
    documentKinds: {
      kiis: 'KIIS',
      terms: 'Condiciones',
      project: 'Proyecto',
      other: 'Documento',
    },
    newsTitle: 'Noticias',
    newsAuthorDemo: 'publicado por la plataforma (contenido de demostración - sin identidad de emisor verificada)',
    commentsTitle: 'Comentarios',
    commentsEmpty: 'Aún no hay comentarios.',
    commentLabel: 'Tu comentario',
    commentSubmit: 'Publicar comentario',
    commentPostingAs: (name: string) => `Publicando como ${name}. Los comentarios son públicos.`,
    commentsSignInHint: 'Inicia sesión con tu monedero abajo para unirte a la conversación.',
    signInTitle: 'Inicio de sesión de la comunidad',
    signInExplainer:
      'Firma un reto único con tu monedero Freighter para demostrar que controlas la dirección. No se crea ninguna transacción ni se mueven fondos. La sesión desbloquea comentarios, tickets de soporte y solicitudes de emisor.',
    signInButton: 'Iniciar sesión con el monedero',
    signInConnectFirst: 'Conecta primero tu monedero Freighter (arriba en la página).',
    signedInTitle: 'Cuenta de la comunidad',
    signedInAs: 'Sesión iniciada como',
    displayNameLabel: 'Nombre visible (se muestra en tus comentarios)',
    displayNameSave: 'Guardar nombre',
    signOutButton: 'Cerrar sesión',
    ticketsTitle: 'Soporte y feedback',
    ticketsNote:
      'Los tickets son visibles solo para tu cuenta de monedero y el operador del sitio. Esto es un prototipo: no incluyas datos personales, contraseñas ni datos de pago reales.',
    ticketKindLabel: 'Tipo',
    ticketKinds: {
      support: 'Solicitud de soporte',
      feedback: 'Feedback',
    },
    ticketSubjectLabel: 'Asunto',
    ticketBodyLabel: 'Mensaje',
    ticketSubmit: 'Enviar',
    ticketsEmpty: 'Aún no hay tickets.',
    ticketStatus: {
      open: 'Abierto',
      closed: 'Cerrado',
    },
    applicationTitle: 'Solicitar ser emisor',
    applicationNote:
      'Cuéntale al operador el proyecto que te gustaría listar. Enviar este formulario no es una oferta, un listado ni una aprobación: inicia una conversación. Entorno de demostración: no envíes secretos comerciales reales.',
    applicationFields: {
      projectName: 'Nombre del proyecto',
      country: 'País',
      instrumentType: 'Tipo de instrumento (p. ej. bono, capital, participación en ingresos)',
      targetAmount: 'Importe objetivo',
      description: 'Descripción del proyecto',
      contactEmail: 'Email de contacto (opcional)',
    },
    newsFeedTitle: 'Últimas noticias de la campaña',
    newsFeedEmpty: 'Aún no hay noticias de la campaña.',
    myApplicationsTitle: 'Mis solicitudes de emisor',
    myApplicationsEmpty: 'Aún no hay solicitudes.',
    applicationStatus: { received: 'Recibida', under_review: 'En revisión', closed: 'Cerrada' },
    myTicketsTitle: 'Mis tickets de soporte y feedback',
    myCommentsTitle: 'Mis comentarios',
    commentHidden: 'Hidden by moderation',
    applicationValidation: {
      required: 'Rellene este campo.',
      emailInvalid: 'Introduzca una dirección de correo electrónico válida.',
    },
    applicationSubmit: 'Enviar solicitud',
    applicationDone: 'Solicitud recibida. El operador revisa las solicitudes fuera del sitio; nada se lista automáticamente.',
  },
};
