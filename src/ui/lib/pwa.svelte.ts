/**
 * App-level PWA state the shell renders: install prompt, pending update, connectivity.
 * The service-worker registration calls `offerUpdate` when a new version is waiting.
 */
import { readStored, writeStored } from './storage';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_SEEN_KEY = 'immerqr.installHintSeen';

const state = $state<{
  installEvent: InstallPromptEvent | null;
  installHintSeen: boolean;
  update: (() => void) | null;
  online: boolean;
}>({
  installEvent: null,
  installHintSeen: readStored(INSTALL_SEEN_KEY) === '1',
  update: null,
  online: navigator.onLine,
});

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  state.installEvent = e as InstallPromptEvent;
});
window.addEventListener('appinstalled', () => {
  state.installEvent = null;
  markInstallHintSeen();
});
window.addEventListener('online', () => (state.online = true));
window.addEventListener('offline', () => (state.online = false));

function markInstallHintSeen(): void {
  state.installHintSeen = true;
  writeStored(INSTALL_SEEN_KEY, '1');
}

export const pwa = {
  get canInstall(): boolean {
    return state.installEvent !== null && !state.installHintSeen;
  },
  get updateReady(): boolean {
    return state.update !== null;
  },
  get online(): boolean {
    return state.online;
  },
  async install(): Promise<void> {
    const event = state.installEvent;
    markInstallHintSeen();
    if (!event) return;
    state.installEvent = null;
    await event.prompt();
  },
  dismissInstall(): void {
    markInstallHintSeen();
  },
  applyUpdate(): void {
    state.update?.();
  },
};

/** Called by the service-worker registration with the function that activates the waiting worker and reloads. */
export function offerUpdate(apply: () => void): void {
  state.update = apply;
}
