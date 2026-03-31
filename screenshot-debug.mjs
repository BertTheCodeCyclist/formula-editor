import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:4200');
await page.waitForTimeout(2000);

// Select a view
await page.locator('p-select#viewSelect').click();
await page.waitForTimeout(500);
await page.locator('.p-select-option').first().click();
await page.waitForTimeout(500);

// Click Annualized Percentage template
const cards = page.locator('[class*="cursor-pointer"]');
await cards.nth(7).click();
await page.waitForTimeout(500);

// Get computed styles of the select dropdown
const selectStyles = await page.evaluate(() => {
  const select = document.querySelector('.p-select');
  const input = document.querySelector('input[pinputtext]');
  const selectEl = select ? getComputedStyle(select) : null;
  const inputEl = input ? getComputedStyle(input) : null;

  // Get all CSS custom properties from root
  const rootStyles = getComputedStyle(document.documentElement);
  const vars = {};
  for (const prop of ['--p-select-background', '--p-inputtext-background', '--p-surface-0', '--p-surface-900', '--p-surface-950']) {
    vars[prop] = rootStyles.getPropertyValue(prop);
  }

  return {
    selectBg: selectEl?.backgroundColor,
    selectColor: selectEl?.color,
    inputBg: inputEl?.backgroundColor,
    inputColor: inputEl?.color,
    cssVars: vars,
    selectClasses: select?.className,
    selectHTML: select?.outerHTML?.substring(0, 500)
  };
});

console.log(JSON.stringify(selectStyles, null, 2));

await page.screenshot({ path: 'screenshot-debug.png', fullPage: true });
await browser.close();
