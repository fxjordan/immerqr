import { expect, test, type Page } from '@playwright/test';

/** Words that read the same in both languages. */
const SAME_IN_BOTH = new Set([
  'Immer',
  'QR',
  'Logo',
  'ImmerQR',
  'PNG',
  'SVG',
  'PDF',
  'DE',
  'EN',
  'URL',
  'Text',
  'SMS',
  'GitHub',
  'Link',
  'A4',
  'Letter',
]);

async function visibleTexts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const el = node.parentElement;
      const text = node.textContent?.trim() ?? '';
      if (!el || !text || el.closest('svg, code, pre, [data-payload]')) continue;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || el.getClientRects().length === 0)
        continue;
      out.push(text);
    }
    return out;
  });
}

for (const mode of ['simple', 'advanced'] as const) {
  test(`${mode} mode: switching language changes every visible string`, async ({ page }) => {
    await page.addInitScript((m) => localStorage.setItem('immerqr.mode', m), mode);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    const german = new Set(await visibleTexts(page));
    await page.getByRole('radio', { name: 'EN', exact: true }).check();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    const unchanged = (await visibleTexts(page)).filter(
      (s) => german.has(s) && !SAME_IN_BOTH.has(s) && /\p{L}{2}/u.test(s),
    );
    expect(unchanged).toEqual([]);
  });
}

test('the language choice survives a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'EN', exact: true }).check();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test.describe('browser language', () => {
  test.use({ locale: 'en-US' });
  test('an English browser starts in English', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
