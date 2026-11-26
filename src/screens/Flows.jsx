import React, { useEffect, useRef, useState } from 'react';
import { Form } from 'react-aria-components';
import { Button, ButtonGroup, ButtonIcon } from '../serenity/Button.jsx';
import { TextField, NumberField, TextArea, Select, SelectBoxGroup } from '../serenity/Fields.jsx';
import { Dialog, Modal, toast } from '../serenity/Overlays.jsx';
import { DescriptionList } from '../serenity/Content.jsx';
import { Icon } from '../icons.jsx';
import { useStore, availableOf } from '../data.js';
import { fmt } from '../format.js';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function BigAmount({ value }) {
  return <p className="text-web-display-small num lh-amount">{value} <span className="text-subtitle-small lh-amount-code">USDC</span></p>;
}

// Send money: form → review → sent, in one Modal (width s). The steps change with Navigate/Axis (back plays it backwards);
// a failed submit plays Feedback/Error once on the field and moves focus to it; the sent step is Feedback/Result.
export function SendDialog({ isOpen, onClose, from: fromId = 'operating', initialStep = 'form', initialDraft }) {
  const { state, dispatch } = useStore();
  const [step, setStep] = useState(initialStep);
  const [dir, setDir] = useState('forward');
  const [draft, setDraft] = useState(initialDraft || { to: '', amount: NaN, from: fromId, note: '' });
  const [errors, setErrors] = useState({});
  const [play, setPlay] = useState(0);
  const [pending, setPending] = useState(false);
  const toRef = useRef(null);
  const amountRef = useRef(null);
  const focusRef = useRef(null);
  useEffect(() => { if (play) focusRef.current?.current?.focus(); }, [play]);
  const from = state.accounts.find((a) => a.id === draft.from);
  const go = (s, d = 'forward') => { setDir(d); setStep(s); };

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!draft.to.trim()) errs.to = 'Add who you are paying.';
    if (!(draft.amount > 0)) errs.amount = 'Enter an amount above 0.';
    else if (draft.amount > availableOf(from)) errs.amount = `That is more than the ${fmt(availableOf(from))} USDC available.`;
    setErrors(errs);
    if (errs.to || errs.amount) { focusRef.current = errs.to ? toRef : amountRef; setPlay((n) => n + 1); return; }
    go('review');
  };
  const confirm = () => {
    setPending(true);
    setTimeout(() => {
      const value = Math.round(draft.amount * 100) / 100;
      dispatch({ type: 'send', from: draft.from, to: draft.to.trim(), value, note: draft.note.trim() });
      setPending(false);
      go('done');
      toast(`Sent ${fmt(value)} USDC to ${draft.to.trim()}`, 'success');
    }, reduced() ? 0 : 700);
  };

  let body;
  if (step === 'form') {
    body = (
      <Form onSubmit={submit} validationBehavior="aria" validationErrors={errors}>
        <Dialog title="Send money" subtitle="USDC, arrives in about a minute"
          footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Cancel</Button><Button type="submit" size="l">Review</Button></ButtonGroup>}>
          <TextField key={`to-${play}`} name="to" label="To" placeholder="Name, email or wallet address" autoFocus inputRef={toRef}
            value={draft.to} onChange={(v) => setDraft({ ...draft, to: v })} isInvalid={!!errors.to} errorMessage={errors.to} playError={!!errors.to && play > 0} autoComplete="off" />
          <NumberField key={`amount-${play}`} name="amount" label="Amount" placeholder="0.00" suffix="USDC" inputRef={amountRef}
            formatOptions={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} minValue={0}
            value={draft.amount} onChange={(v) => setDraft({ ...draft, amount: v })} isInvalid={!!errors.amount} errorMessage={errors.amount} playError={!!errors.amount && play > 0} />
          <SelectBoxGroup label="From" value={draft.from} onChange={(v) => setDraft({ ...draft, from: v })}
            options={state.accounts.map((a) => ({ id: a.id, label: a.name, description: `${fmt(availableOf(a))} available` }))} />
          <TextField name="note" label="Note" optional placeholder="What is it for?" value={draft.note} onChange={(v) => setDraft({ ...draft, note: v })} />
        </Dialog>
      </Form>
    );
  } else if (step === 'review') {
    body = (
      <Dialog title="Review payment"
        footer={<ButtonGroup><Button variant="outlined" tone="secondary" size="l" onPress={() => go('form', 'back')} isDisabled={pending}>Back</Button><Button size="l" autoFocus onPress={confirm} isPending={pending} pendingLabel="Sending">{`Send ${fmt(draft.amount)}`}</Button></ButtonGroup>}>
        <div><p className="text-body-small lh-muted">You send</p><BigAmount value={fmt(draft.amount)} /></div>
        <DescriptionList items={[['To', draft.to], ['From', `${from.name} account`], ['Fee', '0.00 USDC'], ['Arrives', 'In about a minute'], draft.note && ['Note', draft.note]]} />
      </Dialog>
    );
  } else {
    body = (
      <Dialog title="Payment sent" footer={<ButtonGroup><Button slot="close" size="l" autoFocus>Done</Button></ButtonGroup>}>
        <div className="lh-result motion-feedback-result">
          <span className="lh-result-mark motion-enter-pop" aria-hidden="true"><Icon name="check-circle" size={24} /></span>
          <p className="text-body-large" data-motion-part="copy">{fmt(draft.amount)} USDC is on its way to <strong className="text-body-strong-large">{draft.to}</strong>.</p>
        </div>
      </Dialog>
    );
  }
  return (
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()} isDismissable={step !== 'review' || !pending}>
      <div key={step} className="motion-navigate-axis lh-step" data-motion-direction={dir === 'back' ? 'back' : undefined}>{body}</div>
    </Modal>
  );
}

// Add money: the deposit details with copy buttons and, for the prototype only, Simulate deposit.
export function AddMoneyDialog({ isOpen, onClose }) {
  const { dispatch } = useStore();
  const [amount, setAmount] = useState(5000);
  const [invalid, setInvalid] = useState(false);
  const address = '0x7a3F 9cE1 4B2d 0e58 A1c6 3F70 d9B4 52aE 81C0 6f3D';
  const copy = (v) => { const done = () => toast('Copied to clipboard'); try { navigator.clipboard.writeText(v).then(done, done); } catch { done(); } };
  const simulate = () => {
    if (!(amount > 0)) { setInvalid(true); return; }
    const value = Math.round(amount * 100) / 100;
    dispatch({ type: 'deposit', value });
    onClose();
    toast(`${fmt(value)} USDC added to Operating`, 'success');
  };
  const CopyRow = ({ label, value }) => (
    <div className="lh-copy-row">
      <div className="lh-copy-text"><p className="text-caption-small lh-muted">{label}</p><p className="text-body-medium num lh-break">{value}</p></div>
      <ButtonIcon size="s" isSquare={false} aria-label={`Copy ${label.toLowerCase()}`} onPress={() => copy(value)}><Icon name="copy" size={20} /></ButtonIcon>
    </div>
  );
  return (
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Dialog title="Add money" subtitle="Deposit USDC to your Operating account"
        footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Close</Button><Button size="l" onPress={simulate}>Simulate deposit</Button></ButtonGroup>}>
        <CopyRow label="Deposit address" value={address} />
        <CopyRow label="Network" value="Ethereum (ERC-20)" />
        <p className="text-body-small lh-muted">Send only USDC on Ethereum to this address. Deposits usually arrive within 5 minutes.</p>
        <NumberField label="Simulate a deposit" suffix="USDC" value={amount} onChange={(v) => { setAmount(v); setInvalid(false); }} isInvalid={invalid}
          errorMessage="Enter an amount above 0." formatOptions={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} minValue={0}
          description="Prototype only: adds the deposit to Home so you can see it land." />
      </Dialog>
    </Modal>
  );
}

// Submit an expense: merchant, amount, category (Select), note (TextArea).
export function ExpenseDialog({ isOpen, onClose }) {
  const { dispatch } = useStore();
  const [v, setV] = useState({ merchant: '', amount: NaN, category: 'Travel', note: '' });
  const [errors, setErrors] = useState({});
  const [play, setPlay] = useState(0);
  const mRef = useRef(null); const aRef = useRef(null); const focusRef = useRef(null);
  useEffect(() => { if (play) focusRef.current?.current?.focus(); }, [play]);
  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!v.merchant.trim()) errs.merchant = 'Add the merchant.';
    if (!(v.amount > 0)) errs.amount = 'Enter an amount above 0.';
    setErrors(errs);
    if (errs.merchant || errs.amount) { focusRef.current = errs.merchant ? mRef : aRef; setPlay((n) => n + 1); return; }
    dispatch({ type: 'expense', merchant: v.merchant.trim(), value: Math.round(v.amount * 100) / 100, category: v.category, note: v.note.trim() });
    onClose();
    toast('Expense submitted for review', 'success');
  };
  return (
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Form onSubmit={submit} validationBehavior="aria">
        <Dialog title="Submit an expense" subtitle="Get paid back for something you bought for Firefly"
          footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Cancel</Button><Button type="submit" size="l">Submit</Button></ButtonGroup>}>
          <TextField key={`m-${play}`} label="Merchant" placeholder="For example, Uber" autoFocus inputRef={mRef} value={v.merchant} onChange={(x) => setV({ ...v, merchant: x })}
            isInvalid={!!errors.merchant} errorMessage={errors.merchant} playError={!!errors.merchant && play > 0} />
          <NumberField key={`a-${play}`} label="Amount" placeholder="0.00" suffix="USDC" inputRef={aRef} value={v.amount} onChange={(x) => setV({ ...v, amount: x })}
            formatOptions={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} minValue={0} isInvalid={!!errors.amount} errorMessage={errors.amount} playError={!!errors.amount && play > 0} />
          <Select label="Category" items={['Travel', 'Meals', 'Software & SaaS', 'Office supplies', 'Other']} selectedKey={v.category} onSelectionChange={(k) => setV({ ...v, category: k })} />
          <TextArea label="Note" optional value={v.note} onChange={(x) => setV({ ...v, note: x })} />
        </Dialog>
      </Form>
    </Modal>
  );
}
