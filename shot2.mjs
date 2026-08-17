import { chromium } from 'playwright';
const base = 'http://localhost:8777/concept-a/';
const pages = ['index','shop','story','cocktails','locator','contact'];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PAGEERROR: '+e.message));
for (const name of pages) {
  errs.length = 0;
  await page.goto(base + (name==='index'?'index.html':name+'.html'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `shots/site-${name}-top.png` });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `shots/site-${name}-mid.png` });
  console.log(name, errs.length ? ('ERRORS: '+errs.join(' | ')) : 'ok');
}
// mobile check on home
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(base+'index.html', { waitUntil:'networkidle' });
await page.waitForTimeout(2000);
await page.click('.menu-btn');
await page.waitForTimeout(600);
await page.screenshot({ path: 'shots/site-mobile-menu.png' });
console.log('mobile-menu ok');
await browser.close();
console.log('ALL DONE');
