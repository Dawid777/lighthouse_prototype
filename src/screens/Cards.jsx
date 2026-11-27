import React, { useEffect, useMemo, useState } from 'react';
import { Form, MenuTrigger, SearchField, Input, Group } from 'react-aria-components';
import { Button, ButtonIcon, cx } from '../serenity/Button.jsx';
import { TextField, NumberField, Select } from '../serenity/Fields.jsx';
import { Dialog, Modal, Popover, Menu, MenuItem, MenuSection, toast } from '../serenity/Overlays.jsx';
import { DescriptionList, EmptyState } from '../serenity/Content.jsx';
import { Meter, Banner } from '../serenity/Status.jsx';
import { Header, Table, Tone, ToggleButtonGroup, Switch, PaymentCard, SwatchPicker, Pagination, H2 } from '../serenity/Data.jsx';
import { GridList, GridListItem } from '../serenity/GridList.jsx';
import { Icon } from '../icons.jsx';
import { useStore } from '../data.js';
import { CARD_DESIGNS } from '../seed.js';
import { fmt, signed } from '../format.js';

// Cards (Figma 25:7122), frame by frame:
// 1.0 list (Manage · Subscriptions; Table with select boxes and Pagination from 1024, a list grouped by cardholder below),
// 1.0.b Card cancelled (the row gone, Toast), 1.1 card (Overview), 1.1.a Frozen, 1.1.b Cancel card (Dialog: Confirmation),
// 1.1.c Changes saved (Toast), 1.2 Edit card, 1.3 New card, 1.4 Card ready, 1.5 Transactions.
// Routes: #/cards, #/cards/new, #/cards/<id>, #/cards/<id>/edit, #/cards/<id>/transactions, #/cards/<id>/ready.
const go = (h) => { location.hash = h; };
const statusTone = { Active: 'green', Suspended: 'red', Frozen: 'azure' };
const txTone = { Paid: 'green', Declined: 'red', 'Receipt missing': 'amber' };
export const LIMIT_TYPES = [
  { id: 'Per transaction', label: 'Per transaction', phrase: 'per transaction' },
  { id: 'Monthly', label: 'Monthly', phrase: 'a month' },
  { id: 'Total', label: 'Total', phrase: 'in total' },
  { id: 'Single use', label: 'Single use', phrase: 'for a single use' },
];
const ACCOUNTS = [{ id: 'Card float ••6034', label: 'Card float ••6034' }, { id: 'Operating ••4417', label: 'Operating ••4417' }, { id: 'Reserve ••1794', label: 'Reserve ••1794' }];
const HOLDERS = [{ id: 'Alan Rutledge', label: 'Alan Rutledge' }, { id: 'Dawid', label: 'Dawid' }, { id: 'Kristin Watson', label: 'Kristin Watson' }, { id: 'Sofia Lindström', label: 'Sofia Lindström' }];
const limitText = (c) => `${fmt(c.limit)} USDC ${(LIMIT_TYPES.find((l) => l.id === (c.period || 'Monthly')) || LIMIT_TYPES[1]).phrase}`;

function useWide() {
  const q = '(min-width: 1024px)';
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => { const mq = window.matchMedia(q); const on = () => setM(mq.matches); mq.addEventListener('change', on); return () => mq.removeEventListener('change', on); }, []);
  return m;
}

// A preset may open a state of the page once: the Cancel card Dialog, or a Toast that a previous step left (1.0.b, 1.1.c).
// It is used up on first read, so moving around the page afterwards starts clean.
let presetUsed = false;
function takePreset(preset) {
  if (presetUsed || !preset) return {};
  presetUsed = true;
  return preset;
}

export function Cards({ parts = [], preset, open }) {
  const [id, sub] = parts;
  const [p] = useState(() => takePreset(preset));
  useEffect(() => { if (p.toast) { const [title, tone, extra] = p.toast; toast(title, tone, extra); } }, [p]);
  if (id === 'new') return <NewCard />;
  if (id && sub === 'edit') return <EditCard id={id} />;
  if (id && sub === 'ready') return <CardReady id={id} />;
  if (id) return <CardDetail id={id} tab={sub === 'transactions' ? 'transactions' : 'overview'} preset={p} open={open} />;
  return <CardList />;
}

const iconButton = (label, icon, props = {}) => <ButtonIcon size="s" isSquare={false} aria-label={label} {...props}><Icon name={icon} size={16} /></ButtonIcon>;

function exportCsv(cards) {
  const rows = [['Card', 'Cardholder', 'Type', 'Spent this month (USDC)', 'Status'], ...cards.map((c) => [c.name, c.holder, `${c.type} ••${c.last4}`, c.spent.toFixed(2), c.status])];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  try {
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'lighthouse-cards.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch { /* the download is blocked: the Toast still says what happened */ }
  toast(`${cards.length} ${cards.length === 1 ? 'card' : 'cards'} exported`, 'success', { description: 'lighthouse-cards.csv' });
}

// 1.0 Default · 1.0.b Card cancelled
function CardList() {
  const { state } = useStore();
  const wide = useWide();
  const [view, setView] = useState('manage');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const listed = state.cards.filter((c) => c.listed !== false);
  const cards = listed.filter((c) => (status === 'all' || c.status === status) && (!query.trim() || `${c.name} ${c.holder} ${c.last4}`.toLowerCase().includes(query.trim().toLowerCase())));
  const chosen = selected === 'all' ? cards : cards.filter((c) => selected.has(c.id));
  const toExport = chosen.length ? chosen : cards;

  const filterMenu = (
    <MenuTrigger>
      {iconButton(status === 'all' ? 'Filters' : `Filters: ${status}`, 'filter')}
      <Popover placement="bottom end" className="srn-popover--menu">
        <Menu aria-label="Filter cards" selectionMode="single" selectedKeys={[status]} onSelectionChange={(k) => { const [v] = [...k]; if (v) setStatus(v); }}>
          <MenuSection title="Status">
            {['all', 'Active', 'Frozen', 'Suspended'].map((s) => <MenuItem key={s} id={s}>{s === 'all' ? 'All cards' : s}</MenuItem>)}
          </MenuSection>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
  const actions = (
    <>
      {iconButton('Search cards', 'search-s', { onPress: () => { setSearching(!searching); if (searching) setQuery(''); } })}
      {filterMenu}
      {wide
        ? iconButton(chosen.length ? `Export ${chosen.length} selected` : 'Export', 'download', { onPress: () => exportCsv(toExport) })
        : (
          <MenuTrigger>
            {iconButton('More', 'more')}
            <Popover placement="bottom end" className="srn-popover--menu">
              <Menu aria-label="More" onAction={(k) => k === 'export' && exportCsv(toExport)}><MenuItem id="export">Export as CSV</MenuItem></Menu>
            </Popover>
          </MenuTrigger>
        )}
      {iconButton('New card', 'plus', { onPress: () => go('#/cards/new') })}
    </>
  );
  const groups = useMemo(() => {
    const m = new Map();
    cards.forEach((c) => { if (!m.has(c.holder)) m.set(c.holder, []); m.get(c.holder).push(c); });
    return [...m.entries()];
  }, [cards]);
  const empty = <EmptyState size="s" headingLevel={2} icon="credit-card" title="No cards match" description="Try another name or status." action={<Button size="s" variant="outlined" tone="secondary" onPress={() => { setQuery(''); setStatus('all'); }}>Clear filters</Button>} />;

  return (
    <>
      <Header inline title="Cards" actions={actions}
        toggles={<ToggleButtonGroup label="View" items={[{ id: 'manage', label: 'Manage' }, { id: 'subs', label: 'Subscriptions' }]} value={view} onChange={setView} />} />
      {searching && (
        <div className="lh-section lh-search-row">
          <SearchField aria-label="Search cards" value={query} onChange={setQuery} onEscape={() => setSearching(false)} autoFocus className="srn-field">
            <Group className={({ isFocusWithin }) => cx('srn-field-group', 'srn-size-l', isFocusWithin ? 'effect-focus-neutral' : 'effect-field-default')}>
              <span className="lh-muted" aria-hidden="true"><Icon name="search-s" size={16} /></span>
              <Input placeholder="Search by card, cardholder or last 4 digits" className="srn-input text-body-large" />
            </Group>
          </SearchField>
        </div>
      )}
      <div className="lh-section">
        {view === 'subs'
          ? <EmptyState size="m" headingLevel={2} icon="credit-card" title="No subscriptions yet" description="Recurring payments on your cards (AWS, Figma, Slack) will show up here, grouped by merchant." />
          : wide
            ? (
              <>
                <Table label="Cards" selectionMode="multiple" selectedKeys={selected} onSelectionChange={setSelected}
                  columns={[{ label: 'Card' }, { label: 'Cardholder' }, { label: 'Type' }, { id: 'Spent', label: 'Spent this month' }, { label: 'Status' }]}
                  rows={cards.map((c) => ({ id: c.id, Card: c.name, Cardholder: c.holder, Type: `${c.type} ••${c.last4}`, Spent: `${fmt(c.spent)} USDC`, Status: <Tone tone={statusTone[c.status] || 'neutral'}>{c.status}</Tone> }))}
                  onAction={(k) => go(`#/cards/${k}`)} empty={empty} />
                <div className="lh-table-foot"><Pagination page={1} pages={1} /></div>
              </>
            )
            : groups.length
              ? groups.map(([holder, list]) => (
                <GridList key={holder} id={`cards-${holder.replace(/\W+/g, '-')}`} header={holder} onAction={(k) => go(`#/cards/${k}`)} className="lh-grouped">
                  {list.map((c) => <GridListItem key={c.id} id={c.id} description={`${c.type} ••${c.last4}`} value={c.status === 'Active' ? `${fmt(c.spent)} USDC` : c.status} isNew={c.isNew}>{c.name}</GridListItem>)}
                </GridList>
              ))
              : empty}
      </div>
    </>
  );
}

// 1.1 Default · 1.1.a Frozen · 1.1.b Cancel card · 1.1.c Changes saved · 1.5 Transactions
function CardDetail({ id, tab, preset, open }) {
  const { state, dispatch } = useStore();
  const wide = useWide();
  const c = state.cards.find((x) => x.id === id);
  const [shown, setShown] = useState(false);
  const [cancel, setCancel] = useState(!!preset.cancel);
  if (!c) return <Missing what="card" back="#/cards" />;
  const status = c.frozen ? 'Frozen' : c.status;
  const freeze = () => dispatch({ type: 'toggle-freeze', id });
  const copyAddress = () => { try { navigator.clipboard.writeText('21 Duxton Hill, #04-02, Singapore 089600'); } catch { /* */ } toast('Address copied', 'success'); };
  const toggles = <ToggleButtonGroup label="Card view" items={[{ id: 'overview', label: 'Overview' }, { id: 'transactions', label: 'Transactions' }]} value={tab} onChange={(v) => go(`#/cards/${id}${v === 'transactions' ? '/transactions' : ''}`)} />;
  const more = (
    <MenuTrigger>
      {iconButton('More', 'more')}
      <Popover placement="bottom end" className="srn-popover--menu">
        <Menu aria-label="Card actions" onAction={(k) => {
          if (k === 'number') setShown(!shown);
          else if (k === 'freeze') freeze();
          else if (k === 'copy') copyAddress();
          else if (k === 'cancel') setCancel(true);
        }}>
          <MenuItem id="number">{shown ? 'Hide number' : 'Show number'}</MenuItem>
          <MenuItem id="freeze">{c.frozen ? 'Unfreeze card' : 'Freeze card'}</MenuItem>
          <MenuItem id="copy">Copy billing address</MenuItem>
          <MenuItem id="cancel" className="is-danger">Cancel this card</MenuItem>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
  const header = (
    <Header inline togglesCentred title={c.name} caption={`••${c.last4}`} crumbs={[{ label: 'Cards', href: '#/cards' }, { label: c.name }]}
      badges={<Tone tone={statusTone[status] || 'neutral'}>{status}</Tone>} toggles={toggles}
      actions={<>{iconButton('Edit card', 'edit', { onPress: () => go(`#/cards/${id}/edit`) })}{more}</>} />
  );
  const meter = <Meter label="Spent this month" value={Math.min(100, (c.spent / c.limit) * 100)} valueLabel={`${fmt(c.spent)} of ${fmt(c.limit)} USDC`} tone="neutral" />;

  const cancelDialog = (
    <Modal isOpen={cancel} onOpenChange={setCancel}>
      <Dialog className="srn-dialog--confirm" title="Cancel this card?" subtitle={`${c.name} (••${c.last4}) stops working right away and its subscriptions will fail. You can’t undo this.`}
        footer={(
          <div className="srn-button-stack">
            <Button size="l" tone="danger" onPress={() => { setCancel(false); dispatch({ type: 'card-cancel', id }); toast('Card cancelled', 'neutral', { icon: 'notifications', description: `${c.name} ••${c.last4}`, quiet: true }); go('#/cards'); }}>Cancel card</Button>
            <Button slot="close" size="l" variant="solid" tone="secondary">Keep card</Button>
          </div>
        )} />
    </Modal>
  );

  if (tab === 'transactions') {
    const txs = state.cardTransactions;
    const openTx = (k) => open && open({ kind: 'detail', key: `ctx:${k}:${id}` });
    const desc = (t) => (t.status === 'Declined' ? `Declined: ${t.type.toLowerCase()}` : t.status === 'Receipt missing' ? `${t.type}, ${t.time}, receipt missing` : `${t.type}, ${t.time}`);
    const groups = [...new Set(txs.map((t) => t.group))];
    return (
      <>
        {header}
        <div className="lh-section lh-stack lh-card-tx">
          {meter}
          {wide
            ? <Table label={`${c.name} transactions`} columns={[{ label: 'Merchant' }, { label: 'Type' }, { label: 'Date' }, { label: 'Amount' }, { label: 'Status' }]}
                rows={txs.map((t) => ({ id: t.id, Merchant: t.merchant, Type: t.type, Date: t.date, Amount: `${signed(t.amount)} USDC`, Status: <Tone tone={txTone[t.status]}>{t.status}</Tone> }))} onAction={openTx} />
            : groups.map((g) => (
              <GridList key={g} id={`tx-${g.replace(/\W+/g, '-')}`} header={g} onAction={openTx} className="lh-grouped">
                {txs.filter((t) => t.group === g).map((t) => <GridListItem key={t.id} id={t.id} description={desc(t)} value={`${signed(t.amount)} USDC`}>{t.merchant}</GridListItem>)}
              </GridList>
            ))}
        </div>
        {cancelDialog}
      </>
    );
  }
  return (
    <>
      {header}
      <div className="lh-section lh-card-detail">
        <div className="lh-card-detail-main">
          <PaymentCard name={c.name} last4={c.last4} design={c.design} format={c.type} frozen={c.frozen} shown={shown} />
          {c.frozen && <Banner tone="info" title={`Frozen ${c.frozenAt || 'today'} by Dawid`}>New payments are declined and subscriptions on this card will fail. Unfreeze to use it again.</Banner>}
          <div className="lh-split-actions">
            <Button size="l" variant="outlined" tone="secondary" onPress={() => setShown(!shown)}>{shown ? 'Hide number' : 'Show number'}</Button>
            {c.frozen
              ? <Button size="l" onPress={freeze}>Unfreeze</Button>
              : <Button size="l" variant="outlined" tone="secondary" onPress={freeze}>Freeze</Button>}
          </div>
          {meter}
        </div>
        <div className="lh-card-detail-side">
          <section className="lh-stack" aria-labelledby="card-details"><H2 id="card-details">Details</H2>
            <DescriptionList columns items={[['Status', status], ['Type', `${c.type} ${c.kind}`], ['Account', c.account], ['Limit', limitText(c)], ['Created', c.created]]} />
          </section>
          <section className="lh-stack" aria-labelledby="card-billing">
            <div className="lh-row-between"><H2 id="card-billing">Billing address</H2><Button size="s" variant="ghost" tone="secondary" onPress={copyAddress}>Copy</Button></div>
            <DescriptionList columns items={[['Address', '21 Duxton Hill, #04-02, Singapore 089600']]} />
          </section>
          <div className="lh-card-cancel"><Button size="l" variant="ghost" tone="danger" onPress={() => setCancel(true)}>Cancel this card</Button></div>
        </div>
      </div>
      {cancelDialog}
    </>
  );
}

// 1.2 Edit card
function EditCard({ id }) {
  const { state, dispatch } = useStore();
  const c = state.cards.find((x) => x.id === id);
  const [v, setV] = useState(() => c && { name: c.name, account: c.account, period: c.period || 'Monthly', limit: c.limit, frozen: !!c.frozen });
  const [err, setErr] = useState('');
  if (!c) return <Missing what="card" back="#/cards" />;
  const save = (e) => {
    e.preventDefault();
    if (!v.name.trim()) { setErr('Name the card.'); return; }
    if (!(v.limit > 0)) { setErr(''); return; }
    const patch = { name: v.name.trim(), account: v.account, limit: v.limit, period: v.period };
    if (v.frozen !== !!c.frozen) dispatch({ type: 'toggle-freeze', id });
    dispatch({ type: 'card-update', id, patch });
    toast('Changes saved', 'success', { description: `${patch.name} ••${c.last4}`, quiet: true });
    go(`#/cards/${id}`);
  };
  return (
    <>
      <Header inline title="Edit card" crumbs={[{ label: 'Cards', href: '#/cards' }, { label: c.name, href: `#/cards/${id}` }, { label: 'Edit card' }]} />
      <Form onSubmit={save} className="lh-section lh-form lh-form--centred">
        <TextField label="Card name" size="l" value={v.name} onChange={(x) => { setV({ ...v, name: x }); setErr(''); }} isInvalid={!!err} errorMessage={err} />
        <Select label="Account" size="l" items={ACCOUNTS} selectedKey={v.account} onSelectionChange={(x) => setV({ ...v, account: x })} />
        <Select label="Limit type" size="l" items={LIMIT_TYPES} selectedKey={v.period} onSelectionChange={(x) => setV({ ...v, period: x })} />
        <NumberField label="Amount (USDC)" size="l" value={v.limit} onChange={(x) => setV({ ...v, limit: x })} formatOptions={{ minimumFractionDigits: 2 }} minValue={0}
          isInvalid={!(v.limit > 0)} errorMessage={!(v.limit > 0) ? 'Enter an amount above 0.00.' : undefined} />
        <Switch leading isSelected={v.frozen} onChange={(x) => setV({ ...v, frozen: x })} description="Blocks new payments. Keeps the card and its history.">Freeze card</Switch>
        <Button type="submit" size="l" className="lh-wide-button">Save changes</Button>
      </Form>
    </>
  );
}

// 1.3 New card
function NewCard() {
  const { dispatch } = useStore();
  const [v, setV] = useState({ holder: 'Alan Rutledge', name: 'Alan’s virtual card', kind: 'credit', format: 'Virtual', design: 'aurora', period: 'Monthly', limit: 2000 });
  const [err, setErr] = useState('');
  const create = (e) => {
    e.preventDefault();
    if (!v.name.trim()) { setErr('Name the card.'); return; }
    if (!(v.limit > 0)) return;
    const last4 = String(1000 + Math.floor(Math.random() * 8999));
    const cid = `c${Date.now().toString(36)}`;
    dispatch({ type: 'card-create', card: { id: cid, name: v.name.trim(), last4, type: v.format, kind: v.kind, holder: v.holder, balance: v.limit, spent: 0, limit: v.limit, period: v.period, status: 'Active', account: 'Card float ••6034', created: 'Today', design: v.design } });
    go(`#/cards/${cid}/ready`);
  };
  return (
    <>
      <Header inline title="New card" crumbs={[{ label: 'Cards', href: '#/cards' }, { label: 'New card' }]} />
      <Form onSubmit={create} className="lh-section lh-form lh-form--centred">
        <div className="lh-card-visual"><PaymentCard name={v.name || 'New card'} last4="4417" design={v.design} format={v.format} /></div>
        <Select label="Cardholder" size="l" items={HOLDERS} selectedKey={v.holder} onSelectionChange={(x) => setV({ ...v, holder: x })} />
        <TextField label="Card nickname" size="l" value={v.name} onChange={(x) => { setV({ ...v, name: x }); setErr(''); }} isInvalid={!!err} errorMessage={err} />
        <div className="srn-field"><span className="text-label-medium" id="type-label">Type</span><ToggleButtonGroup label="Type" items={[{ id: 'credit', label: 'Credit' }, { id: 'debit', label: 'Debit' }]} value={v.kind} onChange={(x) => setV({ ...v, kind: x })} /></div>
        <div className="srn-field"><span className="text-label-medium">Format</span><ToggleButtonGroup label="Format" items={['Virtual', 'Physical']} value={v.format} onChange={(x) => setV({ ...v, format: x })} /></div>
        <SwatchPicker label="Design" designs={CARD_DESIGNS} value={v.design} onChange={(x) => setV({ ...v, design: x })} />
        <Select label="Limit type" size="l" items={LIMIT_TYPES} selectedKey={v.period} onSelectionChange={(x) => setV({ ...v, period: x })} description="Per transaction, monthly, total or single use" />
        <NumberField label="Amount (USDC)" size="l" value={v.limit} onChange={(x) => setV({ ...v, limit: x })} formatOptions={{ minimumFractionDigits: 2 }} minValue={0}
          description={v.period === 'Monthly' ? 'Resets on the 1st of each month' : undefined}
          isInvalid={!(v.limit > 0)} errorMessage={!(v.limit > 0) ? 'Enter an amount above 0.00.' : undefined} />
        <Button type="submit" size="l" className="lh-wide-button">Create card</Button>
      </Form>
    </>
  );
}

// 1.4 Card ready
function CardReady({ id }) {
  const { state } = useStore();
  const c = state.cards.find((x) => x.id === id);
  const [receipts, setReceipts] = useState(false);
  if (!c) return <Missing what="card" back="#/cards" />;
  const limit = { Monthly: 'monthly limit', 'Per transaction': 'limit per transaction', Total: 'total limit', 'Single use': 'single-use limit' }[c.period || 'Monthly'];
  return (
    <>
      <Header inline title="Card ready" titleHiddenOnPhone />
      <div className="lh-section lh-form lh-form--centred lh-card-ready">
        <div className="lh-card-visual"><PaymentCard name={c.name} last4={c.last4} design={c.design} format={c.type} /></div>
        <div className="lh-stack lh-stack--tight"><h2 className="text-subtitle-medium lh-h2">Your card is ready</h2><p className="text-body-medium lh-secondary">{`${c.name} is active, with a ${fmt(c.limit)} USDC ${limit}.`}</p></div>
        <Switch leading isSelected={receipts} onChange={(x) => { setReceipts(x); if (x) toast('Receipts required above 75.00 USDC', 'success'); }} description="Cardholders get a prompt to attach a receipt. Manage this on the Policies page.">Require a receipt above 75.00 USDC</Switch>
        <div className="lh-stack lh-stack--tight">
          <Button size="l" className="lh-wide-button" onPress={() => go(`#/cards/${id}`)}>Continue</Button>
          <Button size="l" variant="outlined" tone="secondary" className="lh-wide-button" onPress={() => go('#/cards/new')}>Create another card</Button>
        </div>
      </div>
    </>
  );
}

export function Missing({ what, back }) {
  return <div className="lh-section"><EmptyState size="m" headingLevel={1} title={`This ${what} isn’t here anymore`} description="It may have been cancelled or deleted." action={<Button size="s" variant="outlined" tone="secondary" href={back}>Go back</Button>} /></div>;
}
