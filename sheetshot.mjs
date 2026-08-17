import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1040, height: 760 } })).newPage();
await p.goto('file:///C:/work/java-lava/_review/sheet.html');
await p.waitForTimeout(800);
await p.screenshot({ path: '_review/sheet.png', fullPage: true });
await b.close();
console.log('done');
