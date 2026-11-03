import type { LegalBlock } from './types';

export const blocks: LegalBlock[] = [
  {
    t: 'notice',
    text: [
      'Aviso de privacidad del prototipo en testnet, actualizado el 3 de noviembre de 2026. Describe el tratamiento real de los datos de cuenta; no es asesoramiento jurídico ni prueba de autorización regulatoria. No hay operaciones con dinero real activadas.',
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
      'Los tokens de sesión se guardan con hash en el servidor; el navegador conserva el token de sesión en el almacenamiento local. Las sesiones duran hasta 30 días y pueden revocarse. Si activa un segundo factor con aplicación de autenticación, su semilla se cifra en el servidor y los códigos de recuperación se guardan como hashes. Restablecer la contraseña revoca las sesiones y los tickets de inicio de sesión de segundo factor pendientes, pero no elimina un segundo factor ya registrado.',
    ],
  },
  {
    t: 'p',
    text: [
      'Los registros de cuenta, las credenciales de correo y los datos opcionales del segundo factor no tienen actualmente un plazo automático de eliminación de la cuenta. Los tokens caducados dejan de funcionar al caducar, pero la caducidad no garantiza la eliminación inmediata de sus registros. Todavía no hay una herramienta de eliminación de cuenta de autoservicio. Escriba a blockallisto@gmail.com para solicitar acceso, rectificación o supresión; las solicitudes se revisan frente a obligaciones de seguridad y legales. Los registros y copias de seguridad de los proveedores pueden tener una conservación distinta.',
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
      'El tema, el idioma y las opciones de sesión usan el almacenamiento local del navegador. Los proveedores de alojamiento tratan direcciones IP y metadatos de las solicitudes. La limitación de frecuencia de la aplicación y la caché de reputación de IP usan direcciones IP en memoria transitoria; los diagnósticos de la aplicación usan contadores agregados y no registros con IP sin procesar. Los registros de infraestructura de los proveedores y la conservación de copias de seguridad son independientes. No usamos rastreadores publicitarios ni listas de correo de boletines.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Servicios de seguridad y destinatarios'],
  },
  {
    t: 'p',
    text: [
      'Render aloja la aplicación en Fráncfort y Neon aloja sus datos Postgres. Brevo recibe las direcciones de correo de los destinatarios y el contenido de los correos de verificación y restablecimiento, y trata metadatos de entrega. Cloudflare Turnstile trata señales del navegador y del dispositivo y tokens de desafío para las comprobaciones antibot; la validación en el servidor puede incluir la IP del cliente. Tras una comprobación antibot correcta, ipapi.is recibe la IP del cliente para evaluar su reputación de abuso. La reputación es inicialmente solo de observación; el uso de VPN, proxy o Tor no es por sí solo un motivo de bloqueo. Los errores de los proveedores o el agotamiento del presupuesto de consultas pueden reducir esta capa; el CAPTCHA, los límites de frecuencia y los presupuestos de correo son salvaguardas independientes.',
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
