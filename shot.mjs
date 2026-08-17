import { chromium } from 'playwright';
const pages = [
  ['index', 'http://localhost:8777/index.html'],
  ['concept-a', 'http://localhost:8777/concept-a/index.html'],
  ['concept-b', 'http://localhost:8777/concept-b/index.html'],
  ['concept-c', 'http://localhost:8777/concept-c/index.html'],
];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
for (const [name, url] of pages) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200); // let loader + intro settle
  await page.screenshot({ path: `shots/${name}-top.png` });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.42));
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `shots/${name}-mid.png` });
  console.log('shot', name);
}
await browser.close();
console.log('ALL DONE');
