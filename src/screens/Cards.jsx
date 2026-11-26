import React, { useState } from 'react';
import { Form } from 'react-aria-components';
import { Button, ButtonGroup } from '../serenity/Button.jsx';
import { TextField, NumberField, Select } from '../serenity/Fields.jsx';
import { Dialog, Modal, toast } from '../serenity/Overlays.jsx';
import { DescriptionList, EmptyState } from '../serenity/Content.jsx';
import { Meter, Banner } from '../serenity/Status.jsx';
import { Header, Table, Tone, ToggleButtonGroup, Switch, PaymentCard, SwatchPicker, H2 } from '../serenity/Data.jsx';
import { useStore } from '../data.js';
import { CARD_COLORS } from '../seed.js';
import { fmt, signed } from '../format.js';

// Cards (Figma 25:7122): 1.0 the list (Manage · Subscriptions), 1.1 card details (Overview · Transactions, freeze, cancel),
// 1.2 edit card, 1.3 new card, 1.4 card ready. Routes: #/cards, #/cards/new, #/cards/<id>, #/cards/<id>/edit,
// #/cards/<id>/transactions, #/cards/<id>/ready.
const go = (h) => { location.hash = h; };
const statusTone = { Active: 'green', Suspended: 'red', Frozen: 'azure' };

export function Cards({ parts = [] }) {
  const [id, sub] = parts;
  if (id === 'new') return <NewCard />;
  if (id && sub === 'edit') return <EditCard id={id} />;
  if (id && sub === 'ready') return <CardReady id={id} />;
  if (id) return <CardDetail id={id} tab={sub === 'transactions' ? 'transactions' : 'overview'} />;
  return <CardList />;
}

function CardList() {
  const { state } = useStore();
  const [view, setView] = useState('manage');
  const rows = state.cards.map((c) => ({
    id: c.id, Card: c.name, Cardholder: c.holder, Type: `${c.type} ••${c.last4}`, Spent: `${fmt(c.spent)} USDC`,
    Status: <Tone tone={statusTone[c.status] || 'neutral'}>{c.status}</Tone>,
  }));
  return (
    <>
      <Header title="Cards" actions={<Button size="m" onPress={() => go('#/cards/new')}>New card</Button>}
        toggles={<ToggleButtonGroup label="View" items={[{ id: 'manage', label: 'Manage' }, { id: 'subs', label: 'Subscriptions' }]} value={view} onChange={setView} />} />
      <div className="lh-section">
        {view === 'manage'
          ? <Table label="Cards" columns={[{ label: 'Card', strong: true }, { label: 'Cardholder' }, { label: 'Type' }, { id: 'Spent', label: 'Spent this month', align: 'end' }, { label: 'Status' }]} rows={rows} onAction={(k) => go(`#/cards/${k}`)} />
          : <EmptyState size="m" headingLevel={2} icon="credit-card" title="No subscriptions yet" description="Recurring payments on your cards (AWS, Figma, Slack) will show up here, grouped by merchant." />}
      </div>
    </>
  );
}

function CardDetail({ id, tab }) {
  const { state, dispatch } = useStore();
  const c = state.cards.find((x) => x.id === id);
  const [shown, setShown] = useState(false);
  const [cancel, setCancel] = useState(false);
  if (!c) return <Missing what="card" back="#/cards" />;
  const crumbs = [{ label: 'Cards', href: '#/cards' }, { label: c.name }];
  const toggles = <ToggleButtonGroup label="Card view" items={[{ id: 'overview', label: 'Overview' }, { id: 'transactions', label: 'Transactions' }]} value={tab} onChange={(v) => go(`#/cards/${id}${v === 'transactions' ? '/transactions' : ''}`)} />;
  const meter = <Meter label="Spent this month" value={(c.spent / c.limit) * 100} valueLabel={`${fmt(c.spent)} of ${fmt(c.limit)} USDC`} tone="neutral" />;
  const header = <Header title={c.name} caption={`••${c.last4}`} crumbs={crumbs} badges={<Tone tone={statusTone[c.status] || 'neutral'}>{c.status}</Tone>} toggles={toggles}
    actions={<Button size="m" variant="outlined" tone="secondary" onPress={() => go(`#/cards/${id}/edit`)}>Edit</Button>} />;

  if (tab === 'transactions') {
    const rows = state.cardTransactions.map((t) => ({ id: t.id, Merchant: t.merchant, Type: t.type, Date: t.date, Amount: `${signed(t.amount)} USDC`, Status: <Tone tone={{ Paid: 'green', Declined: 'red', 'Receipt missing': 'amber' }[t.status]}>{t.status}</Tone> }));
    return (
      <>
        {header}
        <div className="lh-section lh-stack">{meter}<Table label={`${c.name} transactions`} columns={[{ label: 'Merchant', strong: true }, { label: 'Type' }, { label: 'Date' }, { label: 'Amount', align: 'end' }, { label: 'Status' }]} rows={rows} /></div>
      </>
    );
  }
  const freeze = () => { dispatch({ type: 'toggle-freeze', id }); toast(c.frozen ? 'Card unfrozen' : 'Card frozen'); };
  return (
    <>
      {header}
      <div className="lh-section lh-detail">
        <div className="lh-detail-main">
          <PaymentCard name={c.name} last4={c.last4} color={c.color} frozen={c.frozen} shown={shown} />
          {c.frozen && <Banner tone="info" title={`Frozen ${c.frozenAt || 'today'} by Dawid`}>New payments are declined and subscriptions on this card will fail until you unfreeze it.</Banner>}
          <div className="lh-actions lh-actions--flush">
            <Button size="l" variant="outlined" tone="secondary" onPress={() => setShown(!shown)}>{shown ? 'Hide number' : 'Show number'}</Button>
            <Button size="l" variant="outlined" tone="secondary" onPress={freeze}>{c.frozen ? 'Unfreeze' : 'Freeze'}</Button>
          </div>
          {meter}
        </div>
        <div className="lh-detail-side">
          <section className="lh-stack" aria-labelledby="card-details"><H2 id="card-details">Details</H2>
            <DescriptionList items={[['Status', c.status], ['Type', `${c.type} ${c.kind}`], ['Account', c.account], ['Limit', `${fmt(c.limit)} USDC a month`], ['Created', c.created]]} />
          </section>
          <section className="lh-stack" aria-labelledby="card-billing">
            <div className="lh-row-between"><H2 id="card-billing">Billing address</H2><Button size="s" variant="ghost" tone="secondary" onPress={() => { try { navigator.clipboard.writeText('21 Duxton Hill, #04-02, Singapore 089600'); } catch { /* */ } toast('Address copied', 'success'); }}>Copy</Button></div>
            <DescriptionList items={[['Address', '21 Duxton Hill, #04-02, Singapore 089600']]} />
          </section>
          <div><Button size="l" variant="ghost" tone="danger" onPress={() => setCancel(true)}>Cancel this card</Button></div>
        </div>
      </div>
      <Modal isOpen={cancel} onOpenChange={setCancel}>
        <Dialog title="Cancel this card?" subtitle={`${c.name} (••${c.last4}) stops working right away and its subscriptions fail. You can’t undo this.`}
          footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Keep card</Button><Button size="l" tone="danger" onPress={() => { dispatch({ type: 'card-cancel', id }); toast('Card cancelled'); go('#/cards'); }}>Cancel card</Button></ButtonGroup>} />
      </Modal>
    </>
  );
}

function EditCard({ id }) {
  const { state, dispatch } = useStore();
  const c = state.cards.find((x) => x.id === id);
  const [v, setV] = useState(() => c && { name: c.name, account: c.account, period: 'Monthly', limit: c.limit, frozen: !!c.frozen });
  if (!c) return <Missing what="card" back="#/cards" />;
  const save = (e) => {
    e.preventDefault();
    dispatch({ type: 'card-update', id, patch: { name: v.name.trim() || c.name, account: v.account, limit: v.limit, frozen: v.frozen, status: v.frozen ? 'Frozen' : (c.status === 'Frozen' ? 'Active' : c.status) } });
    toast('Changes saved', 'success'); go(`#/cards/${id}`);
  };
  return (
    <>
      <Header title="Edit card" crumbs={[{ label: 'Cards', href: '#/cards' }, { label: c.name, href: `#/cards/${id}` }, { label: 'Edit card' }]} />
      <Form onSubmit={save} className="lh-section lh-form">
        <TextField label="Name" size="l" value={v.name} onChange={(x) => setV({ ...v, name: x })} />
        <Select label="Account" size="l" items={['Card float ••6034', 'Operating ••4417', 'Reserve ••1794']} selectedKey={v.account} onSelectionChange={(x) => setV({ ...v, account: x })} />
        <Select label="Limit period" size="l" items={['Daily', 'Weekly', 'Monthly', 'Yearly']} selectedKey={v.period} onSelectionChange={(x) => setV({ ...v, period: x })} />
        <NumberField label="Limit" size="l" suffix="USDC" value={v.limit} onChange={(x) => setV({ ...v, limit: x })} formatOptions={{ minimumFractionDigits: 2 }} minValue={0} />
        <Switch isSelected={v.frozen} onChange={(x) => setV({ ...v, frozen: x })} description="Blocks new payments. Keeps the card and its history.">Freeze card</Switch>
        <ButtonGroup className="lh-form-actions"><Button variant="outlined" tone="secondary" size="l" onPress={() => go(`#/cards/${id}`)}>Cancel</Button><Button type="submit" size="l">Save changes</Button></ButtonGroup>
      </Form>
    </>
  );
}

function NewCard() {
  const { dispatch } = useStore();
  const [v, setV] = useState({ holder: 'Alan Rutledge', name: 'Alan’s virtual card', kind: 'credit', format: 'Virtual', color: '#4b3a8f', period: 'Monthly', limit: 2000 });
  const [err, setErr] = useState('');
  const color = CARD_COLORS.find((c) => c.hex === v.color) || CARD_COLORS[2];
  const create = (e) => {
    e.preventDefault();
    if (!v.name.trim()) { setErr('Name the card.'); return; }
    const last4 = String(1000 + Math.floor(Math.random() * 8999));
    dispatch({ type: 'card-create', card: { name: v.name.trim(), last4, type: v.format, kind: v.kind, holder: v.holder, balance: v.limit, spent: 0, limit: v.limit, status: 'Active', account: 'Operating ••4417', created: 'Today', color: v.color } });
    go(`#/cards/new-card/ready?n=${encodeURIComponent(v.name.trim())}&l=${v.limit}&last4=${last4}&c=${encodeURIComponent(v.color)}`);
  };
  return (
    <>
      <Header title="New card" crumbs={[{ label: 'Cards', href: '#/cards' }, { label: 'New card' }]} />
      <Form onSubmit={create} className="lh-section lh-detail">
        <div className="lh-detail-main"><PaymentCard name={v.name} last4="4417" color={v.color} /></div>
        <div className="lh-detail-side lh-form">
          <Select label="Cardholder" size="l" items={['Alan Rutledge', 'Dawid', 'Kristin Watson', 'Sofia Lindström']} selectedKey={v.holder} onSelectionChange={(x) => setV({ ...v, holder: x })} />
          <TextField label="Name" size="l" value={v.name} onChange={(x) => { setV({ ...v, name: x }); setErr(''); }} isInvalid={!!err} errorMessage={err} />
          <div className="srn-field"><span className="text-label-medium">Type</span><ToggleButtonGroup label="Type" items={[{ id: 'credit', label: 'Credit' }, { id: 'debit', label: 'Debit' }]} value={v.kind} onChange={(x) => setV({ ...v, kind: x })} /></div>
          <div className="srn-field"><span className="text-label-medium">Format</span><ToggleButtonGroup label="Format" items={['Virtual', 'Physical']} value={v.format} onChange={(x) => setV({ ...v, format: x })} /></div>
          <SwatchPicker label={`Design: ${color.name}`} colors={CARD_COLORS} value={v.color} onChange={(x) => setV({ ...v, color: x })} />
          <Select label="Limit period" size="l" items={['Daily', 'Weekly', 'Monthly', 'Yearly']} selectedKey={v.period} onSelectionChange={(x) => setV({ ...v, period: x })} />
          <NumberField label="Limit" size="l" suffix="USDC" value={v.limit} onChange={(x) => setV({ ...v, limit: x })} formatOptions={{ minimumFractionDigits: 2 }} minValue={0} />
          <ButtonGroup className="lh-form-actions"><Button variant="outlined" tone="secondary" size="l" onPress={() => go('#/cards')}>Cancel</Button><Button type="submit" size="l">Create card</Button></ButtonGroup>
        </div>
      </Form>
    </>
  );
}

function CardReady() {
  const q = new URLSearchParams(location.hash.split('?')[1] || '');
  const name = q.get('n') || 'Alan’s virtual card'; const limit = Number(q.get('l') || 2000);
  const [receipts, setReceipts] = useState(true);
  return (
    <>
      <Header title="Card ready" crumbs={[{ label: 'Cards', href: '#/cards' }, { label: 'Card ready' }]} />
      <div className="lh-section lh-detail">
        <div className="lh-detail-main"><PaymentCard name={name} last4={q.get('last4') || '4417'} color={q.get('c') || '#4b3a8f'} /></div>
        <div className="lh-detail-side lh-form">
          <div className="lh-stack lh-stack--tight"><H2>Your card is ready</H2><p className="text-body-medium lh-secondary">{`${name} is active, with a ${fmt(limit)} USDC monthly limit.`}</p></div>
          <Switch isSelected={receipts} onChange={setReceipts} description="Cardholders get a prompt to attach a receipt. Manage this on the card’s page.">Require a receipt above 75.00 USDC</Switch>
          <ButtonGroup className="lh-form-actions"><Button variant="outlined" tone="secondary" size="l" onPress={() => go('#/cards/new')}>Create another card</Button><Button size="l" onPress={() => go('#/cards')}>Done</Button></ButtonGroup>
        </div>
      </div>
    </>
  );
}

export function Missing({ what, back }) {
  return <div className="lh-section"><EmptyState size="m" headingLevel={1} title={`This ${what} isn’t here anymore`} description="It may have been cancelled or deleted." action={<Button size="s" variant="outlined" tone="secondary" href={back}>Go back</Button>} /></div>;
}
