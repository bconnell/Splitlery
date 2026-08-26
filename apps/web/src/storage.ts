import { parseDraft, serializeDraft, type ReceiptDraft } from '@splitlery/core';

export const STORAGE_KEY = 'splitlery-active-receipt';

export function loadDraft(storage: Storage = localStorage): ReceiptDraft | null {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return parseDraft(raw); } catch { storage.removeItem(STORAGE_KEY); return null; }
}

export function saveDraft(draft: ReceiptDraft, storage: Storage = localStorage): void { storage.setItem(STORAGE_KEY, serializeDraft(draft)); }
export function clearDraft(storage: Storage = localStorage): void { storage.removeItem(STORAGE_KEY); }
