/**
 * store.js — Observable state management
 *
 * Data flows only one direction:
 *   API → store.set() → subscribers (renderers / controllers)
 *
 * Renderers NEVER write to stores.
 * Controllers are the only writers.
 */

'use strict';

// ── Generic store factory ──────────────────────────────────────────────────

/**
 * Create a lightweight observable store.
 * @template T
 * @param {T} initialState
 */
export function createDiptyqueStore(initialState) {
  let state  = initialState;
  const subs = new Set();

  const notify = () => subs.forEach(fn => {
    try { fn(state); } catch (e) { console.error('[DiptyqueStore] Subscriber error', e); }
  });

  return {
    get()    { return state; },
    set(next) { state = next; notify(); },
    update(fn) { state = fn(state); notify(); },

    subscribe(listener) {
      subs.add(listener);
      return () => subs.delete(listener);
    },

    find(predicate) {
      const s = Array.isArray(state) ? state : (state?.items ?? state?.orders ?? []);
      return s.find(predicate);
    },
  };
}

// ── Domain store singletons ────────────────────────────────────────────────

/** { status: 'idle'|'loading'|'ready'|'error', customer: Object|null, error: string|null } */
export const diptyqueCustomerStore = createDiptyqueStore({
  status:   'idle',
  customer: null,
  error:    null,
});

/** { status: 'idle'|'loading'|'ready'|'error', addresses: AddressRecord[], error: string|null } */
export const diptyqueAddressStore = createDiptyqueStore({
  status:    'idle',
  addresses: [],
  error:     null,
});


/** Order history page store with pagination support */
export const diptyqueOrderHistoryStore = createDiptyqueStore({
  status:      'idle',
  orders:      [],
  hasNextPage: false,
  endCursor:   null,
  loadingMore: false,
  error:       null,
});
