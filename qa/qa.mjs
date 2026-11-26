// Serenity prototype QA (adapted from the serenity-prototype starter): screenshots of every screen at 1440, 768 and 390 in
// Light and Dark, an axe-core scan against WCAG 2.2 AA at 1440 and 390, a keyboard pass (every Tab stop shows a focus ring)
// and a reduced-motion pass. The built dist/ is served from disk through Playwright's request routing, so no server runs.
// Run after a build: npm run build && npm run qa
//   SCREENS=home,send-form picks the screens (default: every id of SCREENS in src/App.jsx)
//   CHROME=/path/to/chrome uses an installed Chrome when Playwright's own Chromium is not installed
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const app = readFileSync('src/App.jsx', 'utf8');
const block = app.slice(app.indexOf('export const SCREENS = {'), app.indexOf('};', app.indexOf('export const SCREENS = {')));
const ids = [...block.matchAll(/^\s+'?([a-z0-9-]+)'?: \{/gm)].map((m) => m[1]);
const SCREENS = process.env.SCREENS ? process.env.SCREENS.split(',') : ids;
const WIDTHS = (process.env.WIDTHS || '1440,768,390').split(',').map(Number);
const THEMES = (process.env.THEMES || 'light,dark').split(',');
const OUT = 'qa/report';
const ORIGIN = 'http://lighthouse.local';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const serve = async (ctx) => {
  await ctx.route(`${ORIGIN}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    const file = join('dist', path === '/' ? 'index.html' : path);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: 'Not found' });
    return route.fulfill({ status: 200, contentType: TYPES[extname(file)] || 'application/octet-stream', body: readFileSync(file) });
  });
  // The Inter webfont is the one outside request; without the network the page falls back to the system font.
  await ctx.route('https://rsms.me/**', (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
};
const url = (s, theme = 'light') => `${ORIGIN}/?screen=${s}&theme=${theme}`;
const findings = [];
const settle = (page) => page.waitForTimeout(900);
try {
  for (const theme of THEMES) for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    await serve(ctx);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => findings.push({ screen: 'page', width, theme, rule: 'js-error', help: String(e) }));
    for (const s of SCREENS) {
      await page.goto(url(s, theme));
      await settle(page);
      // a page is shot whole; a screen with an overlay open is shot at the viewport, as the person sees it (SR-022)
      await page.screenshot({ path: `${OUT}/${s}-${width}-${theme}.png`, fullPage: !/overlay:/.test(block.split('\n').find((l) => l.includes(`'${s}'`) || l.includes(` ${s}:`)) || '') });
      if (width === 1440 || width === 390) {
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        for (const v of r.violations) findings.push({ screen: s, width, theme, rule: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 5) });
      }
    }
    await ctx.close();
  }
  const kctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await serve(kctx);
  const kb = await kctx.newPage();
  for (const s of SCREENS) {
    await kb.goto(url(s));
    await settle(kb);
    for (let i = 0; i < 12; i++) {
      await kb.keyboard.press('Tab');
      const r = await kb.evaluate(() => {
        const a = document.activeElement; if (!a || a === document.body) return null;
        const has = (n) => { const st = getComputedStyle(n); return st.boxShadow !== 'none' || (st.outlineStyle !== 'none' && st.outlineWidth !== '0px'); };
        let ring = has(a);
        for (let n = a.parentElement, k = 0; n && k < 4 && !ring; n = n.parentElement, k += 1) { if (n.hasAttribute('data-focus-within') || n.hasAttribute('data-focus-visible')) ring = has(n); }
        // a control whose ring is drawn on a sibling part (the Checkbox box, the active OTPCell) marks that part data-focus-ring
        for (let n = a.parentElement, k = 0; n && k < 3 && !ring; n = n.parentElement, k += 1) { const part = n.querySelector('[data-focus-ring]'); if (part) ring = has(part); }
        return { el: a.outerHTML.slice(0, 100), ring };
      });
      if (r && !r.ring) findings.push({ screen: s, rule: 'focus-visible', help: 'A focused element shows no focus ring (WCAG 2.2 SC 2.4.7 Focus Visible (AA))', nodes: [r.el] });
    }
  }
  const rctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await serve(rctx);
  const rm = await rctx.newPage();
  for (const s of SCREENS) { await rm.goto(url(s)); await settle(rm); await rm.screenshot({ path: `${OUT}/${s}-390-reduced-motion.png` }); }
} finally {
  await browser.close();
}
writeFileSync(`${OUT}/findings.json`, JSON.stringify(findings, null, 2) + '\n');
console.log(findings.length ? `${findings.length} findings: ${OUT}/findings.json` : `No findings. Screenshots in ${OUT}/`);
process.exit(findings.length ? 1 : 0);
