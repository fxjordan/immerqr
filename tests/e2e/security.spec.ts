import { expect, test } from '@playwright/test';

test('a full session stays on the origin and never violates the CSP', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const foreign: string[] = [];
  const violations: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith('data:') && !url.startsWith('blob:') && new URL(url).origin !== origin)
      foreign.push(url);
  });
  page.on('console', (msg) => {
    if (/Content Security Policy/i.test(msg.text())) violations.push(msg.text());
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) =>
      console.error(`Content Security Policy violation: ${e.violatedDirective} ${e.blockedURI}`),
    );
  });
  const requested: string[] = [];
  page.on('request', (req) => requested.push(req.url()));
  await page.addInitScript(() => localStorage.setItem('immerqr.mode', 'simple'));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // jsPDF is loaded only when a PDF is made.
  expect(requested.filter((u) => /jspdf/i.test(u))).toEqual([]);

  await page.getByLabel('Link').fill('https://example.com/session');
  for (const label of ['PNG laden', 'SVG laden', 'PDF laden']) {
    await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: label }).click()]);
  }
  expect(requested.filter((u) => /jspdf/i.test(u))).toHaveLength(1);
  await page.getByRole('radio', { name: 'Erweitert' }).check();
  await page.getByRole('radio', { name: 'WLAN', exact: true }).check();
  await page.getByRole('radio', { name: 'EN', exact: true }).check();
  await page.goto('/warum');
  await page.goto('/datenschutz');
  await page.reload();
  await page.waitForLoadState('networkidle');
  expect(foreign).toEqual([]);
  expect(violations).toEqual([]);
});

test('ships a strict CSP and no referrer', async ({ page }) => {
  await page.goto('/');
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("connect-src 'none'");
  expect(csp).not.toContain('unsafe-eval');
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
});
