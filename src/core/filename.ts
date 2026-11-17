import type { Payload } from './types';

const MAX_LENGTH = 80;

function slug(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function defaultBase(payload: Payload): string {
  if (payload.kind === 'url') {
    // Host as typed; URL.hostname would turn umlauts into punycode.
    const host = /^[a-z][a-z0-9+.-]*:\/\/(?:[^/?#@]*@)?([^/?#:]+)/i.exec(payload.url.trim())?.[1];
    const s = host ? slug(host.replace(/^www\./i, '')) : '';
    if (s) return `immerqr-${s}`;
  }
  return `immerqr-${payload.kind}`;
}

/**
 * File name for a download: the user's name made safe for every common file system,
 * or `immerqr-<host>` / `immerqr-<kind>` when none is given. `ext` without the dot.
 */
export function fileName(payload: Payload, ext: 'png' | 'svg' | 'pdf', custom?: string): string {
  const cleaned = (custom ?? '')
    .replace(new RegExp(`\\.${ext}$`, 'i'), '')
    // Control characters and characters reserved on Windows, macOS or Linux.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.\s-]+|[.\s]+$/g, '')
    .slice(0, MAX_LENGTH)
    .trim();
  const reserved = /^(con|prn|aux|nul|com\d|lpt\d)$/i.test(cleaned);
  const base = cleaned && !reserved ? cleaned : defaultBase(payload);
  return `${base}.${ext}`;
}
