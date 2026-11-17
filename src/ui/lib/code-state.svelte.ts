/**
 * Form state shared by simple and advanced mode, so switching modes keeps what the user typed.
 * Holds raw field values; `buildPayload` turns them into a core `Payload`.
 */
import { BRAND_STYLE, CLASSIC_STYLE, MIN_QUIET_ZONE } from './core';
import type { CodeStyle, Ecc, LogoImage, Payload, PayloadKind } from './core';
import type { PdfPage } from './core';
import type { PrintUnit } from './sizing';

export interface LogoState {
  image: LogoImage;
  name: string;
  scale: number;
  plate: boolean;
  platePadding: number;
}

export const DEFAULT_LOGO_SCALE = 0.22;
export const DEFAULT_PLATE_PADDING = 1;
export const DEFAULT_ECC: Ecc = 'Q';

export const fields = $state({
  kind: 'url' as PayloadKind,
  url: '',
  text: '',
  wifi: { ssid: '', password: '', security: 'WPA' as 'WPA' | 'WEP' | 'nopass', hidden: false },
  vcard: { firstName: '', lastName: '', org: '', phone: '', email: '', url: '', address: '' },
  email: { to: '', subject: '', body: '' },
  sms: { number: '', message: '' },
  phone: { number: '' },
  geo: { lat: '', lng: '' },
});

export const look = $state({
  style: { ...BRAND_STYLE } as CodeStyle,
  /** Background colour to restore when "transparent" is switched off again. */
  solidBg: BRAND_STYLE.bg,
  ecc: DEFAULT_ECC as Ecc,
  logo: null as LogoState | null,
});

export const output = $state({
  sizeMode: 'px' as 'px' | 'print',
  px: 1024,
  printValue: 50,
  printUnit: 'mm' as PrintUnit,
  dpi: 300,
  pdfPage: 'A4' as PdfPage,
  fileName: '',
});

export function applyPreset(preset: 'brand' | 'classic'): void {
  const base = preset === 'brand' ? BRAND_STYLE : CLASSIC_STYLE;
  look.style = { ...base, quietZone: Math.max(look.style.quietZone, MIN_QUIET_ZONE) };
  look.solidBg = base.bg;
}

function geoNumber(value: string): number {
  const v = value.trim().replace(',', '.');
  return v === '' ? Number.NaN : Number(v);
}

/** The payload for the current kind. Simple mode always encodes a link. */
export function buildPayload(kind: PayloadKind = fields.kind): Payload {
  switch (kind) {
    case 'url':
      return { kind, url: fields.url };
    case 'text':
      return { kind, text: fields.text };
    case 'wifi':
      return { kind, ...fields.wifi };
    case 'vcard':
      return { kind, ...fields.vcard };
    case 'email':
      return { kind, ...fields.email };
    case 'sms':
      return { kind, ...fields.sms };
    case 'phone':
      return { kind, ...fields.phone };
    case 'geo':
      return { kind, lat: geoNumber(fields.geo.lat), lng: geoNumber(fields.geo.lng) };
  }
}

/** True while every field of the kind is still empty, so the form shows a prompt instead of errors. */
export function isPristine(kind: PayloadKind = fields.kind): boolean {
  const blank = (o: Record<string, unknown>) =>
    Object.values(o).every((v) => typeof v !== 'string' || v.trim() === '');
  switch (kind) {
    case 'url':
      return fields.url.trim() === '';
    case 'text':
      return fields.text.trim() === '';
    case 'wifi':
      return fields.wifi.ssid === '' && fields.wifi.password === '';
    case 'vcard':
      return blank(fields.vcard);
    case 'email':
      return blank(fields.email);
    case 'sms':
      return blank(fields.sms);
    case 'phone':
      return blank(fields.phone);
    case 'geo':
      return blank(fields.geo);
  }
}
