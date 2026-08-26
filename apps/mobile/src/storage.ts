import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseDraft, serializeDraft, type ReceiptDraft } from '@splitlery/core';

export const STORAGE_KEY = 'splitlery-active-receipt';
export async function loadDraft(): Promise<ReceiptDraft | null> { try { const raw = await AsyncStorage.getItem(STORAGE_KEY); return raw ? parseDraft(raw) : null; } catch { await AsyncStorage.removeItem(STORAGE_KEY); return null; } }
export async function saveDraft(draft: ReceiptDraft): Promise<void> { await AsyncStorage.setItem(STORAGE_KEY, serializeDraft(draft)); }
export async function clearDraft(): Promise<void> { await AsyncStorage.removeItem(STORAGE_KEY); }
