// Generated from frontend/i18n-json/ by scripts/i18n-import.mjs.
// Edit the JSON (Weblate) or this file, then run npm run i18n:export / i18n:import to sync.

import type { LegalBlock } from './types';

export const blocks: LegalBlock[] = [
  {
    t: 'notice',
    text: [
      'Aviso de privacidad del prototipo en testnet, actualizado el 24 de noviembre de 2026. Describe el tratamiento real de los datos de cuenta; no es asesoramiento jurídico ni prueba de autorización regulatoria. No hay operaciones con dinero real activadas.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Responsable y contacto'],
  },
  {
    t: 'p',
    text: [
      'Nuno Ribeiro es el responsable del tratamiento de los datos personales tratados por el prototipo Blockallisto en testnet. Contacto para solicitudes de privacidad: blockallisto@gmail.com. Blockallisto es el nombre de un proyecto, no una afirmación de que exista una empresa registrada. Los datos ficticios de empresa de otras plantillas legales DEMO no identifican al responsable de los datos de cuenta.',
    ],
  },
  {
    t: 'h2',
    text: ['2. Datos de cuenta y de comunidad'],
  },
  {
    t: 'p',
    text: [
      'El registro con correo y contraseña almacena en la base de datos de la comunidad su dirección de correo normalizada, un hash de contraseña scrypt con sal, el identificador de cuenta, el idioma preferido del correo, el estado de verificación, marcas de tiempo y registros de inicios de sesión fallidos y bloqueos. No guardamos su contraseña en texto plano. Los tokens de verificación y de restablecimiento se guardan con hash y son de un solo uso: los enlaces de verificación caducan a las 24 horas y los de restablecimiento a la hora. Una cuenta de correo recibe un identificador interno de clave pública; su clave privada generada se descarta. Esto no le da una cartera capaz de firmar transacciones en la blockchain.',
    ],
  },
  {
    t: 'p',
    text: [
      'El inicio de sesión con cartera sigue siendo opcional y usa un desafío firmado de un solo uso válido durante cinco minutos. Cuando hay un proveedor de inicio de sesión social configurado, guardamos el nombre del proveedor, el identificador estable del sujeto, el correo verificado si se devuelve y las marcas de tiempo de acceso; no fusionamos cuentas automáticamente por correo. El nuevo registro social puede seguir restringido por separado del registro con correo y contraseña. Su correo no se usa como etiqueta de autor en comentarios públicos.',
    ],
  },
  {
    t: 'p',
    text: [
      'Los tokens de sesión se guardan como hashes en el servidor. El navegador envía la sesión en una cookie HttpOnly, limitada al host y Secure en HTTPS; JavaScript solo guarda un marcador. Las credenciales antiguas en almacenamiento local se migran y eliminan. Las sesiones duran hasta 30 días y pueden revocarse. Las semillas del autenticador se cifran y los códigos de recuperación se guardan como hashes. Restablecer la contraseña revoca sesiones y solicitudes pendientes del segundo factor, sin eliminar el factor inscrito.',
    ],
  },
  {
    t: 'p',
    text: [
      'Las cuentas de correo verificado pueden solicitar la eliminación en el formulario de la cuenta con la contraseña actual, confirmación DELETE y código actual del segundo factor si está activo. Los registros operativos vinculados y las cuentas de operador pueden bloquearla. No se garantiza borrar todos los datos: no se eliminan copias de seguridad, diarios de transacciones separados, registros de proveedores ni datos públicos de blockchain. Otras solicitudes: blockallisto@gmail.com. La caducidad no garantiza la eliminación inmediata de registros.',
    ],
  },
  {
    t: 'p',
    text: [
      'Los comentarios (identificador de clave pública, nombre visible opcional, texto, campaña y marca de tiempo) son públicos. Se muestran los últimos 100 por campaña; los comentarios ocultos se eliminan a los 30 días. Los tickets de soporte y comentarios, las solicitudes de emisores y las notificaciones son privados para la cuenta y los roles de operador autorizados, y se eliminan a los 90 días según las reglas de limpieza de la aplicación. Evite incluir información personal sensible en los campos de texto libre.',
    ],
  },
  {
    t: 'h2',
    text: ['3. Transacciones de prueba y datos del dispositivo'],
  },
  {
    t: 'p',
    text: [
      'Conectar una cartera o preparar contribuciones de prueba registra en el diario de seguridad claves públicas de cartera, identificadores de campaña, importes, sobres de transacción, hashes, estado y marcas de tiempo. Las preparaciones sin firmar caducan a las 24 horas; las transacciones finales se eliminan a los 30 días. Las transacciones firmadas sin resolver se conservan hasta resolverse y los sobres firmados se borran tras la finalidad. No podemos borrar los registros públicos de la testnet de Stellar. Las claves secretas de la cartera permanecen en su cartera.',
    ],
  },
  {
    t: 'p',
    text: [
      'Las preferencias de tema e idioma usan almacenamiento local; el secreto de sesión usa una cookie. Los proveedores de alojamiento procesan IP y metadatos de solicitudes. Los límites y la caché de reputación IP usan memoria temporal. Los registros de proveedores y las copias tienen retención separada. No usamos rastreadores publicitarios ni listas de boletines.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Servicios de seguridad y destinatarios'],
  },
  {
    t: 'p',
    text: [
      'El 19 de noviembre de 2026 se verificaron el sitio y la API en una VM de Oracle Cloud con PostgreSQL 17 local para los datos operativos. Esta comprobación fechada no demuestra el estado actual del alojamiento ni su disponibilidad. Brevo recibe las direcciones de correo de los destinatarios y el contenido de los correos de verificación y restablecimiento, y trata metadatos de entrega. Cloudflare Turnstile trata señales del navegador y del dispositivo y tokens de desafío para las comprobaciones antibot; la validación en el servidor puede incluir la IP del cliente. Tras una comprobación antibot correcta, ipapi.is recibe la IP del cliente para evaluar su reputación de abuso. La reputación es inicialmente solo de observación; el uso de VPN, proxy o Tor no es por sí solo un motivo de bloqueo. Los errores de los proveedores o el agotamiento del presupuesto de consultas pueden reducir esta capa; el CAPTCHA, los límites de frecuencia y los presupuestos de correo son salvaguardas independientes.',
    ],
  },
  {
    t: 'p',
    text: [
      'Cuando el inicio de sesión social está activado, el proveedor de identidad elegido trata esa autenticación según sus propios términos. La testnet de Stellar es pública y global. GitHub aloja el código fuente, no la base de datos de cuentas. Los proveedores de seguridad y de correo pueden tratar datos fuera del EEE; no suponga que todos los encargados son solo de la UE. Sus políticas vigentes y las garantías aplicables rigen su propio tratamiento: https://www.brevo.com/legal/privacypolicy/ ; https://www.cloudflare.com/privacypolicy/ ; https://ipapi.is/privacy.html ; https://ipapi.is/terms.html .',
    ],
  },
  {
    t: 'h2',
    text: ['5. Finalidad y derechos'],
  },
  {
    t: 'p',
    text: [
      'Los datos se usan para ofrecer las funciones solicitadas de cuenta y comunidad del prototipo, verificar el acceso a la cuenta, atender solicitudes de soporte y proteger el servicio frente a abusos. Estas finalidades operativas y de seguridad se basan en intereses legítimos conforme al artículo 6, apartado 1, letra f), del RGPD, sin perjuicio de sus derechos y de la evaluación que exige la ley. Este aviso no certifica el cumplimiento ni sustituye una revisión jurídica. No vendemos datos de cuenta ni los usamos para publicidad.',
    ],
  },
  {
    t: 'p',
    text: [
      'Puede solicitar acceso, rectificación, supresión, limitación o portabilidad, u oponerse al tratamiento, escribiendo a blockallisto@gmail.com. Puede presentar una reclamación ante la CNPD portuguesa o ante su autoridad de control competente. El operador no puede eliminar los registros públicos de la blockchain. El prototipo no está dirigido a menores. La recogida de documentos de identidad y KYC, las ofertas de inversión reales, los pagos en moneda fiduciaria y las operaciones con dinero real no están activadas. Cualquier cambio posterior requiere un nuevo aviso antes de que comience ese tratamiento.',
    ],
  },
];
