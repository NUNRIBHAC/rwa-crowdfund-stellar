// Holding structures: how a participation is held (directly, or through a
// certificate, vehicle or partnership form). Descriptive metadata only: a
// holding structure qualifies the underlying instrument, is never a separate
// instrument, and is not an offer, approval or regulatory classification.
// Blockallisto does not issue certificates and provides no depositary or
// custody service. Display strings live in the i18n locale dictionaries; the
// backend validates the same id list (backend/src/holding-structures.ts).
import type { Messages } from '../i18n/locales/en';

export type HoldingStructureItem = Messages['instruments']['holding']['items'][number];
export type HoldingStructureId = HoldingStructureItem['id'];

export function holdingStructureLabel(m: Messages, id: string | null | undefined): string {
  if (!id) return m.instruments.holding.notSpecified;
  return m.instruments.holding.items.find((item) => item.id === id)?.label ?? id;
}
