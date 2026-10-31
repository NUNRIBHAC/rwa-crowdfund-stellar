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
    t: 'h2',
    text: ['Lea esto primero: la demostración de hoy no implica dinero real'],
  },
  {
    t: 'p',
    text: [
      'Blockallisto es actualmente un ',
      {
        b: ['prototipo en la testnet de Stellar'],
      },
      '. Todas las contribuciones usan tokens de prueba ',
      {
        b: ['sin valor monetario'],
      },
      '. No puede perder dinero real en esta demostración, y nada en ella constituye una oportunidad real de inversión.',
    ],
  },
  {
    t: 'p',
    text: [
      'Las advertencias siguientes explican los riesgos que ',
      {
        b: ['se aplicarían'],
      },
      ' al tipo de inversión que Blockallisto demuestra: crowdfunding en activos del mundo real a través de infraestructura de criptoactivos. Se publican ahora para que la conversación sobre el riesgo forme parte del producto desde el primer día.',
    ],
  },
  {
    t: 'h2',
    text: ['Advertencia general'],
  },
  {
    t: 'p',
    text: [
      'Invertir en proyectos de crowdfunding -ya sea en activos del mundo real como inmuebles o empresas, o a través de criptoactivos y tokens- es de ',
      {
        b: ['alto riesgo'],
      },
      '. Podría perder ',
      {
        b: ['todo el dinero que invierta'],
      },
      '. Estas inversiones no suelen estar ',
      {
        b: ['cubiertas'],
      },
      ' por sistemas de garantía de depósitos ni de indemnización de inversores.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['Nunca invierta dinero que no pueda permitirse perder.'],
      },
      ' Para hacerse una idea de la escala, las plataformas de referencia de nuestro corpus de investigación incluyen orientaciones concretas de diversificación: la página de advertencias de riesgo de CONDA aconseja no invertir más de aproximadamente el 10% de sus fondos libremente disponibles en esta clase de activos, y la ficha estándar austriaca del inversor en crowdfunding (régimen AltFG, observada en dagobertinvest) advierte contra invertir más del 10% del patrimonio neto. Esta es la práctica observada de comunicación de riesgos de plataformas consolidadas, citada como punto de referencia: no es una norma legal aplicable a esta demostración, ni una garantía de que ningún porcentaje sea seguro para su situación. Repartir un importe menor entre varios proyectos reduce, pero nunca elimina, el riesgo de pérdida total.',
    ],
  },
  {
    t: 'h2',
    text: ['Riesgos específicos'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Pérdida de capital.'],
        },
        ' El proyecto que apoye puede fracasar, rendir por debajo de lo esperado o perder todo su valor. Los emisores pueden llegar a ser insolventes, y de hecho lo hacen, tras rondas de financiación exitosas. Los rendimientos nunca están garantizados.',
      ],
      [
        {
          b: ['Iliquidez.'],
        },
        ' Las posiciones de crowdfunding y tokenizadas pueden ser difíciles o imposibles de vender. Puede no existir mercado secundario, las transmisiones pueden requerir el consentimiento del emisor o de la plataforma y un destinatario verificado, y puede tener que mantener la posición hasta que el proyecto termine, o más. (En el prototipo actual ni siquiera existe un token transferible.)',
      ],
      [
        {
          b: ['Subordinación.'],
        },
        ' Los instrumentos subordinados o "junior" van por detrás de otros acreedores; con subordinación cualificada puede no recibir nada mientras el emisor esté sobreendeudado, y los créditos de intereses o de reembolso pueden suspenderse por completo.',
      ],
      [
        {
          b: ['Riesgo de plazo y de prórroga.'],
        },
        ' Los préstamos y bonos pueden prorrogarse más allá de su plazo indicado en virtud de sus contratos, retrasando el reembolso.',
      ],
      [
        {
          b: ['Riesgo de valoración.'],
        },
        ' Los activos del mundo real son difíciles de valorar; las valoraciones indicadas pueden ser erróneas o estar desactualizadas. (En esta demostración, todas las valoraciones e identidades de emisores son datos ficticios.)',
      ],
      [
        {
          b: ['Riesgo de contrato inteligente.'],
        },
        ' El código puede contener errores o ser explotado, y las transacciones en una blockchain son generalmente irreversibles.',
      ],
      [
        {
          b: ['Riesgo de red.'],
        },
        ' Las redes blockchain pueden sufrir congestión, interrupciones, forks o cambios de protocolo fuera del control de cualquiera.',
      ],
      [
        {
          b: ['Riesgo de claves y de cartera.'],
        },
        ' Si pierde la clave secreta o la frase de recuperación de su cartera, o alguien se las roba, sus fondos desaparecen y nadie puede recuperarlos.',
      ],
      [
        {
          b: ['Riesgo regulatorio.'],
        },
        ' Las normas sobre crowdfunding (ECSPR en la UE) y criptoactivos (MiCA) están evolucionando. Una estructura posible hoy puede cambiar, y las ofertas pueden estar restringidas donde usted vive.',
      ],
      [
        {
          b: ['Riesgo de volatilidad y cambiario.'],
        },
        ' Los precios de los criptoactivos pueden moverse bruscamente; las stablecoins pueden perder la paridad; los tipos de cambio se mueven.',
      ],
      [
        {
          b: ['Riesgo de contraparte y de fraude.'],
        },
        ' Los emisores pueden gestionar mal los fondos o tergiversar sus proyectos. Las verificaciones de la plataforma reducen, pero no pueden eliminar, este riesgo.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['Sobre las futuras protecciones del inversor'],
  },
  {
    t: 'p',
    text: [
      'El reglamento europeo de crowdfunding (el ECSPR, Reglamento (UE) 2020/1503) exige que las plataformas autorizadas ofrezcan categorización de inversores, una prueba inicial de conocimientos, una simulación de la capacidad de soportar pérdidas y un período de reflexión precontractual de cuatro días naturales para inversores no sofisticados antes de que una oferta sea vinculante; las plataformas de referencia de nuestro corpus de investigación los implementan bajo sus propias autorizaciones. La demostración de Blockallisto no tiene ninguno de estos mecanismos, porque ninguna inversión real es posible. Si alguna vez se lanza una versión regulada, esas protecciones -y sus límites- se describirán en sus propios documentos revisados jurídicamente. Protecciones como los períodos de reflexión le permiten retirar una oferta; no reducen el riesgo de inversión subyacente.',
    ],
  },
  {
    t: 'h2',
    text: ['Sin asesoramiento'],
  },
  {
    t: 'p',
    text: [
      'Nada en este Servicio constituye asesoramiento de inversión, jurídico o fiscal, ni una recomendación de comprar o vender nada. Los resultados pasados -reales o simulados- no predicen resultados futuros. Considere asesoramiento profesional independiente y diversifique: no concentre sus ahorros en un único proyecto o tipo de activo.',
    ],
  },
  {
    t: 'h2',
    text: ['Reconocimiento'],
  },
  {
    t: 'p',
    text: [
      'Al usar esta demostración, reconoce que ha leído y entendido esta Divulgación de Riesgos. Antes de cualquier lanzamiento real futuro, se aplicará una declaración de riesgos más completa y revisada jurídicamente.',
    ],
  },
];
