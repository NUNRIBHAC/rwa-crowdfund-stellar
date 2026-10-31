// Instrument taxonomy types and label helpers. The user-facing content lives
// in the i18n locale dictionaries (src/i18n/locales/*); this module keeps the
// shared types and the locale-aware label composition.
import type { Messages } from '../i18n/locales/en';

export type InstrumentGroupId = 'participation' | 'debt';

export type SeniorityState = 'senior' | 'subordinated' | 'unspecified';

export type InstrumentClass = Messages['instruments']['classes'][number];
export type StructureOverlay = Messages['instruments']['overlays'][number];
export type LabelQualifier = Messages['instruments']['qualifiers'][number];

export function instrumentLabel(m: Messages, id: string): string {
  return m.instruments.classes.find((c) => c.id === id)?.label ?? id;
}

export function seniorityLabel(m: Messages, state: SeniorityState): string {
  return m.instruments.seniorityLabels[state];
}

// Short display label for chips and fact grids, e.g. "Senior bond" or
// "Convertible bond (seniority unspecified)". Word order follows the active
// locale's composeChip function.
export function composeInstrumentLabel(m: Messages, classId: string, seniority?: SeniorityState | string, overlays: string[] = []): string {
  const base = instrumentLabel(m, classId);
  const parts: string[] = [];
  if (overlays.includes('zero-coupon')) parts.push(m.instruments.chipZeroCoupon);
  if (overlays.includes('convertible')) parts.push(m.instruments.chipConvertible);
  if (seniority === 'senior') parts.push(m.instruments.chipSenior);
  if (seniority === 'subordinated') parts.push(m.instruments.chipSubordinated);
  const label = m.instruments.composeChip(parts, base);
  return seniority === 'unspecified' ? `${label} ${m.instruments.chipUnspecifiedSuffix}` : label;
}
