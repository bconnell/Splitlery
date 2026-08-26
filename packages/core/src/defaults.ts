import type { ItemizedReceiptDraft, EqualReceiptDraft, ReceiptDraft } from './types';

export const defaultEqualDraft = (): EqualReceiptDraft => ({ mode: 'equal', subtotalCents: 0, taxCents: 0, peopleCount: 2, tip: { type: '18%' } });
export const defaultItemizedDraft = (): ItemizedReceiptDraft => ({ mode: 'itemized', people: [{ id: 'person-1', name: 'Person 1' }], items: [], taxCents: 0, tip: { type: '18%' } });
export const defaultDraft = (): ReceiptDraft => defaultEqualDraft();
