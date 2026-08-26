import { describe, expect, it } from 'vitest';
import {
  CalculationError,
  calculate,
  parseCurrencyToCents,
  parseDraft,
  serializeDraft,
  type ItemizedReceiptDraft,
  type EqualReceiptDraft,
} from '../src/index';

const none = { type: 'none' as const };
const equal = (overrides: Partial<EqualReceiptDraft> = {}): EqualReceiptDraft => ({
  mode: 'equal',
  subtotalCents: 1000,
  taxCents: 0,
  peopleCount: 2,
  tip: none,
  ...overrides,
});
const itemized = (overrides: Partial<ItemizedReceiptDraft> = {}): ItemizedReceiptDraft => ({
  mode: 'itemized',
  people: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
  items: [{ id: 'i1', name: 'Soup', amountCents: 1000, participantIds: ['a'] }],
  taxCents: 0,
  tip: none,
  ...overrides,
});

describe('currency parsing', () => {
  it('parses valid currency without floating point arithmetic', () => {
    expect(parseCurrencyToCents('$12.99')).toBe(1299);
    expect(parseCurrencyToCents('4.5')).toBe(450);
    expect(parseCurrencyToCents('.01')).toBe(1);
  });

  it.each(['', 'abc', '-1.00', '1.234', 'Infinity', 'NaN'])('rejects malformed or unsafe value %s', (value) => {
    expect(() => parseCurrencyToCents(value)).toThrow(CalculationError);
  });
});

describe('equal split', () => {
  it('divides exactly', () => {
    const result = calculate(equal({ subtotalCents: 1000, peopleCount: 2 }));
    expect(result.people.map((person) => person.totalCents)).toEqual([500, 500]);
    expect(result.grandTotalCents).toBe(1000);
  });

  it('allocates remainder deterministically to the earliest people', () => {
    const result = calculate(equal({ subtotalCents: 7967, peopleCount: 4 }));
    expect(result.people.map((person) => person.totalCents)).toEqual([1992, 1992, 1992, 1991]);
  });

  it('keeps a one-cent receipt conserved across several people', () => {
    const result = calculate(equal({ subtotalCents: 1, peopleCount: 3 }));
    expect(result.people.map((person) => person.totalCents)).toEqual([1, 0, 0]);
    expect(result.people.reduce((sum, person) => sum + person.totalCents, 0)).toBe(1);
  });

  it('calculates percentage and custom tips from subtotal', () => {
    expect(calculate(equal({ subtotalCents: 1001, tip: { type: '15%' } })).tipCents).toBe(150);
    expect(calculate(equal({ subtotalCents: 1001, taxCents: 500, tip: { type: 'custom', amountCents: 77 } })).tipCents).toBe(77);
  });
});

describe('itemized split', () => {
  it('handles individual and shared items with proportional tax and tip', () => {
    const result = calculate(itemized({
      items: [
        { id: 'i1', name: 'Steak', amountCents: 2250, participantIds: ['a'] },
        { id: 'i2', name: 'Dessert', amountCents: 1000, participantIds: ['a', 'b'] },
      ],
      taxCents: 400,
      tip: { type: '20%' },
    }));
    expect(result.subtotalCents).toBe(3250);
    expect(result.tipCents).toBe(650);
    expect(result.people.map((person) => [person.itemShareCents, person.taxShareCents, person.tipShareCents, person.totalCents])).toEqual([
      [2750, 338, 550, 3638],
      [500, 62, 100, 662],
    ]);
    expect(result.people.reduce((sum, person) => sum + person.totalCents, 0)).toBe(result.grandTotalCents);
  });

  it('conserves shared three-person fractional item allocation', () => {
    const result = calculate(itemized({
      people: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }],
      items: [{ id: 'i1', name: 'Fries', amountCents: 100, participantIds: ['a', 'b', 'c'] }],
    }));
    expect(result.people.map((person) => person.itemShareCents)).toEqual([34, 33, 33]);
  });

  it('rejects zero people and unassigned or unknown items', () => {
    expect(() => calculate(equal({ peopleCount: 0 }))).toThrow('Add at least one person');
    expect(() => calculate(itemized({ items: [{ id: 'i1', name: 'Soup', amountCents: 100, participantIds: [] }] }))).toThrow('Assign each item');
    expect(() => calculate(itemized({ items: [{ id: 'i1', name: 'Soup', amountCents: 100, participantIds: ['missing'] }] }))).toThrow('valid people');
  });

  it('rejects duplicate identifiers and preserves deterministic output', () => {
    expect(() => calculate(itemized({ people: [{ id: 'a', name: 'A' }, { id: 'a', name: 'A2' }] }))).toThrow('unique');
    const first = calculate(itemized({ taxCents: 101, tip: { type: '18%' } }));
    const second = calculate(itemized({ taxCents: 101, tip: { type: '18%' } }));
    expect(second).toEqual(first);
  });

  it('rejects itemized totals that exceed safe integer bounds', () => {
    expect(() => calculate(itemized({ items: [{ id: 'i1', name: 'Large', amountCents: Number.MAX_SAFE_INTEGER, participantIds: ['a'] }, { id: 'i2', name: 'Overflow', amountCents: 1, participantIds: ['b'] }] }))).toThrow('too large');
    expect(() => calculate(itemized({ taxCents: Number.MAX_SAFE_INTEGER }))).toThrow('too large');
  });
});

describe('draft persistence contracts', () => {
  it('round trips a valid draft and rejects malformed persisted state', () => {
    const draft = equal({ subtotalCents: 1299, taxCents: 103, tip: { type: 'custom', amountCents: 250 } });
    expect(parseDraft(serializeDraft(draft))).toEqual(draft);
    expect(() => parseDraft('{"mode":"equal","subtotalCents":-1}')).toThrow('could not be restored');
    expect(() => parseDraft('{"mode":"equal","subtotalCents":100,"taxCents":0,"peopleCount":2,"tip":{"type":"future"}}')).toThrow('could not be restored');
    expect(() => parseDraft('{"mode":"itemized","taxCents":0,"people":[],"items":[],"tip":{"type":"future"}}')).toThrow('could not be restored');
    expect(() => parseDraft('{"mode":"itemized","taxCents":0,"people":[{"id":"a","name":"A"}],"items":[{"id":"i1","name":"Soup","participantIds":[]}],"tip":{"type":"none"}}')).toThrow('could not be restored');
  });
});
