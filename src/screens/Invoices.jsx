import React, { useState } from 'react';
import { Form, MenuTrigger } from 'react-aria-components';
import { Button, ButtonGroup } from '../serenity/Button.jsx';
import { TextField, NumberField, Select, TextArea } from '../serenity/Fields.jsx';
import { Dialog, Modal, Menu, MenuItem, Popover, toast } from '../serenity/Overlays.jsx';
import { Stat, DescriptionList, EmptyState } from '../serenity/Content.jsx';
import { Meter, Banner } from '../serenity/Status.jsx';
import { Header, Table, Tone, ToggleButtonGroup, Switch, ComboBox, H2, Item } from '../serenity/Data.jsx';
import { useStore } from '../data.js';
import { fmt } from '../format.js';

// Invoices (Figma 55:12505): 1.0 the list (All · Unpaid · Paid · Drafts) and its empty states, 1.1 New invoice (customer,
// items, preview, sent, errors), 1.2 invoice details (unpaid, paid, overdue, draft, cancelled; More menu, payment link,
// mark as paid, cancel, reminders), 1.3 Customers, 1.4 Reminders. Routes: #/invoices, #/invoices/new,
// #/invoices/<id>, #/invoices/customers, #/invoices/customers/<id>, #/invoices/reminders.
const go = (h) => { location.hash = h; };
export const totalOf = (inv) => inv.items.reduce((s, [, q, p]) => s + q * p, 0);
const STATUS = {
  unpaid: (i) => ({ label: i.viewed ? 'Viewed' : `Due ${i.dueNote ? i.dueNote.replace('due ', '') : i.due}`, tone: i.viewed ? 'azure' : 'neutral', badge: ['Unpaid', 'azure'] }),
  overdue: (i) => ({ label: i.dueNote || 'Overdue', tone: 'red', badge: ['Overdue', 'red'] }),
  paid: () => ({ label: 'Paid', tone: 'green', badge: ['Paid', 'green'] }),
  draft: () => ({ label: 'Draft', tone: 'neutral', badge: ['Draft', 'neutral'] }),
  cancelled: () => ({ label: 'Cancelled', tone: 'neutral', badge: ['Cancelled', 'neutral'] }),
};
const st = (i) => STATUS[i.status](i);
const subNav = (
  <>
    <Button size="m" variant="outlined" tone="secondary" href="#/invoices/customers">Customers</Button>
    <Button size="m" variant="outlined" tone="secondary" href="#/invoices/reminders">Reminders</Button>
    <Button size="m" href="#/invoices/new">New invoice</Button>
  </>
);

export function Invoices({ parts = [] }) {
  const [a, b] = parts;
  if (a === 'new') return <NewInvoice />;
  if (a === 'customers') return b ? <Customer id={b} /> : <Customers />;
  if (a === 'reminders') return <Reminders />;
  if (a) return <InvoiceDetail id={a} />;
  return <InvoiceList />;
}

function InvoiceList() {
  const { state } = useStore();
  const [view, setView] = useState(() => (location.hash.includes('view=drafts') ? 'drafts' : 'all'));
  const filter = { all: (i) => i.status !== 'cancelled', unpaid: (i) => i.status === 'unpaid' || i.status === 'overdue', paid: (i) => i.status === 'paid', drafts: (i) => i.status === 'draft' }[view];
  const list = state.invoices.filter(filter);
  const outstanding = state.invoices.filter((i) => i.status === 'unpaid' || i.status === 'overdue').reduce((s, i) => s + totalOf(i), 0);
  const overdue = state.invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + totalOf(i), 0);
  const rows = list.map((i) => ({ id: i.id, Customer: i.customer, Invoice: i.status === 'draft' ? 'Draft' : i.id, Due: i.due, Amount: `${fmt(totalOf(i))} USDC`, Status: <Tone tone={st(i).tone}>{st(i).label}</Tone> }));
  const empty = view === 'drafts'
    ? <EmptyState title="No drafts" description="Invoices you start but don’t send are saved here automatically." />
    : <EmptyState title="No invoices yet" description="Create one in under a minute. Customers pay by card, bank transfer or USDC." action={<Button size="s" variant="outlined" tone="secondary" href="#/invoices/new">New invoice</Button>} />;
  return (
    <>
      <Header title="Invoices" actions={subNav} toggles={<ToggleButtonGroup label="View" items={[{ id: 'all', label: 'All' }, { id: 'unpaid', label: 'Unpaid' }, { id: 'paid', label: 'Paid' }, { id: 'drafts', label: 'Drafts' }]} value={view} onChange={setView} />} />
      <div className="lh-section lh-stack">
        {state.invoices.length > 0 && (
          <div className="lh-stat-row">
            <Stat value={fmt(outstanding)}>Outstanding, USDC</Stat>
            <div className="srn-stat"><Meter label="Overdue" value={outstanding ? (overdue / outstanding) * 100 : 0} valueLabel={`${fmt(overdue)} of ${fmt(outstanding)} USDC`} tone="danger" /></div>
          </div>
        )}
        <Table label="Invoices" columns={[{ label: 'Customer', strong: true }, { label: 'Invoice' }, { label: 'Due' }, { label: 'Amount', align: 'end' }, { label: 'Status' }]} rows={rows} onAction={(k) => go(`#/invoices/${k}`)} empty={empty} />
      </div>
    </>
  );
}

let nextNo = 14;
function NewInvoice() {
  const { state, dispatch } = useStore();
  const [step, setStep] = useState('form');
  const [inv, setInv] = useState({ customer: 'Alex Smith', due: 'Nov 7, 2026', account: 'Operating ••4417', items: [['Brand identity', 1, 2400], ['Website design', 1, 3200]] });
  const [errors, setErrors] = useState({});
  const [itemOpen, setItemOpen] = useState(false);
  const [item, setItem] = useState({ d: '', q: 1, p: NaN });
  const [custOpen, setCustOpen] = useState(false);
  const [cust, setCust] = useState({ kind: 'Business', name: '', email: '', country: 'United Kingdom', address: '', tax: '' });
  const [no] = useState(() => `INV-${String(nextNo++).padStart(4, '0')}`);
  const total = totalOf(inv);
  const c = state.customers.find((x) => x.name === inv.customer);
  const check = () => {
    const e = {};
    if (!c) e.customer = 'Choose a customer or add a new one.';
    if (!inv.items.length) e.items = 'Add at least one item';
    setErrors(e); return !e.customer && !e.items;
  };
  const save = (status) => {
    dispatch({ type: 'invoice-save', invoice: { id: status === 'draft' ? `DRAFT-${no}` : no, customer: inv.customer, due: inv.due, dueNote: 'due in 30 days', status, items: inv.items, issued: 'Today', reminders: true, activity: status === 'draft' ? [['Saved as draft', 'Just now']] : [['Sent', 'Just now'], ['Created', 'Just now']] } });
  };

  if (step === 'sent') {
    return (
      <>
        <Header title="Invoice sent" crumbs={[{ label: 'Invoices', href: '#/invoices' }, { label: no }]} />
        <div className="lh-section lh-form">
          <EmptyState size="m" headingLevel={2} icon="check-circle" title="Invoice sent" description={`${inv.customer} will get it by email. We’ll let you know when it’s paid.`} />
          <DescriptionList items={[['Invoice', no], ['Customer', inv.customer], ['Due', inv.due], ['Amount', `${fmt(total)} USDC`]]} />
          <ButtonGroup><Button size="l" variant="outlined" tone="secondary" onPress={() => { try { navigator.clipboard.writeText(`pay.lighthouse.co/${no.toLowerCase()}`); } catch { /* */ } toast('Payment link copied', 'success'); }}>Copy payment link</Button><Button size="l" href={`#/invoices/${no}`}>View invoice</Button></ButtonGroup>
        </div>
      </>
    );
  }
  if (step === 'preview') {
    return (
      <>
        <Header title="Preview" crumbs={[{ label: 'Invoices', href: '#/invoices' }, { label: 'New invoice', href: '#/invoices/new' }, { label: 'Preview' }]} />
        <div className="lh-section lh-form">
          <article className="lh-invoice-paper" aria-labelledby="paper-title">
            <h2 id="paper-title" className="text-subtitle-small">Invoice {no}</h2>
            <DescriptionList items={[['From', 'Studio North Ltd'], ['Billed to', `${inv.customer}${c?.company ? `, ${c.company}` : ''}`], ['Issued', 'Today'], ['Due', inv.due],
              ...inv.items.map(([d, q, p]) => [d, `${q} × ${fmt(p)} = ${fmt(q * p)}`]), ['Subtotal', fmt(total)], ['Total', `${fmt(total)} USDC`], ['Pay online', `pay.lighthouse.co/${no.toLowerCase()}`], ['Pay with', 'Card, bank transfer or USDC']]} />
            <p className="text-body-medium lh-secondary">Thank you for your business.</p>
          </article>
          <ButtonGroup><Button size="l" variant="outlined" tone="secondary" onPress={() => setStep('form')}>Edit</Button><Button size="l" onPress={() => { save('unpaid'); toast(`Invoice sent to ${inv.customer}`, 'success'); setStep('sent'); }}>Send invoice</Button></ButtonGroup>
        </div>
      </>
    );
  }
  const addItem = (e) => { e.preventDefault(); if (!item.d.trim() || !(item.p > 0)) return; setInv({ ...inv, items: [...inv.items, [item.d.trim(), item.q || 1, item.p]] }); setErrors({ ...errors, items: undefined }); setItem({ d: '', q: 1, p: NaN }); setItemOpen(false); };
  const addCustomer = (e) => { e.preventDefault(); if (!cust.name.trim() || !/@/.test(cust.email)) return; dispatch({ type: 'customer-create', customer: { name: cust.name.trim(), email: cust.email.trim(), place: cust.country } }); setInv({ ...inv, customer: cust.name.trim() }); setErrors({ ...errors, customer: undefined }); setCustOpen(false); toast('Customer added', 'success'); };
  return (
    <>
      <Header title="New invoice" crumbs={[{ label: 'Invoices', href: '#/invoices' }, { label: 'New invoice' }]} />
      <Form onSubmit={(e) => { e.preventDefault(); if (check()) setStep('preview'); }} validationBehavior="aria" className="lh-section lh-form">
        <Stat value={fmt(total)} description={`${inv.items.length} item${inv.items.length === 1 ? '' : 's'}`}>Total, USDC</Stat>
        <ComboBox label="Bill to" placeholder="Search customers" items={state.customers.map((x) => ({ id: x.name, label: x.name, description: x.email }))} allowsCustomValue
          selectedKey={c ? c.name : null} defaultInputValue={inv.customer} onSelectionChange={(k) => { if (k) { setInv({ ...inv, customer: k }); setErrors({ ...errors, customer: undefined }); } }}
          onInputChange={(t) => { if (!state.customers.some((x) => x.name === t)) setInv((x) => ({ ...x, customer: t })); }} isInvalid={!!errors.customer} errorMessage={errors.customer} />
        <div><Button size="s" variant="ghost" tone="secondary" onPress={() => setCustOpen(true)}>New customer</Button></div>
        <Select label="Due date" items={['Oct 22, 2026', 'Nov 7, 2026', 'Nov 22, 2026', 'Dec 7, 2026']} selectedKey={inv.due} onSelectionChange={(x) => setInv({ ...inv, due: x })} size="l" />
        <section className="lh-stack lh-stack--tight" aria-labelledby="items-h">
          <h2 id="items-h" className="text-label-medium">Items</h2>
          {inv.items.map(([d, q, p], i) => (
            <Item key={`${d}-${i}`} label={d} description={`${q} × ${fmt(p)}`} value={`${fmt(q * p)} USDC`}
              badge={<Button size="s" variant="ghost" tone="secondary" onPress={() => setInv({ ...inv, items: inv.items.filter((_, j) => j !== i) })} aria-label={`Remove ${d}`}>Remove</Button>} />
          ))}
          {errors.items && <p className="srn-field-error text-body-small" role="alert">{errors.items}</p>}
          <div><Button size="m" variant="outlined" tone="secondary" onPress={() => setItemOpen(true)}>Add item</Button></div>
        </section>
        <Select label="Get paid into" items={['Operating ••4417', 'Reserve ••1794']} selectedKey={inv.account} onSelectionChange={(x) => setInv({ ...inv, account: x })} size="l" />
        <ButtonGroup className="lh-form-actions">
          <Button size="l" variant="outlined" tone="secondary" onPress={() => { save('draft'); toast('Draft saved'); go('#/invoices?view=drafts'); }}>Save draft</Button>
          <Button type="submit" size="l">Preview</Button>
        </ButtonGroup>
      </Form>

      <Modal isOpen={itemOpen} onOpenChange={setItemOpen}>
        <Form onSubmit={addItem}>
          <Dialog title="Add item" footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Cancel</Button><Button type="submit" size="l">Add item</Button></ButtonGroup>}>
            <TextField label="Description" autoFocus value={item.d} onChange={(x) => setItem({ ...item, d: x })} isRequired placeholder="Website design" />
            <NumberField label="Quantity" value={item.q} onChange={(x) => setItem({ ...item, q: x })} minValue={1} />
            <NumberField label="Price" suffix="USDC" value={item.p} onChange={(x) => setItem({ ...item, p: x })} minValue={0} formatOptions={{ minimumFractionDigits: 2 }} isRequired />
          </Dialog>
        </Form>
      </Modal>
      <Modal isOpen={custOpen} onOpenChange={setCustOpen}>
        <Form onSubmit={addCustomer}>
          <Dialog title="New customer" footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Cancel</Button><Button type="submit" size="l">Add customer</Button></ButtonGroup>}>
            <ToggleButtonGroup label="Customer type" items={['Business', 'Individual']} value={cust.kind} onChange={(x) => setCust({ ...cust, kind: x })} />
            <TextField label={cust.kind === 'Business' ? 'Business name' : 'Full name'} autoFocus value={cust.name} onChange={(x) => setCust({ ...cust, name: x })} isRequired />
            <TextField label="Email" type="email" value={cust.email} onChange={(x) => setCust({ ...cust, email: x })} isRequired />
            <Select label="Country" items={['United Kingdom', 'United States', 'Singapore', 'Germany', 'Portugal', 'Poland']} selectedKey={cust.country} onSelectionChange={(x) => setCust({ ...cust, country: x })} />
            <TextField label="Address" optional placeholder="e.g. 10 King Street, London" value={cust.address} onChange={(x) => setCust({ ...cust, address: x })} />
            {cust.kind === 'Business' && <TextField label="Tax ID" optional placeholder="e.g. GB123456789" value={cust.tax} onChange={(x) => setCust({ ...cust, tax: x })} />}
          </Dialog>
        </Form>
      </Modal>
    </>
  );
}

function InvoiceDetail({ id }) {
  const { state, dispatch } = useStore();
  const inv = state.invoices.find((i) => i.id === id);
  const [dialog, setDialog] = useState(null);
  const [paid, setPaid] = useState({ date: 'Today', method: 'Bank transfer', ref: '' });
  const [reason, setReason] = useState('');
  if (!inv) return <div className="lh-section"><EmptyState size="m" headingLevel={1} title="This invoice isn’t here anymore" description="It may have been deleted." action={<Button size="s" variant="outlined" tone="secondary" href="#/invoices">Back to Invoices</Button>} /></div>;
  const s = st(inv); const total = totalOf(inv); const first = inv.customer.split(' ')[0];
  const update = (patch, log, msg) => { dispatch({ type: 'invoice-update', id, patch, log }); if (msg) toast(msg, 'success'); setDialog(null); };
  const draft = inv.status === 'draft';
  const open = inv.status === 'unpaid' || inv.status === 'overdue';
  const sub = { unpaid: inv.dueNote || `due ${inv.due}`, overdue: inv.dueNote, paid: `paid ${inv.paidOn}`, draft: 'not sent', cancelled: `cancelled ${inv.cancelledOn || 'today'}` }[inv.status];
  const more = open && (
    <MenuTrigger>
      <Button size="m" variant="outlined" tone="secondary">More</Button>
      <Popover placement="bottom end" className="srn-popover--menu">
        <Menu aria-label="More actions" onAction={(k) => {
          if (k === 'duplicate') { dispatch({ type: 'invoice-save', invoice: { ...inv, id: `DRAFT-${inv.id}-copy`, status: 'draft', activity: [['Duplicated', 'Just now']] } }); toast('Duplicated as a draft'); go(`#/invoices/DRAFT-${inv.id}-copy`); }
          else if (k === 'reminders') update({ reminders: !inv.reminders }, null, inv.reminders ? 'Reminders off for this invoice' : 'Reminders on for this invoice');
          else setDialog(k);
        }}>
          <MenuItem id="paid">Mark as paid</MenuItem>
          <MenuItem id="duplicate">Duplicate</MenuItem>
          <MenuItem id="reminders">{inv.reminders ? 'Turn off reminders' : 'Turn on reminders'}</MenuItem>
          <MenuItem id="cancel">Cancel invoice</MenuItem>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
  const actions = draft
    ? <><Button size="m" variant="ghost" tone="danger" onPress={() => { dispatch({ type: 'invoice-delete', id }); toast('Draft deleted'); go('#/invoices?view=drafts'); }}>Delete</Button><Button size="m" onPress={() => { const nid = `INV-${String(nextNo++).padStart(4, '0')}`; update({ status: 'unpaid', id: nid, dueNote: 'due in 30 days' }, ['Sent', 'Just now'], `Invoice sent to ${inv.customer}`); go(`#/invoices/${nid}`); }}>Send invoice</Button></>
    : open
      ? <>{more}{inv.status === 'overdue' && <Button size="m" variant="outlined" tone="secondary" onPress={() => setDialog('remind')}>Send reminder</Button>}<Button size="m" onPress={() => setDialog('link')}>Payment link</Button></>
      : <Button size="m" variant="outlined" tone="secondary" onPress={() => { dispatch({ type: 'invoice-save', invoice: { ...inv, id: `DRAFT-${inv.id}-copy`, status: 'draft', activity: [['Duplicated', 'Just now']] } }); go(`#/invoices/DRAFT-${inv.id}-copy`); }}>Duplicate</Button>;
  return (
    <>
      <Header title={draft ? 'Draft' : inv.id} crumbs={[{ label: 'Invoices', href: '#/invoices' }, { label: draft ? 'Draft' : inv.id }]} badges={<Tone tone={s.badge[1]}>{s.badge[0]}</Tone>} actions={actions} />
      <div className="lh-section lh-detail">
        <div className="lh-detail-main lh-stack">
          <Stat size="l" value={fmt(total)} description={`${inv.customer} · ${sub}`}>Amount, USDC</Stat>
          {draft && <Banner tone="neutral" title="Only you can see this">Saved automatically. Send it when it’s ready.</Banner>}
          {open && !inv.reminders && <Banner tone="neutral" title="Reminders are off for this invoice">{inv.customer} won’t get automatic emails. Turn them on from More.</Banner>}
          <section className="lh-stack" aria-labelledby="inv-d"><H2 id="inv-d">Details</H2>
            <DescriptionList items={[['Customer', inv.customer], ...inv.items.map(([d, q, p]) => [d, `${fmt(q * p)} USDC`]), ['Total', `${fmt(total)} USDC`],
              ...(inv.status === 'paid' ? [['Received to', 'Operating ••4417'], ['Paid with', inv.paidWith || 'Card ••1290'], ['Paid on', inv.paidOn]] : [['Due', inv.due]])]} />
          </section>
        </div>
        <section className="lh-detail-side lh-stack" aria-labelledby="inv-a"><H2 id="inv-a">Activity</H2>
          <DescriptionList items={inv.activity.map(([a, b]) => [a, b])} />
        </section>
      </div>

      <Modal isOpen={dialog === 'link'} onOpenChange={(o) => !o && setDialog(null)}>
        <Dialog title="Payment link" isDismissible>
          <div className="lh-qr" role="img" aria-label={`QR code for pay.lighthouse.co/${inv.id.toLowerCase()}`}>{Array.from({ length: 81 }, (_, i) => <span key={i} className={(i * 7 + (i % 9) * 3) % 5 < 2 ? 'on' : ''} />)}</div>
          <TextField label="Link" value={`pay.lighthouse.co/${inv.id.toLowerCase()}`} isReadOnly />
          <ButtonGroup><Button size="l" variant="outlined" tone="secondary" onPress={() => toast('QR saved')}>Save QR</Button><Button size="l" onPress={() => { try { navigator.clipboard.writeText(`pay.lighthouse.co/${inv.id.toLowerCase()}`); } catch { /* */ } toast('Payment link copied', 'success'); }}>Copy link</Button></ButtonGroup>
        </Dialog>
      </Modal>
      <Modal isOpen={dialog === 'paid'} onOpenChange={(o) => !o && setDialog(null)}>
        <Form onSubmit={(e) => { e.preventDefault(); update({ status: 'paid', paidOn: paid.date, paidWith: paid.method }, ['Marked as paid', 'Just now'], 'Marked as paid'); }}>
          <Dialog title="Mark as paid" subtitle={`Use this when ${inv.customer} paid you outside Lighthouse. The payment link will stop working.`}
            footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Cancel</Button><Button type="submit" size="l">Mark as paid</Button></ButtonGroup>}>
            <Select label="Paid on" items={['Today', 'Yesterday', 'Oct 12, 2026']} selectedKey={paid.date} onSelectionChange={(x) => setPaid({ ...paid, date: x })} />
            <Select label="Paid with" items={['Bank transfer', 'Card', 'Cash', 'Other']} selectedKey={paid.method} onSelectionChange={(x) => setPaid({ ...paid, method: x })} />
            <TextField label="Reference" optional placeholder="e.g. Wire ref. 88213" value={paid.ref} onChange={(x) => setPaid({ ...paid, ref: x })} />
          </Dialog>
        </Form>
      </Modal>
      <Modal isOpen={dialog === 'cancel'} onOpenChange={(o) => !o && setDialog(null)}>
        <Dialog title={`Cancel ${inv.id}?`} subtitle={`${inv.customer} won’t be able to pay it and the payment link will stop working. You can’t undo this.`}
          footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Keep invoice</Button><Button size="l" tone="danger" onPress={() => update({ status: 'cancelled', cancelledOn: 'today' }, ['Cancelled', 'Just now'], 'Invoice cancelled')}>Cancel invoice</Button></ButtonGroup>}>
          <TextArea label="Reason" optional value={reason} onChange={setReason} />
        </Dialog>
      </Modal>
      <Modal isOpen={dialog === 'remind'} onOpenChange={(o) => !o && setDialog(null)}>
        <Dialog title="Send a reminder?" subtitle={`${first} will get a polite email with the payment link.`}
          footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Cancel</Button><Button size="l" onPress={() => update({}, ['Reminder sent', 'Just now'], 'Reminder sent')}>Send reminder</Button></ButtonGroup>} />
      </Modal>
    </>
  );
}

function Customers() {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const owes = (name) => state.invoices.filter((i) => i.customer === name && (i.status === 'unpaid' || i.status === 'overdue')).reduce((s, i) => s + totalOf(i), 0);
  const last = (name) => state.invoices.find((i) => i.customer === name);
  const list = state.customers.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(q.toLowerCase()));
  const rows = list.map((c) => { const l = last(c.name); return { id: c.id, Customer: c.name, Email: c.email, Last: l ? l.id : '—', Owes: `${fmt(owes(c.name))} USDC`, Status: l ? <Tone tone={owes(c.name) ? st(l).tone : 'green'}>{owes(c.name) ? st(l).label : 'All paid'}</Tone> : <Tone>New</Tone> }; });
  return (
    <>
      <Header title="Customers" crumbs={[{ label: 'Invoices', href: '#/invoices' }, { label: 'Customers' }]} actions={<Button size="m" href="#/invoices/new">New invoice</Button>} />
      <div className="lh-section lh-stack">
        <TextField label="Search" placeholder="Search by name or email" value={q} onChange={setQ} className="lh-filter-select" />
        <p className="text-body-medium lh-secondary" aria-live="polite">{list.length} customers</p>
        <Table label="Customers" columns={[{ label: 'Customer', strong: true }, { label: 'Email' }, { id: 'Last', label: 'Last invoice' }, { id: 'Owes', label: 'Owes you', align: 'end' }, { label: 'Status' }]} rows={rows} onAction={(k) => go(`#/invoices/customers/${k}`)}
          empty={<EmptyState title={q ? 'No customer matches' : 'No customers yet'} description="Add a customer once and pick them on every new invoice." />} />
      </div>
    </>
  );
}

function Customer({ id }) {
  const { state } = useStore();
  const c = state.customers.find((x) => x.id === id);
  if (!c) return null;
  const list = state.invoices.filter((i) => i.customer === c.name);
  const invoiced = list.filter((i) => i.status !== 'draft' && i.status !== 'cancelled').reduce((s, i) => s + totalOf(i), 0);
  const paid = list.filter((i) => i.status === 'paid').reduce((s, i) => s + totalOf(i), 0);
  return (
    <>
      <Header title={c.name} crumbs={[{ label: 'Invoices', href: '#/invoices' }, { label: 'Customers', href: '#/invoices/customers' }, { label: c.name }]}
        actions={<><Button size="m" variant="outlined" tone="secondary" href={`mailto:${c.email}`}>Email</Button><Button size="m" href="#/invoices/new">New invoice</Button></>} />
      <div className="lh-section lh-detail">
        <div className="lh-detail-main lh-stack">
          <Stat size="l" value={fmt(invoiced - paid)} description={`${c.email} · ${c.place}`}>Owes you, USDC</Stat>
          <section className="lh-stack" aria-labelledby="cs"><H2 id="cs">Summary</H2><DescriptionList items={[['Invoiced', `${fmt(invoiced)} USDC`], ['Paid', `${fmt(paid)} USDC`], ['Owes you', `${fmt(invoiced - paid)} USDC`]]} /></section>
        </div>
        <section className="lh-detail-side lh-stack" aria-labelledby="ci"><H2 id="ci">Invoices</H2>
          {list.map((i) => <Item key={i.id} label={i.id.startsWith('DRAFT') ? 'Draft' : i.id} description={`${st(i).label} · due ${i.due}`} value={`${fmt(totalOf(i))} USDC`} onPress={() => go(`#/invoices/${i.id}`)} />)}
        </section>
      </div>
    </>
  );
}

function Reminders() {
  const [on, setOn] = useState({ all: true, before: true, due: true, after: true, every: true });
  const [preview, setPreview] = useState(false);
  const set = (k) => (v) => { setOn({ ...on, [k]: v }); toast('Changes saved', 'success'); };
  return (
    <>
      <Header title="Reminders" description="We’ll nudge customers by email so you don’t have to chase payments." crumbs={[{ label: 'Invoices', href: '#/invoices' }, { label: 'Reminders' }]} />
      <div className="lh-section lh-form">
        <Switch isSelected={on.all} onChange={set('all')} description="For all unpaid invoices">Automatic reminders</Switch>
        <section className="lh-stack" aria-labelledby="send-r"><H2 id="send-r">Send a reminder</H2>
          <Switch isDisabled={!on.all} isSelected={on.before} onChange={set('before')} description="3 days before due date">Friendly heads-up</Switch>
          <Switch isDisabled={!on.all} isSelected={on.due} onChange={set('due')} description="On the due date">“Your invoice is due today”</Switch>
          <Switch isDisabled={!on.all} isSelected={on.after} onChange={set('after')} description="3 days after due date">Polite follow-up</Switch>
          <Switch isDisabled={!on.all} isSelected={on.every} onChange={set('every')} description="Every 7 days until paid. Stops when the invoice is paid.">Keep reminding</Switch>
        </section>
        <Item label="Preview email" description="Includes the payment link and PDF" onPress={() => setPreview(true)} />
        <p className="text-body-small lh-secondary">You can turn reminders off for a single invoice from its More menu.</p>
      </div>
      <Modal isOpen={preview} onOpenChange={setPreview} width="m">
        <Dialog title="Reminder email" isDismissible>
          <DescriptionList items={[['From', 'Studio North Ltd via Lighthouse'], ['To', 'alex@smithstudio.com']]} />
          <h3 className="text-body-strong-large">INV-0013 is due in 3 days</h3>
          <p className="text-body-medium">Hi Alex, a friendly heads-up that invoice INV-0013 for 5,600.00 USDC from Studio North Ltd is due on Nov 7, 2026. You can pay by card, bank transfer or USDC.</p>
          <Button size="l">Pay 5,600.00 USDC</Button>
          <p className="text-body-small lh-secondary">Invoice PDF attached · Sent 3 days before the due date</p>
        </Dialog>
      </Modal>
    </>
  );
}
