import { expect, test, type Page } from '@playwright/test';
import { decodeFile } from './helpers/decode-file';

const URL_INPUT = 'https://example.com/speisekarte?tisch=12&größe=L';

async function download(page: Page, label: string): Promise<string> {
  const [file] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: label }).click(),
  ]);
  const path = test.info().outputPath(file.suggestedFilename());
  await file.saveAs(path);
  return path;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('immerqr.mode', 'simple'));
  await page.goto('/');
});

test('simple mode: PNG, SVG and PDF downloads decode to the typed link', async ({ page }) => {
  await page.getByLabel('Link').fill(URL_INPUT);
  await expect(page.getByText(URL_INPUT, { exact: true })).toBeVisible();
  for (const label of ['PNG laden', 'SVG laden', 'PDF laden']) {
    const path = await download(page, label);
    expect(path).toMatch(/immerqr-example-com\.(png|svg|pdf)$/);
    const d = await decodeFile(path);
    expect({ jsqr: d.jsqr, zxing: d.zxing }, label).toEqual({ jsqr: URL_INPUT, zxing: URL_INPUT });
  }
});

test('simple mode: scan check shows the exact text', async ({ page }) => {
  await page.getByLabel('Link').fill(URL_INPUT);
  await expect(page.getByText('Geprüft: Der Code enthält genau')).toBeVisible();
});

test('simple mode: too long shows an error and offers no download', async ({ page }) => {
  await page.getByLabel('Link').fill(`https://example.com/${'x'.repeat(3000)}`);
  await expect(page.getByRole('alert').or(page.locator('[role=status]')).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'PNG laden' })).toBeDisabled();
});
