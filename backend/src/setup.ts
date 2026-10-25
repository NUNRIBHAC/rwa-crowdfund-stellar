import { hasUsdcConfig, NETWORK } from './config.js';

console.log(`Setup — rede: ${NETWORK}`);

if (!hasUsdcConfig) {
  console.warn(
    'Aviso: USDC_ISSUER vazio no backend/.env — a fundação de USDC testnet ' +
      'ficará para quando este valor for preenchido.',
  );
} else {
  console.log('Config USDC OK.');
}

// Próximo passo: criar conta da plataforma, pedir XLM (friendbot),
// pedir USDC (Sozu faucet: npx @sozu/faucet@latest claim), criar asset RWA,
// definir trustlines demo.
console.log('Setup parcial (scaffold). Lógica completa no próximo passo.');