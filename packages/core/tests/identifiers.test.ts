import { describe, expect, it } from 'vitest';
import { createDraftEntityId } from '../src/identifiers';

describe('local draft identities', () => {
  it('does not reuse a person or item identity when the clock does not advance', () => {
    const people = Array.from({ length: 128 }, () => createDraftEntityId('person', [], 1234));
    const items = Array.from({ length: 128 }, () => createDraftEntityId('item', [], 1234));
    expect(new Set(people).size).toBe(people.length);
    expect(new Set(items).size).toBe(items.length);
    expect(people.every((id) => id.startsWith('person-'))).toBe(true);
    expect(items.every((id) => id.startsWith('item-'))).toBe(true);
  });

  it('also avoids an occupied ID restored from an earlier draft', () => {
    const first = createDraftEntityId('person', [], 9876);
    const index = Number(first.split('-').at(-1));
    const occupied = [first, `person-9876-${index + 1}`];
    const next = createDraftEntityId('person', occupied, 9876);
    expect(occupied).not.toContain(next);
    expect(next).toBe(`person-9876-${index + 2}`);
  });
});
