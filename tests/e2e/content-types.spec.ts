import { expect, test } from '@playwright/test';
import { encodePayload, type Payload } from '../../src/core';
import { decodeFile } from './helpers/decode-file';

interface Case {
  kind: string;
  fields: Record<string, string>;
  payload: Payload;
  extra?: (page: import('@playwright/test').Page) => Promise<void>;
}

const CASES: Case[] = [
  {
    kind: 'URL',
    fields: { '#f-url': 'https://example.com/a?b=c#d' },
    payload: { kind: 'url', url: 'https://example.com/a?b=c#d' },
  },
  {
    kind: 'Text',
    fields: { '#f-text': 'Grüße aus Köln\nZeile 2' },
    payload: { kind: 'text', text: 'Grüße aus Köln\nZeile 2' },
  },
  {
    kind: 'WLAN',
    fields: { '#f-ssid': 'Heim;Netz,5G', '#f-password': 'p\\a:ss"w' },
    payload: { kind: 'wifi', ssid: 'Heim;Netz,5G', password: 'p\\a:ss"w', security: 'WPA', hidden: false },
  },
  {
    kind: 'Kontakt',
    fields: {
      '#f-first': 'Jürgen',
      '#f-last': 'Müller, Jr.',
      '#f-org': 'Bäckerei; Café',
      '#f-vphone': '+49 221 123456',
      '#f-vemail': 'j@example.de',
      '#f-vurl': 'https://example.de',
      '#f-vaddr': 'Hauptstr. 1, 50667 Köln',
    },
    payload: {
      kind: 'vcard',
      firstName: 'Jürgen',
      lastName: 'Müller, Jr.',
      org: 'Bäckerei; Café',
      phone: '+49 221 123456',
      email: 'j@example.de',
      url: 'https://example.de',
      address: 'Hauptstr. 1, 50667 Köln',
    },
  },
  {
    kind: 'E-Mail',
    fields: { '#f-to': 'info@example.de', '#f-subject': 'Grüße & Fragen?', '#f-body': 'Hallo,\nwie geht’s?' },
    payload: {
      kind: 'email',
      to: 'info@example.de',
      subject: 'Grüße & Fragen?',
      body: 'Hallo,\nwie geht’s?',
    },
  },
  {
    kind: 'SMS',
    fields: { '#f-smsnr': '+49 151 2345678', '#f-smsmsg': 'Bin gleich da: 5 Min' },
    payload: { kind: 'sms', number: '+49 151 2345678', message: 'Bin gleich da: 5 Min' },
  },
  {
    kind: 'Telefon',
    fields: { '#f-phone': '+49 30 1234567' },
    payload: { kind: 'phone', number: '+49 30 1234567' },
  },
  {
    kind: 'Ort',
    fields: { '#f-lat': '-33.856784', '#f-lng': '151.215297' },
    payload: { kind: 'geo', lat: -33.856784, lng: 151.215297 },
  },
];

for (const c of CASES) {
  test(`advanced mode: ${c.kind} downloads decode to the encoded payload`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('immerqr.mode', 'advanced'));
    await page.goto('/');
    await page.getByRole('radio', { name: c.kind, exact: true }).check();
    for (const [sel, value] of Object.entries(c.fields)) await page.locator(sel).fill(value);
    const expected = encodePayload(c.payload);
    await expect(page.getByText('Geprüft: Der Code enthält genau')).toBeVisible();
    const [file] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'PNG laden' }).click(),
    ]);
    const path = test.info().outputPath(file.suggestedFilename());
    await file.saveAs(path);
    const d = await decodeFile(path);
    expect({ jsqr: d.jsqr, zxing: d.zxing }).toEqual({ jsqr: expected, zxing: expected });
  });
}

test('advanced mode: "Klassisch" draws plain black squares', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('immerqr.mode', 'advanced'));
  await page.goto('/');
  await page.locator('#f-url').fill('https://example.com');
  await page.getByRole('button', { name: /Klassisch/ }).click();
  const svg = page.locator('svg:has(path.eye)').first();
  await expect(svg.locator('path.eye').first()).toHaveAttribute('fill', '#000000');
  await expect(svg.locator('path.eye').first()).toHaveAttribute('d', /^M\d+ \d+h3v3h-3z$/);
});
