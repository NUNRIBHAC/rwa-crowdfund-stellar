// Generated from frontend/i18n-json/ by scripts/i18n-import.mjs.
// Edit the JSON (Weblate) or this file, then run npm run i18n:export / i18n:import to sync.

import type { LegalBlock } from './types';

export const blocks: LegalBlock[] = [
  {
    t: 'notice',
    text: [
      'Aviso de privacidade do protótipo de testnet, atualizado em 20 de novembro de 2026. Descreve o tratamento real dos dados de conta; não é aconselhamento jurídico nem prova de autorização regulatória. Não estão ativas operações com dinheiro real.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Responsável e contacto'],
  },
  {
    t: 'p',
    text: [
      'Nuno Ribeiro é o responsável pelo tratamento dos dados pessoais do protótipo Blockallisto na testnet. Contacto para pedidos de privacidade: blockallisto@gmail.com. Blockallisto é o nome do projeto, não uma afirmação de existência de empresa registada. Os dados fictícios de empresa noutros modelos legais DEMO não identificam o responsável pelos dados de conta.',
    ],
  },
  {
    t: 'h2',
    text: ['2. Dados de conta e comunidade'],
  },
  {
    t: 'p',
    text: [
      'O registo com email e palavra-passe guarda o email normalizado, um hash scrypt com salt da palavra-passe, identificador de conta, idioma preferido dos emails, estado de verificação, datas e registos de tentativas falhadas/bloqueio na base de dados comunitária. Não guardamos a palavra-passe em texto simples. Os tokens de verificação e recuperação são guardados como hashes e são de utilização única: os de verificação expiram em 24 horas e os de recuperação numa hora. A conta de email recebe um identificador interno de chave pública; a chave privada gerada é descartada. Isto não cria uma carteira capaz de assinar transações na blockchain.',
    ],
  },
  {
    t: 'p',
    text: [
      'O acesso por carteira continua opcional e usa um desafio assinado de utilização única, válido por cinco minutos. Quando há acesso social configurado, guardamos o fornecedor, o identificador estável atribuído por ele, o email verificado se devolvido e as datas de acesso; não fundimos contas automaticamente pelo email. O registo social pode continuar restrito separadamente do registo por email. O seu email não é usado como nome público de autor de comentários.',
    ],
  },
  {
    t: 'p',
    text: [
      'Os tokens de sessão são guardados como hashes no servidor. O navegador envia a sessão num cookie HttpOnly, limitado ao host e Secure em HTTPS; o JavaScript guarda apenas um marcador. As credenciais antigas em armazenamento local são migradas e removidas. As sessões duram até 30 dias e podem ser revogadas. As sementes do autenticador são cifradas no servidor e os códigos de recuperação são hashes. A reposição da palavra-passe revoga sessões e pedidos pendentes de segundo fator, sem remover o fator já inscrito.',
    ],
  },
  {
    t: 'p',
    text: [
      'As contas de email verificado podem pedir a eliminação no formulário da conta, com a palavra-passe atual, confirmação DELETE e código atual do segundo fator, quando ativo. Registos operacionais associados ou uma conta de operador podem impedir a eliminação. Isto não garante apagar todos os dados: cópias de segurança, registos de transações separados, registos dos fornecedores e dados públicos da blockchain não são apagados. Outros pedidos podem ser enviados para blockallisto@gmail.com. A expiração não garante remoção imediata dos registos guardados.',
    ],
  },
  {
    t: 'p',
    text: [
      'Os comentários (identificador de chave pública, nome opcional, texto, campanha e data) são públicos. São apresentados os últimos 100 por campanha; comentários ocultados são eliminados após 30 dias. Pedidos de suporte/feedback, candidaturas de emissor e notificações são privados para a conta e funções autorizadas do operador e são eliminados após 90 dias pelas regras de limpeza da aplicação. Evite dados pessoais sensíveis em campos de texto livre.',
    ],
  },
  {
    t: 'h2',
    text: ['3. Transações de teste e dados do dispositivo'],
  },
  {
    t: 'p',
    text: [
      'Ao ligar uma carteira ou preparar contribuições de teste, o diário de segurança regista chaves públicas, identificadores de campanha, montantes, envelopes de transação, hashes, estados e datas. Preparações não assinadas expiram em 24 horas; transações finais são limpas após 30 dias. Transações assinadas por resolver ficam até resolução e os envelopes assinados são removidos após estado final. Não podemos apagar registos públicos da testnet Stellar. As chaves secretas ficam na sua carteira.',
    ],
  },
  {
    t: 'p',
    text: [
      'As preferências de tema e idioma usam armazenamento local; o segredo da sessão usa um cookie. Os fornecedores de alojamento tratam endereços IP e metadados dos pedidos. Os limites e a cache de reputação IP usam memória temporária. Os registos dos fornecedores e as cópias de segurança têm retenção separada. Não usamos rastreadores publicitários nem listas de newsletters.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Serviços de segurança e destinatários'],
  },
  {
    t: 'p',
    text: [
      'O site e a API correm numa VM da Oracle Cloud com PostgreSQL 17 local para dados operacionais. Este host partilhado não garante disponibilidade. Brevo recebe emails de destinatários e o conteúdo das mensagens de verificação/recuperação e trata metadados de entrega. O Cloudflare Turnstile trata sinais do navegador/dispositivo e tokens para controlo de bots; a validação no servidor pode incluir o IP do cliente. Após um controlo de bots bem-sucedido, a ipapi.is recebe o IP para avaliação de abuso. A reputação é inicialmente apenas observação; usar VPN, proxy ou Tor, por si só, não provoca bloqueio. Falhas ou esgotamento do orçamento de consultas podem reduzir esta camada; CAPTCHA, limites de pedidos e orçamentos de email são proteções separadas.',
    ],
  },
  {
    t: 'p',
    text: [
      'Quando existe acesso social, o fornecedor de identidade escolhido trata essa autenticação segundo os seus termos. A testnet Stellar é pública e global. O GitHub aloja código, não a base de dados de contas. Fornecedores de segurança e email podem tratar dados fora do EEE; não se deve presumir que todos são exclusivamente europeus. As políticas atuais e salvaguardas aplicáveis regem o seu tratamento: https://www.brevo.com/legal/privacypolicy/ ; https://www.cloudflare.com/privacypolicy/ ; https://ipapi.is/privacy.html ; https://ipapi.is/terms.html .',
    ],
  },
  {
    t: 'h2',
    text: ['5. Finalidades e direitos'],
  },
  {
    t: 'p',
    text: [
      'Os dados são usados para disponibilizar a conta e funcionalidades comunitárias pedidas, verificar o acesso, responder a pedidos de suporte e proteger o serviço contra abuso. Estas finalidades operacionais e de segurança baseiam-se em interesses legítimos nos termos do artigo 6.º, n.º 1, alínea f), do RGPD, sujeitos aos seus direitos e à avaliação exigida por lei. Este aviso não certifica conformidade nem substitui revisão jurídica. Não vendemos dados de conta nem os usamos para publicidade.',
    ],
  },
  {
    t: 'p',
    text: [
      'Pode pedir acesso, correção, eliminação, limitação, portabilidade ou opor-se ao tratamento escrevendo para blockallisto@gmail.com. Pode reclamar à CNPD ou à autoridade de controlo competente. O operador não pode eliminar registos públicos da blockchain. O protótipo não se destina a crianças. Não estão ativas recolha de documentos/KYC, ofertas de investimento reais, pagamentos em moeda fiduciária ou operações com dinheiro real. Qualquer alteração futura exige aviso atualizado antes desse tratamento.',
    ],
  },
];
