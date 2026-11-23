import type { Messages } from './i18n/locales/en';

/** Keep unknown or malformed wire statuses out of user-facing transaction copy. */
export function intentStatusLabel(status: unknown, messages: Pick<Messages, 'intent' | 'account'>): string {
  const labels = messages.intent.statusLabels;
  if (typeof status !== 'string' || !Object.prototype.hasOwnProperty.call(labels, status)) {
    return messages.account.savedTxUnknown;
  }
  const label = labels[status];
  return typeof label === 'string' && label.trim() ? label : messages.account.savedTxUnknown;
}
