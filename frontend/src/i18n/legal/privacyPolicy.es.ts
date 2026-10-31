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
      'Esta Política de Privacidad explica qué datos personales trata el prototipo de Blockallisto (el "Servicio"), por qué, y qué derechos tiene usted. El Servicio es un proyecto prototipo operado bajo el nombre Blockallisto. Los datos societarios mostrados para Blockallisto en estos documentos son datos ficticios de demostración (forma jurídica [DEMO] "Lda.", domicilio social [DEMO] "Rua da Demonstracao 0, 0000-000 Lisboa, Portugal", número de registro [DEMO] "000 000 000"); la identidad jurídica registrada tras el nombre Blockallisto no ha sido verificada, y nombrar el proyecto no identifica por sí mismo al responsable del tratamiento. [El responsable del tratamiento - la persona o entidad efectivamente responsable de este tratamiento - se confirmará antes de la publicación.] Las solicitudes de privacidad se atienden en ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Alcance: lo que la demostración no recopila'],
  },
  {
    t: 'p',
    text: [
      'El prototipo actual no tiene ',
      {
        b: ['ni KYC, ni boletines ni pagos'],
      },
      '. El acceso a la comunidad se basa en la cartera: usa una firma de cartera de Stellar, no una contraseña ni un correo electrónico. No pedimos su nombre completo, número de teléfono, documentos de identidad ni tarjeta de pago. Las funciones de la comunidad sí recopilan los datos descritos en la sección 2b: una clave pública, un nombre visible opcional, contenido de texto libre que usted decida enviar y un correo electrónico de contacto opcional en las solicitudes de emisores. No usamos analítica ni rastreadores publicitarios, y las fuentes y recursos del sitio están autoalojados.',
    ],
  },
  {
    t: 'h2',
    text: ['2. Datos que tratamos'],
  },
  {
    t: 'p',
    text: [
      {
        b: ['a) Datos de cartera y de contribuciones.'],
      },
      ' Si conecta una cartera Freighter y hace una contribución de prueba, el backend registra, en una base de datos Postgres (alojada por Neon), un diario de seguridad que contiene: su ',
      {
        b: ['clave pública'],
      },
      ' de Stellar (nunca su clave secreta), el identificador de la campaña, la acción, el importe de la contribución, los sobres de transacción, el hash y el estado de la transacción, y marcas de tiempo. Una clave pública de Stellar es un dato seudónimo; no la vinculamos a su identidad.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        i: ['Conservación:'],
      },
      ' las transacciones preparadas no firmadas caducan a las 24 horas; las transacciones completadas o fallidas se eliminan a los 30 días; una transacción firmada cuyo resultado no esté resuelto se conserva hasta que se resuelva, porque eliminarla podría hacer perder el rastro de una transacción difundida. Los sobres firmados se depuran una vez que la transacción alcanza un estado final. Estas son las reglas de limpieza configuradas en el propio código de la aplicación: describen lo que la aplicación elimina. Los registros de servidor y las copias de seguridad propios de nuestros proveedores de alojamiento pueden conservar datos durante períodos distintos según sus propias políticas de privacidad, y no están cubiertos por estas reglas.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['b) Cuenta de la comunidad y contenido de la comunidad.'],
      },
      ' Si accede a las funciones de la comunidad, el backend almacena, en la misma base de datos Postgres de Neon: su ',
      {
        b: ['clave pública'],
      },
      ', una marca de tiempo de creación de la cuenta y un ',
      {
        b: ['nombre visible'],
      },
      ' opcional (hasta 40 caracteres). El acceso funciona firmando un desafío único del servidor con su cartera (validez de 5 minutos, un solo uso); no se requiere contraseña ni correo electrónico y su clave secreta nunca sale de la cartera. El servidor solo conserva un hash SHA-256 del token de sesión; el token en bruto vive en el almacenamiento local de su navegador. Las sesiones duran 30 días, cerrar sesión elimina la sesión, y los desafíos y sesiones caducados se depuran cada hora.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['Los comentarios'],
      },
      ' son públicos: cada comentario almacena su clave pública, su nombre visible si lo ha definido, el cuerpo (hasta 1000 caracteres), la campaña y una marca de tiempo, y los últimos 100 comentarios por campaña se muestran a cada visitante. Un comentario ocultado por el operador sale de la lista pública de inmediato y se elimina definitivamente 30 días después de ocultarse. ',
      {
        b: ['Los tickets de soporte/comentarios'],
      },
      ' (tipo, asunto de hasta 120 caracteres, cuerpo de hasta 4000 caracteres, estado, marcas de tiempo) y las ',
      {
        b: ['solicitudes de emisores'],
      },
      ' (nombre del proyecto, país, tipo de instrumento, importe objetivo, descripción y un correo electrónico de contacto opcional) son visibles solo para su cuenta de cartera y para el administrador del operador; ambos se eliminan definitivamente a los 90 días (ventana de conservación configurable en el código de la aplicación). Las ',
      {
        b: ['noticias'],
      },
      ' de las campañas las escribe el operador y se etiquetan como contenido de demostración de la plataforma. Su dirección IP se usa en memoria para limitar la frecuencia de solicitudes y se barre en 24 horas; la aplicación no la conserva (los registros de alojamiento se tratan en el punto e).',
    ],
  },
  {
    t: 'p',
    text: [
      'Una advertencia: las claves públicas, los nombres visibles y el contenido de texto libre pueden identificarle aunque nunca pidamos su nombre. No envíe información personal sensible en los campos de la comunidad.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['c) Datos públicos de la blockchain.'],
      },
      ' Las contribuciones de prueba se registran públicamente en la ',
      {
        b: ['testnet'],
      },
      ' de Stellar y son visibles en exploradores públicos. Los registros de la blockchain no pueden ser alterados ni eliminados por nosotros.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['d) Preferencias del dispositivo.'],
      },
      ' Sus elecciones de tema (claro/oscuro) e idioma se almacenan en el almacenamiento local de su navegador. Estos datos permanecen en su dispositivo y no se nos envían.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['e) Registros técnicos.'],
      },
      ' Nuestro proveedor de alojamiento (Render, región de Fráncfort) procesa registros de servidor estándar (como la dirección IP y los metadatos de las solicitudes) para prestar y proteger el Servicio.',
    ],
  },
  {
    t: 'h2',
    text: ['3. Datos que planeamos tratar en versiones futuras (no recopilados hoy)'],
  },
  {
    t: 'p',
    text: [
      'El diseño indicativo de las versiones futuras de Blockallisto -siguiendo las superficies de cumplimiento de plataformas de crowdfunding europeas consolidadas- es tratar categorías adicionales de datos personales ',
      {
        b: ['cuando y si'],
      },
      ' se lancen esas funciones. Las categorías exactas, los proveedores y los umbrales pueden cambiar con el trabajo de diseño y el asesoramiento jurídico:',
    ],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Datos de registro:'],
        },
        ' nombre completo (exactamente como figura en su documento de identidad), dirección de correo electrónico, país de residencia y residencia fiscal.',
      ],
      [
        {
          b: ['Verificación de identidad (KYC/AML):'],
        },
        ' imágenes del documento de identidad, un selfie, número de móvil y resultados de la verificación, tratados con proveedores especializados de verificación externos; para inversores empresariales, titulares reales (normalmente quien posea más del 25%) y origen de los fondos; declaraciones de persona políticamente expuesta (PEP).',
      ],
      [
        {
          b: ['Datos de pago y de reembolso:'],
        },
        ' datos bancarios (como el IBAN) gestionados por prestadores de servicios de pago autorizados, no por nosotros reteniendo fondos de clientes.',
      ],
    ],
  },
  {
    t: 'p',
    text: [
      'Con la excepción del correo electrónico de contacto opcional del emisor descrito en la sección 2b, ninguno de estos datos es recopilado por la demostración actual. Si estas funciones se lanzan, esta Política se actualizará primero, con los proveedores, fines, bases jurídicas y períodos de conservación de cada categoría.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Fines y bases jurídicas (RGPD)'],
  },
  {
    t: 'p',
    text: [
      'Tratamos los datos de la sección 2 para operar, proteger y demostrar el prototipo: preparar y seguir transacciones de prueba, prevenir dobles gastos y resolver transacciones ambiguas, mantener el Servicio fiable y operar las funciones de la comunidad (publicar y moderar comentarios, responder a tickets de soporte y comentarios, y revisar solicitudes de emisores). La base jurídica es nuestro interés legítimo (art. 6.1.f del RGPD) en ejecutar una demostración técnica segura. No usamos sus datos para marketing, elaboración de perfiles ni venta.',
    ],
  },
  {
    t: 'h2',
    text: ['5. Quién trata los datos'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Render'],
        },
        ' (alojamiento, Fráncfort, UE) - ejecuta la aplicación.',
      ],
      [
        {
          b: ['Neon'],
        },
        ' (Postgres gestionado; región AWS Europa (Fráncfort), UE - verificado en la consola de Neon el ',
        {
          v: 'lastUpdated',
        },
        ') - almacena el diario de contribuciones y el almacén de datos de la comunidad.',
      ],
      [
        {
          b: ['Testnet de Stellar'],
        },
        ' (red pública operada por la Stellar Development Foundation, global) - registra las transacciones públicas de prueba.',
      ],
      [
        {
          b: ['GitHub'],
        },
        ' - aloja el código fuente (sin datos de usuarios).',
      ],
    ],
  },
  {
    t: 'p',
    text: ['Cuando el tratamiento se produce fuera de la UE/EEE (por ejemplo, la red global de Stellar), implica únicamente datos seudónimos de la testnet.'],
  },
  {
    t: 'h2',
    text: ['6. Sus derechos bajo el RGPD'],
  },
  {
    t: 'p',
    text: [
      'Usted tiene derecho a acceder, rectificar, suprimir, limitar u oponerse al tratamiento de sus datos personales, y a la portabilidad de los datos, en virtud del Reglamento (UE) 2016/679 (RGPD). También tiene derecho a presentar una reclamación ante la autoridad de control portuguesa, la ',
      {
        b: ['CNPD'],
      },
      ' (Comissao Nacional de Protecao de Dados).',
    ],
  },
  {
    t: 'p',
    text: [
      'Solo podemos localizar los datos vinculados a usted a través de su clave pública de Stellar (y cualquier nombre visible o contenido de texto libre que haya decidido enviar). Los datos ya escritos en una blockchain pública no pueden borrarse; podemos corregir o borrar los registros fuera de la cadena (el diario de contribuciones, su cuenta de la comunidad, comentarios, tickets y solicitudes) a petición, con sujeción a las reglas de conservación de la sección 2.',
    ],
  },
  {
    t: 'h2',
    text: ['7. Brasil (LGPD)'],
  },
  {
    t: 'p',
    text: [
      'La demostración se opera desde Portugal. La Lei Geral de Protecao de Dados de Brasil (Lei no 13.709/2018 - LGPD) puede aplicarse a tratamientos dirigidos a personas en Brasil o que las involucren; si se aplica a este prototipo es una cuestión jurídica por confirmar con asesoramiento. Si y en la medida en que la LGPD se aplique, le otorga derechos sobre sus datos personales similares a los anteriores, y puede contactar con la ANPD (Autoridade Nacional de Protecao de Dados). Use el mismo contacto indicado arriba para cualquier solicitud.',
    ],
  },
  {
    t: 'h2',
    text: ['8. Seguridad'],
  },
  {
    t: 'p',
    text: [
      'Las claves de su cartera nunca salen de su extensión Freighter; el Servicio está diseñado para no poder acceder a ellas. La aplicación se sirve por TLS y los endpoints administrativos están desactivados por defecto (fallo cerrado). Ningún método es absoluto, pero el diseño del prototipo minimiza los datos que existen para ser atacados.',
    ],
  },
  {
    t: 'h2',
    text: ['9. Menores'],
  },
  {
    t: 'p',
    text: ['El Servicio es una demostración técnica y no está dirigido a menores.'],
  },
  {
    t: 'h2',
    text: ['10. Cambios'],
  },
  {
    t: 'p',
    text: [
      'Podemos actualizar esta Política a medida que evolucione el prototipo. La fecha de "Última actualización" muestra la versión vigente. Los cambios sustanciales se reflejarán aquí antes de surtir efecto.',
    ],
  },
  {
    t: 'h2',
    text: ['11. Contacto'],
  },
  {
    t: 'p',
    text: [
      'Preguntas y solicitudes de privacidad: ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
];
