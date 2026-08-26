import { CalculationError } from './errors';
import { addSafeCents, assertSafeCents } from './money';

export function allocateEvenly(totalCents: number, count: number): number[] {
  assertSafeCents(totalCents, 'Total');
  if (!Number.isSafeInteger(count) || count < 1) throw new CalculationError('Add at least one person.');
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

export function allocateProportionally(totalCents: number, weights: number[]): number[] {
  assertSafeCents(totalCents, 'Total');
  if (weights.length === 0 || weights.some((weight) => !Number.isSafeInteger(weight) || weight < 0)) throw new CalculationError('Unable to allocate that amount.');
  const weightTotal = weights.reduce((sum, weight) => addSafeCents(sum, weight, 'Allocation weight'), 0);
  if (weightTotal === 0) return allocateEvenly(totalCents, weights.length);
  const parts = weights.map((weight, index) => {
    const numerator = totalCents * weight;
    if (!Number.isSafeInteger(numerator)) throw new CalculationError('That receipt is too large to calculate safely.');
    return { base: Math.floor(numerator / weightTotal), remainder: numerator % weightTotal, index };
  });
  let remaining = totalCents - parts.reduce((sum, part) => addSafeCents(sum, part.base, 'Allocation'), 0);
  parts.sort((left, right) => right.remainder - left.remainder || left.index - right.index);
  for (let index = 0; index < parts.length && remaining > 0; index += 1, remaining -= 1) parts[index].base += 1;
  return parts.sort((left, right) => left.index - right.index).map((part) => part.base);
}
