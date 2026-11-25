import { describe, expect, test } from 'vitest';
import { intentStatusLabel } from './intent-status-label';
import { en, type Messages } from './i18n/locales/en';
import { pt } from './i18n/locales/pt';
import { es } from './i18n/locales/es';
import { fr } from './i18n/locales/fr';
import { de } from './i18n/locales/de';
import { ar } from './i18n/locales/ar';
import { zhCN } from './i18n/locales/zh-CN';
import { zhTW } from './i18n/locales/zh-TW';
import { ja } from './i18n/locales/ja';
import { ko } from './i18n/locales/ko';
import { hi } from './i18n/locales/hi';

const locales = { en, pt, es, fr, de, ar, 'zh-CN': zhCN, 'zh-TW': zhTW, ja, ko, hi };
const statuses = ['BUILT', 'SIGNED', 'PENDING', 'SUCCESS', 'FAILED', 'NOT_FOUND', 'CANCELLED_UNSIGNED'];
const unknownStatuses: unknown[] = [undefined, null, '', 'FUTURE_STATUS', '__proto__', 'constructor', 'toString', true, 1, {}, ['SUCCESS']];

for (const [locale, messages] of Object.entries(locales)) {
  describe(`${locale}: transaction status labels`, () => {
    test.each(statuses)('%s has a human-readable translated label', (status) => {
      const label = intentStatusLabel(status, messages);
      expect(label).toBe(messages.intent.statusLabels[status]);
      expect(label.trim()).not.toBe('');
      expect(statuses).not.toContain(label);
    });

    test.each(unknownStatuses.map((status, index) => ({ status, index })))('unknown status $index uses localized unknown text', ({ status }) => {
      expect(messages.account.savedTxUnknown.trim()).not.toBe('');
      expect(intentStatusLabel(status, messages)).toBe(messages.account.savedTxUnknown);
    });

    test.each([undefined, '', '   '])('a missing or blank known-status label uses localized unknown text: %s', (label) => {
      const incomplete = {
        ...messages,
        intent: { ...messages.intent, statusLabels: { ...messages.intent.statusLabels, SUCCESS: label } },
      } as unknown as Messages;
      expect(intentStatusLabel('SUCCESS', incomplete)).toBe(messages.account.savedTxUnknown);
    });
  });
}
