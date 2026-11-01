// Generated from frontend/i18n-json/ by scripts/i18n-import.mjs.
// Edit the JSON (Weblate) or this file, then run npm run i18n:export / i18n:import to sync.

import type { LegalBlock } from './types';

export const blocks: LegalBlock[] = [
  {
    t: 'notice',
    text: [
      'Modelo de demonstração: esta página é um documento ilustrativo do protótipo Blockallisto, não é aconselhamento jurídico. Não foi revisto por um advogado e não é prova de qualquer registo societário ou autorização regulamentar. Os dados societários marcados [DEMO] são dados fictícios de demonstração.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['Última atualização:'],
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
      'Esta Política de Privacidade explica que dados pessoais o protótipo Blockallisto (o "Serviço") trata, porquê, e que direitos tem. O Serviço é um projeto-protótipo operado sob o nome Blockallisto. Os dados societários apresentados para a Blockallisto nestes documentos são dados fictícios de demonstração (forma jurídica "Lda." [DEMO], sede "Rua da Demonstracao 0, 0000-000 Lisboa, Portugal" [DEMO], número de registo "000 000 000" [DEMO]); a identidade jurídica registada por detrás do nome Blockallisto não foi verificada, e nomear o projeto não identifica por si só o responsável pelo tratamento dos dados. [O responsável pelo tratamento - a pessoa ou entidade efetivamente responsável por este tratamento - será confirmado antes da publicação.] Os pedidos de privacidade são respondidos em ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Âmbito: o que a demonstração não recolhe'],
  },
  {
    t: 'p',
    text: [
      'O protótipo atual não tem ',
      {
        b: ['KYC, newsletters nem pagamentos'],
      },
      '. O acesso comunitário é baseado na carteira: usa uma assinatura de carteira Stellar, não uma palavra-passe nem um endereço de email. Não pedimos o seu nome completo, número de telefone, documentos de identidade ou cartão de pagamento. As funcionalidades comunitárias recolhem os dados descritos na secção 2b: uma chave pública, um nome de apresentação opcional, conteúdo de texto livre que decida submeter e um email de contacto opcional nas candidaturas de emissor. Não usamos analítica nem rastreadores de publicidade, e os tipos de letra e recursos do site são autoalojados.',
    ],
  },
  {
    t: 'h2',
    text: ['2. Dados que tratamos'],
  },
  {
    t: 'p',
    text: [
      {
        b: ['a) Dados da carteira e das contribuições.'],
      },
      ' Se ligar uma carteira Freighter e fizer uma contribuição de teste, o backend regista, numa base de dados Postgres (alojada pela Neon), um diário de segurança contendo: a sua ',
      {
        b: ['chave pública'],
      },
      ' Stellar (nunca a sua chave secreta), o identificador da campanha, a ação, o montante da contribuição, os envelopes da transação, o hash e o estado da transação, e carimbos temporais. Uma chave pública Stellar é um dado pseudonimizado; não a associamos à sua identidade.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        i: ['Retenção:'],
      },
      ' as transações preparadas não assinadas expiram após 24 horas; as transações concluídas ou falhadas são eliminadas após 30 dias; uma transação assinada cujo resultado esteja por resolver é conservada até se resolver, porque apagá-la poderia perder o rasto de uma transação difundida. Os envelopes assinados são limpos assim que a transação atinge um estado final. Estas são as regras de limpeza configuradas no próprio código da aplicação: descrevem o que a aplicação apaga. Os registos de servidor e as cópias de segurança dos nossos fornecedores de alojamento podem conservar dados por períodos diferentes ao abrigo das respetivas políticas de privacidade, e não são abrangidos por estas regras.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['b) Conta comunitária e conteúdo comunitário.'],
      },
      ' Se iniciar sessão nas funcionalidades comunitárias, o backend guarda, na mesma base de dados Postgres da Neon: a sua ',
      {
        b: ['chave pública'],
      },
      ', um carimbo temporal de criação da conta e um ',
      {
        b: ['nome de apresentação'],
      },
      ' opcional (até 40 caracteres). O início de sessão funciona assinando um desafio único do servidor com a sua carteira (validade de 5 minutos, utilização única); não é necessária palavra-passe nem email e a sua chave secreta nunca sai da carteira. O servidor guarda apenas um hash SHA-256 do token de sessão; o token em bruto fica no armazenamento local do seu navegador. As sessões duram 30 dias, o terminar de sessão apaga a sessão, e os desafios e sessões expirados são limpos de hora a hora.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['Os comentários'],
      },
      ' são públicos: cada comentário guarda a sua chave pública, o seu nome de apresentação se definido, o texto (até 1000 caracteres), a campanha e um carimbo temporal, e os 100 comentários mais recentes por campanha são mostrados a todos os visitantes. Um comentário ocultado pelo operador sai imediatamente da lista pública e é definitivamente apagado 30 dias após a ocultação. ',
      {
        b: ['Os pedidos de suporte/feedback'],
      },
      ' (tipo, assunto até 120 caracteres, texto até 4000 caracteres, estado, carimbos temporais) e as ',
      {
        b: ['candidaturas de emissor'],
      },
      ' (nome do projeto, país, tipo de instrumento, montante-alvo, descrição e um email de contacto opcional) são visíveis apenas para a sua conta de carteira e para o administrador do operador; ambos são definitivamente apagados após 90 dias (janela de retenção configurável no código da aplicação). Os itens de ',
      {
        b: ['notícias'],
      },
      ' da campanha são escritos pelo operador e assinalados como conteúdo de demonstração da plataforma. O seu endereço IP é usado em memória para limitação de ritmo e eliminado dentro de 24 horas; a aplicação não o persiste (os registos de alojamento são abrangidos no ponto e).',
    ],
  },
  {
    t: 'p',
    text: [
      'Um aviso: chaves públicas, nomes de apresentação e conteúdo de texto livre podem identificá-lo mesmo sem nunca pedirmos o seu nome. Não submeta informação pessoal sensível nos campos comunitários.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['c) Dados públicos da blockchain.'],
      },
      ' As contribuições de teste são registadas publicamente na ',
      {
        b: ['testnet'],
      },
      ' da Stellar e são visíveis em exploradores públicos. Os registos na blockchain não podem ser alterados nem apagados por nós.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['d) Preferências do dispositivo.'],
      },
      ' As suas escolhas de tema (claro/escuro) e de idioma são guardadas no armazenamento local do seu navegador. Estes dados ficam no seu dispositivo e não nos são enviados.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['e) Registos técnicos.'],
      },
      ' O nosso fornecedor de alojamento (Render, região de Frankfurt) trata registos de servidor padrão (como endereço IP e metadados de pedidos) para fornecer e proteger o Serviço.',
    ],
  },
  {
    t: 'h2',
    text: ['3. Dados que planeamos tratar em versões futuras (não recolhidos hoje)'],
  },
  {
    t: 'p',
    text: [
      'O desenho indicativo para versões futuras da Blockallisto - seguindo as superfícies de conformidade de plataformas de crowdfunding europeias estabelecidas - é tratar categorias adicionais de dados pessoais ',
      {
        b: ['quando e se'],
      },
      ' essas funcionalidades forem lançadas. As categorias exatas, os fornecedores e os limites podem mudar com o trabalho de desenho e o aconselhamento jurídico:',
    ],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Dados de registo:'],
        },
        ' nome completo (exatamente como no seu documento de identidade), endereço de email, país de residência e residência fiscal.',
      ],
      [
        {
          b: ['Verificação de identidade (KYC/AML):'],
        },
        ' imagens do documento de identidade, uma selfie, número de telemóvel e resultados da verificação, tratados com fornecedores terceiros especializados em verificação; para investidores empresariais, beneficiários efetivos (tipicamente quem detenha mais de 25%) e origem dos fundos; declarações de pessoa politicamente exposta (PEP).',
      ],
      [
        {
          b: ['Dados de pagamento e de levantamento:'],
        },
        ' dados de conta bancária (como IBAN) tratados por prestadores de serviços de pagamento licenciados, não por nós detendo fundos de clientes.',
      ],
    ],
  },
  {
    t: 'p',
    text: [
      'Com exceção do email de contacto opcional do emissor descrito na secção 2b, nenhum destes dados é recolhido pela demonstração atual. Se estas funcionalidades forem lançadas, esta Política será atualizada primeiro, com os fornecedores, as finalidades, as bases jurídicas e os períodos de conservação de cada categoria.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Finalidades e bases jurídicas (RGPD)'],
  },
  {
    t: 'p',
    text: [
      'Tratamos os dados da secção 2 para operar, proteger e demonstrar o protótipo: preparar e acompanhar transações de teste, prevenir gastos duplos e resolver transações ambíguas, manter o Serviço fiável e operar as funcionalidades comunitárias (publicar e moderar comentários, responder a pedidos de suporte e feedback e analisar candidaturas de emissor). A base jurídica é o nosso interesse legítimo (art. 6.º, n.º 1, alínea f), do RGPD) em executar uma demonstração técnica segura. Não usamos os seus dados para marketing, definição de perfis ou venda.',
    ],
  },
  {
    t: 'h2',
    text: ['5. Quem trata os dados'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Render'],
        },
        ' (alojamento, Frankfurt, UE) - executa a aplicação.',
      ],
      [
        {
          b: ['Neon'],
        },
        ' (Postgres gerido; região AWS Europa (Frankfurt), UE - verificado na consola Neon em ',
        {
          v: 'lastUpdated',
        },
        ') - guarda o diário de contribuições e o armazenamento de dados da comunidade.',
      ],
      [
        {
          b: ['Testnet da Stellar'],
        },
        ' (rede pública operada pela Stellar Development Foundation, global) - regista transações públicas de teste.',
      ],
      [
        {
          b: ['GitHub'],
        },
        ' - aloja o código-fonte (sem dados de utilizadores).',
      ],
    ],
  },
  {
    t: 'p',
    text: ['Quando o tratamento ocorre fora da UE/EEE (por exemplo na rede global da Stellar), envolve apenas dados pseudonimizados da testnet.'],
  },
  {
    t: 'h2',
    text: ['6. Os seus direitos ao abrigo do RGPD'],
  },
  {
    t: 'p',
    text: [
      'Tem o direito de aceder, retificar, apagar, limitar ou opor-se ao tratamento dos seus dados pessoais, e à portabilidade dos dados, ao abrigo do Regulamento (UE) 2016/679 (RGPD). Tem também o direito de apresentar reclamação à autoridade de controlo portuguesa, a ',
      {
        b: ['CNPD'],
      },
      ' (Comissão Nacional de Proteção de Dados).',
    ],
  },
  {
    t: 'p',
    text: [
      'Conseguimos localizar os dados associados a si apenas através da sua chave pública Stellar (e de qualquer nome de apresentação ou conteúdo de texto livre que tenha decidido submeter). Os dados já escritos numa blockchain pública não podem ser apagados; podemos corrigir ou apagar os registos fora da cadeia (o diário de contribuições, a sua conta comunitária, comentários, pedidos e candidaturas) a pedido, sujeito às regras de retenção da secção 2.',
    ],
  },
  {
    t: 'h2',
    text: ['7. Brasil (LGPD)'],
  },
  {
    t: 'p',
    text: [
      'A demonstração é operada a partir de Portugal. A Lei Geral de Proteção de Dados do Brasil (Lei n.º 13.709/2018 - LGPD) pode aplicar-se a tratamentos que visem ou envolvam pessoas no Brasil; se se aplica a este protótipo é uma questão jurídica a confirmar com advogados. Se e na medida em que a LGPD se aplicar, confere-lhe direitos sobre os seus dados pessoais semelhantes aos acima, e pode contactar a ANPD (Autoridade Nacional de Proteção de Dados). Use o mesmo contacto acima para qualquer pedido.',
    ],
  },
  {
    t: 'h2',
    text: ['8. Segurança'],
  },
  {
    t: 'p',
    text: [
      'As chaves da sua carteira nunca saem da sua extensão Freighter; o Serviço foi desenhado de forma a não lhes poder aceder. A aplicação é servida sobre TLS e os pontos de administração estão desativados por omissão (fail-closed). Nenhum método é absoluto, mas o desenho do protótipo minimiza os dados que existem para serem atacados.',
    ],
  },
  {
    t: 'h2',
    text: ['9. Crianças'],
  },
  {
    t: 'p',
    text: ['O Serviço é uma demonstração técnica e não se dirige a crianças.'],
  },
  {
    t: 'h2',
    text: ['10. Alterações'],
  },
  {
    t: 'p',
    text: [
      'Podemos atualizar esta Política à medida que o protótipo evolui. A data de "Última atualização" indica a versão atual. As alterações materiais serão refletidas aqui antes de produzirem efeitos.',
    ],
  },
  {
    t: 'h2',
    text: ['11. Contacto'],
  },
  {
    t: 'p',
    text: [
      'Questões e pedidos de privacidade: ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
];
