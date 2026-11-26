import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
const [, , screen, width = '1440', action = ''] = process.argv;
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: +width, height: 900 } });
await ctx.route('http://lighthouse.local/**', (r) => { const p = new URL(r.request().url()).pathname; const f = join('dist', p === '/' ? 'index.html' : p); return existsSync(f) ? r.fulfill({ status: 200, contentType: T[extname(f)], body: readFileSync(f) }) : r.fulfill({ status: 404 }); });
await ctx.route('https://rsms.me/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`.slice(0, 300)));
page.on('pageerror', (e) => logs.push('PAGEERROR ' + String(e).slice(0, 400)));
await page.goto(`http://lighthouse.local/?screen=${screen}&theme=light`);
await page.waitForTimeout(1000);
if (action) { await eval(`(async () => { ${action} })()`); await page.waitForTimeout(900); }
const info = await page.evaluate(() => {
  const q = (s) => [...document.querySelectorAll(s)].map((e) => { const r = e.getBoundingClientRect(); return `${s} ${e.className.toString().slice(0, 60)} ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} op=${getComputedStyle(e).opacity}`; });
  return [...q('.srn-sheet-overlay'), ...q('.srn-sheet'), ...q('.srn-modal'), ...q('[role=dialog]'), ...q('.srn-toast')].join('\n') + '\nactive: ' + (document.activeElement?.outerHTML || '').slice(0, 150);
});
console.log(info); console.log(logs.join('\n'));
await page.screenshot({ path: `/tmp/probe.png` });
await b.close();
