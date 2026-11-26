import React, { useEffect, useState } from 'react';
import { Form } from 'react-aria-components';
import { Button, ButtonGroup, ButtonIcon, cx } from '../serenity/Button.jsx';
import { TextField, NumberField, Select } from '../serenity/Fields.jsx';
import { Dialog, Modal, toast } from '../serenity/Overlays.jsx';
import { Stat, DescriptionList } from '../serenity/Content.jsx';
import { Header, Table, Tone, Switch, DropZone, H2, Item } from '../serenity/Data.jsx';
import { SearchField, Input, Group } from 'react-aria-components';
import { Icon } from '../icons.jsx';
import { useStore } from '../data.js';
import { fmt, signed } from '../format.js';

// Transactions (Figma 47:9901): 1.0 the month's list with a type filter, 1.1 transaction details with the receipt, 1.2
// Transfer funds (form, review, done), 1.3 Send money (pick a recipient). Routes: #/transactions, #/transactions/<id>,
// #/transactions/send.
const go = (h) => { location.hash = h; };
const statusTone = { Completed: 'green', Pending: 'amber', Failed: 'red', Processing: 'azure' };
const TYPES = ['All types', 'Card payment', 'Deposit', 'Withdrawal', 'Reward', 'Internal transfer'];

export function Transactions({ parts = [], open }) {
  const [id] = parts;
  if (id === 'send') return <SendMoney open={open} />;
  if (id) return <TransactionDetail id={id} />;
  return <TransactionList open={open} />;
}

function TransactionList({ open }) {
  const { state } = useStore();
  const [type, setType] = useState('All types');
  const list = type === 'All types' ? state.transactions : state.transactions.filter((t) => t.type === type);
  const card = type === 'Card payment';
  const inSum = list.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const outSum = list.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);
  const pending = list.filter((t) => t.amount < 0 && t.status === 'Pending').reduce((s, t) => s - t.amount, 0);
  const rows = list.map((t) => ({ id: t.id, Merchant: t.name, Type: card ? (t.card || '—') : t.type, Date: t.date, Amount: `${signed(t.amount)} USDC`, Status: <Tone tone={statusTone[t.status] || 'neutral'}>{t.status}</Tone> }));
  return (
    <>
      <Header title="Transactions" actions={<>
        <Button size="m" variant="outlined" tone="secondary" onPress={() => open({ kind: 'transfer' })}>Transfer</Button>
        <Button size="m" onPress={() => go('#/transactions/send')}>Send money</Button>
      </>} />
      <div className="lh-section lh-stack">
        <div className="lh-filter-row">
          <Select label="Type" items={TYPES} selectedKey={type} onSelectionChange={setType} className="lh-filter-select" />
          {type !== 'All types' && (
            <span className="srn-tag-filter text-label-medium">Type is {type === 'Card payment' ? 'Card payments' : type}
              <ButtonIcon size="xs" isSquare={false} aria-label="Remove the type filter" onPress={() => setType('All types')}><Icon name="close" size={16} /></ButtonIcon>
            </span>
          )}
          {type !== 'All types' && <span className="text-body-medium lh-secondary" aria-live="polite">{list.length} results</span>}
        </div>
        <h2 className="text-subtitle-small">{card ? 'Card spend · August 2026' : 'August 2026'}</h2>
        <div className="lh-stat-row">
          {card
            ? <><Stat value={`−${fmt(outSum - pending)}`}>Spent, USDC</Stat><Stat value={`−${fmt(pending)}`}>Pending, USDC</Stat></>
            : <><Stat value={`+${fmt(inSum)}`}>Money in, USDC</Stat><Stat value={`−${fmt(outSum)}`}>Money out, USDC</Stat></>}
        </div>
        <Table label="Transactions" columns={[{ label: 'Merchant', strong: true }, { label: card ? 'Card' : 'Type', id: 'Type' }, { label: 'Date' }, { label: 'Amount', align: 'end' }, { label: 'Status' }]} rows={rows} onAction={(k) => go(`#/transactions/${k}`)} />
      </div>
    </>
  );
}

function TransactionDetail({ id }) {
  const { state, dispatch } = useStore();
  const t = state.transactions.find((x) => x.id === id);
  if (!t) return <div className="lh-section"><p className="text-body-medium">This transaction isn’t here anymore. <a href="#/transactions">Back to Transactions</a></p></div>;
  return (
    <>
      <Header title={t.name} crumbs={[{ label: 'Transactions', href: '#/transactions' }, { label: t.name }]} badges={<Tone tone={statusTone[t.status] || 'neutral'}>{t.status}</Tone>} />
      <div className="lh-section lh-detail">
        <div className="lh-detail-main lh-stack">
          <Stat size="l" value={signed(t.amount)}>Amount, USDC</Stat>
          <section className="lh-stack" aria-labelledby="tx-details"><H2 id="tx-details">Details</H2>
            <DescriptionList items={[['Type', t.type], t.card && ['Card', t.method], ['Account', t.account], ['Date', t.date], ['Reference', t.ref], ['Category', t.category]]} />
          </section>
        </div>
        {t.type === 'Card payment' && (
          <section className="lh-detail-side lh-stack" aria-labelledby="tx-receipt"><H2 id="tx-receipt">Receipt</H2>
            <DropZone label="Add a receipt" description={Math.abs(t.amount) > 75 ? 'Required above 75.00 USDC. PDF, JPG or PNG, up to 10 MB' : 'PDF, JPG or PNG, up to 10 MB'} file={t.receipt}
              onFile={(f) => { dispatch({ type: 'tx-receipt', id, file: f }); toast('Receipt added', 'success'); }} />
          </section>
        )}
      </div>
    </>
  );
}

function SendMoney({ open }) {
  const [q, setQ] = useState('');
  const [bill, setBill] = useState(null);
  const people = [['Northwind Ltd', 'Supplier · billing@northwind.com'], ['Kristin Watson', 'Contractor · kristin@watson.dev'], ['Acme Corp', 'Supplier · finance@acme.com'], ['Orion Labs', 'Supplier · ap@orionlabs.io']];
  const list = people.filter(([n, d]) => `${n} ${d}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <Header title="Send money" crumbs={[{ label: 'Transactions', href: '#/transactions' }, { label: 'Send money' }]} />
      <div className="lh-section lh-form lh-form--wide">
        <DropZone label="Upload a bill" description="We read the file and pre-fill the recipient and amount." button="Choose a bill" file={bill}
          onFile={(f) => { setBill(f); toast('Bill read: Northwind Ltd, 3,480.00 USDC'); open({ kind: 'send', draft: { to: 'Northwind Ltd', amount: 3480, from: 'operating', note: f } }); }} />
        <H2>Select a recipient</H2>
        <SearchField aria-label="Search name or email" value={q} onChange={setQ} className="srn-field">
          <Group className={({ isFocusWithin }) => cx('srn-field-group', 'srn-size-l', isFocusWithin ? 'effect-focus-neutral' : 'effect-field-default')}>
            <span className="lh-muted" aria-hidden="true"><Icon name="search-s" size={16} /></span>
            <Input placeholder="Search name or email" className="srn-input text-body-large" />
          </Group>
        </SearchField>
        <div className="lh-actions lh-actions--flush">
          <Button size="m" variant="outlined" tone="secondary" onPress={() => open({ kind: 'send', draft: { to: q, amount: NaN, from: 'operating', note: '' } })}>Create recipient</Button>
          <Button size="m" variant="outlined" tone="secondary" onPress={() => toast('Invite sent')}>Invite recipient</Button>
        </div>
        <section className="lh-stack lh-stack--tight" aria-labelledby="recent"><h3 id="recent" className="text-caption-strong-small lh-secondary">Recently paid</h3>
          {list.map(([n, d]) => <Item key={n} label={n} description={d} onPress={() => open({ kind: 'send', draft: { to: n, amount: NaN, from: 'operating', note: '' } })} />)}
          {!list.length && <p className="text-body-medium lh-secondary">No one matches. Create a recipient instead.</p>}
        </section>
      </div>
    </>
  );
}

// Transfer funds between your own accounts (1.2): the form, the review and the done step, in one Modal.
export function TransferDialog({ isOpen, onClose, initialStep = 'form' }) {
  const { state, dispatch } = useStore();
  const [step, setStep] = useState(initialStep);
  const [v, setV] = useState({ amount: 10000, from: 'operating', to: 'reserve', repeat: false, period: 'Monthly', note: '' });
  const [err, setErr] = useState('');
  const [pending, setPending] = useState(false);
  useEffect(() => { if (v.from === v.to) setV((x) => ({ ...x, to: x.from === 'operating' ? 'reserve' : 'operating' })); }, [v.from, v.to]);
  const acc = (x) => state.accounts.find((a) => a.id === x);
  const label = (a) => `${a.name} ${a.id === 'operating' ? '••4417' : '••1794'}`;
  const available = (x) => (x === 'operating' ? acc(x).available : acc(x).balance);
  const submit = (e) => {
    e.preventDefault();
    if (!(v.amount > 0)) { setErr('Enter an amount above 0.'); return; }
    if (v.amount > available(v.from)) { setErr(`That is more than the ${fmt(available(v.from))} USDC available.`); return; }
    setStep('review');
  };
  const confirm = () => { setPending(true); setTimeout(() => { dispatch({ type: 'transfer', from: v.from, to: v.to, value: v.amount, note: v.note }); setPending(false); setStep('done'); toast(`Moved ${fmt(v.amount)} USDC to ${acc(v.to).name}`, 'success'); }, 600); };
  let body;
  if (step === 'form') {
    body = (
      <Form onSubmit={submit} validationBehavior="aria">
        <Dialog title="Transfer funds" subtitle="Between your own accounts, instant and free"
          footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Cancel</Button><Button type="submit" size="l">Review</Button></ButtonGroup>}>
          <NumberField label="Amount" suffix="USDC" autoFocus value={v.amount} onChange={(x) => { setV({ ...v, amount: x }); setErr(''); }} isInvalid={!!err} errorMessage={err} formatOptions={{ minimumFractionDigits: 2 }} minValue={0}
            description={`${fmt(available(v.from))} USDC available in ${acc(v.from).name}`} />
          <Select label="From" items={state.accounts.map((a) => ({ id: a.id, label: label(a) }))} selectedKey={v.from} onSelectionChange={(x) => setV({ ...v, from: x })} />
          <Select label="To" items={state.accounts.filter((a) => a.id !== v.from).map((a) => ({ id: a.id, label: label(a) }))} selectedKey={v.to} onSelectionChange={(x) => setV({ ...v, to: x })} />
          <TextField label="Note" optional value={v.note} onChange={(x) => setV({ ...v, note: x })} description="Shows on both accounts" />
          <Switch isSelected={v.repeat} onChange={(x) => setV({ ...v, repeat: x })} description="Repeat this transfer every week or month.">Set up auto transfer</Switch>
          {v.repeat && <Select label="Repeat" items={['Weekly', 'Monthly']} selectedKey={v.period} onSelectionChange={(x) => setV({ ...v, period: x })} />}
        </Dialog>
      </Form>
    );
  } else if (step === 'review') {
    body = (
      <Dialog title="Review transfer"
        footer={<ButtonGroup><Button variant="outlined" tone="secondary" size="l" onPress={() => setStep('form')} isDisabled={pending}>Back</Button><Button size="l" autoFocus onPress={confirm} isPending={pending} pendingLabel="Transferring">Transfer</Button></ButtonGroup>}>
        <Stat value={fmt(v.amount)} description="Runs as soon as you confirm">Amount, USDC</Stat>
        <DescriptionList items={[['From', `${label(acc(v.from))}, Firefly LLC`], ['To', `${label(acc(v.to))}, Firefly LLC`], ['Arrives', 'Instant, as soon as you confirm'], ['Fee', 'No fee'], v.repeat && ['Repeats', v.period]]} />
        <p className="text-body-small lh-secondary">By selecting Transfer, you authorise Lighthouse to move the amount shown above from {acc(v.from).name} to {acc(v.to).name}.</p>
      </Dialog>
    );
  } else {
    body = (
      <Dialog title="Your transfer is done" footer={<ButtonGroup><Button slot="close" size="l" autoFocus>Done</Button></ButtonGroup>}>
        <p className="text-body-large">{fmt(v.amount)} USDC is in {acc(v.to).name} now.</p>
        <DescriptionList items={[['Amount', `${fmt(v.amount)} USDC`], ['From', label(acc(v.from))], ['To', label(acc(v.to))], ['Date', 'Just now']]} />
      </Dialog>
    );
  }
  return (
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()} isDismissable={!pending}>
      <div key={step} className="motion-navigate-axis lh-step">{body}</div>
    </Modal>
  );
}
