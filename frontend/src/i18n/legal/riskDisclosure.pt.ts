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
    t: 'h2',
    text: ['Leia isto primeiro: a demonstração de hoje não envolve dinheiro real'],
  },
  {
    t: 'p',
    text: [
      'A Blockallisto é atualmente um ',
      {
        b: ['protótipo na testnet da Stellar'],
      },
      '. Todas as contribuições usam tokens de teste ',
      {
        b: ['sem valor monetário'],
      },
      '. Não pode perder dinheiro real nesta demonstração, e nada nela constitui uma oportunidade real de investimento.',
    ],
  },
  {
    t: 'p',
    text: [
      'Os avisos abaixo explicam os riscos que ',
      {
        b: ['se aplicariam'],
      },
      ' ao tipo de investimento que a Blockallisto demonstra - crowdfunding em ativos reais através de infraestrutura de criptoativos. São publicados agora para que a conversa sobre risco faça parte do produto desde o primeiro dia.',
    ],
  },
  {
    t: 'h2',
    text: ['Aviso geral'],
  },
  {
    t: 'p',
    text: [
      'Investir em projetos de crowdfunding - quer em ativos reais como imóveis ou empresas, quer através de criptoativos e tokens - é de ',
      {
        b: ['alto risco'],
      },
      '. Pode perder ',
      {
        b: ['todo o dinheiro que investir'],
      },
      '. Estes investimentos não estão tipicamente ',
      {
        b: ['cobertos'],
      },
      ' por regimes de garantia de depósitos ou de indemnização de investidores.',
    ],
  },
  {
    t: 'p',
    text: [
      {
        b: ['Nunca invista dinheiro que não possa perder.'],
      },
      ' Para ter uma noção de escala, as plataformas de referência do nosso corpus de investigação trazem orientações concretas de diversificação: a página de avisos de risco da CONDA aconselha a não investir mais de cerca de 10% dos seus fundos livremente disponíveis nesta classe de ativos, e a ficha-padrão austríaca do investidor em crowdfunding (regime AltFG, observada na dagobertinvest) alerta contra investir mais de 10% do património líquido. Esta é a prática observada de comunicação de risco de plataformas estabelecidas, citada como ponto de referência - não é uma regra de lei aplicável a esta demonstração, nem uma garantia de que qualquer percentagem seja segura para a sua situação. Distribuir um montante menor por vários projetos reduz, mas nunca elimina, o risco de perda total.',
    ],
  },
  {
    t: 'h2',
    text: ['Riscos específicos'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Perda de capital.'],
        },
        ' O projeto que apoiar pode falhar, ter desempenho abaixo do esperado ou perder todo o valor. Os emitentes podem e tornam-se insolventes após angariações bem-sucedidas. Os rendimentos nunca são garantidos.',
      ],
      [
        {
          b: ['Iliquidez.'],
        },
        ' As posições de crowdfunding e tokenizadas podem ser difíceis ou impossíveis de vender. Pode não existir mercado secundário, as transmissões podem exigir o consentimento do emitente ou da plataforma e um destinatário verificado, e pode ter de manter a posição até ao fim do projeto - ou mais. (No protótipo atual nem sequer existe um token transmissível.)',
      ],
      [
        {
          b: ['Subordinação.'],
        },
        ' Os instrumentos subordinados ou "júnior" ficam atrás de outros credores; com subordinação qualificada pode não receber nada enquanto o emitente estiver sobre-endividado, e os créditos de juros ou de reembolso podem ser totalmente suspensos.',
      ],
      [
        {
          b: ['Risco de prazo e de extensão.'],
        },
        ' Os empréstimos e as obrigações podem ser prolongados para além do prazo indicado ao abrigo dos respetivos contratos, atrasando o reembolso.',
      ],
      [
        {
          b: ['Risco de avaliação.'],
        },
        ' Os ativos reais são difíceis de avaliar; as avaliações apresentadas podem estar erradas ou desatualizadas. (Nesta demonstração, todas as avaliações e identidades de emitentes são dados fictícios.)',
      ],
      [
        {
          b: ['Risco de contrato inteligente.'],
        },
        ' O código pode conter erros ou ser explorado, e as transações numa blockchain são geralmente irreversíveis.',
      ],
      [
        {
          b: ['Risco de rede.'],
        },
        ' As redes blockchain podem sofrer congestão, falhas, forks ou alterações de protocolo fora do controlo de qualquer parte.',
      ],
      [
        {
          b: ['Risco de chaves e de carteira.'],
        },
        ' Se perder a chave secreta ou a frase de recuperação da sua carteira, ou se alguém as roubar, os seus fundos desaparecem e ninguém os pode repor.',
      ],
      [
        {
          b: ['Risco regulamentar.'],
        },
        ' As regras para o crowdfunding (ECSPR na UE) e para os criptoativos (MiCA) estão em evolução. Uma estrutura possível hoje pode mudar, e as ofertas podem ser restringidas onde vive.',
      ],
      [
        {
          b: ['Risco de volatilidade e cambial.'],
        },
        ' Os preços dos criptoativos podem oscilar fortemente; as stablecoins podem perder a paridade; as taxas de câmbio movem-se.',
      ],
      [
        {
          b: ['Risco de contraparte e de fraude.'],
        },
        ' Os emitentes podem gerir mal os fundos ou deturpar os seus projetos. As verificações da plataforma reduzem, mas não eliminam, este risco.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['Sobre as futuras proteções do investidor'],
  },
  {
    t: 'p',
    text: [
      'O regulamento europeu de crowdfunding (o ECSPR, Regulamento (UE) 2020/1503) exige que as plataformas autorizadas ofereçam categorização de investidores, um teste inicial de conhecimentos, uma simulação da capacidade de suportar perdas e um período de reflexão pré-contratual de quatro dias de calendário para investidores não sofisticados antes de uma oferta se tornar vinculativa; as plataformas de referência do nosso corpus de investigação implementam-nas ao abrigo das respetivas autorizações. A demonstração da Blockallisto não tem nenhum destes mecanismos, porque nenhum investimento real é possível. Se uma versão regulada for um dia lançada, essas proteções - e os seus limites - serão descritas nos respetivos documentos juridicamente revistos. Proteções como os períodos de reflexão permitem retirar uma oferta; não reduzem o risco de investimento subjacente.',
    ],
  },
  {
    t: 'h2',
    text: ['Sem aconselhamento'],
  },
  {
    t: 'p',
    text: [
      'Nada neste Serviço constitui aconselhamento de investimento, jurídico ou fiscal, nem uma recomendação de compra ou venda de seja o que for. O desempenho passado - real ou simulado - não prevê resultados futuros. Considere aconselhamento profissional independente e diversifique: não concentre as suas poupanças num único projeto ou tipo de ativo.',
    ],
  },
  {
    t: 'h2',
    text: ['Reconhecimento'],
  },
  {
    t: 'p',
    text: [
      'Ao utilizar esta demonstração, reconhece que leu e compreendeu esta Divulgação de Riscos. Antes de qualquer lançamento real futuro, aplicar-se-á uma declaração de riscos mais completa e juridicamente revista.',
    ],
  },
];
