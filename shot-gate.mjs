import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
const p = await ctx.newPage();
await p.goto('https://java-lava.vercel.app/concept-a/index.html',{waitUntil:'networkidle'});
await p.waitForTimeout(1500);
await p.screenshot({path:'shots/gate-desktop.png'});
// click yes, confirm it dismisses
await p.click('#ageYes');
await p.waitForTimeout(1200);
await p.screenshot({path:'shots/gate-after.png'});
// mobile gate
const ctx2 = await b.newContext({ viewport:{width:390,height:844}, isMobile:true });
const p2 = await ctx2.newPage();
await p2.goto('https://java-lava.vercel.app/concept-a/index.html',{waitUntil:'networkidle'});
await p2.waitForTimeout(1500);
await p2.screenshot({path:'shots/gate-mobile.png'});
await b.close(); console.log('done');
