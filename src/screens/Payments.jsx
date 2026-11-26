import React, { useState } from 'react';
import { FileTrigger } from 'react-aria-components';
import { Button } from '../serenity/Button.jsx';
import { toast } from '../serenity/Overlays.jsx';
import { Stat, EmptyState } from '../serenity/Content.jsx';
import { Meter } from '../serenity/Status.jsx';
import { Chart, LinePlot } from '../serenity/Chart.jsx';
import { GridList, GridListItem } from '../serenity/GridList.jsx';
import { Header, Table, Tone, ToggleButtonGroup, H2 } from '../serenity/Data.jsx';
import { useStore } from '../data.js';
import { moneyMovement } from '../seed.js';
import { fmt, signed, compactK } from '../format.js';

const go = (h) => { location.hash = h; };

// Payments (Figma 51:5678): the bills Inbox with Needs approval, Scheduled and Paid views, the overdue Meter and Upload bill.
export function Payments() {
  const { state } = useStore();
  const [view, setView] = useState('inbox');
  const bills = state.bills.filter((b) => b.group === view);
  const toPay = state.bills.filter((b) => b.group !== 'paid' && b.status !== 'Draft').reduce((s, b) => s + b.amount, 0);
  const overdue = state.bills.filter((b) => /late/.test(b.status)).reduce((s, b) => s + b.amount, 0);
  const rows = bills.map((b) => ({ id: b.id, Vendor: b.vendor, Invoice: b.invoice, Due: b.due, Amount: `${fmt(b.amount)} USDC`, Status: <Tone tone={b.tone}>{b.status}</Tone> }));
  const empty = { approval: 'Nothing needs approval', scheduled: 'Nothing scheduled', paid: 'No bills paid yet', inbox: 'Nothing to pay' }[view];
  return (
    <>
      <Header title="Payments" actions={<FileTrigger onSelect={(f) => f && f[0] && toast(`${f[0].name} added to the Inbox`, 'success')}><Button size="m" variant="outlined" tone="secondary">Upload bill</Button></FileTrigger>}
        toggles={<ToggleButtonGroup label="View" items={[{ id: 'inbox', label: 'Inbox' }, { id: 'approval', label: 'Needs approval' }, { id: 'scheduled', label: 'Scheduled' }, { id: 'paid', label: 'Paid' }]} value={view} onChange={setView} />} />
      <div className="lh-section lh-stack">
        <div className="lh-stat-row">
          <Stat value={fmt(toPay)}>To pay, USDC</Stat>
          <div className="srn-stat"><Meter label="Overdue" value={(overdue / toPay) * 100} valueLabel={`${fmt(overdue)} of ${fmt(toPay)} USDC`} tone="danger" /><p className="text-web-label-small srn-stat-desc">Oldest 21 days late</p></div>
          <Stat value="15,980.00" description="2 bills, by Sep 5">Due this week, USDC</Stat>
        </div>
        <Table label={`Bills: ${view}`} columns={[{ label: 'Vendor', strong: true }, { label: 'Invoice' }, { label: 'Due' }, { label: 'Amount', align: 'end' }, { label: 'Status' }]} rows={rows}
          onAction={(k) => { const b = state.bills.find((x) => x.id === k); if (b.group === 'approval') go('#/tasks/k1'); else toast(`${b.vendor}: bill details open here in the product`); }}
          empty={<EmptyState title={empty} description="Bills you upload or forward to bills@firefly.lighthouse.co land here." />} />
      </div>
    </>
  );
}

// Money movement (Figma 84:7472): Money in · Money spent for the month, the month chart and the list, and the empty month.
export function MoneyMovement({ parts = [] }) {
  const [view, setView] = useState(parts[0] === 'spent' ? 'spent' : 'in');
  const [month, setMonth] = useState('October 2026');
  const d = moneyMovement[view];
  const empty = month === 'November 2026' && view === 'in';
  const total = empty ? 0 : d.total;
  return (
    <>
      <Header title="Money movement" toggles={<ToggleButtonGroup label="Direction" items={[{ id: 'in', label: 'Money in' }, { id: 'spent', label: 'Money spent' }]} value={view} onChange={setView} />}
        actions={<ToggleButtonGroup label="Month" items={['October 2026', 'November 2026']} value={month} onChange={setMonth} />} />
      <div className="lh-section lh-stack">
        <h2 className="text-subtitle-small">{month}</h2>
        <Stat value={`${view === 'in' ? '' : '−'}${fmt(total)}`} description={`Last 3 month average: ${view === 'in' ? '' : '−'}${fmt(d.avg)}`}>{view === 'in' ? 'Money in, USDC' : 'Money spent, USDC'}</Stat>
        <Chart id={`mm-${view}`} label={view === 'in' ? 'Money in by month' : 'Money spent by month'} value={`${compactK(total)} USDC`} description={empty ? 'Oct – Nov 2026' : 'Sep – Oct 2026'}>
          <LinePlot series={empty ? [{ label: 'Oct', value: d.series[1].value }, { label: 'Nov', value: 0 }] : d.series} min={0} max={Math.max(...d.series.map((s) => s.value)) * 1.2}
            format={(v, full) => (full ? `${compactK(v)} USDC` : `${Math.round(v / 1000)}K`)} ariaLabel={`${view === 'in' ? 'Money in' : 'Money spent'} by month`} />
        </Chart>
        {empty
          ? <EmptyState title="Nothing came in this month" description="Deposits and incoming payments will show up here." />
          : (
            <GridList id={`mm-list-${view}`} header="Transactions" onAction={() => go('#/transactions')}>
              {d.items.map(([n, t, a]) => <GridListItem key={n} id={n} description={t} value={`${signed(a)} USDC`}>{n}</GridListItem>)}
            </GridList>
          )}
      </div>
    </>
  );
}

// Move money (Figma 84:7474): Transfer, Deposit and Request, the payments to act on and the open requests.
export function MoveMoney({ open }) {
  const { state } = useStore();
  const inbox = state.bills.filter((b) => b.group === 'inbox' && b.status !== 'Draft');
  const approval = state.tasks.filter((t) => t.status === 'Needs approval');
  const scheduled = state.bills.filter((b) => b.group === 'scheduled');
  const requests = state.invoices.filter((i) => i.status === 'unpaid' || i.status === 'overdue');
  return (
    <>
      <Header title="Move money" actions={<>
        <Button size="m" variant="outlined" tone="secondary" onPress={() => open({ kind: 'transfer' })}>Transfer</Button>
        <Button size="m" variant="outlined" tone="secondary" onPress={() => open({ kind: 'add-money' })}>Deposit</Button>
        <Button size="m" variant="outlined" tone="secondary" onPress={() => go('#/invoices/new')}>Request</Button>
      </>} />
      <div className="lh-section lh-columns">
        <div className="lh-column">
          <GridList id="mm-payments" header="Payments" onAction={(k) => go(k === 'approval' ? '#/tasks' : '#/payments')}>
            <GridListItem id="inbox" description={inbox.length ? `${inbox.length} bills` : 'Nothing to pay'} value={`${fmt(inbox.reduce((s, b) => s + b.amount, 0))} USDC`}>Inbox</GridListItem>
            <GridListItem id="approval" description={approval.length ? `${approval.length} payments` : 'No payments waiting'} value={`${fmt(approval.reduce((s, t) => s + (t.amount || 0), 0))} USDC`}>Needs approval</GridListItem>
            <GridListItem id="scheduled" description={scheduled.length ? `${scheduled.length} payments` : 'Nothing scheduled'} value={`${fmt(scheduled.reduce((s, b) => s + b.amount, 0))} USDC`}>Scheduled</GridListItem>
          </GridList>
        </div>
        <div className="lh-column">
          {requests.length ? (
            <GridList id="mm-requests" header="Requests" onAction={(k) => go(`#/invoices/${k}`)}>
              {requests.map((i) => <GridListItem key={i.id} id={i.id} description={`${i.status === 'overdue' ? 'Overdue' : 'Due'} ${i.due}`} value={`${fmt(i.items.reduce((s, [, q, p]) => s + q * p, 0))} USDC`}>{i.customer}</GridListItem>)}
            </GridList>
          ) : (
            <section className="lh-stack" aria-labelledby="req"><H2 id="req">Requests</H2><EmptyState title="No open requests" description="Ask a customer to pay and it will show up here." /></section>
          )}
        </div>
      </div>
    </>
  );
}
