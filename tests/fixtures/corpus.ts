import type { Payload, PayloadKind } from '../../src/core';

type Of<K extends PayloadKind> = Extract<Payload, { kind: K }>;

export const URLS = [
  'https://example.com',
  'http://a.de',
  'https://example.com/speisekarte?tisch=12',
  'https://example.com/search?q=a&b=c#frag',
  'https://example.com/a%20b/c+d?x=%2F&y=1+2',
  'https://example.com:8443/path',
  'http://[2001:db8::1]:8080/index.html',
  'https://example.com/größe',
  'https://例え.jp/パス?キー=値',
  'https://example.com/🌲?emoji=✅',
  `https://www.example.org/${'segment/'.repeat(30)}?utm_free=${'x'.repeat(40)}`,
  'HTTPS://EXAMPLE.COM/UPPER',
];

export const CORPUS: { [K in PayloadKind]: Array<Of<K>> } = {
  url: URLS.map((url) => ({ kind: 'url', url })),
  text: [
    { kind: 'text', text: 'Grüße aus Köln' },
    { kind: 'text', text: '你好，世界。二维码测试' },
    { kind: 'text', text: 'Emoji 🌲🍂🌱 und ß' },
    { kind: 'text', text: '1234567890123456' },
    { kind: 'text', text: 'Zeile 1\nZeile 2\n\tEingerückt "Zitat" \\ Ende' },
  ],
  wifi: [
    { kind: 'wifi', ssid: 'Heim;Netz,Gast:5G', password: 'p\\a;s,s:w"o"rd', security: 'WPA', hidden: false },
    { kind: 'wifi', ssid: 'Café "Öffentlich"', password: '', security: 'nopass', hidden: true },
    { kind: 'wifi', ssid: 'old', password: '12345', security: 'WEP', hidden: false },
  ],
  vcard: [
    {
      kind: 'vcard',
      firstName: 'Jürgen',
      lastName: 'Müller, Jr.',
      org: 'Bäckerei; Café',
      phone: '+49 221 123456',
      email: 'j@example.de',
      url: 'https://example.de',
      address: 'Hauptstr. 1\n50667 Köln',
    },
    { kind: 'vcard', firstName: 'Ana', lastName: '' },
  ],
  email: [
    {
      kind: 'email',
      to: 'info@example.de',
      subject: 'Grüße & Fragen?',
      body: 'Hallo,\nwie geht’s? 100% gut #1',
    },
    { kind: 'email', to: 'a@b.de' },
  ],
  sms: [
    { kind: 'sms', number: '+49 151 2345678', message: 'Bin gleich da: 5 Min, ok?' },
    { kind: 'sms', number: '+4915112345678' },
  ],
  phone: [
    { kind: 'phone', number: '+49 30 1234567' },
    { kind: 'phone', number: '0221 / 98 76 54' },
  ],
  geo: [
    { kind: 'geo', lat: 50.941278, lng: 6.958281 },
    { kind: 'geo', lat: -33.856784, lng: -151.215297 },
    { kind: 'geo', lat: 0, lng: 0 },
  ],
};
