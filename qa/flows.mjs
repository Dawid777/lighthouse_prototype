// Click-through test of the Home flows on the built dist/ (served from disk, as in qa.mjs).
// npm run build && node qa/flows.mjs   (CHROME=/path/to/chrome when Playwright's Chromium is not installed)
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const ORIGIN = 'http://lighthouse.local';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
const OUT = 'qa/report/flows';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`); };

async function newPage(width = 1440) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  await ctx.route(`${ORIGIN}/**`, (r) => { const p = new URL(r.request().url()).pathname; const f = join('dist', p === '/' ? 'index.html' : p); return existsSync(f) ? r.fulfill({ status: 200, contentType: TYPES[extname(f)], body: readFileSync(f) }) : r.fulfill({ status: 404 }); });
  await ctx.route('https://rsms.me/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  try { await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: ORIGIN }); } catch { /* the copy falls back to its toast */ }
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${ORIGIN}/?theme=light#/home`);
  await page.waitForTimeout(800);
  return { page, ctx, errors };
}
const toastText = async (page) => (await page.locator('.srn-toast').allInnerTexts()).join(' | ');
const mod = process.platform === 'darwin' ? 'Meta' : 'Control';

try {
  // 1. Send: validation, review, send; Home updates.
  {
    const { page, errors } = await newPage();
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Review' }).click();
    await page.waitForTimeout(300);
    const err = await page.getByText('Add who you are paying.').count();
    const focused = await page.evaluate(() => document.activeElement?.closest('.srn-field')?.querySelector('label')?.textContent);
    check('Send: empty submit shows errors and focuses To', err === 1 && focused === 'To', `focus on ${focused}`);
    await page.getByRole('textbox', { name: 'To', exact: true }).fill('Maya Chen');
    await page.getByRole('textbox', { name: 'Amount', exact: true }).fill('999999');
    await page.getByRole('button', { name: 'Review' }).click();
    await page.waitForTimeout(300);
    check('Send: amount above available is refused', (await page.getByText(/That is more than the 11,446.45 USDC available/).count()) === 1);
    await page.getByRole('textbox', { name: 'Amount', exact: true }).fill('420');
    await page.locator('.srn-selectbox', { hasText: 'Reserve' }).click();
    await page.locator('.srn-selectbox', { hasText: 'Operating' }).click();
    await page.getByRole('button', { name: 'Review' }).click();
    await page.waitForTimeout(500);
    check('Send: review step shows the payment', (await page.getByRole('heading', { name: 'Review payment' }).count()) === 1 && (await page.getByText('Maya Chen').count()) > 0);
    await page.screenshot({ path: `${OUT}/send-review.png` });
    await page.getByRole('button', { name: /^Send 420.00/ }).click();
    await page.waitForTimeout(1300);
    check('Send: sent step and toast', (await page.getByRole('heading', { name: 'Payment sent' }).count()) === 1 && /Sent 420.00 USDC to Maya Chen/.test(await toastText(page)));
    await page.screenshot({ path: `${OUT}/send-done.png` });
    await page.getByRole('button', { name: 'Done' }).click();
    await page.waitForTimeout(500);
    const bal = await page.locator('#op-balance').innerText();
    const firstTx = await page.locator('.srn-gridlist').first().locator('.srn-gridlist-label').first().innerText();
    const recipients = await page.getByRole('grid', { name: /Recent recipients/ }).count() + await page.locator('#rec-title ~ * .srn-gridlist-label').count();
    check('Send: Home shows the new balance, transaction and recipient', bal.includes('345,310.65') && firstTx === 'Maya Chen' && recipients > 0, `${bal.trim()} / ${firstTx}`);
    check('Send: no page errors', errors.length === 0, errors.join('; '));
  }

  // 2. Add money, 3. Expense, 4. Detail + freeze, 5. Search, 6. Sidebar rail, 7. Theme
  {
    const { page, errors } = await newPage();
    await page.getByRole('button', { name: 'Add money' }).click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Copy deposit address' }).click();
    await page.waitForTimeout(300);
    check('Add money: copy shows a toast', /Copied to clipboard/.test(await toastText(page)));
    await page.getByRole('button', { name: 'Simulate deposit' }).click();
    await page.waitForTimeout(700);
    check('Add money: deposit lands on Home', (await page.locator('#op-balance').innerText()).includes('350,730.65') && /5,000.00 USDC added/.test(await toastText(page)));

    await page.getByRole('button', { name: 'Submit an expense' }).click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await page.waitForTimeout(300);
    check('Expense: empty submit shows errors', (await page.getByText('Add the merchant.').count()) === 1);
    await page.getByRole('textbox', { name: 'Merchant', exact: true }).fill('Uber');
    await page.getByRole('textbox', { name: 'Amount', exact: true }).fill('32.4');
    await page.getByRole('button', { name: /Category/ }).click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: 'Meals' }).click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await page.waitForTimeout(700);
    check('Expense: appears under Expenses', (await page.getByText('Meals · In review').count()) === 1);

    await page.getByRole('row', { name: /Ops card/ }).click();
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: 'Freeze card' }).click();
    await page.waitForTimeout(400);
    check('Detail: freezing a card updates the sheet and the row', (await page.getByRole('button', { name: 'Unfreeze card' }).count()) === 1 && (await page.getByText('Virtual · ••6034 · Frozen').count()) === 1);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    await page.keyboard.press(`${mod}+k`);
    await page.waitForTimeout(500);
    await page.keyboard.type('alan');
    await page.waitForTimeout(300);
    const opts = await page.getByRole('option').allInnerTexts();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000); // a Sheet takes focus once it has entered (React Aria Sheet)
    check('Search: ⌘K, filter and Enter opens the result', opts.length === 1 && (await page.getByRole('heading', { name: "Alan's card" }).count()) === 1, opts.join(','));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const openSheets = await page.locator('.srn-sheet').count();
    check('Search: Escape closes the opened result', openSheets === 0, `${openSheets} open`);
    await page.keyboard.press(`${mod}+b`);
    await page.waitForTimeout(600);
    const railW = await page.locator('.lh-sidebar').evaluate((e) => e.getBoundingClientRect().width);
    await page.getByRole('link', { name: 'Cards', exact: true }).hover();
    await page.waitForTimeout(1100);
    await page.screenshot({ path: `${OUT}/rail-tooltip.png` });
    await page.getByRole('button', { name: 'Expand sidebar' }).click();
    await page.waitForTimeout(600);
    const fullW = await page.locator('.lh-sidebar').evaluate((e) => e.getBoundingClientRect().width);
    check('Sidebar: ⌘B collapses to the rail, the logo expands it', railW === 64 && fullW === 240, `${railW} → ${fullW}`);

    await page.getByRole('button', { name: 'Account: Dawid' }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/account-menu.png` });
    await page.getByRole('menuitemradio', { name: 'Dark' }).click();
    await page.waitForTimeout(900);
    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    const bg = await page.evaluate(() => getComputedStyle(document.querySelector('.lh-pane')).backgroundColor);
    check('Account menu: the theme switches to Dark', theme === 'dark' && bg !== 'rgb(255, 255, 255)', `${theme} ${bg}`);
    await page.screenshot({ path: `${OUT}/dark-after-actions.png`, fullPage: true });

    await page.getByRole('link', { name: 'Cards', exact: true }).click();
    await page.waitForTimeout(500);
    check('Navigation: Cards is current and shows its placeholder', (await page.getByRole('heading', { name: 'Cards', level: 1 }).count()) === 1 && (await page.getByRole('link', { name: 'Cards', exact: true }).getAttribute('aria-current')) === 'page');
    check('Flows 2–7: no page errors', errors.length === 0, errors.join('; '));
  }

  // 8. Keyboard: the GridList and the chart
  {
    const { page } = await newPage();
    await page.getByRole('row', { name: /Deli 77/ }).focus();
    await page.keyboard.press('ArrowDown');
    const name = await page.evaluate(() => document.activeElement?.textContent);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    check('Keyboard: Down moves in the GridList, Enter opens the row', /Payment from Firefly/.test(name) && (await page.getByRole('heading', { name: 'Payment from Firefly' }).count()) === 1);
    check('Keyboard: focus is in the detail Sheet once it has entered', await page.evaluate(() => !!document.activeElement.closest('.srn-sheet')));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
    await page.getByRole('button', { name: /^Oct 31/ }).focus();
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    const tip = await page.locator('.srn-chart-tooltip').innerText();
    check('Keyboard: Left moves between chart points with the ChartTooltip', /353.0K USDC · Oct 26/.test(tip), tip);
  }

  // 9. Phone: drawer and a detail as a centred Modal
  {
    const { page, errors } = await newPage(390);
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/drawer.png` });
    await page.getByRole('dialog', { name: 'Main navigation' }).getByRole('link', { name: 'Transactions' }).click();
    await page.waitForTimeout(700);
    check('Phone: the drawer navigates and closes', (await page.getByRole('heading', { name: 'Transactions', level: 1 }).count()) === 1 && (await page.getByRole('dialog', { name: 'Main navigation' }).count()) === 0);
    await page.getByRole('link', { name: 'Back to Home' }).click();
    await page.waitForTimeout(600);
    await page.getByRole('row', { name: /Reserve/ }).click();
    await page.waitForTimeout(700);
    const box = await page.locator('.srn-modal').boundingBox();
    await page.screenshot({ path: `${OUT}/phone-detail.png` });
    check('Phone: a row opens a centred Modal (SR-276)', !!box && box.x >= 15 && box.width <= 360, box ? `${box.x},${box.width}` : 'none');
    await page.getByRole('button', { name: 'Send' }).last().click();
    await page.waitForTimeout(700);
    check('Phone: Send from the Reserve account preselects it', await page.getByRole('radio', { name: /Reserve/ }).isChecked());
    check('Phone: no page errors', errors.length === 0, errors.join('; '));
  }
} finally {
  await browser.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
