import type { Payload } from './core';

const MAX_LENGTH = 80;

/** File-system-safe base name: letters, digits, dot, dash and underscore; no leading dots. */
export function sanitizeFileName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, MAX_LENGTH);
}

/** `immerqr-<host>` for links, `immerqr-<kind>` for everything else. */
export function defaultFileName(payload: Payload): string {
  if (payload.kind === 'url') {
    try {
      const host = new URL(payload.url.trim()).hostname.replace(/^www\./, '');
      const safe = sanitizeFileName(host);
      if (safe) return `immerqr-${safe}`;
    } catch {
      // Not a parseable URL; fall through to the kind.
    }
  }
  return `immerqr-${payload.kind}`;
}

export function resolveFileName(custom: string, payload: Payload): string {
  return sanitizeFileName(custom) || defaultFileName(payload);
}
