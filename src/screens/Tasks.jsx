import React, { useState } from 'react';
import { Form } from 'react-aria-components';
import { Button, ButtonGroup } from '../serenity/Button.jsx';
import { TextField, Select } from '../serenity/Fields.jsx';
import { Dialog, Modal, toast } from '../serenity/Overlays.jsx';
import { Stat, DescriptionList, EmptyState, Avatar } from '../serenity/Content.jsx';
import { Header, Table, Tone, ToggleButtonGroup, Switch, H2, Item } from '../serenity/Data.jsx';
import { useStore } from '../data.js';
import { fmt } from '../format.js';

const go = (h) => { location.hash = h; };

// Tasks (Figma 63:5057): 1.0 Incomplete · Completed with approve and decline, 1.0.d all caught up, 1.1 payment request
// (approve, decline with a reason). Routes: #/tasks, #/tasks/<id>.
export function Tasks({ parts = [] }) {
  if (parts[0]) return <TaskDetail id={parts[0]} />;
  return <TaskList />;
}

function TaskList() {
  const { state } = useStore();
  const [view, setView] = useState('open');
  const open = view === 'open';
  const rows = open
    ? state.tasks.map((t) => ({ id: t.id, Task: t.title, Type: t.type, By: t.by, Amount: t.amount == null ? '—' : `${fmt(t.amount)} USDC`, Status: <Tone tone={t.tone}>{t.status}</Tone> }))
    : state.completedTasks.map((t) => ({ id: t.id, Task: t.title, Type: t.result, By: t.date, Amount: t.amount == null ? '—' : `${fmt(t.amount)} USDC`, Status: <Tone tone={t.tone}>{t.status}</Tone> }));
  const caption = open ? (state.tasks.length ? `${state.tasks.length} open` : 'No open tasks') : `${state.completedTasks.length} completed this month`;
  return (
    <>
      <Header title="Tasks" caption={caption} toggles={<ToggleButtonGroup label="View" items={[{ id: 'open', label: 'Incomplete' }, { id: 'done', label: 'Completed' }]} value={view} onChange={setView} />} />
      <div className="lh-section">
        <Table label={open ? 'Open tasks' : 'Completed tasks'} rows={rows} onAction={open ? (k) => go(`#/tasks/${k}`) : undefined}
          columns={[{ label: 'Task', strong: true }, { id: 'Type', label: open ? 'Type' : 'Result' }, { id: 'By', label: open ? 'Requested by' : 'Date' }, { label: 'Amount', align: 'end' }, { label: 'Status' }]}
          empty={<EmptyState icon="check-circle" title="You’re all caught up" description="New approvals and reviews will show up here." />} />
      </div>
    </>
  );
}

function TaskDetail({ id }) {
  const { state, dispatch } = useStore();
  const t = state.tasks.find((x) => x.id === id);
  const [decline, setDecline] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [pending, setPending] = useState(false);
  if (!t) return <div className="lh-section"><EmptyState size="m" headingLevel={1} icon="check-circle" title="This task is done" description="Someone approved or declined it." action={<Button size="s" variant="outlined" tone="secondary" href="#/tasks">Back to Tasks</Button>} /></div>;
  const approve = () => { setPending(true); setTimeout(() => { dispatch({ type: 'task-resolve', id, result: 'Approved by you', status: 'Approved', tone: 'green' }); toast(`${t.title} approved`, 'success'); go('#/tasks'); }, 600); };
  const doDecline = (e) => { e.preventDefault(); if (!reason.trim()) { setErr('Say why, so the requester can fix it.'); return; } dispatch({ type: 'task-resolve', id, result: `Declined: ${reason.trim()}`, status: 'Declined', tone: 'red' }); toast(`${t.title} declined`); go('#/tasks'); };
  const isPayment = t.request || /Payment|transfer|monthly/i.test(t.type);
  return (
    <>
      <Header title={isPayment ? 'Payment request' : t.type} crumbs={[{ label: 'Tasks', href: '#/tasks' }, { label: t.title }]} badges={<Tone tone={t.request ? 'amber' : t.tone}>{t.request ? 'Expires in 6 hours' : t.status}</Tone>}
        actions={<><Button size="m" variant="outlined" tone="secondary" onPress={() => setDecline(true)} isDisabled={pending}>Decline</Button><Button size="m" onPress={approve} isPending={pending} pendingLabel="Approving">{t.status === 'Needs review' ? 'Mark as reviewed' : 'Approve'}</Button></>} />
      <div className="lh-section lh-detail">
        <div className="lh-detail-main lh-stack">
          {t.amount != null && <Stat size="l" value={fmt(t.amount)} description={`Requested by ${t.request ? 'Kristin Watson · Sep 2' : t.by}`}>Amount, USDC</Stat>}
          <section className="lh-stack" aria-labelledby="td"><H2 id="td">Details</H2>
            <DescriptionList items={t.request
              ? [['From', 'Operating account'], ['Balance', `${fmt(state.accounts[0].balance)} USDC`], ['To', 'Meridian Health Supplies'], ['Invoice', '#MH-2291']]
              : [['Task', t.title], ['Type', t.type], ['Requested by', t.by], ['Status', t.status]]} />
          </section>
        </div>
      </div>
      <Modal isOpen={decline} onOpenChange={setDecline}>
        <Form onSubmit={doDecline} validationBehavior="aria">
          <Dialog title={isPayment ? 'Decline this payment?' : 'Decline this request?'} subtitle="The requester gets your reason."
            footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Cancel</Button><Button type="submit" size="l" tone="danger">Decline</Button></ButtonGroup>}>
            <TextField label="Reason" autoFocus placeholder="Duplicate invoice" value={reason} onChange={(x) => { setReason(x); setErr(''); }} isInvalid={!!err} errorMessage={err} />
          </Dialog>
        </Form>
      </Modal>
    </>
  );
}

// Settings (Figma 66:5057): Account, Preferences (the theme here switches the app), Privacy and data; changes save as
// they happen with a Toast. Routes: #/settings, #/settings/preferences, #/settings/privacy.
export function Settings({ parts = [], theme, onTheme }) {
  const { state, dispatch } = useStore();
  const tab = parts[0] || 'account';
  const s = state.settings;
  const [deactivate, setDeactivate] = useState(false);
  const save = (patch) => { dispatch({ type: 'settings', patch }); toast('Changes saved', 'success'); };
  const nav = (
    <nav aria-label="Settings" className="lh-subnav">
      {[['account', 'Account'], ['preferences', 'Preferences'], ['privacy', 'Privacy and data']].map(([k, l]) => (
        <a key={k} href={`#/settings${k === 'account' ? '' : `/${k}`}`} aria-current={tab === k ? 'page' : undefined} className={`lh-subnav-item text-body-medium${tab === k ? ' is-current' : ''}`}>{l}</a>
      ))}
    </nav>
  );
  let body;
  if (tab === 'preferences') {
    body = (
      <>
        <Header title="Preferences" description="Changes save automatically." />
        <div className="lh-form">
          <div className="srn-field"><span className="text-label-medium">Theme</span>
            <ToggleButtonGroup label="Theme" items={[{ id: 'system', label: 'Auto' }, { id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }]} value={theme} onChange={(t) => { onTheme(t); toast('Changes saved', 'success'); }} /></div>
          <Select label="Language" size="l" items={['English', 'Polski', 'Deutsch', 'Español']} selectedKey={s.language} onSelectionChange={(x) => save({ language: x })} />
          <Select label="Time zone" size="l" placeholder="Select a time zone" items={['Europe/Warsaw (UTC+01:00)', 'Europe/London (UTC+00:00)', 'Asia/Singapore (UTC+08:00)', 'America/New_York (UTC−05:00)']} selectedKey={s.timeZone} onSelectionChange={(x) => save({ timeZone: x })} />
          <Switch isSelected={s.newsletter} onChange={(x) => save({ newsletter: x })} description="Receive a personalized email digest">Newsletter</Switch>
        </div>
      </>
    );
  } else if (tab === 'privacy') {
    body = (
      <>
        <Header title="Privacy and data" description="Changes save automatically." />
        <div className="lh-form">
          <H2>Cookie preferences</H2>
          <Switch isSelected isDisabled description="Always on: Lighthouse needs them to work">Essential cookies</Switch>
          <Switch isSelected={s.analytics} onChange={(x) => save({ analytics: x })} description="Show us which pages people use">Analytics cookies</Switch>
          <Switch isSelected={s.marketing} onChange={(x) => save({ marketing: x })} description="Let partners show you relevant ads">Marketing cookies</Switch>
          <p className="text-body-small lh-secondary">Lighthouse and its partners use cookies to provide a better, safer and faster service.</p>
          <H2>Your data</H2>
          <Item label="Export your data" description="Request an archive of your data" onPress={() => toast('We’ll email you a link within 24 hours')} />
          <div><Button size="l" variant="ghost" tone="danger" onPress={() => setDeactivate(true)}>Deactivate account…</Button></div>
        </div>
        <Modal isOpen={deactivate} onOpenChange={setDeactivate}>
          <Dialog title="Deactivate your account?" subtitle="You’ll lose access to Lighthouse right away. Your company’s data stays with Firefly LLC."
            footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Keep account</Button><Button size="l" tone="danger" onPress={() => { setDeactivate(false); toast('Deactivation is turned off in the prototype'); }}>Deactivate</Button></ButtonGroup>} />
        </Modal>
      </>
    );
  } else {
    body = (
      <>
        <Header title="Account" />
        <div className="lh-form">
          <div className="lh-row-start"><Avatar src="./assets/avatar.jpg" size="l" alt="" /><Button size="m" variant="outlined" tone="secondary" onPress={() => toast('Photo picker opens here')}>Change photo</Button></div>
          <TextField label="Email" size="l" value={s.email} isReadOnly description="Change it from Security below" />
          <div className="lh-field-row">
            <TextField label="First name" size="l" defaultValue={s.first} onBlur={(e) => e.target.value !== s.first && save({ first: e.target.value })} />
            <TextField label="Last name" size="l" defaultValue={s.last} onBlur={(e) => e.target.value !== s.last && save({ last: e.target.value })} />
          </div>
          <TextField label="Job title" size="l" defaultValue={s.title} onBlur={(e) => e.target.value !== s.title && save({ title: e.target.value })} />
          <Select label="Country" size="l" placeholder="Select a country" items={['Poland', 'Singapore', 'United Kingdom', 'United States']} selectedKey={s.country} onSelectionChange={(x) => save({ country: x })} />
          <TextField label="Phone" size="l" type="tel" defaultValue={s.phone} onBlur={(e) => e.target.value !== s.phone && save({ phone: e.target.value })} />
          <TextField label="LinkedIn" optional size="l" placeholder="linkedin.com/in/your-name" />
          <TextField label="X" optional size="l" placeholder="x.com/your-name" />
          <H2>Security</H2>
          <Item label="Password" description="Change or reset your password" onPress={() => toast('Password change opens in a Dialog in the product')} />
          <Item label="Two-factor authentication" description="Codes from an authenticator app" value="Off" onPress={() => toast('Two-factor setup opens in a Dialog in the product')} />
        </div>
      </>
    );
  }
  return <div className="lh-settings">{nav}<div className="lh-settings-body">{body}</div></div>;
}
