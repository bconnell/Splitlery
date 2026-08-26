import { CalculationError } from './errors';

export const MAX_CENTS = Number.MAX_SAFE_INTEGER;

export function assertSafeCents(value: number, label = 'Amount'): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new CalculationError(`${label} must be a valid non-negative amount.`);
  return value;
}

export function addSafeCents(left: number, right: number, label = 'Amount'): number {
  assertSafeCents(left, label);
  assertSafeCents(right, label);
  const total = left + right;
  if (!Number.isSafeInteger(total)) throw new CalculationError('That receipt is too large to calculate safely.');
  return total;
}

export function parseCurrencyToCents(value: string): number {
  if (typeof value !== 'string') throw new CalculationError('Enter a valid amount.');
  const normalized = value.trim().replace(/^\$/, '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized) && !/^\.\d{1,2}$/.test(normalized)) throw new CalculationError('Enter a valid amount, such as 12.99.');
  const [wholePart, fractionPart = ''] = normalized.replace(/^\./, '0.').split('.');
  const whole = Number(wholePart);
  const fraction = Number((fractionPart + '00').slice(0, 2));
  if (!Number.isSafeInteger(whole) || whole > Math.floor(MAX_CENTS / 100)) throw new CalculationError('That amount is too large.');
  return assertSafeCents(whole * 100 + fraction);
}

export function formatCurrency(cents: number): string {
  assertSafeCents(cents);
  return `$${Math.floor(cents / 100).toLocaleString('en-US')}.${String(cents % 100).padStart(2, '0')}`;
}

export function roundDivision(numerator: number, denominator: number): number {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator <= 0) throw new CalculationError('Unable to calculate that amount.');
  return Math.floor(numerator / denominator) + ((numerator % denominator) * 2 >= denominator ? 1 : 0);
}
