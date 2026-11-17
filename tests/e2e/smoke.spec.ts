import { expect, test } from '@playwright/test';

test('start page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /ImmerQR/ }).first()).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
