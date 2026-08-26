import { CalculationError } from './errors';
import { assertSafeCents } from './money';
import type { ReceiptDraft } from './types';

export function serializeDraft(draft: ReceiptDraft): string { return JSON.stringify(draft); }

function validateTip(value: unknown): void {
  if (!value || typeof value !== 'object' || !('type' in value)) throw new Error();
  const type = value.type;
  if (type === 'custom') { if (!('amountCents' in value) || typeof value.amountCents !== 'number') throw new Error(); assertSafeCents(value.amountCents, 'Custom tip'); return; }
  if (type !== 'none' && type !== '15%' && type !== '18%' && type !== '20%' && type !== '25%') throw new Error();
}

function validateItemized(value: ReceiptDraft & { mode: 'itemized' }): void {
  if (!Array.isArray(value.people) || !Array.isArray(value.items)) throw new Error();
  for (const person of value.people) if (!person || typeof person.id !== 'string' || typeof person.name !== 'string') throw new Error();
  for (const item of value.items) {
    if (!item || typeof item.id !== 'string' || typeof item.name !== 'string' || !Array.isArray(item.participantIds) || item.participantIds.some((id) => typeof id !== 'string')) throw new Error();
    assertSafeCents(item.amountCents, 'Item amount');
  }
}

export function parseDraft(raw: string): ReceiptDraft {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || !('mode' in value) || (value.mode !== 'equal' && value.mode !== 'itemized')) throw new Error();
    if (value.mode === 'equal') {
      const draft = value as ReceiptDraft & { mode: 'equal' };
      assertSafeCents(draft.subtotalCents, 'Subtotal'); assertSafeCents(draft.taxCents, 'Tax');
      if (!Number.isSafeInteger(draft.peopleCount) || draft.peopleCount < 1) throw new Error();
      validateTip(draft.tip);
      return draft;
    }
    const draft = value as ReceiptDraft & { mode: 'itemized' };
    assertSafeCents(draft.taxCents, 'Tax');
    validateTip(draft.tip);
    validateItemized(draft);
    return draft;
  } catch { throw new CalculationError('That saved receipt could not be restored.'); }
}
