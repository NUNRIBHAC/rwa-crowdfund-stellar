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
      'Esta página describe qué mantiene el prototipo de Blockallisto disponible y recuperable, y qué planificación de continuidad se pretende para una futura plataforma autorizada. La primera sección es factual sobre la demostración en ejecución; la segunda es intención de diseño, no práctica actual.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Postura de continuidad del prototipo (actual)'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Sin activos de clientes en riesgo:'],
        },
        ' la demostración no retiene dinero, fondos de clientes ni custodia. Las contribuciones son tokens de la testnet sin valor monetario, liquidadas por un contrato inteligente de Soroban en la testnet pública de Stellar. El estado del contrato vive en el ledger de la testnet, independientemente de este sitio web.',
      ],
      [
        {
          b: ['Alojamiento:'],
        },
        ' el sitio y la API funcionan en el nivel gratuito de Render; los datos operativos (diario de transacciones, datos de la comunidad) viven en una base de datos Postgres de Neon en su nivel gratuito. Ambos son servicios de terceros con sus propias propiedades de disponibilidad; no se garantiza ningún tiempo de actividad para la demostración.',
      ],
      [
        {
          b: ['Copias de seguridad:'],
        },
        ' [programación y retención de copias de seguridad por definir - los niveles gratuitos no ofrecen copias gestionadas; el estado del contrato en la testnet es recuperable desde el ledger público].',
      ],
      [
        {
          b: ['Separación de entornos:'],
        },
        ' la demostración de cara al usuario, un entorno de staging separado y copias desechables de la base de datos se mantienen aparte para que las pruebas no puedan corromper la demostración.',
      ],
      [
        {
          b: ['Si la demostración no está disponible:'],
        },
        ' ningún usuario pierde nada de valor. El estado de la campaña sigue siendo legible en exploradores públicos de la testnet de Stellar, y las contribuciones siguen rigiéndose por el contrato, no por este sitio.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['2. Plan de continuidad previsto para una plataforma autorizada (no activo)'],
  },
  {
    t: 'p',
    text: [
      'Una plataforma real que gestione ofertas reguladas necesitaría, antes del lanzamiento: objetivos documentados de tiempo y punto de recuperación [valores RTO/RPO por definir con asesoramiento jurídico y de infraestructura]; copias de seguridad gestionadas con procedimientos de restauración probados; un acuerdo de servicios de pago en el que los fondos de los clientes nunca sean retenidos por la plataforma, de modo que un fallo de la plataforma no pueda dejar bloqueado el dinero de los inversores; un plan ordenado de cese de actividad que asegure que las campañas en curso puedan completarse o reembolsarse si la plataforma deja de operar; y procedimientos de comunicación para incidentes que afecten a los usuarios.',
    ],
  },
  {
    t: 'p',
    text: ['Nada de esto está operativo hoy. Publicarlo como plantilla mantiene la superficie de cumplimiento prevista visible y revisable.'],
  },
  {
    t: 'h2',
    text: ['3. Contacto para incidentes'],
  },
  {
    t: 'p',
    text: [
      'Para notificar un incidente de seguridad o disponibilidad que afecte al prototipo: ',
      {
        v: 'contactEmail',
      },
      ', asunto "Incident".',
    ],
  },
];
