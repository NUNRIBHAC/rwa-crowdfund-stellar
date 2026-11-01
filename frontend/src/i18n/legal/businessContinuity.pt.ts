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
      'Esta página descreve o que mantém o protótipo Blockallisto disponível e recuperável, e que planeamento de continuidade se pretende para uma futura plataforma autorizada. A primeira secção é factual sobre a demonstração em execução; a segunda é intenção de desenho, não prática atual.',
    ],
  },
  {
    t: 'h2',
    text: ['1. Postura de continuidade do protótipo (atual)'],
  },
  {
    t: 'ul',
    items: [
      [
        {
          b: ['Sem ativos de clientes em risco:'],
        },
        ' a demonstração não detém dinheiro, fundos de clientes nem custódia. As contribuições são tokens da testnet sem valor monetário, liquidadas por um contrato inteligente Soroban na testnet pública da Stellar. O estado do contrato vive no ledger da testnet, independentemente deste website.',
      ],
      [
        {
          b: ['Alojamento:'],
        },
        ' o site e a API correm no nível gratuito da Render; os dados operacionais (diário de transações, dados da comunidade) vivem numa base de dados Postgres da Neon no seu nível gratuito. Ambos são serviços de terceiros com as respetivas propriedades de disponibilidade; não é garantido qualquer tempo de atividade para a demonstração.',
      ],
      [
        {
          b: ['Cópias de segurança:'],
        },
        ' [agendamento e retenção de cópias de segurança a definir - os níveis gratuitos não fornecem cópias geridas; o estado do contrato na testnet é recuperável a partir do ledger público].',
      ],
      [
        {
          b: ['Separação de ambientes:'],
        },
        ' a demonstração virada para o utilizador, um ambiente de staging separado e cópias descartáveis da base de dados são mantidos separados para que os testes não possam corromper a demonstração.',
      ],
      [
        {
          b: ['Se a demonstração estiver indisponível:'],
        },
        ' nenhum utilizador perde nada de valor. O estado da campanha permanece legível em exploradores públicos da testnet da Stellar, e as contribuições permanecem regidas pelo contrato, não por este site.',
      ],
    ],
  },
  {
    t: 'h2',
    text: ['2. Plano de continuidade previsto para uma plataforma autorizada (não ativo)'],
  },
  {
    t: 'p',
    text: [
      'Uma plataforma real que trate ofertas reguladas precisaria, antes do lançamento: de objetivos documentados de tempo e de ponto de recuperação [valores RTO/RPO a definir com aconselhamento jurídico e de infraestrutura]; cópias de segurança geridas com procedimentos de restauro testados; um acordo de serviços de pagamento em que os fundos dos clientes nunca são detidos pela plataforma, para que uma falha da plataforma não possa bloquear o dinheiro dos investidores; um plano ordeiro de encerramento que assegure que as campanhas em curso podem concluir-se ou reembolsar se a plataforma cessar a atividade; e procedimentos de comunicação para incidentes que afetem os utilizadores.',
    ],
  },
  {
    t: 'p',
    text: ['Nada disto está operativo hoje. Publicá-lo como modelo mantém a superfície de conformidade prevista visível e revista.'],
  },
  {
    t: 'h2',
    text: ['3. Contacto para incidentes'],
  },
  {
    t: 'p',
    text: [
      'Para reportar um incidente de segurança ou de disponibilidade que afete o protótipo: ',
      {
        v: 'contactEmail',
      },
      ', assunto "Incident".',
    ],
  },
];
