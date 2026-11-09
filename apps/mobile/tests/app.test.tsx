import React from 'react';
import { act, create } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';
import { clearDraft, loadDraft, saveDraft } from '../src/storage';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('Splitlery mobile workflow', () => {
  it('saves, reloads, and clears the active draft through the production adapter', async () => {
    const draft = { mode: 'equal' as const, subtotalCents: 1299, taxCents: 103, peopleCount: 2, tip: { type: 'none' as const } };
    await saveDraft(draft);
    expect(await loadDraft()).toEqual(draft);
    await clearDraft();
    expect(await loadDraft()).toBeNull();
  });

  it('keeps persisted mobile people and items unique within one millisecond', async () => {
    await clearDraft();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(4567);
    let renderer: ReturnType<typeof create> | undefined;
    try {
      await act(async () => { renderer = create(<App />); await Promise.resolve(); });
      const root = renderer!.root;
      await act(async () => {
        root.find((node) => node.props.accessibilityLabel === 'Itemized mode').props.onPress();
      });
      await act(async () => {
        const add = root.find((node) => node.props.accessibilityLabel === 'Add person');
        add.props.onPress();
        add.props.onPress();
        const addItem = root.find((node) => node.props.accessibilityLabel === 'Add item');
        addItem.props.onPress();
        addItem.props.onPress();
        await Promise.resolve();
      });
      const saved = await loadDraft();
      expect(saved?.mode).toBe('itemized');
      if (saved?.mode !== 'itemized') throw new Error('Expected itemized draft');
      expect(new Set(saved.people.map((person) => person.id)).size).toBe(saved.people.length);
      expect(new Set(saved.items.map((item) => item.id)).size).toBe(saved.items.length);
    } finally {
      if (renderer) await act(async () => { renderer!.unmount(); });
      clock.mockRestore();
      await clearDraft();
    }
  });

  it('drives the production equal split component and renders reconciled results', async () => {
    let renderer: ReturnType<typeof create>;
    await act(async () => { renderer = create(<App />); await Promise.resolve(); });
    const root = renderer!.root;
    const subtotal = root.find((node) => node.props.accessibilityLabel === 'Subtotal');
    const tax = root.find((node) => node.props.accessibilityLabel === 'Tax');
    const numberOfPeople = root.find((node) => node.props.accessibilityLabel === 'Number of people');
    await act(async () => { subtotal.props.onChangeText('79.67'); tax.props.onChangeText('0'); numberOfPeople.props.onChangeText('4'); });
    const noTip = root.find((node) => node.props.accessibilityLabel === 'No Tip');
    await act(async () => { noTip.props.onPress(); });
    const calculate = root.find((node) => node.props.accessibilityLabel === 'Calculate split');
    await act(async () => { calculate.props.onPress(); });
    const output = JSON.stringify(renderer!.toJSON());
    expect(output).toContain('$79.67');
    expect(output).toContain('$19.92');
    expect(output).toContain('$19.91');
    expect(output).toContain('Shares reconcile');
  });
});
