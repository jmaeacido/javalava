import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const base = 'https://java-lava.vercel.app/concept-a/';
const shots = [['home','index.html',0],['home2','index.html',0.6],['cocktails','cocktails.html',0.25],['shop','shop.html',0.0]];
for (const [name,page,frac] of shots){
  await p.goto(base+page,{waitUntil:'networkidle'});
  await p.waitForTimeout(2200);
  if(frac>0){ await p.evaluate(f=>window.scrollTo(0,document.body.scrollHeight*f), frac); await p.waitForTimeout(1200); }
  await p.screenshot({path:`shots/m-${name}.png`});
  console.log('shot',name);
}
await b.close(); console.log('done');
