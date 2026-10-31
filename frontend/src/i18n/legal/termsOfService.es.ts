import type { LegalBlock } from './types';

export const blocks: LegalBlock[] = [
  {
    t: 'notice',
    text: [
      'Plantilla de demostración: esta página es un documento ilustrativo para el prototipo de Blockallisto, no asesoramiento jurídico. No ha sido revisada por un abogado y no constituye prueba de ningún registro mercantil ni autorización regulatoria. Los datos societarios marcados como [DEMO] son datos ficticios de demostración.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['Última actualización:'],
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
      'Estos Términos de Servicio (los "Términos") rigen el uso del sitio web y la aplicación de demostración de Blockallisto (el "Servicio"), un proyecto prototipo operado por Blockallisto ("nosotros"). Los datos societarios mostrados para Blockallisto en estos Términos son datos ficticios de demostración: forma jurídica "Lda." [DEMO], domicilio social "Rua da Demonstracao 0, 0000-000 Lisboa, Portugal" [DEMO], número de registro "000 000 000" [DEMO]. La denominación social, la forma, el domicilio y el estatus registral de Blockallisto no han sido verificados, y no se afirma ningún registro. Contacto: ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
  {
    t: 'p',
    text: ['Al utilizar el Servicio, acepta estos Términos. Si no está de acuerdo, no utilice el Servicio.'],
  },
  {
    t: 'h2',
    text: ['1. Qué es Blockallisto hoy'],
  },
  {
    t: 'p',
    text: [
      'Blockallisto es una ',
      {
        b: ['demostración de prototipo'],
      },
      ' de un concepto de crowdfunding de activos del mundo real tokenizados, que funciona íntegramente en la ',
      {
        b: ['red de pruebas de Stellar (testnet)'],
      },
      '.',
    ],
  },
  {
    t: 'p',
    text: ['Esto significa, en claro:'],
  },
  {
    t: 'ul',
    items: [
      [
        'El Servicio ',
        {
          b: ['no'],
        },
        ' es una plataforma de crowdfunding en el sentido jurídico. Nosotros ',
        {
          b: ['no'],
        },
        ' somos un prestador de servicios de crowdfunding autorizado en virtud del Reglamento (UE) 2020/1503 (ECSPR) ni de ningún otro régimen, y no hacemos ',
        {
          b: ['ninguna oferta real'],
        },
        ' de inversión.',
      ],
      [
        'Nada en el Servicio constituye una oferta, una solicitud, una recomendación ni asesoramiento de inversión, jurídico, fiscal o financiero, en ninguna jurisdicción.',
      ],
      [
        'No interviene dinero real. Las contribuciones en la demostración usan ',
        {
          b: ['tokens de la testnet de Stellar (USDC de prueba) que no tienen valor monetario'],
        },
        ' y no pueden canjearse por fondos reales.',
      ],
      [
        'Las campañas de ejemplo son ilustraciones ficticias. Las identidades de los emisores, las valoraciones, las cifras y los resultados mostrados en la demostración son ',
        {
          b: ['datos ficticios'],
        },
        ', no oportunidades reales.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['2. Qué le permite hacer el Servicio'],
  },
  {
    t: 'ul',
    items: [
      ['Explorar y filtrar campañas de inversión de ejemplo y leer sus condiciones estructuradas.'],
      ['Usar el centro de aprendizaje, el glosario y las preguntas frecuentes para entender los instrumentos de inversión.'],
      [
        'Conectar una cartera ',
        {
          b: ['Freighter'],
        },
        ' (una extensión del navegador) y hacer ',
        {
          b: ['contribuciones de prueba'],
        },
        ' a la campaña de demostración en la testnet de Stellar.',
      ],
    ],
  },
  {
    t: 'p',
    text: [
      'Las contribuciones de prueba son gestionadas por un contrato inteligente de Soroban con el siguiente comportamiento: financiación de todo o nada, pago a la campaña solo tras su fecha límite, contribuciones limitadas al objetivo de la campaña y saldos registrados en el contrato. No se emite ningún token transferible.',
    ],
  },
  {
    t: 'h2',
    text: ['3. Funciones previstas (aún no activas)'],
  },
  {
    t: 'p',
    text: [
      'Blockallisto se está diseñando tomando como referencia las superficies de cumplimiento de plataformas de crowdfunding europeas consolidadas. Las versiones futuras ',
      {
        b: ['podrían'],
      },
      ' incluir: cuentas de usuario completas con registro por correo electrónico (más allá del acceso comunitario opcional); verificación de identidad (KYC/AML), incluidas comprobaciones de titular real y de origen de los fondos para inversores empresariales; categorización de inversores con una prueba inicial de conocimientos y una simulación de la capacidad de soportar pérdidas; un período de reflexión precontractual para inversores no sofisticados; fichas de información fundamental sobre la inversión por campaña; pagos procesados por prestadores de servicios de pago autorizados (nunca por nosotros reteniendo fondos de clientes); gestión de reclamaciones y políticas de conflictos de interés; y restricciones de venta por jurisdicción.',
    ],
  },
  {
    t: 'p',
    text: [
      'Nada de esto existe hoy. La lista anterior es una orientación de diseño indicativa extraída de nuestro corpus de investigación, no una especificación: los detalles, los umbrales y funciones enteras pueden cambiar con el trabajo de diseño y el asesoramiento jurídico. Estas funciones solo se lanzarán con términos actualizados y revisados jurídicamente, y solo con las autorizaciones regulatorias que requieran. Nada en esta sección constituye un compromiso de fecha de lanzamiento ni de licencia.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Elegibilidad y uso aceptable'],
  },
  {
    t: 'p',
    text: [
      'El Servicio está destinado a adultos (18+). No está dirigido a ninguna persona en una jurisdicción donde la visualización de contenido de inversión en crowdfunding de este tipo esté restringida, y no debe presentarse a personas estadounidenses como una oportunidad de inversión.',
    ],
  },
  {
    t: 'p',
    text: [
      'Usted se compromete a no: atacar, sondear o interrumpir el Servicio o su infraestructura; abusar, extraer datos a ritmos abusivos o interferir con otros usuarios; tergiversar la demostración como un servicio de inversión real; ni usar el Servicio para nada ilícito.',
    ],
  },
  {
    t: 'h2',
    text: ['5. Su cartera y sus claves'],
  },
  {
    t: 'ul',
    items: [
      [
        'Su cartera es ',
        {
          b: ['no custodiada'],
        },
        ': su clave secreta y su frase de recuperación permanecen dentro de su propia extensión Freighter. Nunca las vemos, almacenamos ni pedimos.',
      ],
      [
        {
          b: ['Nunca'],
        },
        ' introduzca su clave secreta ni su frase de recuperación en ningún sitio web, incluido este. Cualquiera que se la pida está intentando robarle.',
      ],
      [
        'Cada transacción está firmada por usted en su cartera. Las transacciones en la testnet de Stellar se registran públicamente y pueden consultarse en exploradores públicos de la testnet.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['6. Propiedad intelectual'],
  },
  {
    t: 'p',
    text: [
      'El Servicio, su contenido y su código son Copyright (c) 2026 Nuno Ribeiro, todos los derechos reservados. No se concede ninguna licencia de código abierto ni patente. Puede ver y usar la demostración para evaluarla; no puede copiarla, republicarla ni revenderla.',
    ],
  },
  {
    t: 'h2',
    text: ['7. Disponibilidad y cambios'],
  },
  {
    t: 'p',
    text: [
      'El Servicio funciona en alojamiento de nivel gratuito y puede tardar en arrancar, no estar disponible, cambiar o retirarse en cualquier momento sin previo aviso. Las funciones etiquetadas como "no construidas" (cuentas, KYC, pagos fiduciarios, panel del inversor) aún no existen.',
    ],
  },
  {
    t: 'h2',
    text: ['8. Exenciones de responsabilidad y limitación de responsabilidad'],
  },
  {
    t: 'p',
    text: [
      'El Servicio se proporciona ',
      {
        b: ['"tal cual" y "según disponibilidad"'],
      },
      ', sin garantías de ningún tipo, expresas o implícitas, incluidas la exactitud, la idoneidad para un fin particular o la no infracción. En la medida máxima permitida por la ley, no somos responsables de daños indirectos, incidentales o consecuentes, ni de ninguna pérdida derivada del uso que haga del Servicio, de su cartera o de la red Stellar. Nada en estos Términos excluye la responsabilidad que no pueda excluirse por ley.',
    ],
  },
  {
    t: 'h2',
    text: ['9. Ley aplicable'],
  },
  {
    t: 'p',
    text: [
      'Estos Términos se rigen por las leyes de ',
      {
        b: ['Portugal'],
      },
      ' y el derecho de la Unión Europea aplicable, sin perjuicio de las normas imperativas de protección del consumidor de su país de residencia.',
    ],
  },
  {
    t: 'h2',
    text: ['10. Cambios en estos Términos'],
  },
  {
    t: 'p',
    text: [
      'Podemos actualizar estos Términos en cualquier momento. La fecha de "Última actualización" muestra la versión vigente. El uso continuado tras un cambio significa que acepta los nuevos Términos.',
    ],
  },
  {
    t: 'h2',
    text: ['11. Contacto'],
  },
  {
    t: 'p',
    text: [
      'Preguntas sobre estos Términos: ',
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
        b: ['Divulgaciones del operador no resueltas:'],
      },
      ' los datos del operador marcados como DEMO en estos Términos son ilustrativos y no satisfacen ninguna obligación imperativa de identificación del operador (como un aviso legal bajo las normas portuguesas o europeas de comercio electrónico, medios o consumo). No se ha determinado si tal obligación se aplica a este servicio prototipo; cualquier divulgación exigida se añadirá aquí o en una página enlazada antes de cualquier lanzamiento real.',
    ],
  },
];
