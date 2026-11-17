import { registerSW } from 'virtual:pwa-register';

export interface PwaState {
  /** A new version is installed and waiting; `applyUpdate()` reloads into it. */
  updateReady: boolean;
  /** Everything is cached; the app now works offline. */
  offlineReady: boolean;
}

type Listener = (state: PwaState) => void;

let state: PwaState = { updateReady: false, offlineReady: false };
const listeners = new Set<Listener>();
let update: ((reload?: boolean) => Promise<void>) | undefined;

function set(patch: Partial<PwaState>): void {
  state = { ...state, ...patch };
  for (const fn of listeners) fn(state);
}

/** Registers the service worker once; later calls do nothing. */
export function startPwa(): void {
  if (update || !('serviceWorker' in navigator)) return;
  update = registerSW({
    onNeedRefresh: () => set({ updateReady: true }),
    onOfflineReady: () => set({ offlineReady: true }),
  });
}

/** Calls `fn` now and on every change; returns the unsubscribe function. */
export function onPwaChange(fn: Listener): () => void {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export async function applyUpdate(): Promise<void> {
  await update?.(true);
}
