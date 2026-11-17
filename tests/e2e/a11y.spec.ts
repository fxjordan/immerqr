import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const screens: Array<{ name: string; path: string; setup?: (page: Page) => Promise<void> }> = [
  { name: 'simple, empty', path: '/' },
  {
    name: 'simple, with link',
    path: '/',
    setup: async (page) => {
      await page.getByLabel('Link').fill('https://example.com/speisekarte');
      await expect(page.getByText('https://example.com/speisekarte', { exact: true })).toBeVisible();
    },
  },
  {
    name: 'simple, too long',
    path: '/',
    setup: async (page) => {
      await page.getByLabel('Link').fill(`https://example.com/${'x'.repeat(3000)}`);
    },
  },
  {
    name: 'advanced',
    path: '/',
    setup: async (page) => {
      await page.getByRole('radio', { name: 'Erweitert' }).check();
      await page.getByLabel('Link').fill('https://example.com');
    },
  },
  {
    name: 'advanced, low contrast',
    path: '/',
    setup: async (page) => {
      await page.getByRole('radio', { name: 'Erweitert' }).check();
      await page.getByLabel('Link').fill('https://example.com');
      await page.locator('input[type=color]').first().fill('#dddddd');
    },
  },
  { name: 'why', path: '/warum' },
  { name: 'privacy', path: '/datenschutz' },
  { name: 'imprint', path: '/impressum' },
  { name: 'not found', path: '/gibt-es-nicht' },
];

for (const scheme of ['light', 'dark'] as const) {
  for (const locale of ['de', 'en'] as const) {
    for (const screen of screens) {
      test(`axe: ${screen.name} (${scheme}, ${locale})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
        await page.addInitScript(() => localStorage.setItem('immerqr.mode', 'simple'));
        await page.goto(screen.path);
        await screen.setup?.(page);
        if (locale === 'en') await page.getByRole('radio', { name: 'EN', exact: true }).check();
        await page.waitForTimeout(400);
        const { violations } = await new AxeBuilder({ page }).analyze();
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
      });
    }
  }
}

test('no request leaves the page origin', async ({ page, baseURL }) => {
  const foreign: string[] = [];
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== new URL(baseURL!).origin)
      foreign.push(r.url());
  });
  await page.goto('/');
  await page.getByLabel('Link').fill('https://example.com');
  await page.getByRole('radio', { name: 'Erweitert' }).check();
  await page.getByRole('radio', { name: 'EN', exact: true }).check();
  await page.goto('/warum');
  expect(foreign).toEqual([]);
});
