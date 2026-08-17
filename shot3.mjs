import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
// home cocktails preview
await p.goto('http://localhost:8777/concept-a/index.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(2200);
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.82));
await p.waitForTimeout(1300);
await p.screenshot({ path: 'shots/site-index-cocktails.png' });
// shop pair-it (bottom)
await p.goto('http://localhost:8777/concept-a/shop.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(1300);
await p.screenshot({ path: 'shots/site-shop-pairit.png' });
await b.close();
console.log('done');
