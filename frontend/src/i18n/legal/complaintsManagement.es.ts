// Generated from frontend/i18n-json/ by scripts/i18n-import.mjs.
// Edit the JSON (Weblate) or this file, then run npm run i18n:export / i18n:import to sync.

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
      'Esta página explica cómo reclamar sobre el prototipo de Blockallisto y cómo se tramitan las reclamaciones. Blockallisto es hoy una demostración en la testnet de Stellar sin fondos reales involucrados; el proceso de tramitación descrito abajo es real para la demostración, mientras que el marco regulatorio formal que refleja se aplica solo a una plataforma autorizada.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Cómo reclamar'],
  },
  {
    t: 'p',
    text: [
      'Envíe un correo electrónico a ',
      {
        v: 'contactEmail',
      },
      ' con el asunto "Complaint". Incluya: qué ocurrió, cuándo, la página o función involucrada y el resultado que pide. Las reclamaciones son gratuitas.',
    ],
  },
  {
    t: 'p',
    text: [
      'Para el prototipo existe también un formulario de ticket de soporte en el sitio; las reclamaciones enviadas por ahí se tramitan de la misma manera.',
    ],
  },
  {
    t: 'h2',
    text: ['2. Qué ocurre después'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Acuse de recibo:'],
        },
        ' confirmamos la recepción en un plazo de [10 días hábiles - valor de plantilla].',
      ],
      [
        {
          b: ['Investigación:'],
        },
        ' el operador examina la reclamación contra los registros (contenido de la página, eventos del contrato, historial de soporte). Es posible que se le pida una aclaración.',
      ],
      [
        {
          b: ['Respuesta:'],
        },
        ' una respuesta razonada en un plazo de [20 días hábiles - valor de plantilla] desde el acuse de recibo. Si se necesita más tiempo, lo decimos y explicamos por qué.',
      ],
      [
        {
          b: ['Registro:'],
        },
        ' las reclamaciones y sus resultados se anotan en un libro de reclamaciones conservado durante [5 años - valor de plantilla], que contiene la reclamación, la investigación y la resolución.',
      ],
    ],
  },
  {
    t: 'p',
    text: [
      'Los plazos de la plantilla son valores indicativos extraídos de la práctica común de las plataformas europeas, no compromisos jurídicos; los valores finales requieren asesoramiento jurídico.',
    ],
  },
  {
    t: 'h2',
    text: ['3. Si no queda satisfecho'],
  },
  {
    t: 'p',
    text: [
      'Para el prototipo no existe vía de escalado a una autoridad de supervisión, porque el operador no es un prestador de servicios de crowdfunding autorizado y no existe ningún servicio de inversión real. Para una futura plataforma autorizada, esta sección nombrará el canal de reclamación de la autoridad competente (en Portugal, la CMVM) y cualquier organismo aplicable de resolución extrajudicial de litigios antes de cualquier oferta real.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Usar las reclamaciones para mejorar'],
  },
  {
    t: 'p',
    text: [
      'Los temas recurrentes de las reclamaciones se revisan y alimentan correcciones de producto y de contenido. La propia hoja de ruta del prototipo trata los datos de reclamaciones como una entrada para cambios de diseño, no solo para la resolución caso por caso.',
    ],
  },
];
