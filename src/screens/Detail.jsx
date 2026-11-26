import React from 'react';
import { Dialog as AriaDialog, Heading, Text } from 'react-aria-components';
import { Button, ButtonGroup, ButtonIcon } from '../serenity/Button.jsx';
import { Sheet, Modal, toast } from '../serenity/Overlays.jsx';
import { Badge, DescriptionList, Value } from '../serenity/Content.jsx';
import { Icon } from '../icons.jsx';
import { useStore, total } from '../data.js';
import { fmt, signed, pct } from '../format.js';

// The detail of a row on Home: a Sheet from the end edge on desktop (Dialog in the Sheet, isDismissible), a centred Modal
// below 1024 (SR-276: a web app never uses a bottom Sheet). The record's amount, its properties (DescriptionList, striped)
// and its actions.
export function DetailPanel({ detail, isOpen, onClose, onAction, isCompact }) {
  const { state, dispatch } = useStore();
  if (!detail) return null;
  const [kind, id] = detail.split(':');
  let title, sub, amount, rows = [], actions;

  if (kind === 'tx') {
    const tx = state.transactions.find((t) => t.id === id); if (!tx) return null;
    title = tx.name; sub = tx.sub; amount = signed(tx.amount);
    rows = [['Status', <Badge key="b">{tx.status}</Badge>], ['Date', tx.date], ['Method', tx.method], ['Category', tx.category], ['Account', 'Operating']];
    actions = (close) => <><Button variant="outlined" tone="secondary" size="l" onPress={() => toast('Receipt downloads in the product.')}>Receipt</Button><Button size="l" href="#/transactions" onPress={close}>Open in Transactions</Button></>;
  } else if (kind === 'card') {
    const c = state.cards.find((x) => x.id === id); if (!c) return null;
    title = c.name; sub = `${c.type} card · ••${c.last4}`; amount = fmt(c.balance);
    rows = [['Status', <Badge key="b">{c.frozen ? 'Frozen' : 'Active'}</Badge>], ['Cardholder', c.holder], ['Number', `•••• •••• •••• ${c.last4}`], ['Spent this month', `${fmt(c.spent)} USDC`]];
    actions = () => <><Button variant="outlined" tone="secondary" size="l" onPress={() => { dispatch({ type: 'toggle-freeze', id: c.id }); toast(`${c.name} ${c.frozen ? 'unfrozen' : 'frozen'}`); }}>{c.frozen ? 'Unfreeze card' : 'Freeze card'}</Button><Button size="l" href="#/cards">Open in Cards</Button></>;
  } else if (kind === 'acc') {
    const a = state.accounts.find((x) => x.id === id); if (!a) return null;
    title = `${a.name} account`; sub = `${pct(a.balance, total(state))} of total`; amount = fmt(a.balance);
    rows = a.id === 'operating'
      ? [['Available', `${fmt(a.available)} USDC`], ['In flight', `${fmt(a.inFlight)} USDC`]]
      : [['Available', `${fmt(a.balance)} USDC`]];
    rows.push(['Currency', 'USDC'], ['Total across accounts', `${fmt(total(state))} USDC`]);
    actions = () => <><Button variant="outlined" tone="secondary" size="l" onPress={() => onAction({ kind: 'add-money' })}>Add money</Button><Button size="l" onPress={() => onAction({ kind: 'send', from: a.id })}>Send</Button></>;
  } else if (kind === 'exp') {
    const ex = state.expenses.find((x) => x.id === id); if (!ex) return null;
    title = ex.merchant; sub = ex.category; amount = fmt(ex.amount);
    rows = [['Status', <Badge key="b">In review</Badge>], ['Submitted', 'Just now'], ['Paid back to', 'Dawid'], ex.note && ['Note', ex.note]];
    actions = (close) => <Button variant="outlined" tone="secondary" size="l" onPress={close}>Close</Button>;
  } else if (kind === 'rec') {
    const r = state.recipients.find((x) => x.id === id); if (!r) return null;
    title = r.name; sub = `Paid ${r.when}`;
    rows = [['Last payment', `${fmt(r.amount)} USDC`], ['Payments', '1']];
    actions = () => <Button size="l" onPress={() => onAction({ kind: 'send' })}>Pay again</Button>;
  }

  const content = (
    <AriaDialog className="srn-dialog srn-dialog--panel" aria-labelledby="detail-title">
      {({ close }) => (
        <>
          <div className="srn-dialog-head">
            <div className="srn-dialog-titles">
              <Heading slot="title" id="detail-title" className="text-subtitle-small srn-dialog-title">{title}</Heading>
              <Text className="text-body-medium srn-dialog-subtitle">{sub}</Text>
            </div>
            <ButtonIcon slot="close" size="s" isSquare={false} aria-label="Close"><Icon name="close" size={20} /></ButtonIcon>
          </div>
          <div className="srn-dialog-body">
            {amount && <p className="text-web-display-small num"><Value>{amount}</Value> <span className="text-subtitle-small lh-amount-code">USDC</span></p>}
            <DescriptionList items={rows} />
          </div>
          <div className="srn-dialog-foot"><ButtonGroup>{actions(close)}</ButtonGroup></div>
        </>
      )}
    </AriaDialog>
  );

  const onOpenChange = (o) => { if (!o) onClose(); };
  return isCompact
    ? <Modal isOpen={isOpen} onOpenChange={onOpenChange}>{content}</Modal>
    : <Sheet position="end" isOpen={isOpen} onOpenChange={onOpenChange}>{content}</Sheet>;
}
