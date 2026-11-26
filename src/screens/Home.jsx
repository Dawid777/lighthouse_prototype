import React from 'react';
import { Button, Link } from '../serenity/Button.jsx';
import { Stat, EmptyState, PageHeader } from '../serenity/Content.jsx';
import { Chart, LinePlot, DonutPlot } from '../serenity/Chart.jsx';
import { GridList, GridListItem } from '../serenity/GridList.jsx';
import { useStore, total } from '../data.js';
import { fmt, signed, compactK, pct } from '../format.js';

// Home (Figma 1.0.a Home): the Operating balance (Stat size l), Send and Add money, the Balance chart, the month's Stats,
// Spending by category; on the right the GridLists of Transactions, Cards and Accounts, then Expenses and Recent recipients.
export function Home({ open }) {
  const { state } = useStore();
  const op = state.accounts.find((a) => a.id === 'operating');
  const t = total(state);
  const { month } = state;
  const openRow = (key) => open({ kind: 'detail', key: String(key) });

  return (
    <>
      <PageHeader>Home</PageHeader>
      <div className="lh-columns">
        <div className="lh-column">
          <div className="lh-section">
            <Stat size="l" id="op-balance" value={fmt(op.balance)} description={`${fmt(op.available)} available · ${fmt(op.inFlight)} in flight`}>Operating account, USDC</Stat>
          </div>
          <div className="lh-actions">
            <Button size="l" onPress={() => open({ kind: 'send' })}>Send</Button>
            <Button size="l" variant="outlined" tone="secondary" onPress={() => open({ kind: 'add-money' })}>Add money</Button>
          </div>
          <div className="lh-section">
            <Chart id="balance" label="Balance" value={`${compactK(op.balance)} USDC`} description="Last 30 days, +10.8%">
              <LinePlot series={state.balanceSeries} min={320000} max={360000} format={(v, full) => (full ? `${compactK(v)} USDC` : `${v / 1000}K`)}
                ariaLabel={`Balance over the last 30 days, from ${compactK(state.balanceSeries[0].value)} to ${compactK(state.balanceSeries.at(-1).value)} USDC`} />
            </Chart>
          </div>
          <section className="lh-section lh-stack" aria-labelledby="month-title">
            <h2 className="text-subtitle-small" id="month-title">{month.label}</h2>
            <div className="lh-stat-row">
              <Stat value={`+${fmt(month.moneyIn)}`}>Money in, USDC</Stat>
              <Stat value={`−${fmt(month.moneyOut)}`} description={`Net ${signed(month.moneyIn - month.moneyOut)}`}>Money spent, USDC</Stat>
            </div>
            <div><Link href="#/money-movement">Money movement</Link></div>
          </section>
          <div className="lh-section">
            <Chart id="spend" label="Spending by category" value={`${compactK(state.spendingTotal)} USDC`} description={month.label}>
              <DonutPlot data={state.spending} total={state.spendingTotal} format={compactK} />
            </Chart>
          </div>
        </div>

        <div className="lh-column">
          <div className="lh-list-block">
            <GridList id="tx" header="Transactions" onAction={(k) => openRow(`tx:${k}`)}>
              {state.transactions.slice(0, 3).map((tx) => <GridListItem key={tx.id} id={tx.id} description={tx.sub} value={`${signed(tx.amount)} USDC`} isNew={tx.isNew}>{tx.name}</GridListItem>)}
            </GridList>
            <div className="lh-list-more"><Link href="#/transactions">All transactions</Link></div>
          </div>
          <div className="lh-list-block">
            <GridList id="cards" header="Cards" onAction={(k) => openRow(`card:${k}`)}>
              {state.cards.slice(0, 2).map((c) => <GridListItem key={c.id} id={c.id} description={`${c.type} · ••${c.last4}${c.frozen ? ' · Frozen' : ''}`} value={`${fmt(c.balance)} USDC`}>{c.name}</GridListItem>)}
            </GridList>
            <div className="lh-list-more"><Link href="#/cards">All cards</Link></div>
          </div>
          <div className="lh-list-block">
            <GridList id="accounts" header={`Accounts · ${fmt(t)} USDC`} onAction={(k) => openRow(`acc:${k}`)}>
              {state.accounts.map((a) => <GridListItem key={a.id} id={a.id} description={`${pct(a.balance, t)} of total`} value={`${fmt(a.balance)} USDC`}>{a.name}</GridListItem>)}
            </GridList>
            <div className="lh-list-more"><Link onPress={() => openRow('acc:operating')}>All accounts</Link></div>
          </div>

          <section className="lh-section lh-stack lh-stack--tight" aria-labelledby="exp-title">
            <h2 className="text-subtitle-small" id="exp-title">Expenses</h2>
            {state.expenses.length ? (
              <>
                <div className="lh-bleed">
                  <GridList id="expenses" onAction={(k) => openRow(`exp:${k}`)}>
                    {state.expenses.map((e) => <GridListItem key={e.id} id={e.id} description={`${e.category} · In review`} value={`${fmt(e.amount)} USDC`} isNew={e.isNew}>{e.merchant}</GridListItem>)}
                  </GridList>
                </div>
                <div><Link onPress={() => open({ kind: 'expense' })}>Submit another expense</Link></div>
              </>
            ) : (
              <EmptyState icon="inbox" title="No expenses in progress" description="Submit an expense to get paid back."
                action={<Button size="s" variant="outlined" tone="secondary" onPress={() => open({ kind: 'expense' })}>Submit an expense</Button>} />
            )}
          </section>

          <section className="lh-section lh-stack lh-stack--tight" aria-labelledby="rec-title">
            <h2 className="text-subtitle-small" id="rec-title">Recent recipients</h2>
            {state.recipients.length ? (
              <div className="lh-bleed">
                <GridList id="recipients" onAction={(k) => openRow(`rec:${k}`)}>
                  {state.recipients.map((r) => <GridListItem key={r.id} id={r.id} description={`Paid ${r.when}`} value={`${fmt(r.amount)} USDC`} isNew={r.isNew}>{r.name}</GridListItem>)}
                </GridList>
              </div>
            ) : (
              <EmptyState icon="users" title="No one paid yet" description="Recipients you pay will show up here." />
            )}
          </section>
        </div>
      </div>
    </>
  );
}

// Every section other than Home: the PageHeader and an EmptyState (size m, a whole page) with the way back.
export function Placeholder({ title }) {
  return (
    <>
      <PageHeader>{title}</PageHeader>
      <div className="lh-section">
        <EmptyState size="m" headingLevel={2} icon="inbox" title={`${title} isn’t designed yet`} description={`There are no ${title} screens in the Figma file yet, so the prototype stops here.`}
          action={<Button size="s" variant="outlined" tone="secondary" href="#/home">Back to Home</Button>} />
      </div>
    </>
  );
}
