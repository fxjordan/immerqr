/** Minimal WiFi QR parser (ZXing format), the way scanner apps read it. */
export function parseWifi(text: string): Record<string, string> {
  if (!text.startsWith('WIFI:')) throw new Error('not a WIFI payload');
  const out: Record<string, string> = {};
  let key = '';
  let value = '';
  let inValue = false;
  const body = text.slice(5);
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (inValue) {
      if (c === '\\') value += body[++i] ?? '';
      else if (c === ';') {
        out[key] = value;
        key = '';
        value = '';
        inValue = false;
      } else value += c;
    } else if (c === ':') inValue = true;
    else if (c !== ';') key += c;
  }
  return out;
}

/** Minimal vCard 3.0 parser: property name → unescaped structured components. */
export function parseVcard(text: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const line of text.split('\r\n')) {
    const idx = line.indexOf(':');
    const name = line.slice(0, idx);
    const parts: string[] = [];
    let current = '';
    const raw = line.slice(idx + 1);
    for (let i = 0; i < raw.length; i++) {
      const c = raw[i];
      if (c === '\\') {
        const next = raw[++i];
        current += next === 'n' || next === 'N' ? '\n' : (next ?? '');
      } else if (c === ';') {
        parts.push(current);
        current = '';
      } else current += c;
    }
    parts.push(current);
    out[name] = parts;
  }
  return out;
}
