import { readStored, writeStored } from './storage';

export type Mode = 'simple' | 'advanced';

const MODE_KEY = 'immerqr.mode';

const state = $state<{ mode: Mode }>({
  mode: readStored(MODE_KEY) === 'advanced' ? 'advanced' : 'simple',
});

export function getMode(): Mode {
  return state.mode;
}

export function setMode(mode: Mode): void {
  state.mode = mode;
  writeStored(MODE_KEY, mode);
}
