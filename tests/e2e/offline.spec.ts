import { expect, test } from '@playwright/test';

test('reloads and generates codes offline after the first visit', async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem('immerqr.mode', 'simple'));
  await page.goto('/');
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }),
      );
    }
    return reg.active?.state;
  });
  await context.setOffline(true);
  await page.reload();
  await page.getByLabel('Link').fill('https://example.com/offline');
  await expect(page.getByText('Geprüft: Der Code enthält genau')).toBeVisible();
  const [file] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'PDF laden' }).click(),
  ]);
  expect(file.suggestedFilename()).toMatch(/\.pdf$/);
});

test('serves a valid web manifest', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest).toMatchObject({
    name: 'ImmerQR',
    display: 'standalone',
    theme_color: '#0F3B2C',
    start_url: '.',
  });
});
