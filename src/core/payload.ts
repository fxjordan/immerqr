import type { Payload } from './types';

/** Thrown by `encodePayload` when a required field is empty or malformed. */
export class InvalidPayloadError extends Error {
  constructor(readonly field: string) {
    super(`invalid payload field: ${field}`);
    this.name = 'InvalidPayloadError';
  }
}

/** Turns a payload into the exact string stored in the code. URL and text are stored verbatim apart from trimming. */
export function encodePayload(p: Payload): string {
  switch (p.kind) {
    case 'url':
      return required(p.url.trim(), 'url');
    case 'text':
      return required(p.text.trim(), 'text');
    case 'wifi':
      return encodeWifi(p);
    case 'vcard':
      return encodeVcard(p);
    case 'email':
      return encodeEmail(p);
    case 'sms': {
      const number = phoneNumber(p.number, 'number');
      const message = p.message ?? '';
      return message === '' ? `SMSTO:${number}` : `SMSTO:${number}:${message}`;
    }
    case 'phone':
      return `tel:${phoneNumber(p.number, 'number')}`;
    case 'geo':
      return encodeGeo(p.lat, p.lng);
  }
}

function required(value: string, field: string): string {
  if (value === '') throw new InvalidPayloadError(field);
  return value;
}

/** Escaping per the ZXing WiFi format: backslash before `\ ; , : "`. */
function wifiEscape(s: string): string {
  return s.replace(/[\\;,:"]/g, (c) => `\\${c}`);
}

function encodeWifi(p: Extract<Payload, { kind: 'wifi' }>): string {
  required(p.ssid, 'ssid');
  let out = `WIFI:T:${p.security};S:${wifiEscape(p.ssid)};`;
  if (p.security !== 'nopass') out += `P:${wifiEscape(required(p.password, 'password'))};`;
  if (p.hidden) out += 'H:true;';
  return `${out};`;
}

/** Text-value escaping per RFC 2426 (vCard 3.0). */
function vcardEscape(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\r\n|\r|\n/g, '\\n');
}

function encodeVcard(p: Extract<Payload, { kind: 'vcard' }>): string {
  const first = p.firstName.trim();
  const last = p.lastName.trim();
  if (first === '' && last === '') throw new InvalidPayloadError('name');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${vcardEscape(last)};${vcardEscape(first)};;;`,
    `FN:${vcardEscape([first, last].filter(Boolean).join(' '))}`,
  ];
  const org = p.org?.trim();
  if (org) lines.push(`ORG:${vcardEscape(org)}`);
  const phone = p.phone?.trim();
  if (phone) lines.push(`TEL:${phoneNumber(phone, 'phone')}`);
  const email = p.email?.trim();
  if (email) lines.push(`EMAIL:${emailAddress(email, 'email')}`);
  const url = p.url?.trim();
  if (url) {
    if (/[\r\n]/.test(url)) throw new InvalidPayloadError('url');
    lines.push(`URL:${url}`);
  }
  const address = p.address?.trim();
  if (address) lines.push(`ADR:;;${vcardEscape(address)};;;;`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

function emailAddress(value: string, field: string): string {
  if (!/^[^\s@?&#]+@[^\s@?&#]+$/.test(value)) throw new InvalidPayloadError(field);
  return value;
}

/** `mailto:` per RFC 6068: header values percent-encoded, line breaks as CRLF. */
function encodeEmail(p: Extract<Payload, { kind: 'email' }>): string {
  const to = emailAddress(p.to.trim(), 'to');
  const params: string[] = [];
  if (p.subject) params.push(`subject=${encodeURIComponent(p.subject)}`);
  if (p.body) params.push(`body=${encodeURIComponent(p.body.replace(/\r\n|\r|\n/g, '\r\n'))}`);
  return params.length ? `mailto:${to}?${params.join('&')}` : `mailto:${to}`;
}

/** Strips visual separators; keeps an optional leading `+` and digits. */
function phoneNumber(value: string, field: string): string {
  const trimmed = value.trim();
  if (!/^\+?[0-9 ()\-/.]+$/.test(trimmed)) throw new InvalidPayloadError(field);
  const compact = trimmed.replace(/[ ()\-/.]/g, '');
  if (!/^\+?[0-9]{3,}$/.test(compact)) throw new InvalidPayloadError(field);
  return compact;
}

function coordinate(value: number, limit: number, field: string): string {
  if (!Number.isFinite(value) || Math.abs(value) > limit) throw new InvalidPayloadError(field);
  const fixed = value.toFixed(6).replace(/\.?0+$/, '');
  return fixed === '-0' ? '0' : fixed;
}

function encodeGeo(lat: number, lng: number): string {
  return `geo:${coordinate(lat, 90, 'lat')},${coordinate(lng, 180, 'lng')}`;
}
