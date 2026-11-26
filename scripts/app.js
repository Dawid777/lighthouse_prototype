/* Lighthouse prototype: Home (Serenity 2.0). Plain JS, no build step. */
(function () {
  'use strict';

  /* ---------- Data (from Figma 1.0.a Home) ---------- */
  var state = {
    accounts: [
      { id: 'operating', name: 'Operating', balance: 345730.65, available: 11446.45, inFlight: 1284.20 },
      { id: 'reserve', name: 'Reserve', balance: 1441630.65 }
    ],
    transactions: [
      { id: 't1', name: 'Deli 77', sub: 'Card payment, today', amount: -63.53, method: 'Ops card ••6034', category: 'Meals', date: 'Today, 12:41' },
      { id: 't2', name: 'Payment from Firefly', sub: 'Deposit, yesterday', amount: 1200.00, method: 'Bank deposit', category: 'Income', date: 'Yesterday, 09:12' },
      { id: 't3', name: 'Office Stop Co.', sub: 'Card payment, Oct 3', amount: -287.89, method: "Alan's card ••4417", category: 'Office supplies', date: 'Oct 3, 16:05' }
    ],
    cards: [
      { id: 'c1', name: 'Ops card', last4: '6034', type: 'Virtual', balance: 2350.40, frozen: false, holder: 'Dawid' },
      { id: 'c2', name: "Alan's card", last4: '4417', type: 'Virtual', balance: 640.12, frozen: false, holder: 'Alan' }
    ],
    month: { label: 'October 2026', moneyIn: 14067.20, moneyOut: 89003.37 },
    balanceSeries: [
      { label: 'Oct 6', value: 344000 }, { label: 'Oct 11', value: 351000 }, { label: 'Oct 16', value: 348000 },
      { label: 'Oct 21', value: 356000 }, { label: 'Oct 26', value: 353000 }, { label: 'Oct 31', value: 359000 }
    ],
    spending: [
      { name: 'Payroll', pct: 46, color: 'var(--color-chart-categorical-1-default)' },
      { name: 'Other', pct: 23, color: 'var(--color-chart-categorical-2-default)' },
      { name: 'Contractors', pct: 17, color: 'var(--color-chart-categorical-3-default)' },
      { name: 'Software & SaaS', pct: 14, color: 'var(--color-chart-categorical-4-default)' }
    ],
    spendingTotal: 89000,
    expenses: [],
    recipients: []
  };
  var nextId = 100;

  var ROUTES = {
    home: 'Home', cards: 'Cards', transactions: 'Transactions', payments: 'Payments',
    invoices: 'Invoices', tasks: 'Tasks', team: 'Team'
  };

  /* ---------- Helpers ---------- */
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmt = function (n) { return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var signed = function (n) { return (n < 0 ? '−' : '+') + fmt(n); };
  var compactK = function (n) { return (n / 1000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'K'; };
  var icon = function (name) { return window.Icons.get(name); };
  var total = function () { return state.accounts.reduce(function (s, a) { return s + a.balance; }, 0); };
  var account = function (id) { return state.accounts.filter(function (a) { return a.id === id; })[0]; };
  var storage = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isCompact = function () { return window.matchMedia('(max-width: 1023px)').matches; };

  function toast(message) {
    var host = $('#toasts');
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    host.appendChild(el);
    setTimeout(function () { el.classList.add('is-leaving'); setTimeout(function () { el.remove(); }, 220); }, 2800);
  }

  /* ---------- Rendering: Home ---------- */
  function rowHTML(opts) {
    return '<button class="row' + (opts.isNew ? ' row--new' : '') + '" type="button" data-open="' + opts.open + '">' +
      '<span class="row__text"><span class="row__title" style="display:block">' + esc(opts.title) + '</span>' +
      '<span class="row__sub" style="display:block">' + esc(opts.sub) + '</span></span>' +
      '<span class="row__value">' + esc(opts.value) + '</span>' +
      '<span class="row__chevron">' + icon('chevron-right') + '</span></button>';
  }

  function listBlock(title, rows, more) {
    return '<section class="list-block" aria-label="' + esc(title.split(' · ')[0]) + '">' +
      '<div class="grid-list"><h2 class="grid-list__header">' + esc(title) + '</h2>' + rows.join('') + '</div>' +
      (more ? '<div class="list-more">' + more + '</div>' : '') + '</section>';
  }

  function emptyHTML(iconName, title, desc, actionHTML) {
    return '<div class="empty"><span class="empty__icon">' + icon(iconName) + '</span>' +
      '<div class="empty__text"><p class="empty__title">' + esc(title) + '</p><p class="empty__desc">' + esc(desc) + '</p></div>' +
      (actionHTML || '') + '</div>';
  }

  function renderHome() {
    var op = account('operating');
    var t = total();

    var left =
      '<div class="section"><div class="stat stat--l">' +
        '<p class="stat__value" id="op-balance">' + fmt(op.balance) + '</p>' +
        '<p class="stat__label">Operating account, USDC</p>' +
        '<p class="stat__desc num">' + fmt(op.available) + ' available · ' + fmt(op.inFlight) + ' in flight</p>' +
      '</div></div>' +
      '<div class="actions">' +
        '<button class="button button--primary" type="button" data-action="send">Send</button>' +
        '<button class="button button--secondary" type="button" data-action="add-money">Add money</button>' +
      '</div>' +
      '<section class="section chart" aria-labelledby="balance-label">' +
        '<div class="chart__head"><p class="chart__label" id="balance-label">Balance</p>' +
          '<div class="chart__summary"><p class="chart__value">' + compactK(op.balance) + ' USDC</p>' +
          '<p class="chart__caption">Last 30 days, +10.8%</p></div></div>' +
        '<div class="line-chart" id="line-chart"><div class="line-chart__plot" id="line-plot"></div>' +
          '<div class="line-chart__x" aria-hidden="true">' + state.balanceSeries.map(function (p) { return '<span>' + p.label + '</span>'; }).join('') + '</div></div>' +
      '</section>' +
      '<section class="section section--stack" aria-labelledby="month-title">' +
        '<h2 class="section-title" id="month-title">' + state.month.label + '</h2>' +
        '<div class="stat-row">' +
          '<div class="stat"><p class="stat__value">+' + fmt(state.month.moneyIn) + '</p><p class="stat__label">Money in, USDC</p></div>' +
          '<div class="stat"><p class="stat__value">−' + fmt(state.month.moneyOut) + '</p><p class="stat__label">Money spent, USDC</p>' +
            '<p class="stat__desc">Net ' + signed(state.month.moneyIn - state.month.moneyOut) + '</p></div>' +
        '</div>' +
      '</section>' +
      '<section class="section chart" aria-labelledby="spend-label">' +
        '<div class="chart__head"><p class="chart__label" id="spend-label">Spending by category</p>' +
          '<div class="chart__summary"><p class="chart__value">' + compactK(state.spendingTotal) + ' USDC</p>' +
          '<p class="chart__caption">' + state.month.label + '</p></div></div>' +
        '<div class="donut-row"><div class="donut" id="donut"></div>' +
          '<ul class="legend" id="legend">' + state.spending.map(function (s, i) {
            return '<li><button class="legend__item" type="button" data-seg="' + i + '">' +
              '<span class="legend__dot" style="background:' + s.color + '"></span>' +
              '<span class="legend__name">' + esc(s.name) + '</span><span class="legend__pct">' + s.pct + '%</span></button></li>';
          }).join('') + '</ul></div>' +
      '</section>';

    var txRows = state.transactions.slice(0, 3).map(function (tx) {
      return rowHTML({ open: 'tx:' + tx.id, title: tx.name, sub: tx.sub, value: signed(tx.amount) + ' USDC', isNew: tx.isNew });
    });
    var cardRows = state.cards.map(function (c) {
      return rowHTML({ open: 'card:' + c.id, title: c.name, sub: c.type + ' · ••' + c.last4 + (c.frozen ? ' · Frozen' : ''), value: fmt(c.balance) + ' USDC' });
    });
    var accRows = state.accounts.map(function (a) {
      return rowHTML({ open: 'acc:' + a.id, title: a.name, sub: Math.round(a.balance / t * 100) + '% of total', value: fmt(a.balance) + ' USDC' });
    });

    var expenses = state.expenses.length
      ? '<div class="grid-list">' + state.expenses.map(function (e) {
          return rowHTML({ open: 'exp:' + e.id, title: e.merchant, sub: e.category + ' · In review', value: fmt(e.amount) + ' USDC', isNew: e.isNew });
        }).join('') + '</div><div class="list-more"><button class="link-button" type="button" data-action="expense">Submit another expense</button></div>'
      : emptyHTML('inbox', 'No expenses in progress', 'Submit an expense to get paid back.',
          '<button class="button button--secondary button--s" type="button" data-action="expense">Submit an expense</button>');

    var recipients = state.recipients.length
      ? '<div class="grid-list">' + state.recipients.map(function (r) {
          return rowHTML({ open: 'rec:' + r.id, title: r.name, sub: 'Paid ' + r.when, value: fmt(r.amount) + ' USDC', isNew: r.isNew });
        }).join('') + '</div>'
      : emptyHTML('users', 'No one paid yet', 'Recipients you pay will show up here.');

    var right =
      listBlock('Transactions', txRows, '<a class="link-button" href="#/transactions">All transactions</a>') +
      listBlock('Cards', cardRows, '<a class="link-button" href="#/cards">All cards</a>') +
      listBlock('Accounts · ' + fmt(t) + ' USDC', accRows, '<button class="link-button" type="button" data-open="acc:operating">All accounts</button>') +
      '<section class="section section--stack" aria-labelledby="exp-title" style="gap:var(--gap-8)">' +
        '<h2 class="section-title" id="exp-title">Expenses</h2>' + expenses + '</section>' +
      '<section class="section section--stack" aria-labelledby="rec-title" style="gap:var(--gap-8)">' +
        '<h2 class="section-title" id="rec-title">Recent recipients</h2>' + recipients + '</section>';

    $('#page').innerHTML =
      '<header class="page-header"><h1 class="page-title">Home</h1></header>' +
      '<div class="columns"><div class="column">' + left + '</div><div class="column">' + right + '</div></div>';

    state.transactions.forEach(function (x) { x.isNew = false; });
    state.expenses.forEach(function (x) { x.isNew = false; });
    state.recipients.forEach(function (x) { x.isNew = false; });

    drawLineChart();
    drawDonut();
  }

  function renderPlaceholder(route) {
    var title = ROUTES[route] || 'Not found';
    $('#page').innerHTML =
      '<header class="page-header"><h1 class="page-title">' + esc(title) + '</h1></header>' +
      '<div class="placeholder">' +
        emptyHTML('inbox', title + ' is not in the prototype yet', 'This stage covers Home. ' + title + ' comes in the next iteration.',
          '<a class="button button--secondary button--s" href="#/home">Back to Home</a>') +
      '</div>';
  }

  /* ---------- Line chart ---------- */
  var chartObserver = null;
  function drawLineChart() {
    var plot = $('#line-plot');
    if (!plot) return;
    var series = state.balanceSeries;
    var H = 176, top = 8, bottom = 168, max = 360000, min = 320000, left = 32;

    function paint() {
      var W = plot.clientWidth;
      if (!W) return;
      var cw = (W - left) / series.length;
      var x = function (i) { return left + cw * (i + 0.5); };
      var y = function (v) { return top + (max - v) / (max - min) * (bottom - top); };
      var d = series.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(2) + ' ' + y(p.value).toFixed(2); }).join(' ');
      var grid = [
        { v: 360000, y: top, stroke: 'var(--color-stroke-subtle)' },
        { v: 340000, y: (top + bottom) / 2, stroke: 'var(--color-stroke-subtle)' },
        { v: 320000, y: bottom, stroke: 'var(--color-stroke-default)' }
      ];
      plot.innerHTML =
        '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Balance over the last 30 days, from ' + compactK(series[0].value) + ' to ' + compactK(series[series.length - 1].value) + ' USDC">' +
          grid.map(function (g) { return '<line x1="' + left + '" x2="' + W + '" y1="' + g.y + '" y2="' + g.y + '" stroke="' + g.stroke + '" stroke-width="1"/>'; }).join('') +
          '<path d="' + d + '" fill="none" stroke="var(--color-chart-brand-bold)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" class="line-chart__path"/>' +
          '<line class="line-chart__cursor" x1="0" x2="0" y1="' + top + '" y2="' + bottom + '" stroke="var(--color-stroke-default)" stroke-dasharray="3 3" visibility="hidden"/>' +
          '<circle class="line-chart__dot" r="4" cx="0" cy="0" fill="var(--color-surface-default)" stroke="var(--color-chart-brand-bold)" stroke-width="2" visibility="hidden"/>' +
        '</svg>' +
        grid.map(function (g) { return '<span class="line-chart__y" style="top:' + g.y + 'px;transform:translateY(-50%)" aria-hidden="true">' + (g.v / 1000) + 'K</span>'; }).join('') +
        series.map(function (p, i) {
          return '<button type="button" class="line-chart__hit" data-i="' + i + '" style="left:' + (left + cw * i) + 'px;width:' + cw + 'px" aria-label="' + p.label + ': ' + compactK(p.value) + ' USDC"></button>';
        }).join('') +
        '<div class="chart-tooltip" hidden></div>';

      if (!reducedMotion && !plot.dataset.animated) {
        var path = $('.line-chart__path', plot);
        var len = path.getTotalLength();
        path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
        path.getBoundingClientRect();
        path.style.transition = 'stroke-dashoffset 900ms cubic-bezier(0.2,0,0,1)';
        path.style.strokeDashoffset = '0';
        plot.dataset.animated = '1';
      }

      var tip = $('.chart-tooltip', plot), dot = $('.line-chart__dot', plot), cursor = $('.line-chart__cursor', plot);
      function show(i) {
        var p = series[i], px = x(i), py = y(p.value);
        dot.setAttribute('cx', px); dot.setAttribute('cy', py); dot.setAttribute('visibility', 'visible');
        cursor.setAttribute('x1', px); cursor.setAttribute('x2', px); cursor.setAttribute('visibility', 'visible');
        tip.innerHTML = '<strong>' + compactK(p.value) + ' USDC</strong> · ' + p.label;
        tip.style.left = Math.min(Math.max(px, 70), W - 70) + 'px'; tip.style.top = py + 'px';
        tip.hidden = false;
      }
      function hide() { tip.hidden = true; dot.setAttribute('visibility', 'hidden'); cursor.setAttribute('visibility', 'hidden'); }
      $$('.line-chart__hit', plot).forEach(function (b) {
        var i = +b.dataset.i;
        b.addEventListener('mouseenter', function () { show(i); });
        b.addEventListener('focus', function () { show(i); });
        b.addEventListener('mouseleave', hide);
        b.addEventListener('blur', hide);
        b.addEventListener('click', function () { show(i); });
        b.addEventListener('keydown', function (e) {
          var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
          if (n !== null && n >= 0 && n < series.length) { e.preventDefault(); $$('.line-chart__hit', plot)[n].focus(); }
        });
      });
    }

    paint();
    if (chartObserver) chartObserver.disconnect();
    if ('ResizeObserver' in window) {
      var lastW = plot.clientWidth;
      chartObserver = new ResizeObserver(function () { if (plot.clientWidth !== lastW) { lastW = plot.clientWidth; paint(); } });
      chartObserver.observe(plot);
    }
  }

  /* ---------- Donut ---------- */
  function drawDonut() {
    var host = $('#donut'), legend = $('#legend');
    if (!host) return;
    var r = 74, c = 2 * Math.PI * r, gap = 2, start = 0;
    var segs = state.spending.map(function (s, i) {
      var len = c * s.pct / 100;
      var html = '<circle class="donut__seg" data-seg="' + i + '" cx="80" cy="80" r="' + r + '" fill="none" stroke="' + s.color + '" stroke-width="12"' +
        ' stroke-dasharray="' + (len - gap).toFixed(2) + ' ' + (c - len + gap).toFixed(2) + '" stroke-dashoffset="' + (-start).toFixed(2) + '"/>';
      start += len;
      return html;
    }).join('');
    host.innerHTML = '<svg viewBox="0 0 160 160" role="img" aria-label="Spending by category: ' +
      state.spending.map(function (s) { return s.name + ' ' + s.pct + '%'; }).join(', ') + '">' + segs + '</svg>' +
      '<div class="donut__center" aria-hidden="true"><div><span id="donut-name"></span><strong id="donut-val"></strong></div></div>';

    function activate(i) {
      host.setAttribute('data-active', ''); legend.setAttribute('data-active', '');
      $$('.donut__seg', host).forEach(function (el) { el.classList.toggle('is-active', +el.dataset.seg === i); });
      $$('.legend__item', legend).forEach(function (el) { el.classList.toggle('is-active', +el.dataset.seg === i); });
      var s = state.spending[i];
      $('#donut-name').textContent = s.name;
      $('#donut-val').textContent = compactK(state.spendingTotal * s.pct / 100);
    }
    function reset() {
      host.removeAttribute('data-active'); legend.removeAttribute('data-active');
      $$('.is-active', host).concat($$('.is-active', legend)).forEach(function (el) { el.classList.remove('is-active'); });
      $('#donut-name').textContent = ''; $('#donut-val').textContent = '';
    }
    $$('.donut__seg', host).concat($$('.legend__item', legend)).forEach(function (el) {
      var i = +el.dataset.seg;
      el.addEventListener('mouseenter', function () { activate(i); });
      el.addEventListener('mouseleave', reset);
      el.addEventListener('focus', function () { activate(i); });
      el.addEventListener('blur', reset);
      el.addEventListener('click', function () { activate(i); });
    });
  }

  /* ---------- Router ---------- */
  function currentRoute() {
    var r = (location.hash.replace(/^#\/?/, '') || 'home').split('/')[0];
    return r;
  }
  function render() {
    var route = currentRoute();
    $$('.nav-item[data-route]').forEach(function (a) {
      if (a.dataset.route === route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = (ROUTES[route] || 'Not found') + ' · Lighthouse';
    if (route === 'home') renderHome(); else renderPlaceholder(route);
    window.Icons.hydrate($('#page'));
  }
  window.addEventListener('hashchange', function () {
    closeDrawer(true);
    render();
    $('#main').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  });

  /* ---------- Dialogs ---------- */
  var dialog = $('#dialog'), sheet = $('#sheet');
  function openIn(dlg, html, mount) {
    dlg.innerHTML = html;
    window.Icons.hydrate(dlg);
    $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
    if (!dlg.open) dlg.showModal();
    if (mount) mount(dlg);
    var first = $('[autofocus]', dlg);
    if (first) first.focus();
  }
  [dialog, sheet, $('#search')].forEach(function (dlg) {
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  });
  function head(title, sub, idPrefix) {
    return '<div class="dialog__head"><div style="flex:1 1 0;min-width:0"><h2 class="dialog__title" id="' + (idPrefix || 'dialog') + '-title">' + esc(title) + '</h2>' +
      (sub ? '<p class="dialog__subtitle">' + esc(sub) + '</p>' : '') + '</div>' +
      '<button class="icon-button dialog__close" type="button" data-close aria-label="Close"><span data-icon="close"></span></button></div>';
  }

  /* Send money */
  function openSend(fromId) {
    var draft = { to: '', amount: '', from: fromId || 'operating', note: '' };
    function availableOf(id) { var a = account(id); return a.id === 'operating' ? a.available : a.balance; }

    function stepForm(errors) {
      errors = errors || {};
      openIn(dialog,
        '<form novalidate id="send-form">' + head('Send money', 'USDC, arrives in about a minute') +
        '<div class="dialog__body">' +
          '<div class="field"><label class="field__label" for="send-to">To</label>' +
            '<input class="input" id="send-to" name="to" autocomplete="off" placeholder="Name, email or wallet address" value="' + esc(draft.to) + '"' + (errors.to ? ' aria-invalid="true" aria-describedby="send-to-err"' : '') + ' autofocus />' +
            (errors.to ? '<p class="field__error" id="send-to-err">' + errors.to + '</p>' : '') + '</div>' +
          '<div class="field"><label class="field__label" for="send-amount">Amount</label>' +
            '<div class="input-affix"><input class="input" id="send-amount" name="amount" inputmode="decimal" placeholder="0.00" value="' + esc(draft.amount) + '"' + (errors.amount ? ' aria-invalid="true" aria-describedby="send-amount-err"' : '') + ' />' +
            '<span class="input-affix__suffix">USDC</span></div>' +
            (errors.amount ? '<p class="field__error" id="send-amount-err">' + errors.amount + '</p>' : '') + '</div>' +
          '<fieldset class="field" style="border:0;margin:0;padding:0"><legend class="field__label" style="margin-bottom:6px">From</legend><div class="segmented">' +
            state.accounts.map(function (a) {
              return '<label><input type="radio" name="from" value="' + a.id + '"' + (draft.from === a.id ? ' checked' : '') + ' />' +
                '<strong>' + a.name + '</strong><span>' + fmt(availableOf(a.id)) + ' available</span></label>';
            }).join('') + '</div></fieldset>' +
          '<div class="field"><label class="field__label" for="send-note">Note <span style="color:var(--color-text-tertiary);font-weight:400">(optional)</span></label>' +
            '<input class="input" id="send-note" name="note" value="' + esc(draft.note) + '" placeholder="What is it for?" /></div>' +
        '</div>' +
        '<div class="dialog__foot"><button class="button button--secondary" type="button" data-close>Cancel</button>' +
        '<button class="button button--primary" type="submit">Review</button></div></form>',
        function (dlg) {
          $('#send-form', dlg).addEventListener('submit', function (e) {
            e.preventDefault();
            var f = e.target;
            draft.to = f.to.value.trim(); draft.amount = f.amount.value.trim(); draft.note = f.note.value.trim();
            draft.from = (f.querySelector('input[name="from"]:checked') || {}).value || 'operating';
            var amt = parseFloat(draft.amount.replace(/,/g, ''));
            var errs = {};
            if (!draft.to) errs.to = 'Add who you are paying.';
            if (!(amt > 0)) errs.amount = 'Enter an amount above 0.';
            else if (amt > availableOf(draft.from)) errs.amount = 'That is more than the ' + fmt(availableOf(draft.from)) + ' USDC available.';
            if (errs.to || errs.amount) { stepForm(errs); var bad = $('[aria-invalid="true"]', dialog); if (bad) bad.focus(); return; }
            draft.value = Math.round(amt * 100) / 100;
            stepReview();
          });
        });
    }

    function stepReview() {
      var from = account(draft.from);
      openIn(dialog,
        head('Review payment') +
        '<div class="dialog__body"><div><p class="field__hint">You send</p><p class="big-amount">' + fmt(draft.value) + ' <span style="font-size:20px;color:var(--color-text-tertiary)">USDC</span></p></div>' +
        '<dl class="summary">' +
          '<div class="summary__row"><dt>To</dt><dd>' + esc(draft.to) + '</dd></div>' +
          '<div class="summary__row"><dt>From</dt><dd>' + from.name + ' account</dd></div>' +
          '<div class="summary__row"><dt>Fee</dt><dd>0.00 USDC</dd></div>' +
          '<div class="summary__row"><dt>Arrives</dt><dd>In about a minute</dd></div>' +
          (draft.note ? '<div class="summary__row"><dt>Note</dt><dd>' + esc(draft.note) + '</dd></div>' : '') +
        '</dl></div>' +
        '<div class="dialog__foot"><button class="button button--secondary" type="button" id="send-back">Back</button>' +
        '<button class="button button--primary" type="button" id="send-confirm" autofocus>Send ' + fmt(draft.value) + '</button></div>',
        function (dlg) {
          $('#send-back', dlg).addEventListener('click', function () { stepForm(); });
          $('#send-confirm', dlg).addEventListener('click', function (e) {
            e.currentTarget.disabled = true; e.currentTarget.textContent = 'Sending…';
            setTimeout(function () { commit(); stepDone(); }, reducedMotion ? 0 : 700);
          });
        });
    }

    function commit() {
      var a = account(draft.from);
      a.balance -= draft.value;
      if (a.id === 'operating') a.available -= draft.value;
      state.month.moneyOut += draft.value;
      state.transactions.unshift({ id: 't' + (nextId++), name: draft.to, sub: 'Transfer, just now', amount: -draft.value, method: a.name + ' account', category: draft.note || 'Transfer', date: 'Just now', isNew: true });
      state.recipients.unshift({ id: 'r' + (nextId++), name: draft.to, amount: draft.value, when: 'just now', isNew: true });
      if (currentRoute() === 'home') { render(); }
    }

    function stepDone() {
      openIn(dialog,
        head('Payment sent') +
        '<div class="dialog__body" style="align-items:center;text-align:center">' +
          '<div class="success-mark">' + icon('check-circle') + '</div>' +
          '<p style="font-size:16px;line-height:24px">' + fmt(draft.value) + ' USDC is on its way to <strong style="font-weight:500">' + esc(draft.to) + '</strong>.</p>' +
        '</div>' +
        '<div class="dialog__foot"><button class="button button--primary" type="button" data-close autofocus>Done</button></div>');
      toast('Sent ' + fmt(draft.value) + ' USDC to ' + draft.to);
    }

    stepForm();
  }

  /* Add money */
  function openAddMoney() {
    var address = '0x7a3F 9cE1 4B2d 0e58 A1c6 3F70 d9B4 52aE 81C0 6f3D';
    openIn(dialog,
      head('Add money', 'Deposit USDC to your Operating account') +
      '<div class="dialog__body">' +
        copyRow('Deposit address', address) +
        copyRow('Network', 'Ethereum (ERC-20)') +
        '<p class="field__hint">Send only USDC on Ethereum to this address. Deposits usually arrive within 5 minutes.</p>' +
        '<div class="field"><label class="field__label" for="sim-amount">Simulate a deposit</label>' +
          '<div class="input-affix"><input class="input" id="sim-amount" inputmode="decimal" value="5,000.00" /><span class="input-affix__suffix">USDC</span></div>' +
          '<p class="field__hint">Prototype only: adds the deposit to Home so you can see it land.</p></div>' +
      '</div>' +
      '<div class="dialog__foot"><button class="button button--secondary" type="button" data-close>Close</button>' +
      '<button class="button button--primary" type="button" id="sim-deposit">Simulate deposit</button></div>',
      function (dlg) {
        bindCopy(dlg);
        $('#sim-deposit', dlg).addEventListener('click', function () {
          var amt = parseFloat($('#sim-amount', dlg).value.replace(/,/g, ''));
          if (!(amt > 0)) { $('#sim-amount', dlg).setAttribute('aria-invalid', 'true'); $('#sim-amount', dlg).focus(); return; }
          amt = Math.round(amt * 100) / 100;
          var op = account('operating');
          op.balance += amt; op.available += amt; state.month.moneyIn += amt;
          state.transactions.unshift({ id: 't' + (nextId++), name: 'USDC deposit', sub: 'Deposit, just now', amount: amt, method: 'Ethereum (ERC-20)', category: 'Deposit', date: 'Just now', isNew: true });
          dlg.close();
          if (currentRoute() === 'home') render();
          var el = $('#op-balance'); if (el) el.classList.add('value-flash');
          toast(fmt(amt) + ' USDC added to Operating');
        });
      });
  }
  function copyRow(label, value) {
    return '<div class="copy-row"><div class="copy-row__text"><p class="copy-row__label">' + esc(label) + '</p><p class="copy-row__value">' + esc(value) + '</p></div>' +
      '<button class="icon-button" type="button" data-copy="' + esc(value) + '" aria-label="Copy ' + esc(label.toLowerCase()) + '"><span data-icon="copy"></span></button></div>';
  }
  function bindCopy(root) {
    $$('[data-copy]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-copy');
        var done = function () { toast('Copied to clipboard'); };
        try { navigator.clipboard.writeText(v).then(done, done); } catch (e) { done(); }
      });
    });
  }

  /* Submit an expense */
  function openExpense() {
    openIn(dialog,
      '<form novalidate id="exp-form">' + head('Submit an expense', 'Get paid back for something you bought for Firefly') +
      '<div class="dialog__body">' +
        '<div class="field"><label class="field__label" for="exp-merchant">Merchant</label><input class="input" id="exp-merchant" name="merchant" placeholder="e.g. Uber" autofocus /></div>' +
        '<div class="field"><label class="field__label" for="exp-amount">Amount</label><div class="input-affix"><input class="input" id="exp-amount" name="amount" inputmode="decimal" placeholder="0.00" /><span class="input-affix__suffix">USDC</span></div></div>' +
        '<div class="field"><label class="field__label" for="exp-cat">Category</label><select class="input" id="exp-cat" name="category">' +
          ['Travel', 'Meals', 'Software & SaaS', 'Office supplies', 'Other'].map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label class="field__label" for="exp-note">Note <span style="color:var(--color-text-tertiary);font-weight:400">(optional)</span></label><textarea class="input" id="exp-note" name="note" rows="2"></textarea></div>' +
      '</div><div class="dialog__foot"><button class="button button--secondary" type="button" data-close>Cancel</button><button class="button button--primary" type="submit">Submit</button></div></form>',
      function (dlg) {
        $('#exp-form', dlg).addEventListener('submit', function (e) {
          e.preventDefault();
          var f = e.target, ok = true;
          var amt = parseFloat(f.amount.value.replace(/,/g, ''));
          [[f.merchant, !!f.merchant.value.trim()], [f.amount, amt > 0]].forEach(function (pair) {
            pair[0].setAttribute('aria-invalid', pair[1] ? 'false' : 'true');
            if (!pair[1] && ok) { pair[0].focus(); ok = false; }
          });
          if (!ok) return;
          state.expenses.unshift({ id: 'e' + (nextId++), merchant: f.merchant.value.trim(), amount: Math.round(amt * 100) / 100, category: f.category.value, isNew: true });
          dlg.close();
          if (currentRoute() === 'home') render();
          toast('Expense submitted for review');
        });
      });
  }

  /* Detail sheet for a row */
  function openDetail(key) {
    var parts = key.split(':'), kind = parts[0], id = parts[1], html = '';
    var footer = '';
    if (kind === 'tx') {
      var tx = state.transactions.filter(function (t) { return t.id === id; })[0]; if (!tx) return;
      html = head(tx.name, tx.sub, 'sheet') + '<div class="dialog__body"><p class="big-amount">' + signed(tx.amount) + ' <span style="font-size:20px;color:var(--color-text-tertiary)">USDC</span></p>' +
        '<dl class="summary">' + sRow('Status', '<span class="badge">' + (tx.sub.indexOf('just now') > -1 ? 'Processing' : 'Completed') + '</span>') + sRow('Date', tx.date) + sRow('Method', esc(tx.method)) + sRow('Category', esc(tx.category)) + sRow('Account', 'Operating') + '</dl></div>';
      footer = '<button class="button button--secondary" type="button" data-toast="Receipt downloads in the product.">Receipt</button><a class="button button--primary" href="#/transactions">Open in Transactions</a>';
    } else if (kind === 'card') {
      var c = state.cards.filter(function (x) { return x.id === id; })[0]; if (!c) return;
      html = head(c.name, c.type + ' card · ••' + c.last4, 'sheet') + '<div class="dialog__body"><p class="big-amount">' + fmt(c.balance) + ' <span style="font-size:20px;color:var(--color-text-tertiary)">USDC</span></p>' +
        '<dl class="summary">' + sRow('Status', '<span class="badge">' + (c.frozen ? 'Frozen' : 'Active') + '</span>') + sRow('Cardholder', esc(c.holder)) + sRow('Number', '•••• •••• •••• ' + c.last4) + sRow('Spent this month', fmt(c.id === 'c1' ? 1284.20 : 287.89) + ' USDC') + '</dl></div>';
      footer = '<button class="button button--secondary" type="button" id="freeze">' + (c.frozen ? 'Unfreeze card' : 'Freeze card') + '</button><a class="button button--primary" href="#/cards">Open in Cards</a>';
    } else if (kind === 'acc') {
      var a = account(id); if (!a) return;
      html = head(a.name + ' account', Math.round(a.balance / total() * 100) + '% of total', 'sheet') + '<div class="dialog__body"><p class="big-amount">' + fmt(a.balance) + ' <span style="font-size:20px;color:var(--color-text-tertiary)">USDC</span></p>' +
        '<dl class="summary">' + (a.id === 'operating' ? sRow('Available', fmt(a.available) + ' USDC') + sRow('In flight', fmt(a.inFlight) + ' USDC') : sRow('Available', fmt(a.balance) + ' USDC')) + sRow('Currency', 'USDC') + sRow('Total across accounts', fmt(total()) + ' USDC') + '</dl></div>';
      footer = '<button class="button button--secondary" type="button" data-action="add-money">Add money</button><button class="button button--primary" type="button" data-action="send" data-from="' + a.id + '">Send</button>';
    } else if (kind === 'exp') {
      var ex = state.expenses.filter(function (x) { return x.id === id; })[0]; if (!ex) return;
      html = head(ex.merchant, ex.category, 'sheet') + '<div class="dialog__body"><p class="big-amount">' + fmt(ex.amount) + ' <span style="font-size:20px;color:var(--color-text-tertiary)">USDC</span></p>' +
        '<dl class="summary">' + sRow('Status', '<span class="badge">In review</span>') + sRow('Submitted', 'Just now') + sRow('Paid back to', 'Dawid') + '</dl></div>';
      footer = '<button class="button button--secondary" type="button" data-close>Close</button>';
    } else if (kind === 'rec') {
      var r = state.recipients.filter(function (x) { return x.id === id; })[0]; if (!r) return;
      html = head(r.name, 'Paid ' + r.when, 'sheet') + '<div class="dialog__body"><dl class="summary">' + sRow('Last payment', fmt(r.amount) + ' USDC') + sRow('Payments', '1') + '</dl></div>';
      footer = '<button class="button button--primary" type="button" data-action="send">Pay again</button>';
    }
    openIn(sheet, html + '<div class="dialog__foot">' + footer + '</div>', function (dlg) {
      var fr = $('#freeze', dlg);
      if (fr) fr.addEventListener('click', function () {
        var c = state.cards.filter(function (x) { return x.id === id; })[0];
        c.frozen = !c.frozen; render(); openDetail(key);
        toast(c.name + (c.frozen ? ' frozen' : ' unfrozen'));
      });
      $$('a', dlg).forEach(function (a) { a.addEventListener('click', function () { dlg.close(); }); });
      $$('[data-action]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
    });
  }
  function sRow(k, v) { return '<div class="summary__row"><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }

  /* ---------- Search (⌘K) ---------- */
  var searchDlg = $('#search'), searchInput = $('#search-input'), searchList = $('#search-results'), searchItems = [], searchIndex = 0;
  function searchSource() {
    var items = [];
    Object.keys(ROUTES).forEach(function (k) { items.push({ group: 'Go to', label: ROUTES[k], run: function () { location.hash = '#/' + k; } }); });
    items.push({ group: 'Actions', label: 'Send money', run: function () { openSend(); } });
    items.push({ group: 'Actions', label: 'Add money', run: openAddMoney });
    items.push({ group: 'Actions', label: 'Submit an expense', run: openExpense });
    state.transactions.forEach(function (t) { items.push({ group: 'Transactions', label: t.name, meta: signed(t.amount), run: function () { openDetail('tx:' + t.id); } }); });
    state.cards.forEach(function (c) { items.push({ group: 'Cards', label: c.name + ' ••' + c.last4, meta: fmt(c.balance), run: function () { openDetail('card:' + c.id); } }); });
    state.accounts.forEach(function (a) { items.push({ group: 'Accounts', label: a.name, meta: fmt(a.balance), run: function () { openDetail('acc:' + a.id); } }); });
    return items;
  }
  function renderSearch() {
    var q = searchInput.value.trim().toLowerCase();
    searchItems = searchSource().filter(function (i) { return !q || i.label.toLowerCase().indexOf(q) > -1 || i.group.toLowerCase().indexOf(q) > -1; });
    searchIndex = Math.min(searchIndex, Math.max(searchItems.length - 1, 0));
    if (!searchItems.length) { searchList.innerHTML = '<li class="search__empty">No results for “' + esc(searchInput.value) + '”</li>'; return; }
    var html = '', group = '';
    searchItems.forEach(function (it, i) {
      if (it.group !== group) { group = it.group; html += '<li class="search__group" role="presentation">' + esc(group) + '</li>'; }
      html += '<li class="search__option" role="option" id="opt-' + i + '" data-i="' + i + '" aria-selected="' + (i === searchIndex) + '"><span>' + esc(it.label) + '</span>' + (it.meta ? '<span>' + esc(it.meta) + '</span>' : '') + '</li>';
    });
    searchList.innerHTML = html;
    searchInput.setAttribute('aria-activedescendant', 'opt-' + searchIndex);
    var sel = $('#opt-' + searchIndex); if (sel) sel.scrollIntoView({ block: 'nearest' });
  }
  function openSearch() {
    closeDrawer(true); closeMenus();
    searchInput.value = ''; searchIndex = 0; renderSearch();
    if (!searchDlg.open) searchDlg.showModal();
    searchInput.focus();
  }
  function runSearch(i) { var it = searchItems[i]; if (!it) return; searchDlg.close(); setTimeout(it.run, 0); }
  searchInput.addEventListener('input', function () { searchIndex = 0; renderSearch(); });
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); searchIndex = Math.min(searchIndex + 1, searchItems.length - 1); renderSearch(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); searchIndex = Math.max(searchIndex - 1, 0); renderSearch(); }
    else if (e.key === 'Enter') { e.preventDefault(); runSearch(searchIndex); }
    else if (e.key === 'Escape') { e.preventDefault(); searchDlg.close(); }
  });
  searchList.addEventListener('click', function (e) { var o = e.target.closest('.search__option'); if (o) runSearch(+o.dataset.i); });
  searchList.addEventListener('mousemove', function (e) {
    var o = e.target.closest('.search__option'); if (o && +o.dataset.i !== searchIndex) { searchIndex = +o.dataset.i; renderSearch(); }
  });

  /* ---------- Menus (account, notifications) ---------- */
  var openMenu = null, menuTrigger = null;
  function closeMenus() {
    if (!openMenu) return;
    openMenu.hidden = true;
    if (menuTrigger) menuTrigger.setAttribute('aria-expanded', 'false');
    openMenu = null; menuTrigger = null;
  }
  function toggleMenu(menu, trigger) {
    if (openMenu === menu) { closeMenus(); trigger.focus(); return; }
    closeMenus();
    menu.hidden = false;
    var r = trigger.getBoundingClientRect(), mw = menu.offsetWidth, mh = menu.offsetHeight;
    var inSidebar = !!trigger.closest('.sidebar');
    var left = inSidebar ? r.left : Math.min(r.right - mw, window.innerWidth - mw - 8);
    var top = inSidebar ? r.top - mh - 8 : r.bottom + 8;
    menu.style.left = Math.max(8, left) + 'px'; menu.style.top = Math.max(8, top) + 'px';
    trigger.setAttribute('aria-expanded', 'true');
    openMenu = menu; menuTrigger = trigger;
    var first = $('[role="menuitem"]', menu); if (first) first.focus();
  }
  $('#account-menu').addEventListener('keydown', function (e) {
    var items = $$('[role="menuitem"]', e.currentTarget), i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  });

  /* ---------- Drawer (tablet, phone) ---------- */
  var app = $('#app'), scrim = $('#scrim'), drawerBtn = $('#drawer-open');
  function openDrawer() {
    app.classList.add('drawer-open'); scrim.hidden = false;
    drawerBtn.setAttribute('aria-expanded', 'true');
    $('#main').inert = true; $('.topbar').inert = true;
    var cur = $('.nav-item[aria-current="page"]') || $('.nav-item'); setTimeout(function () { cur.focus(); }, 50);
  }
  function closeDrawer(silent) {
    if (!app.classList.contains('drawer-open')) return;
    app.classList.remove('drawer-open'); scrim.hidden = true;
    drawerBtn.setAttribute('aria-expanded', 'false');
    $('#main').inert = false; $('.topbar').inert = false;
    if (!silent) drawerBtn.focus();
  }
  drawerBtn.addEventListener('click', openDrawer);
  $('#drawer-close').addEventListener('click', function () { closeDrawer(); });
  scrim.addEventListener('click', function () { closeDrawer(); });
  window.matchMedia('(max-width: 1023px)').addEventListener('change', function (e) { if (!e.matches) closeDrawer(true); });

  /* ---------- Sidebar rail (desktop) ---------- */
  var toggleBtn = $('#sidebar-toggle');
  function setSidebar(mode) {
    app.setAttribute('data-sidebar', mode);
    toggleBtn.setAttribute('aria-expanded', String(mode === 'expanded'));
    $('.brand').setAttribute('aria-label', mode === 'rail' ? 'Expand sidebar' : 'Firefly LLC, Home');
    storage.set('lh.sidebar', mode);
    if (currentRoute() === 'home') setTimeout(drawLineChart, 0);
  }
  toggleBtn.addEventListener('click', function () { setSidebar('rail'); $('.brand').focus(); });
  $('.brand').addEventListener('click', function (e) {
    if (!isCompact() && app.getAttribute('data-sidebar') === 'rail') { e.preventDefault(); setSidebar('expanded'); toggleBtn.focus(); }
  });

  /* ---------- Global events ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-action],[data-open],[data-toast]');
    if (openMenu && !e.target.closest('.menu') && !e.target.closest('[data-action="account-menu"],[data-action="notifications"]')) closeMenus();
    if (!t) return;
    if (t.hasAttribute('data-toast')) { closeMenus(); toast(t.getAttribute('data-toast')); return; }
    if (t.hasAttribute('data-open')) { openDetail(t.getAttribute('data-open')); return; }
    var a = t.getAttribute('data-action');
    if (a === 'send') openSend(t.getAttribute('data-from'));
    else if (a === 'add-money') openAddMoney();
    else if (a === 'expense') openExpense();
    else if (a === 'open-search') openSearch();
    else if (a === 'account-menu') toggleMenu($('#account-menu'), t);
    else if (a === 'notifications') toggleMenu($('#notifications'), t);
  });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (searchDlg.open) searchDlg.close(); else openSearch(); return; }
    if (e.key === 'Escape') {
      if (openMenu) { var tr = menuTrigger; closeMenus(); if (tr) tr.focus(); }
      else if (app.classList.contains('drawer-open')) closeDrawer();
    }
  });
  window.addEventListener('resize', function () { closeMenus(); });

  /* ---------- Boot ---------- */
  window.Icons.hydrate(document);
  if (storage.get('lh.sidebar') === 'rail') setSidebar('rail');
  render();
})();
