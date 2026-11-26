import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Dialog as AriaDialog } from 'react-aria-components';
import { Menu, MenuSection, MenuItem, MenuSeparator, Sheet, Toasts, toast } from './serenity/Overlays.jsx';
import { Sidebar, TopBar, AccountTrigger, NotificationsTrigger, NAV } from './serenity/Navigation.jsx';
import { GlobalSearch } from './serenity/GlobalSearch.jsx';
import { EmptyState } from './serenity/Content.jsx';
import { Home, Placeholder } from './screens/Home.jsx';
import { SendDialog, AddMoneyDialog, ExpenseDialog } from './screens/Flows.jsx';
import { DetailPanel } from './screens/Detail.jsx';
import { SignUp } from './screens/SignUp.jsx';
import { Verify } from './screens/Verify.jsx';
import { PrototypeMap } from './screens/Map.jsx';
import { StoreContext, initialState, reducer } from './data.js';
import { fmt, signed } from './format.js';

// The screen map of the prototype: one entry per screen and state; its id is what ?screen=<id> opens (the QA uses every id).
// route: the page (and step, the hash #/<route>/<step>); overlay: what is open over it; seed: actions run first; rail: the
// collapsed Sidebar; preset: the state a flow starts in. The journey: Sign up → Identity verification → Home → Add money.
export const SCREENS = {
  // Sign up: email or phone (Figma 8:2971)
  signup: { route: 'signup' },
  'signup-phone': { route: 'signup', preset: { contact: '612345' } },
  'signup-country': { route: 'signup', preset: { contact: '612345678', countryOpen: true } },
  'signup-email-taken': { route: 'signup', preset: { contact: 'dawid@firefly.com', step: 'start', errors: { contact: 'This email already has an account. Sign in below.' } } },
  'signup-password': { route: 'signup', step: 'password', preset: { contact: 'amara.okafor@example.com' } },
  'signup-password-weak': { route: 'signup', step: 'password', preset: { contact: 'amara.okafor@example.com', password: 'rainbow1' } },
  'signup-why': { route: 'signup', step: 'password', preset: { contact: 'amara.okafor@example.com', why: true } },
  'signup-creating': { route: 'signup', step: 'password', preset: { contact: 'amara.okafor@example.com', pending: true } },
  'signup-check-email': { route: 'signup', step: 'check-email', preset: { contact: 'amara.okafor@example.com' } },
  'signup-code': { route: 'signup', step: 'code' },
  'signup-code-wrong': { route: 'signup', step: 'code', preset: { code: '2173', step: 'code', errors: { code: 'This code is wrong. Check the SMS or send a new code.' } } },
  'signup-code-incomplete': { route: 'signup', step: 'code', preset: { code: '48', step: 'code', errors: { code: 'Enter all 4 digits.' } } },
  'signup-expired': { route: 'signup', step: 'expired', preset: { contact: 'amara.okafor@example.com' } },
  // Identity verification: ID and selfie (Figma 17:6445)
  verify: { route: 'verify' },
  'verify-document': { route: 'verify', step: 'document' },
  'verify-document-error': { route: 'verify', step: 'document', preset: { docError: 'Choose a document to continue.' } },
  'verify-id-ready': { route: 'verify', step: 'id-ready' },
  'verify-camera': { route: 'verify', step: 'camera' },
  'verify-unreadable': { route: 'verify', step: 'id-ready', preset: { unreadable: true } },
  'verify-selfie': { route: 'verify', step: 'selfie' },
  'verify-face-scan': { route: 'verify', step: 'face-scan' },
  'verify-checking': { route: 'verify', step: 'checking' },
  'verify-done': { route: 'verify', step: 'done' },
  'verify-failed': { route: 'verify', step: 'failed' },
  // Home and its flows
  home: { route: 'home' },
  'home-after-actions': { route: 'home', seed: [{ type: 'send', from: 'operating', to: 'Maya Chen', value: 420, note: 'Design review' }, { type: 'expense', merchant: 'Uber', value: 32.4, category: 'Travel', note: '' }] },
  'home-rail': { route: 'home', rail: true },
  'send-form': { route: 'home', overlay: { kind: 'send' } },
  'send-review': { route: 'home', overlay: { kind: 'send', step: 'review', draft: { to: 'Maya Chen', amount: 420, from: 'operating', note: 'Design review' } } },
  'send-done': { route: 'home', overlay: { kind: 'send', step: 'done', draft: { to: 'Maya Chen', amount: 420, from: 'operating', note: '' } } },
  // Add money (Figma 545:21868)
  'add-money': { route: 'home', overlay: { kind: 'add-money' } },
  'add-money-wallet': { route: 'home', overlay: { kind: 'add-money', step: 'wallet', preset: { method: 'wallet', address: '0x91C4e2A7b5D03f8C61aE97d02B54c3F1aD8e7B20', wallet: 'Coinbase' } } },
  'add-money-wallet-blocked': { route: 'home', overlay: { kind: 'add-money', step: 'wallet', preset: { method: 'wallet', address: '0x91C4e2A7b5D03f8C61aE97d02B54c3F1aD8edead', wallet: 'Coinbase', blocked: true } } },
  'add-money-network': { route: 'home', overlay: { kind: 'add-money', step: 'network', preset: { confirmed: true } } },
  'add-money-network-other': { route: 'home', overlay: { kind: 'add-money', step: 'network', preset: { network: 'other' } } },
  'add-money-address': { route: 'home', overlay: { kind: 'add-money', step: 'address' } },
  'add-money-address-error': { route: 'home', overlay: { kind: 'add-money', step: 'address', preset: { unavailable: true } } },
  expense: { route: 'home', overlay: { kind: 'expense' } },
  'detail-transaction': { route: 'home', overlay: { kind: 'detail', key: 'tx:t1' } },
  'detail-card': { route: 'home', overlay: { kind: 'detail', key: 'card:c1' } },
  'detail-account': { route: 'home', overlay: { kind: 'detail', key: 'acc:operating' } },
  search: { route: 'home', overlay: { kind: 'search' } },
  drawer: { route: 'home', overlay: { kind: 'drawer' } },
  cards: { route: 'cards' },
  map: { route: 'map' },
};
const FOCUS_ROUTES = { signup: 'Create account', verify: 'Verify your identity', map: 'Prototype map' };

const ROUTES = Object.fromEntries(NAV.map((n) => [n.id, n.label]));
const hashParts = () => (location.hash.replace(/^#\/?/, '') || 'signup').split('/');
const routeFromHash = () => hashParts()[0];
const stepFromHash = () => hashParts()[1];
const storage = {
  get: (k) => { try { return window.localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { window.localStorage.setItem(k, v); } catch { /* storage off: the choice lasts this visit */ } },
};

function useMediaQuery(q) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => { const mq = window.matchMedia(q); const on = () => setM(mq.matches); mq.addEventListener('change', on); return () => mq.removeEventListener('change', on); }, [q]);
  return m;
}

// Feedback/Theme: the theme switches inside a view transition (a cross-fade); at once under reduced motion.
function applyTheme(theme) {
  const root = document.documentElement;
  const set = () => { if (theme === 'system') delete root.dataset.theme; else root.dataset.theme = theme; };
  if ('startViewTransition' in document && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('motion-feedback-theme');
    const vt = document.startViewTransition(() => flushSync(set));
    vt.ready.catch(() => {}); // skipped when a toast starts its own transition; the theme is set either way
    vt.finished.catch(() => {}).finally(() => root.classList.remove('motion-feedback-theme'));
  } else set();
}

export function App({ initial, initialTheme }) {
  const preset = SCREENS[initial] || null;
  const [state, dispatch] = useReducer(reducer, initialState, (s) => (preset?.seed || []).reduce(reducer, s));
  // A preset writes its route and step into the hash once, so the flows read their step from one place.
  const [route, setRoute] = useState(() => { if (preset) history.replaceState(null, '', `${location.pathname}${location.search}#/${preset.route}${preset.step ? `/${preset.step}` : ''}`); return routeFromHash(); });
  const [step, setStep] = useState(stepFromHash);
  const [overlay, setOverlay] = useState(preset?.overlay || null);
  const [expanded, setExpanded] = useState(() => (preset ? !preset.rail : storage.get('lh.sidebar') !== 'rail'));
  const [theme, setTheme] = useState(initialTheme || storage.get('lh.theme') || 'system');
  const [scrolled, setScrolled] = useState(false);
  const isCompact = useMediaQuery('(max-width: 1023px)');
  const mainRef = useRef(null);

  // The last overlay of each kind stays mounted while it closes, so Exit/Dialog, Exit/Sheet and Exit/Scrim can play;
  // each opening gets a new key, so a dialog starts fresh.
  const [last, setLast] = useState(() => (preset?.overlay ? { [preset.overlay.kind]: { ...preset.overlay, n: 0 } } : {}));
  const open = useCallback((o) => { setOverlay(o); setLast((l) => ({ ...l, [o.kind]: { ...o, n: (l[o.kind]?.n ?? 0) + 1 } })); }, []);
  const close = useCallback(() => setOverlay(null), []);
  const isOpen = (kind) => overlay?.kind === kind;

  useEffect(() => {
    const onHash = () => {
      const r = routeFromHash();
      setRoute(r);
      setStep(stepFromHash());
      setOverlay((o) => (o?.kind === 'drawer' || FOCUS_ROUTES[r] ? null : o));
      requestAnimationFrame(() => (mainRef.current || document.getElementById('main'))?.focus({ preventScroll: true }));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => { document.title = `${FOCUS_ROUTES[route] || ROUTES[route] || 'Not found'} · Lighthouse`; }, [route]);
  const goStep = useCallback((r) => (s) => { location.hash = `#/${r}${s && s !== 'start' ? `/${s}` : ''}`; }, []);
  const goSignup = useCallback((s) => goStep('signup')(s), [goStep]);
  const goVerify = useCallback((s) => goStep('verify')(s), [goStep]);
  useEffect(() => { if (!isCompact && overlay?.kind === 'drawer') close(); }, [isCompact, overlay, close]);
  useEffect(() => { const on = () => setScrolled(window.scrollY > 0); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on); }, []);

  const toggleSidebar = useCallback(() => setExpanded((e) => { storage.set('lh.sidebar', e ? 'rail' : 'expanded'); return !e; }), []);
  const chooseTheme = (t) => { setTheme(t); storage.set('lh.theme', t); applyTheme(t); };

  // ⌘K / Ctrl+K and / open search; ⌘B / Ctrl+B toggles the Sidebar (Sidebar § Interaction).
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); setOverlay((o) => (o?.kind === 'search' ? null : { kind: 'search' })); }
      else if (e.key === '/' && !typing && !overlay) { e.preventDefault(); setOverlay({ kind: 'search' }); }
      else if (mod && e.key.toLowerCase() === 'b' && !isCompact) { e.preventDefault(); toggleSidebar(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [overlay, isCompact, toggleSidebar]);

  const searchGroups = [
    { name: 'Go to', items: NAV.map((n) => ({ id: `go-${n.id}`, label: n.label, run: () => { location.hash = `#/${n.id}`; } })) },
    { name: 'Actions', items: [
      { id: 'act-send', label: 'Send money', run: () => open({ kind: 'send' }) },
      { id: 'act-add', label: 'Add money', run: () => open({ kind: 'add-money' }) },
      { id: 'act-expense', label: 'Submit an expense', run: () => open({ kind: 'expense' }) },
    ] },
    { name: 'Transactions', items: state.transactions.map((t) => ({ id: `tx-${t.id}`, label: t.name, meta: signed(t.amount), run: () => open({ kind: 'detail', key: `tx:${t.id}` }) })) },
    { name: 'Cards', items: state.cards.map((c) => ({ id: `card-${c.id}`, label: `${c.name} ••${c.last4}`, meta: fmt(c.balance), run: () => open({ kind: 'detail', key: `card:${c.id}` }) })) },
    { name: 'Accounts', items: state.accounts.map((a) => ({ id: `acc-${a.id}`, label: a.name, meta: fmt(a.balance), run: () => open({ kind: 'detail', key: `acc:${a.id}` }) })) },
  ];

  // The Account Menu: the person's name as the section title, Settings, Help, the theme (Light, Dark, System) and Log out.
  const accountMenu = (
    <Menu aria-label="Account" onAction={(k) => {
      if (k === 'settings') toast('Settings is the next screen in the prototype.');
      else if (k === 'help') toast('Help center opens here in the product.');
      else if (k === 'logout') { toast('Logged out'); location.hash = '#/signup'; }
    }}>
      <MenuSection title={<><span className="text-body-strong-medium">Dawid</span><span className="text-caption-small srn-menu-caption">Firefly LLC · Admin</span></>}>
        <MenuItem id="settings">Settings</MenuItem>
        <MenuItem id="help">Help</MenuItem>
        <MenuItem id="map" href="#/map">Prototype map</MenuItem>
      </MenuSection>
      <MenuSeparator />
      <MenuSection title={<span className="text-caption-strong-small">Theme</span>} selectionMode="single" selectedKeys={[theme]} onSelectionChange={(keys) => { const [k] = [...keys]; if (k) chooseTheme(k); }}>
        <MenuItem id="light">Light</MenuItem>
        <MenuItem id="dark">Dark</MenuItem>
        <MenuItem id="system">System</MenuItem>
      </MenuSection>
      <MenuSeparator />
      <MenuItem id="logout">Log out</MenuItem>
    </Menu>
  );
  const notifications = <EmptyState size="s" icon="inbox" title="You're all caught up" description="New activity will show up here." />;

  const sidebarProps = { route, onSearch: () => open({ kind: 'search' }), isSearchOpen: overlay?.kind === 'search' };

  // Full-focus routes (SR-150): Sign up, Identity verification and the prototype map draw no Sidebar and no TopBar.
  if (FOCUS_ROUTES[route]) {
    const flowPreset = preset && preset.route === route ? preset.preset || {} : {};
    return (
      <StoreContext.Provider value={{ state, dispatch }}>
        <a className="lh-skip text-body-medium" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
        {route === 'signup' && <SignUp step={step || 'start'} preset={flowPreset} go={goSignup} />}
        {route === 'verify' && <Verify step={step || 'start'} preset={flowPreset} go={goVerify} account={<AccountTrigger placement="bottom end">{accountMenu}</AccountTrigger>} />}
        {route === 'map' && <PrototypeMap screens={SCREENS} />}
        <Toasts />
      </StoreContext.Provider>
    );
  }

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      <a className="lh-skip text-body-medium" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>Skip to content</a>
      <div className={`lh-app${expanded ? '' : ' is-rail'}`}>
        {!isCompact && (
          <nav className="lh-sidebar motion-expand-width" aria-label="Main navigation" data-expanded={expanded || undefined}>
            <Sidebar {...sidebarProps} isExpanded={expanded} size="m" onToggle={toggleSidebar}
              accountMenu={<AccountTrigger placement="top start">{accountMenu}</AccountTrigger>} />
          </nav>
        )}
        {isCompact && (
          <TopBar onMenu={() => open({ kind: 'drawer' })} onSearch={() => open({ kind: 'search' })} isMenuOpen={overlay?.kind === 'drawer'} isScrolled={scrolled}
            notifications={<NotificationsTrigger>{notifications}</NotificationsTrigger>}
            account={<AccountTrigger placement="bottom end">{accountMenu}</AccountTrigger>} />
        )}
        <main id="main" ref={mainRef} tabIndex={-1} className="lh-main">
          <div className="lh-pane">
            <div key={route} className="lh-page motion-navigate-fade">
              {route === 'home' ? <Home open={open} /> : <Placeholder title={ROUTES[route] || 'Not found'} />}
            </div>
          </div>
        </main>
      </div>

      {/* Phone drawer (Sidebar recipe): a Sheet from the start edge over the Scrim, holding the Sidebar at size l, expanded. */}
      <Sheet position="start" size="l" isOpen={isOpen('drawer')} onOpenChange={(o) => !o && close()} className="srn-sheet--drawer">
        <AriaDialog aria-label="Main navigation" className="lh-drawer">
          <Sidebar {...sidebarProps} isExpanded size="l" inDrawer onClose={close} onNavigate={close}
            onSearch={() => open({ kind: 'search' })} />
        </AriaDialog>
      </Sheet>

      <GlobalSearch isOpen={isOpen('search')} onOpenChange={(o) => !o && close()} groups={searchGroups} />
      {last.send && <SendDialog key={`send-${last.send.n}`} isOpen={isOpen('send')} onClose={close} from={last.send.from} initialStep={last.send.step} initialDraft={last.send.draft} />}
      {last['add-money'] && <AddMoneyDialog key={`add-${last['add-money'].n}`} isOpen={isOpen('add-money')} onClose={close} initialStep={last['add-money'].step} preset={last['add-money'].preset} />}
      {last.expense && <ExpenseDialog key={`exp-${last.expense.n}`} isOpen={isOpen('expense')} onClose={close} />}
      {last.detail && <DetailPanel key={`detail-${last.detail.n}`} isOpen={isOpen('detail')} detail={last.detail.key} onClose={close} onAction={open} isCompact={isCompact} />}
      <Toasts />
    </StoreContext.Provider>
  );
}
