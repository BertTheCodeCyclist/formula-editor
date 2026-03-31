import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://localhost:4200');
await page.waitForTimeout(1000);

// Select a view from the dropdown
await page.locator('p-select#viewSelect').click();
await page.waitForTimeout(500);
await page.locator('.p-select-option').first().click();
await page.waitForTimeout(500);

// Screenshot template builder tab
await page.screenshot({ path: 'screenshot-templates.png', fullPage: true });

// Click the first advanced template (Percentage)
const advancedCards = page.locator('.border-2.rounded-lg.cursor-pointer');
await advancedCards.nth(7).click(); // first advanced card after 7 simple ones
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshot-template-selected.png', fullPage: true });

// Switch to free-text editor tab
await page.locator('p-tab', { hasText: 'Free-Text Editor' }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'screenshot-freetext.png', fullPage: true });

await browser.close();
console.log('Done');
