import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('deploy config', () => {
  it('serves the custom domain', () => {
    expect(readFileSync('public/CNAME', 'utf8').trim()).toBe('immerqr.de');
  });
});
