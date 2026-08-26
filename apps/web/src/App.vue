<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { calculate, defaultItemizedDraft, formatCurrency, parseCurrencyToCents, type CalculationSummary, type EqualReceiptDraft, type ItemizedReceiptDraft, type ReceiptDraft, type ReceiptItem, type TipSelection } from '@splitlery/core';
import { clearDraft, loadDraft, saveDraft } from './storage';

type Mode = 'equal' | 'itemized';
type FormItem = { id: string; name: string; amount: string; participantIds: string[] };
const mode = ref<Mode>('equal');
const equalSubtotal = ref(''); const equalTax = ref(''); const equalPeople = ref('2'); const equalTip = ref<TipSelection['type']>('18%'); const equalCustomTip = ref('');
const people = ref<{ id: string; name: string }[]>([]); const items = ref<FormItem[]>([]); const itemTax = ref(''); const itemTip = ref<TipSelection['type']>('18%'); const itemCustomTip = ref('');
const result = ref<CalculationSummary | null>(null); const error = ref(''); const showResetConfirm = ref(false);

const tipOptions = [{ value: 'none', label: 'No Tip' }, { value: '15%', label: '15%' }, { value: '18%', label: '18%' }, { value: '20%', label: '20%' }, { value: '25%', label: '25%' }, { value: 'custom', label: 'Custom amount' }];
const activeTip = computed(() => mode.value === 'equal' ? equalTip.value : itemTip.value);
const activeCustomTip = computed(() => mode.value === 'equal' ? equalCustomTip.value : itemCustomTip.value);

function moneyValue(value: string): number { return value.trim() === '' ? 0 : parseCurrencyToCents(value); }
function tipFrom(type: TipSelection['type'], custom: string): TipSelection { return type === 'custom' ? { type: 'custom', amountCents: moneyValue(custom) } : { type } as TipSelection; }
function draftFromForm(): ReceiptDraft {
  if (mode.value === 'equal') return { mode: 'equal', subtotalCents: moneyValue(equalSubtotal.value), taxCents: moneyValue(equalTax.value), peopleCount: Number(equalPeople.value), tip: tipFrom(equalTip.value, equalCustomTip.value) } as EqualReceiptDraft;
  const draftItems: ReceiptItem[] = items.value.map((item) => ({ id: item.id, name: item.name.trim(), amountCents: moneyValue(item.amount), participantIds: item.participantIds }));
  return { mode: 'itemized', people: people.value, items: draftItems, taxCents: moneyValue(itemTax.value), tip: tipFrom(itemTip.value, itemCustomTip.value) } as ItemizedReceiptDraft;
}
function persist(): void { try { saveDraft(draftFromForm()); } catch { /* incomplete fields remain in the form until they are valid */ } }
function formatInput(cents: number): string { return cents === 0 ? '' : (cents / 100).toFixed(2); }
function restore(): void {
  const draft = loadDraft(); if (!draft) { const d = defaultItemizedDraft(); people.value = d.people; return; }
  mode.value = draft.mode;
  if (draft.mode === 'equal') { equalSubtotal.value = formatInput(draft.subtotalCents); equalTax.value = formatInput(draft.taxCents); equalPeople.value = String(draft.peopleCount); equalTip.value = draft.tip.type; equalCustomTip.value = draft.tip.type === 'custom' ? formatInput(draft.tip.amountCents) : ''; }
  else { people.value = draft.people; items.value = draft.items.map((item) => ({ id: item.id, name: item.name, amount: formatInput(item.amountCents), participantIds: item.participantIds })); itemTax.value = formatInput(draft.taxCents); itemTip.value = draft.tip.type; itemCustomTip.value = draft.tip.type === 'custom' ? formatInput(draft.tip.amountCents) : ''; }
}
function calculateReceipt(): void { try { error.value = ''; result.value = calculate(draftFromForm()); persist(); } catch (cause) { result.value = null; error.value = cause instanceof Error ? cause.message : 'Check the receipt details and try again.'; } }
function selectMode(next: Mode): void { mode.value = next; result.value = null; error.value = ''; persist(); }
function addPerson(): void { people.value.push({ id: `person-${Date.now()}`, name: `Person ${people.value.length + 1}` }); persist(); }
function removePerson(id: string): void { if (items.value.some((item) => item.participantIds.includes(id))) { error.value = 'Remove this person from their items before removing them.'; return; } people.value = people.value.filter((person) => person.id !== id); persist(); }
function addItem(): void { items.value.push({ id: `item-${Date.now()}`, name: '', amount: '', participantIds: [] }); persist(); }
function removeItem(id: string): void { items.value = items.value.filter((item) => item.id !== id); persist(); }
function toggleParticipant(item: FormItem, id: string): void { item.participantIds = item.participantIds.includes(id) ? item.participantIds.filter((current) => current !== id) : [...item.participantIds, id]; persist(); }
function resetReceipt(): void { clearDraft(); mode.value = 'equal'; equalSubtotal.value = ''; equalTax.value = ''; equalPeople.value = '2'; equalTip.value = '18%'; equalCustomTip.value = ''; const d = defaultItemizedDraft(); people.value = d.people; items.value = []; itemTax.value = ''; itemTip.value = '18%'; itemCustomTip.value = ''; result.value = null; error.value = ''; showResetConfirm.value = false; }
function personResultName(name: string, index: number): string { return name || `Person ${index + 1}`; }

watch([equalSubtotal, equalTax, equalPeople, equalTip, equalCustomTip, people, items, itemTax, itemTip, itemCustomTip, mode], persist, { deep: true });
onMounted(restore);
</script>

<template>
  <main class="shell">
    <header class="hero"><div><p class="eyebrow">LOCAL RECEIPT SPLITTER</p><h1>Splitlery</h1><p class="tagline">Split the check. Not the table.</p></div><button class="reset-link" type="button" aria-label="Reset receipt" @click="showResetConfirm = true">Reset receipt</button></header>
    <nav class="mode-tabs" aria-label="Split mode"><button type="button" :class="{ active: mode === 'equal' }" aria-label="Equal mode" @click="selectMode('equal')">Equal</button><button type="button" :class="{ active: mode === 'itemized' }" aria-label="Itemized mode" @click="selectMode('itemized')">Itemized</button></nav>
    <p class="privacy-note">Your receipt stays on this device.</p>
    <section class="workspace">
      <form class="card form-card" @submit.prevent="calculateReceipt">
        <template v-if="mode === 'equal'">
          <div class="section-heading"><span class="step">01</span><div><h2>Receipt</h2><p>Enter the numbers from your check.</p></div></div>
          <div class="field-grid"><label>Subtotal<input v-model="equalSubtotal" aria-label="Subtotal" inputmode="decimal" placeholder="0.00" /></label><label>Tax<input v-model="equalTax" aria-label="Tax" inputmode="decimal" placeholder="0.00" /></label><label>Number of people<input v-model="equalPeople" aria-label="Number of people" type="number" min="1" step="1" /></label></div>
          <div class="section-heading"><span class="step">02</span><div><h2>Tip</h2><p>Tip calculated from subtotal.</p></div></div>
          <label>Tip selection<select v-model="equalTip" aria-label="Tip selection"><option v-for="option in tipOptions" :key="option.value" :value="option.value">{{ option.label }}</option></select></label><label v-if="equalTip === 'custom'">Custom tip<input v-model="equalCustomTip" aria-label="Custom tip" inputmode="decimal" placeholder="0.00" /></label>
        </template>
        <template v-else>
          <div class="section-heading"><span class="step">01</span><div><h2>People</h2><p>Who is sharing this receipt?</p></div><button class="small-button" type="button" aria-label="Add person" @click="addPerson">+ Add person</button></div>
          <div class="people-list"><div v-for="(person, index) in people" :key="person.id" class="person-row"><input v-model="person.name" :aria-label="`Person ${index + 1} name`" :placeholder="`Person ${index + 1}`" /><button class="icon-button" type="button" :aria-label="`Remove ${personResultName(person.name, index)}`" @click="removePerson(person.id)">×</button></div></div>
          <div class="section-heading"><span class="step">02</span><div><h2>Items</h2><p>Assign each item to one or more people.</p></div><button class="small-button" type="button" aria-label="Add item" @click="addItem">+ Add item</button></div>
          <div v-if="items.length === 0" class="empty-box">Add an item to start splitting the receipt.</div>
          <article v-for="item in items" :key="item.id" class="item-editor"><div class="item-fields"><input v-model="item.name" placeholder="Item name" aria-label="Item name" /><input v-model="item.amount" :aria-label="`Item amount ${item.name}`" inputmode="decimal" placeholder="0.00" /><button class="icon-button" type="button" :aria-label="`Remove ${item.name || 'item'}`" @click="removeItem(item.id)">×</button></div><fieldset><legend>Shared by</legend><label v-for="person in people" :key="person.id" class="person-check"><input type="checkbox" :checked="item.participantIds.includes(person.id)" @change="toggleParticipant(item, person.id)" /> <span>{{ person.name }}</span></label></fieldset></article>
          <div class="section-heading"><span class="step">03</span><div><h2>Tax & Tip</h2><p>Tax is allocated by each person’s pretax share.</p></div></div>
          <div class="field-grid"><label>Tax<input v-model="itemTax" aria-label="Tax" inputmode="decimal" placeholder="0.00" /></label><label>Tip selection<select v-model="itemTip" aria-label="Tip selection"><option v-for="option in tipOptions" :key="option.value" :value="option.value">{{ option.label }}</option></select></label></div><label v-if="itemTip === 'custom'">Custom tip<input v-model="itemCustomTip" aria-label="Custom tip" inputmode="decimal" placeholder="0.00" /></label>
        </template>
        <p v-if="error" class="error" role="alert">{{ error }}</p><button class="primary-button" type="submit" aria-label="Calculate split">Calculate split <span>→</span></button>
      </form>
      <section class="card results-card" aria-live="polite"><div class="results-heading"><div><p class="eyebrow">YOUR RESULTS</p><h2>Everyone’s share</h2></div><span v-if="result" class="checkmark">✓</span></div><div v-if="!result" class="results-empty"><div class="receipt-mark">◒</div><p>Complete the details and calculate to see the split.</p></div><template v-else><div class="totals"><div><span>Subtotal</span><strong>{{ formatCurrency(result.subtotalCents) }}</strong></div><div><span>Tax</span><strong>{{ formatCurrency(result.taxCents) }}</strong></div><div><span>Tip</span><strong>{{ formatCurrency(result.tipCents) }}</strong></div><div class="grand-total"><span>Grand total</span><strong>{{ formatCurrency(result.grandTotalCents) }}</strong></div></div><div class="shares"><div v-for="(person, index) in result.people" :key="person.personId" class="share-row"><div><strong>{{ personResultName(person.personName, index) }}</strong><span v-if="mode === 'itemized'">{{ formatCurrency(person.itemShareCents) }} items · {{ formatCurrency(person.taxShareCents) }} tax · {{ formatCurrency(person.tipShareCents) }} tip</span></div><strong class="share-amount">{{ formatCurrency(person.totalCents) }}</strong></div></div><p class="reconciled">✓ Shares reconcile to {{ formatCurrency(result.grandTotalCents) }}</p></template></section>
    </section>
    <footer>Splitlery is local-only. No accounts, tracking, or receipt history.</footer>
    <div v-if="showResetConfirm" class="modal-backdrop" role="presentation"><div class="confirm-card" role="dialog" aria-modal="true" aria-labelledby="reset-title"><h2 id="reset-title">Reset this receipt?</h2><p>Your current draft will be cleared from this device.</p><div class="confirm-actions"><button type="button" @click="showResetConfirm = false">Keep receipt</button><button class="danger-button" type="button" @click="resetReceipt">Reset receipt</button></div></div></div>
  </main>
</template>
