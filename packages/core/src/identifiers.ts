/**
 * Allocate session-unique, non-sensitive draft identities for both clients.
 * A timestamp alone can collide when several additions share one millisecond.
 * The counter handles same-tick additions and occupied IDs cover restored
 * drafts created during an earlier session.
 */
let nextSequence = 0;

export function createDraftEntityId(
  kind: 'person' | 'item',
  existingIds: readonly string[],
  timestamp = Date.now()
): string {
  const occupied = new Set(existingIds);
  let candidate: string;
  do {
    candidate = `${kind}-${timestamp}-${++nextSequence}`;
  } while (occupied.has(candidate));
  return candidate;
}
