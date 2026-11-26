import React, { useEffect, useRef, useState } from 'react';
import { Form } from 'react-aria-components';
import { Button, ButtonGroup, ButtonIcon } from '../serenity/Button.jsx';
import { TextField, NumberField, TextArea, Select, SelectBoxGroup, Checkbox } from '../serenity/Fields.jsx';
import { Banner } from '../serenity/Status.jsx';
import { Disclosure } from '../serenity/Layout.jsx';
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

// Add money (Figma page "👷 Design: Add money", 545:21868): how (1.0) → your sending wallet (1.1, 1.1.a) → network
// (1.2, 1.2.a) → your address (1.3, 1.3.a copied, 1.3.b unavailable), in one Modal. Bank transfer, the arrival time and the
// fee stay placeholders until PT-1; Base and Solana both stay until UXQ-17. The steps change with Navigate/Axis.
const NETWORKS = {
  base: { label: 'Base', description: 'Called Base in most wallets and exchanges', address: '0x7a3F9cE14B2d0e58A1c63F70d9B452aE81C06f3D' },
  solana: { label: 'Solana', description: 'Called Solana or SOL', address: 'F3kq9Vx7Rt2bWm8Lp4Cz6Hn1Jd5Ys9Qa2Ue7Tg3Kw8B' },
  other: { label: 'Another network', description: 'Ethereum, Polygon, Arbitrum and others' },
};
const WALLETS = ['Coinbase', 'Binance', 'Kraken', 'MetaMask', 'Phantom', 'Another wallet or exchange'];
const looksLikeAddress = (v) => /^0x[0-9a-fA-F]{40}$/.test(v.trim()) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v.trim());

export function AddMoneyDialog({ isOpen, onClose, initialStep = 'method', preset = {} }) {
  const { state } = useStore();
  const [step, setStep] = useState(initialStep);
  const [dir, setDir] = useState('forward');
  const [method, setMethod] = useState(preset.method ?? null);
  const [wallet, setWallet] = useState({ address: preset.address ?? '', name: preset.wallet ?? null });
  const [blocked, setBlocked] = useState(!!preset.blocked);
  const [network, setNetwork] = useState(preset.network ?? 'base');
  const [confirmed, setConfirmed] = useState(preset.confirmed ?? false);
  const [unavailable, setUnavailable] = useState(!!preset.unavailable);
  const [errors, setErrors] = useState({});
  const [play, setPlay] = useState(0);
  const [pending, setPending] = useState(false);
  const addrRef = useRef(null);
  useEffect(() => { if (play) addrRef.current?.focus(); }, [play]);
  const go = (s, d = 'forward') => { setDir(d); setErrors({}); setStep(s); };
  const bank = () => { onClose(); toast('Bank transfer is the next screen in the prototype'); };
  const net = NETWORKS[network];
  const available = state.accounts.find((a) => a.id === 'operating').available;
  const copy = () => { const done = () => toast(`${net.label} address copied`, 'success'); try { navigator.clipboard.writeText(net.address).then(done, done); } catch { done(); } };
  const secondary = (label, onPress, extra = {}) => <Button variant="outlined" tone="secondary" size="l" onPress={onPress} {...extra}>{label}</Button>;

  let body;
  if (step === 'method') {
    const submit = (e) => { e.preventDefault(); if (!method) { setErrors({ method: 'Choose how to add money.' }); return; } if (method === 'bank') bank(); else go('wallet'); };
    body = (
      <Form onSubmit={submit} validationBehavior="aria">
        <Dialog title="Add money" subtitle={`Available now: ${fmt(available)} USDC`}
          footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Cancel</Button><Button type="submit" size="l">Continue</Button></ButtonGroup>}>
          <SelectBoxGroup aria-label="How to add money" orientation="vertical" value={method} onChange={(v) => { setMethod(v); setErrors({}); }}
            isInvalid={!!errors.method} errorMessage={errors.method}
            options={[
              { id: 'bank', label: 'Bank transfer', description: '1–2 business days · Fee shown before you confirm', icon: 'bank' },
              { id: 'wallet', label: 'USDC from a wallet', description: 'Within an hour · No Lighthouse fee', icon: 'wallet' },
            ]} />
        </Dialog>
      </Form>
    );
  } else if (step === 'wallet') {
    const submit = (e) => {
      e.preventDefault();
      const errs = {};
      if (!wallet.address.trim()) errs.address = 'Enter the wallet address.';
      else if (!looksLikeAddress(wallet.address)) errs.address = 'Check the address: it starts with 0x, or it is a Solana address.';
      if (!wallet.name) errs.name = 'Choose your wallet or exchange.';
      setErrors(errs);
      if (errs.address || errs.name) { setPlay((n) => n + 1); return; }
      setPending(true);
      setTimeout(() => { setPending(false); if (/dead/i.test(wallet.address)) setBlocked(true); else go('network'); }, reduced() ? 0 : 700);
    };
    body = (
      <Form onSubmit={submit} validationBehavior="aria">
        <Dialog title="Your sending wallet" isDismissible subtitle={blocked ? undefined : 'Tell us where the USDC will come from. We check the wallet before we show your address.'}
          footer={blocked
            ? <ButtonGroup>{secondary('Use another wallet', () => { setBlocked(false); setWallet({ address: '', name: wallet.name }); setPlay((n) => n + 1); })}<Button size="l" onPress={bank}>Use a bank transfer</Button></ButtonGroup>
            : <ButtonGroup>{secondary('Back', () => go('method', 'back'), { isDisabled: pending })}<Button type="submit" size="l" isPending={pending} pendingLabel="Checking the wallet">Continue</Button></ButtonGroup>}>
          <TextField key={`a-${play}`} label="Wallet address" placeholder="0x… or a Solana address" autoFocus inputRef={addrRef} autoComplete="off" inputClassName="text-code-medium"
            value={wallet.address} onChange={(v) => { setWallet({ ...wallet, address: v }); setBlocked(false); setErrors({}); }} isReadOnly={pending}
            isInvalid={!!errors.address} errorMessage={errors.address} playError={!!errors.address && play > 0} />
          <Select label="Wallet or exchange" items={WALLETS} selectedKey={wallet.name} onSelectionChange={(k) => { setWallet({ ...wallet, name: k }); setErrors({}); }}
            isInvalid={!!errors.name} errorMessage={errors.name} />
          {blocked && <Banner tone="neutral" title="This wallet can’t be used to add money">Try another wallet, or add money by bank transfer.</Banner>}
        </Dialog>
      </Form>
    );
  } else if (step === 'network') {
    const other = network === 'other';
    const submit = (e) => { e.preventDefault(); if (other) { bank(); return; } if (!confirmed) { setErrors({ confirm: 'Confirm the network to continue.' }); return; } go('address'); };
    body = (
      <Form onSubmit={submit} validationBehavior="aria">
        <Dialog title="Which network will your wallet send on?" isDismissible subtitle="Pick the network your wallet or exchange shows when you send USDC."
          footer={<ButtonGroup>{secondary('Back', () => go('wallet', 'back'))}<Button type="submit" size="l">{other ? 'Use a bank transfer' : 'Show address'}</Button></ButtonGroup>}>
          <SelectBoxGroup aria-label="Network" orientation="vertical" value={network} onChange={(v) => { setNetwork(v); setConfirmed(false); setErrors({}); }}
            options={Object.entries(NETWORKS).map(([id, n]) => ({ id, label: n.label, description: n.description }))} />
          {other
            ? <Banner tone="neutral" title="Lighthouse can’t receive USDC on other networks">Switch your wallet to Base or Solana, or add money by bank transfer.</Banner>
            : (
              <>
                <Disclosure title="Where do I find the network in my wallet?">
                  In your wallet or exchange, choose Send or Withdraw, pick USDC, then look for Network. Choose the same one here.
                </Disclosure>
                <div className="srn-field">
                  <Checkbox isSelected={confirmed} onChange={(v) => { setConfirmed(v); setErrors({}); }} isInvalid={!!errors.confirm}>{`My wallet will send USDC on ${net.label}`}</Checkbox>
                  {errors.confirm && <p className="srn-field-error text-body-small" role="alert">{errors.confirm}</p>}
                </div>
              </>
            )}
        </Dialog>
      </Form>
    );
  } else {
    body = unavailable ? (
      <Dialog title={`Your ${net.label} address`}
        footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Close</Button><Button size="l" onPress={() => setUnavailable(false)}>Try again</Button></ButtonGroup>}>
        <Banner tone="danger" title="We can’t show your address right now">Try again in a few minutes, or add money by bank transfer.</Banner>
      </Dialog>
    ) : (
      <Dialog title={`Your ${net.label} address`} subtitle="Copy the whole address and paste it into your wallet."
        footer={<ButtonGroup>{secondary('Change network', () => go('network', 'back'))}<Button slot="close" size="l">Done</Button></ButtonGroup>}>
        <TextArea label={`${net.label} deposit address`} value={net.address} isReadOnly rows={2} inputClassName="text-code-medium lh-break" />
        <Button variant="outlined" tone="secondary" size="m" onPress={copy} leading={<Icon name="copy" size={20} />}>Copy address</Button>
        <DescriptionList items={[['Network', net.label], ['Token', 'USDC only'], ['Minimum', '5.00 USDC'], ['Arrives', 'Within an hour of sending']]} />
        <Banner tone="warning" title={`Send only USDC on ${net.label}`}>USDC sent on another network, or any other token, usually can’t be recovered.</Banner>
      </Dialog>
    );
  }
  return (
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()} isDismissable={!pending}>
      <div key={step} className="motion-navigate-axis lh-step" data-motion-direction={dir === 'back' ? 'back' : undefined}>{body}</div>
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
