import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import App from '../src/App.vue';
import { clearDraft, loadDraft, saveDraft } from '../src/storage';

async function fillInput(wrapper: ReturnType<typeof mount>, label: string, value: string) {
  const input = wrapper.get(`input[aria-label="${label}"]`);
  await input.setValue(value);
}

describe('Splitlery web workflow', () => {
  it('saves, reloads, and clears the active draft through the production adapter', () => {
    const storage = new Map<string, string>();
    const adapter = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) } as unknown as Storage;
    const draft = { mode: 'equal' as const, subtotalCents: 1299, taxCents: 103, peopleCount: 2, tip: { type: 'none' as const } };
    saveDraft(draft, adapter);
    expect(loadDraft(adapter)).toEqual(draft);
    clearDraft(adapter);
    expect(loadDraft(adapter)).toBeNull();
  });

  it('calculates an equal split through the production form', async () => {
    const wrapper = mount(App, { global: { stubs: { Teleport: true } } });
    await fillInput(wrapper, 'Subtotal', '79.67');
    await fillInput(wrapper, 'Tax', '0');
    await fillInput(wrapper, 'Number of people', '4');
    await wrapper.get('select[aria-label="Tip selection"]').setValue('none');
    await wrapper.get('button[aria-label="Calculate split"]').trigger('click');
    await wrapper.get('form').trigger('submit');
    expect(wrapper.text()).toContain('$79.67');
    expect(wrapper.text()).toContain('Person 1');
    expect(wrapper.text()).toContain('$19.92');
    expect(wrapper.text()).toContain('$19.91');
  });

  it('clears the active form only after reset confirmation', async () => {
    const wrapper = mount(App);
    await wrapper.get('input[aria-label="Subtotal"]').setValue('12.00');
    await wrapper.get('button[aria-label="Reset receipt"]').trigger('click');
    expect(wrapper.get('[role="dialog"]').text()).toContain('Reset this receipt?');
    await wrapper.get('button.danger-button').trigger('click');
    expect((wrapper.get('input[aria-label="Subtotal"]').element as HTMLInputElement).value).toBe('');
  });

  it('calculates an itemized workflow with a shared item, tax, tip, and visible reconciliation', async () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) });
    const wrapper = mount(App);
    await wrapper.get('button[aria-label="Itemized mode"]').trigger('click');
    await wrapper.get('button[aria-label="Add person"]').trigger('click');
    await wrapper.get('button[aria-label="Add item"]').trigger('click');
    const nameInputs = wrapper.findAll('input[placeholder="Item name"]');
    await nameInputs[0].setValue('Dinner');
    await wrapper.find('input[aria-label="Item amount Dinner"]').setValue('30.00');
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    await checkboxes[0].setValue(true);
    await checkboxes[1].setValue(true);
    await wrapper.get('input[aria-label="Tax"]').setValue('3.00');
    await wrapper.get('select[aria-label="Tip selection"]').setValue('20%');
    await wrapper.get('button[aria-label="Calculate split"]').trigger('click');
    await wrapper.get('form').trigger('submit');
    expect(wrapper.text()).toContain('Everyone’s share');
    expect(wrapper.text()).toContain('$39.00');
    expect(wrapper.text()).toContain('$19.50');
    expect(storage.size).toBe(1);
  });
});
