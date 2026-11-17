import { expect, test } from '@playwright/test';

test('no request leaves the origin and the CSP is never violated', async ({ page, baseURL }) => {
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
  await page.goto('/');
  await page.waitForLoadState('networkidle');
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
