import { describe, expect, it } from 'vitest';

describe('browser test runtime', () => {
  it('encodes a canvas to PNG', async () => {
    const canvas = new OffscreenCanvas(8, 8);
    canvas.getContext('2d')?.fillRect(0, 0, 8, 8);
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });
});
