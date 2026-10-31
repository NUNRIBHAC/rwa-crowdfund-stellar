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
      'Este Aviso Legal identifica o operador do website e da aplicação de demonstração Blockallisto (o "Serviço"). Os dados societários apresentados abaixo são dados fictícios de demonstração: forma jurídica "Lda." [DEMO], sede "Rua da Demonstracao 0, 0000-000 Lisboa, Portugal" [DEMO], número de registo "000 000 000" [DEMO], capital social "EUR 0" [DEMO], gerente "Nome Demonstracao" [DEMO]. A denominação social, a forma jurídica, a sede e o estatuto de registo da Blockallisto não foram verificados, e nenhum registo é afirmado. Contacto: ',
      {
        v: 'contactEmail',
      },
      '.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Operador'],
  },
  {
    t: 'table',
    head: [[['Campo'], ['Valor']]],
    rows: [
      [['Nome comercial'], ['Blockallisto']],
      [['Forma jurídica'], ['"Lda." [DEMO]']],
      [['Sede'], ['"Rua da Demonstracao 0, 0000-000 Lisboa, Portugal" [DEMO]']],
      [['Registo comercial'], ['"Registo Comercial de [Lisboa], número 000 000 000" [DEMO]']],
      [['NIF'], ['"PT 000 000 000" [DEMO]']],
      [['Gerente'], ['"Nome Demonstracao" [DEMO]']],
      [
        ['Contacto'],
        [
          {
            v: 'contactEmail',
          },
        ],
      ],
    ],
  },
  {
    t: 'p',
    text: ['Substitua todos os valores [DEMO] pelos dados registados reais do operador antes de qualquer publicação para além do protótipo.'],
  },
  {
    t: 'h2',
    text: ['2. Estatuto regulamentar'],
  },
  {
    t: 'p',
    text: [
      'A Blockallisto é hoje uma ',
      {
        b: ['demonstração de protótipo'],
      },
      ' a correr inteiramente na rede de teste da Stellar (testnet). O operador ',
      {
        b: ['não'],
      },
      ' está autorizado como prestador de serviços de crowdfunding ao abrigo do Regulamento (UE) 2020/1503 (ECSPR), ',
      {
        b: ['não'],
      },
      ' está supervisionado pela CMVM ou por qualquer outra autoridade competente nessa qualidade, e não faz ',
      {
        b: ['qualquer oferta'],
      },
      ' de investimento. Nada no Serviço constitui uma oferta, solicitação, recomendação ou aconselhamento de investimento, jurídico, fiscal ou financeiro. Não está envolvido dinheiro real; os tokens da testnet não têm valor monetário.',
    ],
  },
  {
    t: 'p',
    text: [
      'Se e quando um lançamento real for preparado, este aviso será atualizado com o estatuto de autorização do operador, a sua autoridade de supervisão competente e quaisquer divulgações exigidas no mercado único antes de qualquer oferta real.',
    ],
  },
  {
    t: 'h2',
    text: ['3. Conteúdo e responsabilidade'],
  },
  {
    t: 'p',
    text: [
      'O conteúdo do Serviço é fornecido tal como está, para avaliação de um protótipo. As campanhas, os emitentes, os valores e os resultados de exemplo são ilustrações fictícias. O operador não aceita responsabilidade por decisões tomadas com base em conteúdo da demonstração. As ligações externas, quando presentes, levam a conteúdo de terceiros que o operador não controla.',
    ],
  },
  {
    t: 'h2',
    text: ['4. Propriedade intelectual'],
  },
  {
    t: 'p',
    text: [
      'O Serviço, o seu conteúdo e o seu código são Copyright (c) 2026 Nuno Ribeiro, todos os direitos reservados. Não é concedida qualquer licença de código aberto ou de patente. Pode ver e usar a demonstração para avaliação; não pode copiá-la, republicá-la ou revendê-la.',
    ],
  },
  {
    t: 'h2',
    text: ['5. Enquadramento aplicável [a rever]'],
  },
  {
    t: 'p',
    text: [
      'As cláusulas de lei aplicável e de jurisdição para um lançamento real exigem aconselhamento jurídico e dependem do registo final do operador. Este modelo deliberadamente não afirma qualquer lei aplicável para o protótipo.',
    ],
  },
];
