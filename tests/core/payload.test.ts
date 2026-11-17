import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { encodePayload, InvalidPayloadError } from '../../src/core';
import { parseVcard, parseWifi } from '../helpers/parse';

describe('verbatim payload', () => {
  it('url is returned unchanged apart from outer whitespace', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'grapheme', minLength: 1 }), (s) => {
        fc.pre(s.trim() !== '');
        expect(encodePayload({ kind: 'url', url: s })).toBe(s.trim());
      }),
    );
  });

  it('text is returned unchanged apart from outer whitespace', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'grapheme', minLength: 1 }), (s) => {
        fc.pre(s.trim() !== '');
        expect(encodePayload({ kind: 'text', text: s })).toBe(s.trim());
      }),
    );
  });

  it('adds no scheme', () => {
    expect(encodePayload({ kind: 'url', url: ' example.com ' })).toBe('example.com');
  });

  it('rejects empty input', () => {
    expect(() => encodePayload({ kind: 'url', url: '   ' })).toThrow(InvalidPayloadError);
  });
});

describe('wifi', () => {
  const nasty = 'a;b,c:d\\e"f';

  it('escapes special characters and parses back', () => {
    const text = encodePayload({
      kind: 'wifi',
      ssid: nasty,
      password: nasty,
      security: 'WPA',
      hidden: false,
    });
    expect(text).toBe('WIFI:T:WPA;S:a\\;b\\,c\\:d\\\\e\\"f;P:a\\;b\\,c\\:d\\\\e\\"f;;');
    expect(parseWifi(text)).toEqual({ T: 'WPA', S: nasty, P: nasty });
  });

  it('omits the password for open networks and marks hidden ones', () => {
    expect(
      encodePayload({ kind: 'wifi', ssid: 'Café', password: 'x', security: 'nopass', hidden: true }),
    ).toBe('WIFI:T:nopass;S:Café;H:true;;');
  });

  it('requires a password for protected networks', () => {
    expect(() =>
      encodePayload({ kind: 'wifi', ssid: 'x', password: '', security: 'WEP', hidden: false }),
    ).toThrow(expect.objectContaining({ field: 'password' }));
  });
});

describe('vcard', () => {
  it('escapes commas, semicolons, backslashes and newlines', () => {
    const text = encodePayload({
      kind: 'vcard',
      firstName: 'Jürgen',
      lastName: 'Müller, Jr.',
      org: 'Bäckerei; Café',
      address: 'Hauptstr. 1\n50667 Köln',
      phone: '+49 221 123-456',
      email: 'j@example.de',
      url: 'https://example.de/a,b',
    });
    expect(text.split('\r\n')).toEqual([
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Müller\\, Jr.;Jürgen;;;',
      'FN:Jürgen Müller\\, Jr.',
      'ORG:Bäckerei\\; Café',
      'TEL:+49221123456',
      'EMAIL:j@example.de',
      'URL:https://example.de/a,b',
      'ADR:;;Hauptstr. 1\\n50667 Köln;;;;',
      'END:VCARD',
    ]);
    expect(parseVcard(text)).toMatchObject({
      N: ['Müller, Jr.', 'Jürgen', '', '', ''],
      ORG: ['Bäckerei; Café'],
      ADR: ['', '', 'Hauptstr. 1\n50667 Köln', '', '', '', ''],
    });
  });

  it('needs a name', () => {
    expect(() => encodePayload({ kind: 'vcard', firstName: ' ', lastName: '' })).toThrow(
      expect.objectContaining({ field: 'name' }),
    );
  });
});

describe('email', () => {
  it('percent-encodes subject and body, with CRLF line breaks', () => {
    expect(
      encodePayload({
        kind: 'email',
        to: 'a@example.de',
        subject: 'Grüße & mehr?',
        body: 'Zeile 1\nZeile 2 #3',
      }),
    ).toBe(
      'mailto:a@example.de?subject=Gr%C3%BC%C3%9Fe%20%26%20mehr%3F&body=Zeile%201%0D%0AZeile%202%20%233',
    );
  });

  it('is a plain mailto without extras', () => {
    expect(encodePayload({ kind: 'email', to: 'a@example.de' })).toBe('mailto:a@example.de');
  });

  it('rejects addresses that would break the URI', () => {
    expect(() => encodePayload({ kind: 'email', to: 'a@b.de?cc=x' })).toThrow(InvalidPayloadError);
  });
});

describe('sms and phone', () => {
  it('compacts +49 numbers', () => {
    expect(encodePayload({ kind: 'phone', number: '+49 (0)30 / 123-45.67' })).toBe('tel:+49030123456' + '7');
    expect(encodePayload({ kind: 'sms', number: '+49 151 2345678', message: 'Bin gleich da: 5 min' })).toBe(
      'SMSTO:+491512345678:Bin gleich da: 5 min',
    );
    expect(encodePayload({ kind: 'sms', number: '0151 2345678' })).toBe('SMSTO:01512345678');
  });

  it('rejects letters', () => {
    expect(() => encodePayload({ kind: 'phone', number: '0800-FLOWERS' })).toThrow(InvalidPayloadError);
  });
});

describe('geo', () => {
  it('keeps up to 6 decimals and negative values', () => {
    expect(encodePayload({ kind: 'geo', lat: -33.8567844, lng: 151.213108 })).toBe(
      'geo:-33.856784,151.213108',
    );
    expect(encodePayload({ kind: 'geo', lat: 50.94, lng: -6.95 })).toBe('geo:50.94,-6.95');
    expect(encodePayload({ kind: 'geo', lat: -0.0000001, lng: 0 })).toBe('geo:0,0');
  });

  it('rejects out-of-range coordinates', () => {
    expect(() => encodePayload({ kind: 'geo', lat: 91, lng: 0 })).toThrow(
      expect.objectContaining({ field: 'lat' }),
    );
    expect(() => encodePayload({ kind: 'geo', lat: 0, lng: Number.NaN })).toThrow(
      expect.objectContaining({ field: 'lng' }),
    );
  });
});
