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
      'Estes Termos de Serviço ("Termos") regem a sua utilização do website e da aplicação de demonstração Blockallisto (o "Serviço"), um projeto-protótipo operado pela Blockallisto ("nós"). Os dados societários apresentados para a Blockallisto nestes Termos são dados fictícios de demonstração - forma jurídica "Lda." [DEMO], sede "Rua da Demonstracao 0, 0000-000 Lisboa, Portugal" [DEMO], número de registo "000 000 000" [DEMO]. A denominação social, a forma jurídica, a sede e o estatuto de registo da Blockallisto não foram verificados, e nenhum registo é afirmado. Contacto: ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
  {
    t: 'p',
    text: ['Ao utilizar o Serviço, aceita estes Termos. Se não concordar, não utilize o Serviço.'],
  },
  {
    t: 'h2',
    text: ['1. O que é a Blockallisto hoje'],
  },
  {
    t: 'p',
    text: [
      'A Blockallisto é uma ',
      {
        b: ['demonstração de protótipo'],
      },
      ' de um conceito de crowdfunding de ativos reais tokenizados, a correr inteiramente na ',
      {
        b: ['rede de teste da Stellar (testnet)'],
      },
      '.',
    ],
  },
  {
    t: 'p',
    text: ['Isto significa, de forma simples:'],
  },
  {
    t: 'ul',
    items: [
      [
        'O Serviço ',
        {
          b: ['não'],
        },
        ' é uma plataforma de crowdfunding no sentido legal. Nós ',
        {
          b: ['não'],
        },
        ' somos um prestador de serviços de crowdfunding autorizado ao abrigo do Regulamento (UE) 2020/1503 (ECSPR) ou de qualquer outro regime, e não fazemos ',
        {
          b: ['quaisquer ofertas reais'],
        },
        ' de investimento.',
      ],
      [
        'Nada no Serviço constitui uma oferta, uma solicitação, uma recomendação ou aconselhamento de investimento, jurídico, fiscal ou financeiro, em qualquer jurisdição.',
      ],
      [
        'Não está envolvido dinheiro real. As contribuições na demonstração usam ',
        {
          b: ['tokens da testnet Stellar (USDC de teste) sem qualquer valor monetário'],
        },
        ' e não podem ser trocados por fundos reais.',
      ],
      [
        'As campanhas de exemplo são ilustrações fictícias. As identidades dos emitentes, as avaliações, os valores e os resultados apresentados na demonstração são ',
        {
          b: ['dados fictícios'],
        },
        ', não oportunidades reais.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['2. O que o Serviço lhe permite fazer'],
  },
  {
    t: 'ul',
    items: [
      ['Navegar e filtrar campanhas de investimento de exemplo e ler os respetivos termos estruturados.'],
      ['Usar o centro de aprendizagem, o glossário e as FAQ para compreender os instrumentos de investimento.'],
      [
        'Ligar uma carteira ',
        {
          b: ['Freighter'],
        },
        ' (uma extensão do navegador) e fazer ',
        {
          b: ['contribuições de teste'],
        },
        ' à campanha de demonstração na testnet da Stellar.',
      ],
    ],
  },
  {
    t: 'p',
    text: [
      'As contribuições de teste são tratadas por um contrato inteligente Soroban com o seguinte comportamento: financiamento tudo-ou-nada, pagamento à campanha apenas após o respetivo prazo, contribuições limitadas ao objetivo da campanha e saldos registados no contrato. Não é emitido nenhum token transmissível.',
    ],
  },
  {
    t: 'h2',
    text: ['3. Funcionalidades de teste e limites de produção'],
  },
  {
    t: 'p',
    text: [
      'O protótipo tem início de sessão comunitário, contas de email/palavra-passe, uma vista do investidor de testnet e ecrãs de demonstração do teste de conhecimentos e simulação de perdas. O acesso pode estar restrito; não são proteções do investidor juridicamente validadas.',
    ],
  },
  {
    t: 'p',
    text: [
      'Não estão ativos KYC/AML reais, pagamentos por prestadores licenciados nem um período de reflexão com efeitos legais. Os documentos e ecrãs de teste não provam autorização regulamentar nem direitos de investidor exigíveis. A utilização em produção exige revisão jurídica e autorizações próprias.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Elegibilidade e utilização aceitável'],
  },
  {
    t: 'p',
    text: [
      'O Serviço destina-se a adultos (18+). Não se dirige a qualquer pessoa numa jurisdição onde a visualização de conteúdo de crowdfunding deste tipo seja restringida, e não deve ser apresentado a pessoas dos EUA como uma oportunidade de investimento.',
    ],
  },
  {
    t: 'p',
    text: [
      'Concorda em não: atacar, sondar ou perturbar o Serviço ou a sua infraestrutura; abusar, extrair dados a ritmos abusivos ou interferir com outros utilizadores; apresentar falsamente a demonstração como um serviço de investimento real; ou usar o Serviço para qualquer fim ilegal.',
    ],
  },
  {
    t: 'h2',
    text: ['5. A sua carteira e as suas chaves'],
  },
  {
    t: 'ul',
    items: [
      [
        'A sua carteira é ',
        {
          b: ['não custodial'],
        },
        ': a sua chave secreta e a sua frase de recuperação permanecem dentro da sua própria extensão Freighter. Nunca as vemos, guardamos ou pedimos.',
      ],
      [
        {
          b: ['Nunca'],
        },
        ' introduza a sua chave secreta ou frase de recuperação em qualquer website, incluindo este. Quem lhas pedir está a tentar roubá-lo.',
      ],
      [
        'Cada transação é assinada por si na sua carteira. As transações na testnet da Stellar são registadas publicamente e podem ser consultadas em exploradores públicos da testnet.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['6. Propriedade intelectual'],
  },
  {
    t: 'p',
    text: [
      'O Serviço, o seu conteúdo e o seu código são Copyright (c) 2026 Nuno Ribeiro, todos os direitos reservados. Não é concedida qualquer licença de código aberto ou de patente. Pode ver e usar a demonstração para avaliação; não pode copiá-la, republicá-la ou revendê-la.',
    ],
  },
  {
    t: 'h2',
    text: ['7. Disponibilidade e alterações'],
  },
  {
    t: 'p',
    text: [
      'O Serviço usa alojamento gratuito e pode ser lento, ficar indisponível, mudar ou terminar. As funcionalidades de teste implementadas não provam prontidão para produção; a verificação real de identidade e os pagamentos em moeda fiduciária continuam inativos.',
    ],
  },
  {
    t: 'h2',
    text: ['8. Exclusões de responsabilidade e limitação de responsabilidade'],
  },
  {
    t: 'p',
    text: [
      'O Serviço é fornecido ',
      {
        b: ['"tal como está" e "conforme disponível"'],
      },
      ', sem garantias de qualquer tipo, expressas ou implícitas, incluindo de exatidão, adequação a um fim específico ou não infração. Na medida máxima permitida por lei, não somos responsáveis por quaisquer danos indiretos, incidentais ou consequenciais, nem por qualquer perda resultante da sua utilização do Serviço, da sua carteira ou da rede Stellar. Nada nestes Termos exclui responsabilidade que não possa ser excluída por lei.',
    ],
  },
  {
    t: 'h2',
    text: ['9. Lei aplicável'],
  },
  {
    t: 'p',
    text: [
      'Estes Termos são regidos pelas leis de ',
      {
        b: ['Portugal'],
      },
      ' e pelo direito da União Europeia aplicável, sem prejuízo das normas imperativas de defesa do consumidor do seu país de residência.',
    ],
  },
  {
    t: 'h2',
    text: ['10. Alterações a estes Termos'],
  },
  {
    t: 'p',
    text: [
      'Podemos atualizar estes Termos a qualquer momento. A data de "Última atualização" indica a versão atual. A utilização continuada após uma alteração significa que aceita os novos Termos.',
    ],
  },
  {
    t: 'h2',
    text: ['11. Contacto'],
  },
  {
    t: 'p',
    text: [
      'Questões sobre estes Termos: ',
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
        b: ['Divulgações do operador por resolver:'],
      },
      ' os dados de operador DEMO nestes Termos são ilustrativos e não satisfazem qualquer dever obrigatório de identificação do operador (como um impressum ou aviso legal ao abrigo das regras portuguesas ou europeias de comércio eletrónico, comunicação social ou defesa do consumidor). Não foi determinado se tal dever se aplica a este serviço-protótipo; quaisquer divulgações exigidas serão adicionadas aqui ou numa página ligada antes de qualquer lançamento real.',
    ],
  },
];
