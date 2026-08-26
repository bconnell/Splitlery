import { allocateEvenly, allocateProportionally } from './allocation';
import { CalculationError } from './errors';
import { addSafeCents, assertSafeCents, roundDivision } from './money';
import type { CalculationSummary, EqualReceiptDraft, ItemizedReceiptDraft, ReceiptDraft, SplitResult, TipSelection } from './types';

const tipPercent: Record<Exclude<TipSelection['type'], 'none' | 'custom'>, number> = { '15%': 15, '18%': 18, '20%': 20, '25%': 25 };

function validateTip(tip: TipSelection, subtotalCents: number): number {
  if (tip.type === 'none') return 0;
  if (tip.type === 'custom') return assertSafeCents(tip.amountCents, 'Custom tip');
  return roundDivision(subtotalCents * tipPercent[tip.type], 100);
}

function emptyPerson(index: number): SplitResult {
  return { personId: `person-${index + 1}`, personName: `Person ${index + 1}`, itemShareCents: 0, taxShareCents: 0, tipShareCents: 0, totalCents: 0 };
}

function calculateEqual(draft: EqualReceiptDraft): CalculationSummary {
  assertSafeCents(draft.subtotalCents, 'Subtotal');
  assertSafeCents(draft.taxCents, 'Tax');
  if (!Number.isSafeInteger(draft.peopleCount) || draft.peopleCount < 1) throw new CalculationError('Add at least one person.');
  const tipCents = validateTip(draft.tip, draft.subtotalCents);
  const grandTotalCents = addSafeCents(addSafeCents(draft.subtotalCents, draft.taxCents), tipCents);
  const people = allocateEvenly(grandTotalCents, draft.peopleCount).map((totalCents, index) => ({ ...emptyPerson(index), totalCents }));
  return { mode: 'equal', subtotalCents: draft.subtotalCents, taxCents: draft.taxCents, tipCents, grandTotalCents, people };
}

function calculateItemized(draft: ItemizedReceiptDraft): CalculationSummary {
  assertSafeCents(draft.taxCents, 'Tax');
  if (draft.people.length < 1) throw new CalculationError('Add at least one person.');
  const personIds = new Set<string>();
  for (const person of draft.people) {
    if (!person.id || personIds.has(person.id)) throw new CalculationError('People must have unique identifiers.');
    personIds.add(person.id);
  }
  const weights = draft.people.map(() => 0);
  const seenItems = new Set<string>();
  for (const item of draft.items) {
    assertSafeCents(item.amountCents, 'Item amount');
    if (!item.id || seenItems.has(item.id)) throw new CalculationError('Items must have unique identifiers.');
    seenItems.add(item.id);
    const participants = [...new Set(item.participantIds)];
    if (participants.length === 0) throw new CalculationError('Assign each item to at least one person.');
    if (participants.length !== item.participantIds.length || participants.some((id) => !personIds.has(id))) throw new CalculationError('Assign items to valid people.');
    const shares = allocateEvenly(item.amountCents, participants.length);
    participants.forEach((id, index) => {
      const personIndex = draft.people.findIndex((person) => person.id === id);
      weights[personIndex] = addSafeCents(weights[personIndex], shares[index], 'Item share');
    });
  }
  if (draft.items.length === 0) throw new CalculationError('Add at least one item.');
  const subtotalCents = weights.reduce((sum, value) => addSafeCents(sum, value, 'Subtotal'), 0);
  const tipCents = validateTip(draft.tip, subtotalCents);
  const taxShares = allocateProportionally(draft.taxCents, weights);
  const tipShares = allocateProportionally(tipCents, weights);
  const people = draft.people.map((person, index) => {
    const totalCents = addSafeCents(addSafeCents(weights[index], taxShares[index]), tipShares[index]);
    return { personId: person.id, personName: person.name.trim() || `Person ${index + 1}`, itemShareCents: weights[index], taxShareCents: taxShares[index], tipShareCents: tipShares[index], totalCents };
  });
  const grandTotalCents = addSafeCents(addSafeCents(subtotalCents, draft.taxCents), tipCents);
  return { mode: 'itemized', subtotalCents, taxCents: draft.taxCents, tipCents, grandTotalCents, people };
}

export function calculate(draft: ReceiptDraft): CalculationSummary { return draft.mode === 'equal' ? calculateEqual(draft) : calculateItemized(draft); }
