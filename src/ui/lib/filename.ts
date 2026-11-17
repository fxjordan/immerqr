import { fileName, type Payload } from './core';

/** Download base name without extension: the user's name made safe, else `immerqr-<host>` / `immerqr-<kind>`. */
export function resolveFileName(custom: string, payload: Payload): string {
  return fileName(payload, 'png', custom).replace(/\.png$/, '');
}

export function defaultFileName(payload: Payload): string {
  return resolveFileName('', payload);
}
