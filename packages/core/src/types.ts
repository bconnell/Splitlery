export type TipSelection =
  | { type: 'none' }
  | { type: '15%' }
  | { type: '18%' }
  | { type: '20%' }
  | { type: '25%' }
  | { type: 'custom'; amountCents: number };

export interface Person { id: string; name: string; }
export interface ReceiptItem { id: string; name: string; amountCents: number; participantIds: string[]; }

export interface EqualReceiptDraft {
  mode: 'equal'; subtotalCents: number; taxCents: number; peopleCount: number; tip: TipSelection;
}
export interface ItemizedReceiptDraft {
  mode: 'itemized'; people: Person[]; items: ReceiptItem[]; taxCents: number; tip: TipSelection;
}
export type ReceiptDraft = EqualReceiptDraft | ItemizedReceiptDraft;

export interface SplitResult {
  personId: string; personName: string; itemShareCents: number; taxShareCents: number; tipShareCents: number; totalCents: number;
}
export interface CalculationSummary {
  mode: ReceiptDraft['mode']; subtotalCents: number; taxCents: number; tipCents: number; grandTotalCents: number; people: SplitResult[];
}
