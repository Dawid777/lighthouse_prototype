import React, { useState } from 'react';
import { Form } from 'react-aria-components';
import { Button, ButtonGroup, cx } from '../serenity/Button.jsx';
import { TextField, Select, TextArea } from '../serenity/Fields.jsx';
import { Dialog, Modal, toast, Toasts } from '../serenity/Overlays.jsx';
import { Stat, EmptyState } from '../serenity/Content.jsx';
import { Header, Tone, Tabs, Card, Item, Alert, RadioGroup } from '../serenity/Data.jsx';
import { Jewel } from '../icons.jsx';

// The internal consoles (Figma: Compliance console 471:7471, Support console 474:7471), a separate section of the
// prototype at #/console/compliance/... and #/console/support/..., with their own navigation. Support also holds the
// customer-app screens it hands off to (#/console/support/app/...).
const go = (h) => { location.hash = h; };
const NAV = [
  { group: 'Compliance', items: [['compliance', 'Queue'], ['compliance/SCR-2291', 'Screening match'], ['compliance/customer', 'Customer view'], ['compliance/EDD-0331', 'Enhanced due diligence'], ['compliance/approval', 'Approvals'], ['compliance/BRE-0042', 'Breach case'], ['compliance/STR-0019', 'Reporting']] },
  { group: 'Support', items: [['support', 'Queue'], ['support/CT-10482', 'Contact · confirmed'], ['support/CT-10490', 'Contact · not confirmed'], ['support/customer', 'Customer view'], ['support/MC-0213', 'Money case'], ['support/correction', 'Correction to approve']] },
  { group: 'Customer app', items: [['support/app/help', 'Get help'], ['support/app/contact', 'Contact thread'], ['support/app/signin', 'Can’t sign in'], ['support/app/dispute', 'Sign a dispute'], ['support/app/data', 'Data request'], ['support/app/deposit', 'Missing deposit']] },
];

export function Console({ parts = [], preset = {} }) {
  const path = parts.join('/') || 'compliance';
  return (
    <div className="lh-console">
      <nav className="lh-console-nav" aria-label="Console">
        <a href="#/home" className="lh-console-brand"><Jewel size={28} /><span className="text-body-strong-medium">Lighthouse consoles</span></a>
        {NAV.map((g) => (
          <div key={g.group} className="lh-console-group">
            <p className="text-caption-strong-small lh-secondary">{g.group}</p>
            {g.items.map(([p, l]) => <a key={p} href={`#/console/${p}`} aria-current={path === p ? 'page' : undefined} className={cx('lh-subnav-item', 'text-body-medium', path === p && 'is-current')}>{l}</a>)}
          </div>
        ))}
        <a href="#/map" className="lh-subnav-item text-body-medium">Prototype map</a>
      </nav>
      <main id="main" tabIndex={-1} className="lh-console-main">
        <div key={path} className="lh-page motion-navigate-fade">{route(path, preset)}</div>
      </main>
      <Toasts />
    </div>
  );
}

function route(p, preset) {
  switch (p) {
    case 'compliance': return <ComplianceQueue />;
    case 'compliance/SCR-2291': return <ScreeningCase preset={preset} />;
    case 'compliance/customer': return <ComplianceCustomer />;
    case 'compliance/EDD-0331': return <EddCase preset={preset} />;
    case 'compliance/approval': return <FourEyes />;
    case 'compliance/BRE-0042': return <Breach />;
    case 'compliance/STR-0019': return <Reporting />;
    case 'support': return <SupportQueue preset={preset} />;
    case 'support/CT-10482': return <ContactCase />;
    case 'support/CT-10490': return <ContactUnconfirmed />;
    case 'support/customer': return <SupportCustomer />;
    case 'support/MC-0213': return <MoneyCase />;
    case 'support/correction': return <Correction />;
    case 'support/app/help': return <AppHelp />;
    case 'support/app/contact': return <AppContact preset={preset} />;
    case 'support/app/signin': return <AppSignIn preset={preset} />;
    case 'support/app/dispute': return <AppDispute />;
    case 'support/app/data': return <AppData />;
    case 'support/app/deposit': return <AppDeposit />;
    default: return <EmptyState size="m" headingLevel={1} title="Not in the consoles" description="Pick a screen on the left." />;
  }
}

// A justification dialog: opening evidence or revealing identifiers records who looked, why and when (2.2).
function Justify({ isOpen, onClose, title, onDone }) {
  const [purpose, setPurpose] = useState(null);
  const [err, setErr] = useState('');
  return (
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()} width="m">
      <Form onSubmit={(e) => { e.preventDefault(); if (!purpose) { setErr('Choose why you need it.'); return; } onDone(purpose); }}>
        <Dialog title={title} subtitle="Opening it records your name, the time and your reason in the case’s access trail."
          footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Cancel</Button><Button type="submit" size="l">Open</Button></ButtonGroup>}>
          <Select label="Purpose" items={['Verify the match', 'Source of funds', 'Customer request', 'Regulator request']} selectedKey={purpose} onSelectionChange={(x) => { setPurpose(x); setErr(''); }} isInvalid={!!err} errorMessage={err} />
          <TextArea label="Note" optional />
        </Dialog>
      </Form>
    </Modal>
  );
}

const CaseHeader = ({ title, caption, badges, note, actions }) => (
  <Header title={title} caption={caption} badges={badges} description={note} actions={actions} />
);

/* ---------------- Compliance ---------------- */
function ComplianceQueue() {
  const [tab, setTab] = useState('unclaimed');
  const group = (title, tone, n, rows) => (
    <Card title={title} actions={<Tone tone={tone}>{n}</Tone>}>
      {rows.map(([l, d, v, b, bt, to]) => <Item key={l} label={l} description={d} value={v} badge={<Tone tone={bt}>{b}</Tone>} onPress={to ? () => go(to) : () => toast(`${l} opens here`)} />)}
    </Card>
  );
  return (
    <>
      <CaseHeader title="Queue" note="Intake healthy · last case received 2 min ago" actions={<Button size="m" onPress={() => go('#/console/compliance/SCR-2291')}>Claim next case</Button>} />
      <div className="lh-section lh-stack">
        <div className="lh-stat-row lh-stat-row--4">
          <Stat value="4" description="1 awaiting approval">My open cases</Stat><Stat value="23" description="across 8 case types">Unclaimed</Stat>
          <Stat value="3" description="raised to an officer">At risk</Stat><Stat value="2" description="oldest 3 h">Awaiting my approval</Stat>
        </div>
        <Tabs label="Cases" value={tab} onChange={setTab} items={[{ id: 'unclaimed', label: 'Unclaimed · 23' }, { id: 'mine', label: 'My cases · 4' }, { id: 'views', label: 'Saved views' }]}>
          {tab === 'views' ? <EmptyState title="No saved views" description="Filter the queue and choose Save view to keep it here." /> : (
            <div className="lh-stack">
              <div className="lh-filter-row">
                {['All case types', 'All jurisdictions', 'All risk bands', 'All clock states'].map((f) => <Select key={f} aria-label={f} items={[f]} selectedKey={f} className="lh-filter-select" />)}
                <Button size="m" variant="outlined" tone="secondary" onPress={() => toast('View saved')}>Save view</Button>
              </div>
              {group('At risk', 'red', 3, [['Breach event', 'BRE-0042 · UAE and Singapore · statutory', 'UAE: 14 h left', 'Statutory', 'red', '#/console/compliance/BRE-0042'], ['Data-subject request, erasure', 'DSR-0118 · CUS-•••7730 · statutory, Cayman', '2 days left', 'Statutory', 'red'], ['Onboarding screening match', 'SCR-2291 · CUS-•••1904 · customer waiting', '3 h left', 'Customer waiting', 'red', '#/console/compliance/SCR-2291']])}
              {group('Approaching', 'yellow', 3, [['Residence mismatch', 'ONB-0074 · CUS-•••6620 · customer waiting', '20 h left', 'Customer waiting', 'yellow'], ['Enhanced due diligence', 'EDD-0331 · CUS-•••5512 · 2 of 3 documents in', '2 days left', 'Internal window', 'yellow', '#/console/compliance/EDD-0331'], ['Transaction monitoring alert', 'TM-8812 · rule TM-R14 v7', '3 days left', 'Internal target', 'neutral']])}
              {group('Normal', 'neutral', 17, [['Ongoing re-screening hit', 'SCR-2288 · precautionary restriction in force', '6 days left', 'Internal target', 'neutral'], ['Complaint', 'CMP-0412 · linked to transaction TX-99812', '9 days left', 'Service target', 'neutral'], ['Transaction monitoring alert', 'TM-8809 · owned by Priya Nair', '5 days left', 'Awaiting approval', 'azure', '#/console/compliance/approval']])}
            </div>
          )}
        </Tabs>
      </div>
    </>
  );
}

function ScreeningCase({ preset }) {
  const [outcome, setOutcome] = useState(preset.outcome || null);
  const [reason, setReason] = useState('Date of birth differs');
  const [evidence, setEvidence] = useState(!!preset.justify);
  const [opened, setOpened] = useState(false);
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  if (done) return <div className="lh-section"><EmptyState size="m" headingLevel={1} icon="check-circle" title="SCR-2291 closed as a false positive" description="Daniel’s onboarding continues with no further manual step." action={<Button size="s" variant="outlined" tone="secondary" href="#/console/compliance">Back to the queue</Button>} /></div>;
  return (
    <>
      <CaseHeader title="SCR-2291" caption="Onboarding screening match" badges={<><Tone tone="azure">In review</Tone><Tone tone="red">Customer waiting · 3 h left</Tone></>}
        note="Owned by you since 10:04 UTC · internal target, not a legal deadline" actions={<><Button size="m" variant="outlined" tone="secondary" onPress={() => { toast('Case released to the queue'); go('#/console/compliance'); }}>Release</Button><Button size="m" variant="outlined" tone="secondary" onPress={() => toast('Reassign opens a person picker')}>Reassign</Button></>} />
      <div className="lh-section lh-console-grid">
        <div className="lh-stack">
          <Card title="What fired" caption="screening-config v12">
            <Item label="List" description="OFAC SDN, refreshed Nov 24, 06:00 UTC" />
            <Item label="Matched entity" description="Daniel R. Ramos · SDN-44120" />
            <Item label="Match score" description="Name 92 · date of birth 0 · nationality 0" value="87" />
          </Card>
          <Card title="Customer and matched entity, field by field">
            <Item label="Full name" description="Customer: Daniel Reyes Ramos · Match: Daniel R. Ramos" badge={<Tone>Similar</Tone>} />
            <Item label="Date of birth" description="Customer: 14 Mar 1991 · Match: 02 Sep 1964" badge={<Tone tone="red">Differs</Tone>} />
            <Item label="Nationality" description="Customer: Philippines · Match: Venezuela" badge={<Tone tone="red">Differs</Tone>} />
            <Item label="Residence" description="Customer: Singapore · Match: unknown" badge={<Tone>No data</Tone>} />
          </Card>
          <Card title="Evidence">
            <Item label="Passport" description={opened ? 'Sumsub · opened by you just now' : 'Sumsub · retrievable · opening it records your view'} badge={<Tone tone="azure">{opened ? 'Opened' : 'Open'}</Tone>} onPress={() => setEvidence(true)} />
            <Item label="Proof of address" description="Reap · partner-held, no copy exists" badge={<Tone>Partner request</Tone>} onPress={() => toast('Request sent to Reap')} />
          </Card>
          <Card title="Case notes"><TextArea label="Working note" placeholder="Add a working note" value={note} onChange={setNote} />{note && <div><Button size="s" variant="outlined" tone="secondary" onPress={() => { toast('Note added'); setNote(''); }}>Add note</Button></div>}</Card>
        </div>
        <div className="lh-stack">
          <Card title="Customer" caption="Lighthouse · read 10:04 UTC" actions={<Button size="s" variant="outlined" tone="secondary" href="#/console/compliance/customer">Open customer view</Button>}>
            <Item label="Name" description="Daniel R••• R•••s" /><Item label="Residence" description="Singapore · Declared and verified" /><Item label="Risk rating" description="Medium · Model v3, no override" /><Item label="Status" description="Onboarding blocked" />
          </Card>
          <Card title="Decision">
            <RadioGroup label="Outcome" description="Choosing an outcome shows what it requires." options={['True positive', 'False positive', 'Escalate']} value={outcome} onChange={setOutcome} />
            {outcome === 'False positive' && (
              <>
                <Select label="Reason" items={['Date of birth differs', 'Nationality differs', 'Different person, other evidence']} selectedKey={reason} onSelectionChange={setReason} />
                <TextArea label="Detail" optional placeholder="Add detail if the reason needs it" />
                <Alert tone="info" title="This clears the last screening hold">Daniel’s onboarding continues with no further manual step.</Alert>
                <Button size="l" onPress={() => { setDone(true); toast('Decision recorded', 'success'); }}>Record decision</Button>
              </>
            )}
            {outcome === 'True positive' && <><Alert tone="warning" title="This blocks the customer and opens a report">A true positive goes to an officer for approval (four eyes) before anything changes.</Alert><Button size="l" onPress={() => { toast('Sent for approval'); go('#/console/compliance'); }}>Submit for approval</Button></>}
            {outcome === 'Escalate' && <><TextArea label="Why escalate" /><Button size="l" onPress={() => { toast('Escalated to an officer'); go('#/console/compliance'); }}>Escalate</Button></>}
          </Card>
        </div>
      </div>
      <Justify isOpen={evidence} onClose={() => setEvidence(false)} title="Open the passport?" onDone={() => { setEvidence(false); setOpened(true); toast('Passport opened · view recorded'); }} />
    </>
  );
}

function ComplianceCustomer() {
  const [reveal, setReveal] = useState(false);
  const [shown, setShown] = useState(false);
  return (
    <>
      <CaseHeader title="Customer CUS-•••5512" badges={<><Tone tone="green">Active</Tone><Tone tone="yellow">1 restriction in force</Tone></>} note="Every part shows its source and when it was read"
        actions={<Button size="m" variant="outlined" tone="secondary" onPress={() => (shown ? setShown(false) : setReveal(true))}>{shown ? 'Mask identifiers' : 'Reveal identifiers'}</Button>} />
      <div className="lh-section lh-stack">
        <div className="lh-stat-row lh-stat-row--4">
          <Stat value="High" description="Override by Sam Park · was Medium">Risk rating</Stat><Stat value="12,480.00" description="Ledger · read 10:21 UTC">Balance, USDC</Stat>
          <Stat value="300.00" description="1 card authorisation">Holds</Stat><Stat value="5" description="2 open, 3 closed">Cases</Stat>
        </div>
        <div className="lh-console-grid">
          <Card title="Profile" caption="Lighthouse identity record · read 10:21 UTC">
            <Item label="Name" description={shown ? 'Mei Lin Tan' : 'Mei Lin T••'} /><Item label="Date of birth" description={shown ? '12 Jun 1988' : '•• ••• 1988'} />
            <Item label="Residence" description="Cayman Islands · Declared and verified" /><Item label="Tax number" description={shown ? 'KY 2210 4410' : '•••• 4410 · Masked until revealed'} />
          </Card>
          <Card title="Verification and screening" caption="Sumsub · read 10:21 UTC">
            <Item label="Identity verification" description="Passed · Passport and selfie · Mar 4, 2024" /><Item label="Onboarding screening" description="Clear · Mar 4, 2024" badge={<Tone tone="green">Clear</Tone>} />
            <Item label="Re-screening" description="Hit dispositioned · Oct 2, 2026" badge={<Tone>False positive</Tone>} />
          </Card>
          <Card title="Cases" caption="Lighthouse case store · read 10:21 UTC">
            <Item label="Enhanced due diligence" description="EDD-0331 · Open · 2 of 3 documents in" badge={<Tone tone="azure">In review</Tone>} onPress={() => go('#/console/compliance/EDD-0331')} />
            <Item label="Complaint" description="CMP-0398 · Open · card declined abroad" badge={<Tone>Open</Tone>} />
            <Item label="Re-screening hit" description="SCR-2104 · Closed Oct 2 · false positive" badge={<Tone>Closed</Tone>} />
          </Card>
          <Card title="Card and account" caption="Reap">
            <Alert tone="warning" title="Reap read failed" action={<Button size="s" variant="outlined" tone="secondary" onPress={() => toast('Reap still can’t be reached')}>Retry</Button>}>Showing the last known state from 3 h ago. Check again before you act.</Alert>
            <Item label="Card ••7712" description="Frozen · Virtual · last known 07:18 UTC" /><Item label="Account ••5512" description="Open · Last known 07:18 UTC" />
          </Card>
          <Card title="Restrictions in force" caption="Restriction engine · read 10:21 UTC">
            <Item label="Card freeze, precautionary" description="Cause: EDD-0331 · applied by Sam Park" badge={<Tone tone="green">Fully applied</Tone>} />
          </Card>
        </div>
      </div>
      <Justify isOpen={reveal} onClose={() => setReveal(false)} title="Reveal identifiers?" onDone={() => { setReveal(false); setShown(true); toast('Identifiers revealed · view recorded'); }} />
    </>
  );
}

function EddCase({ preset }) {
  const [outcome, setOutcome] = useState(preset.applied ? 'Restrict' : null);
  const [restriction, setRestriction] = useState('Card freeze, precautionary');
  const [confirm, setConfirm] = useState(!!preset.confirm);
  const [applied, setApplied] = useState(!!preset.applied);
  return (
    <>
      <CaseHeader title="EDD-0331" caption="Enhanced due diligence" badges={<><Tone tone="azure">In review</Tone><Tone tone="yellow">Internal window · 2 days left</Tone></>} note="Owned by you · documents requested Nov 18"
        actions={<><Button size="m" variant="outlined" tone="secondary" onPress={() => toast('Case released')}>Release</Button><Button size="m" variant="outlined" tone="secondary" onPress={() => toast('Reassign opens a person picker')}>Reassign</Button></>} />
      <div className="lh-section lh-stack">
        {applied && <Alert tone="danger" title="Restriction partially applied: card payments are still possible" action={<Button size="s" variant="outlined" tone="secondary" onPress={() => document.getElementById('legs')?.scrollIntoView()}>View legs</Button>}>The Lighthouse ledger hold is in force. The Reap card block failed and retries every 5 minutes.</Alert>}
        <div className="lh-console-grid">
          <div className="lh-stack">
            <Card title="What triggered it" caption="risk-config v8">
              <Item label="Trigger" description="Cumulative card spend above 50,000.00 in 30 days" /><Item label="Documents requested" description="Source of funds, bank statements, employment letter" />
              <Item label="Received" description="Bank statements, employment letter" value="2 of 3" />
            </Card>
            {applied && (
              <div id="legs"><Card title={`Restriction · ${restriction}`} caption="Applied 10:32 UTC by you">
                <Item label="Ledger hold" description="Lighthouse · outgoing transfers blocked" badge={<Tone tone="green">Applied</Tone>} />
                <Item label="Card authorisation block" description="Reap · partner leg, retrying every 5 min" badge={<Tone tone="red">Failed, retrying</Tone>} />
                <p className="text-body-small lh-secondary">What the customer can still do: card payments, receiving deposits, viewing the account.</p>
              </Card></div>
            )}
          </div>
          <div className="lh-stack">
            <Card title="Customer" caption="Lighthouse · read 10:21 UTC" actions={<Button size="s" variant="outlined" tone="secondary" href="#/console/compliance/customer">Open</Button>}>
              <Item label="Mei Lin T••" description="CUS-•••5512 · Cayman Islands" /><Item label="Risk rating" description="High · Override by Sam Park" />
            </Card>
            <Card title="Decision">
              <RadioGroup label="Outcome" options={['Approve', 'Restrict', 'Exit the relationship']} value={outcome} onChange={setOutcome} isDisabled={applied} />
              {outcome === 'Restrict' && !applied && <><Select label="Restriction" items={['Card freeze, precautionary', 'Outgoing transfers blocked', 'Full account freeze']} selectedKey={restriction} onSelectionChange={setRestriction} /><Button size="l" onPress={() => setConfirm(true)}>Apply restriction</Button></>}
              {outcome === 'Approve' && <Button size="l" onPress={() => { toast('Case approved and closed', 'success'); go('#/console/compliance'); }}>Approve and close</Button>}
              {outcome === 'Exit the relationship' && <><Alert tone="warning" title="Needs a second approver">An exit goes to an officer for approval before anything changes.</Alert><Button size="l" onPress={() => { toast('Sent for approval'); go('#/console/compliance/approval'); }}>Submit for approval</Button></>}
            </Card>
          </div>
        </div>
      </div>
      <Modal isOpen={confirm} onOpenChange={setConfirm} width="m">
        <Dialog title="Apply the restriction?" subtitle={`${restriction} runs in two places. Each leg reports back on its own.`}
          footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Cancel</Button><Button size="l" onPress={() => { setConfirm(false); setApplied(true); toast('Restriction applied, 1 leg retrying'); }}>Apply</Button></ButtonGroup>}>
          <Item label="Ledger hold" description="Lighthouse · outgoing transfers blocked" /><Item label="Card authorisation block" description="Reap · partner leg" />
        </Dialog>
      </Modal>
    </>
  );
}

function FourEyes() {
  const [ret, setRet] = useState(false);
  const [reason, setReason] = useState('');
  return (
    <>
      <CaseHeader title="Approve a decision on EDD-0329" badges={<><Tone tone="azure">Awaiting your approval</Tone><Tone tone="yellow">Internal window · 1 day left</Tone></>} note="Submitted by Priya Nair at 09:12 UTC · the clock keeps running"
        actions={<><Button size="m" variant="outlined" tone="secondary" onPress={() => setRet(true)}>Return with reason</Button><Button size="m" onPress={() => { toast('Decision approved · passkey confirmed', 'success'); go('#/console/compliance'); }}>Approve</Button></>} />
      <div className="lh-section lh-console-grid">
        <div className="lh-stack">
          <Card title="Submitted decision" caption="Submitted 09:12 UTC">
            <Item label="Outcome" description="Exit the relationship" /><Item label="Rationale" description="Source of funds not provided after two reminders. Statements show unexplained third-party deposits." /><Item label="Configuration" description="risk-config v8" />
          </Card>
          <Card title="Evidence Priya viewed" caption="Access trail">
            <Item label="Bank statements, Jun to Oct" description="Sumsub · viewed 08:40 UTC · purpose: source of funds" /><Item label="Employment letter" description="Sumsub · viewed 08:47 UTC" />
          </Card>
        </div>
        <div className="lh-stack">
          <Card title="Case as Priya saw it" caption="Snapshot at submission" actions={<Button size="s" variant="outlined" tone="secondary" href="#/console/compliance/EDD-0331">Open case</Button>}>
            <Item label="Customer" description="CUS-•••2287 · United Arab Emirates" /><Item label="Risk rating" description="High · Model v3" /><Item label="Restrictions in force" description="None" />
          </Card>
          <Card title="Your queue"><Item label="2 approvals waiting" description="Oldest 3 h" onPress={() => go('#/console/compliance')} /></Card>
        </div>
      </div>
      <Modal isOpen={ret} onOpenChange={setRet}>
        <Form onSubmit={(e) => { e.preventDefault(); if (!reason.trim()) return; setRet(false); toast('Returned to Priya'); go('#/console/compliance'); }}>
          <Dialog title="Return to Priya?" subtitle="She gets your reason and the case goes back to her."
            footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Cancel</Button><Button type="submit" size="l">Return</Button></ButtonGroup>}>
            <TextArea label="Reason" autoFocus value={reason} onChange={setReason} isRequired />
          </Dialog>
        </Form>
      </Modal>
    </>
  );
}

function Breach() {
  const [extracted, setExtracted] = useState(['UAE']);
  return (
    <>
      <CaseHeader title="BRE-0042" caption="Breach event" badges={<><Tone tone="azure">In review</Tone><Tone tone="red">Statutory</Tone></>} note="Owned by Sam Park · trigger set Nov 23, 21:10 UTC by Sam Park"
        actions={<Button size="m" variant="outlined" tone="secondary" onPress={() => toast('Scope editor opens here')}>Revise scope</Button>} />
      <div className="lh-section lh-stack">
        <Alert tone="danger" title="Next: notify the UAE Data Office in 14 h 20 min" action={<Button size="s" variant="outlined" tone="secondary" onPress={() => { setExtracted(['UAE', 'Singapore', 'Cayman Islands']); toast('Affected customers extracted'); }}>Extract affected customers</Button>}>72 hours from the trigger, due Nov 26, 21:10 UTC.</Alert>
        <div className="lh-console-grid">
          <Card title="Clocks, one per jurisdiction" caption="Each runs from the trigger">
            <Item label="United Arab Emirates" description="UAE Data Office · 72 hours" value="14 h left" badge={<Tone tone="red">At risk</Tone>} />
            <Item label="Singapore" description="PDPC · 3 calendar days" value="2 days left" badge={<Tone tone="yellow">Approaching</Tone>} />
            <Item label="Cayman Islands" description="Ombudsman · 5 days · added to scope Nov 24" value="3 days left" badge={<Tone>Normal</Tone>} />
          </Card>
          <Card title="Affected customers">
            {[['UAE', 412], ['Singapore', 188], ['Cayman Islands', 57]].map(([j, n]) => <Item key={j} label={j} description={extracted.includes(j) ? 'Extracted' : 'Not extracted yet'} value={String(n)} />)}
          </Card>
          <Card title="Scope revisions"><Item label="Cayman Islands added" description="Nov 24, 08:02 UTC · Sam Park · clock runs from the trigger" /><Item label="Scope opened: UAE, Singapore" description="Nov 23, 21:40 UTC · Sam Park" /></Card>
          <Card title="Trigger"><Item label="Event" description="Unauthorised access to a support export" /><Item label="Trigger time" description="Nov 23, 21:10 UTC · Set by Sam Park" /></Card>
        </div>
      </div>
    </>
  );
}

function Reporting() {
  const [rec, setRec] = useState({ ref: '', date: 'Nov 24, 2026', body: 'Cayman Islands FRA' });
  const [filed, setFiled] = useState(false);
  const [err, setErr] = useState('');
  return (
    <>
      <CaseHeader title="STR-0019" caption="Suspicious activity report" badges={filed ? <Tone tone="green">Filed</Tone> : <><Tone tone="yellow">Generated</Tone><Tone tone="red">Not filed</Tone></>} note="Visible to the reporting group only · decision to report by Sam Park" />
      <div className="lh-section lh-console-grid">
        <div className="lh-stack">
          <Card title="Report" caption="goAML · generated Nov 24, 09:55 UTC" actions={<Button size="s" variant="outlined" tone="secondary" onPress={() => toast('STR-0019.xml downloaded · recorded')}>Download</Button>}>
            <Item label="STR-0019.xml" description="sha256 9f2c…e41a · 48 KB" badge={<Tone tone="yellow">Generated</Tone>} /><Item label="Downloaded" description="Sam Park · 09:57 UTC" />
          </Card>
          <Card title="Filing record" caption="Saved records can’t be changed">
            {filed ? <Item label={rec.ref} description={`${rec.body} · ${rec.date}`} badge={<Tone tone="green">Recorded</Tone>} /> : (
              <Form onSubmit={(e) => { e.preventDefault(); if (!rec.ref.trim()) { setErr('Enter the reference the FRA gave you.'); return; } setFiled(true); toast('Filing recorded', 'success'); }} className="lh-stack">
                <TextField label="FRA reference" placeholder="FRA-2026-11-04417" value={rec.ref} onChange={(x) => { setRec({ ...rec, ref: x }); setErr(''); }} isInvalid={!!err} errorMessage={err} />
                <TextField label="Filed on" value={rec.date} onChange={(x) => setRec({ ...rec, date: x })} />
                <Select label="Filed with" items={['Cayman Islands FRA', 'UAE FIU', 'Singapore STRO']} selectedKey={rec.body} onSelectionChange={(x) => setRec({ ...rec, body: x })} />
                <div><Button type="submit" size="l">Save record</Button></div>
              </Form>
            )}
          </Card>
        </div>
        <div className="lh-stack">
          <Card title="Status">
            <Item label="Preparing" description="Mandatory data complete · Nov 24, 09:40" badge={<Tone tone="green">Done</Tone>} /><Item label="Generated" description="Nov 24, 09:55" badge={<Tone tone="green">Done</Tone>} />
            <Item label="Filed and recorded" description={filed ? 'Just now' : 'Waiting for the filing record'} badge={<Tone tone={filed ? 'green' : 'red'}>{filed ? 'Done' : 'Outstanding'}</Tone>} />
          </Card>
          <Card title="Linked case"><Item label="Transaction monitoring alert" description="TM-8790 · Escalated by Priya Nair · Nov 21" /></Card>
        </div>
      </div>
    </>
  );
}

/* ---------------- Support ---------------- */
function SupportQueue({ preset }) {
  const [tab, setTab] = useState('all');
  const [state, setState] = useState(preset.queue || 'live');
  const rows = [
    ['contacts', 'Withdrawal hasn’t arrived', 'CT-10482 · Mei Lin T•• · 3 contacts grouped · with you', '1 h 20 min', 'With support', 'azure', '#/console/support/CT-10482'],
    ['contacts', 'Card declined abroad', 'CT-10477 · Jonas W•• · unassigned', '42 min', 'Received', 'neutral'],
    ['money', 'Reported missing deposit', 'MC-0213 · Owner Priya Nair · USDC on Solana · 2 days', 'Due today', 'Money case', 'yellow', '#/console/support/MC-0213'],
    ['partner', 'Reap · card authorisation stuck', 'PE-0091 · Raised 2 days ago · committed response 24 h', 'Partner-late', 'Partner-late', 'red'],
    ['partner', 'Ramp provider · SEPA return', 'PE-0094 · Raised 6 h ago · committed response 1 business day', '', 'Inside commitment', 'neutral'],
    ['contacts', 'Lost my phone, can’t sign in', 'CT-10490 · not confirmed · reply due in 3 h', '3 h', 'Received', 'neutral', '#/console/support/CT-10490'],
  ];
  const list = rows.filter((r) => tab === 'all' || r[0] === tab);
  return (
    <>
      <CaseHeader title="Queue" actions={<ButtonGroup><Button size="s" variant="ghost" tone="secondary" onPress={() => setState('live')}>Live</Button><Button size="s" variant="ghost" tone="secondary" onPress={() => setState('empty')}>Empty</Button><Button size="s" variant="ghost" tone="secondary" onPress={() => setState('error')}>Can’t load</Button></ButtonGroup>} />
      <div className="lh-section lh-stack">
        <div className="lh-stat-row lh-stat-row--4">
          {state === 'error' ? ['Close to breach', 'Waiting on support', 'Waiting on partners', 'Waiting on customers'].map((l) => <Stat key={l} value="—">{l}</Stat>)
            : state === 'empty' ? ['Close to breach', 'Waiting on support', 'Waiting on partners', 'Waiting on customers'].map((l) => <Stat key={l} value="0" description="Nothing waiting">{l}</Stat>)
              : <><Stat value="5" description="Reply due within 1 h">Close to breach</Stat><Stat value="21" description="Oldest 5 h">Waiting on support</Stat><Stat value="9" description="3 past the partner's commitment">Waiting on partners</Stat><Stat value="14" description="Clocks paused">Waiting on customers</Stat></>}
        </div>
        <Tabs label="Queue" value={tab} onChange={setTab} items={[{ id: 'all', label: 'All' }, { id: 'contacts', label: 'Contacts' }, { id: 'money', label: 'Money cases' }, { id: 'partner', label: 'Partner-late' }]}>
          {state === 'error' ? <Alert tone="danger" title="The queue couldn’t load" action={<Button size="s" variant="outlined" tone="secondary" onPress={() => setState('live')}>Retry</Button>}>This isn’t an empty queue: work may be waiting.</Alert>
            : state === 'empty' ? <EmptyState icon="inbox" title="No contacts or money cases are waiting" description="New ones appear here as they come in. Updated 10:21 UTC." />
              : (
                <Card title="Ordered by time left against each commitment" caption="Partner health: Reap degraded since 08:40 UTC">
                  {list.map(([, l, d, v, b, t, to]) => <Item key={l} label={l} description={d} value={v} badge={<Tone tone={t}>{b}</Tone>} onPress={to ? () => go(to) : () => toast(`${l} opens here`)} />)}
                </Card>
              )}
        </Tabs>
      </div>
    </>
  );
}

const THREAD = [
  ['Mei Lin T••', 'Nov 22, 18:04', 'I sent 2,000 USDC to my bank on Friday and it still isn’t there.', 'customer'],
  ['Priya Nair', 'Nov 22, 18:30', 'Thanks, Mei Lin. The transfer has left Lighthouse and is with our banking partner. I’ll update you tomorrow.', 'sent'],
  ['Priya Nair', 'Nov 22, 18:31', 'Ramp ref RMP-55102. Bank leg not confirmed yet. Re-check on Monday.', 'note'],
  ['Mei Lin T••', 'Today, 09:12', 'It’s Monday and still nothing. This is the third time I’m asking.', 'customer'],
];
function Thread({ items }) {
  return (
    <ol className="lh-thread">
      {items.map(([who, when, text, kind], i) => (
        <li key={i} className={cx('lh-msg', `lh-msg--${kind}`)}>
          <p className="text-caption-strong-small">{who} <span className="lh-secondary">· {when}</span> {kind === 'sent' && <Tone>Sent · in message center</Tone>}{kind === 'note' && <Tone tone="yellow">Internal note · never sent</Tone>}</p>
          <p className="text-body-medium">{text}</p>
        </li>
      ))}
    </ol>
  );
}

function ContactCase() {
  const [msgs, setMsgs] = useState(THREAD);
  const [reply, setReply] = useState('');
  const [dialog, setDialog] = useState(null);
  const [status, setStatus] = useState('With support');
  const add = (kind) => { if (!reply.trim()) return; setMsgs([...msgs, ['You', 'Just now', reply.trim(), kind]]); setReply(''); toast(kind === 'note' ? 'Note added' : 'Reply sent'); };
  return (
    <>
      <CaseHeader title="Withdrawal hasn’t arrived" badges={<><Tone tone="azure">{status}</Tone><Tone tone="yellow">Reply due in 1 h 20 min</Tone></>} note="CT-10482 · owned by you · 2 earlier contacts grouped"
        actions={<><Button size="m" variant="outlined" tone="secondary" onPress={() => setDialog('escalate')}>Escalate</Button><Button size="m" onPress={() => setDialog('resolve')}>Resolve</Button></>} />
      <div className="lh-section lh-console-grid">
        <div className="lh-stack">
          <p className="text-body-small lh-secondary">Every reply also appears in the customer’s message center</p>
          <Thread items={msgs} />
          <Select label="Situation" items={['Withdrawal in recovery · bank leg pending', 'Withdrawal completed', 'Bank details wrong']} defaultSelectedKey="Withdrawal in recovery · bank leg pending" />
          <TextArea label="Reply" placeholder="Write a reply" value={reply} onChange={setReply} rows={3} />
          <ButtonGroup><Button size="m" variant="outlined" tone="secondary" onPress={() => add('note')}>Add internal note</Button><Button size="m" variant="outlined" tone="secondary" onPress={() => { setStatus('Waiting for customer'); toast('Asked for the bank transfer reference'); }}>Ask for information</Button><Button size="m" onPress={() => add('sent')}>Send reply</Button></ButtonGroup>
        </div>
        <div className="lh-stack">
          <Card title="Who sent it"><Item label="Confirmed account holder" description="Sent from a signed-in session" badge={<Tone tone="green">Confirmed</Tone>} /></Card>
          <Card title="Customer" actions={<Button size="s" variant="outlined" tone="secondary" href="#/console/support/customer">Open customer view</Button>}><Item label="Mei Lin T••" description="CUS-•••5512 · 3 contacts grouped" /></Card>
          <Card title="Attached"><Item label="Withdrawal to bank ••4471" description="Nov 21 · bank leg pending" value="2,000.00 USDC" badge={<Tone tone="yellow">In recovery</Tone>} /></Card>
        </div>
      </div>
      <Modal isOpen={dialog === 'escalate'} onOpenChange={(o) => !o && setDialog(null)} width="m">
        <Dialog title="Escalate to compliance?" subtitle="Compliance gets the thread and your note. The customer sees no change."
          footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Cancel</Button><Button size="l" onPress={() => { setDialog(null); setStatus('With compliance'); toast('Escalated to compliance'); }}>Escalate</Button></ButtonGroup>}>
          <Select label="Reason" items={['Possible fraud', 'Sanctions concern', 'Data request', 'Legal threat']} defaultSelectedKey="Possible fraud" />
          <TextArea label="Note for compliance" />
        </Dialog>
      </Modal>
      <Modal isOpen={dialog === 'resolve'} onOpenChange={(o) => !o && setDialog(null)} width="m">
        <Dialog title="Resolve CT-10482" subtitle="Mei Lin said this is the third time she’s asking. If she is unhappy with the service, record it as a complaint."
          footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Cancel</Button><Button size="l" onPress={() => { setDialog(null); setStatus('Resolved'); toast('Contact resolved · reopen window 7 days'); }}>Resolve</Button></ButtonGroup>}>
          <RadioGroup label="Outcome" options={['Resolved, no complaint', 'Record as a complaint (CMP)']} defaultValue="Resolved, no complaint" />
          <TextArea label="Final reply" defaultValue="The withdrawal reached your bank at 13:52. It can take until tomorrow to show in your account." />
        </Dialog>
      </Modal>
    </>
  );
}

function ContactUnconfirmed() {
  const [sent, setSent] = useState(false);
  return (
    <>
      <CaseHeader title="Lost my phone, can’t sign in" badges={<><Tone>Received</Tone><Tone tone="yellow">Not confirmed</Tone></>} note="CT-10490 · sent from the sign-in screen · reply due in 3 h" />
      <div className="lh-section lh-console-grid">
        <div className="lh-stack">
          <Alert tone="warning" title="Not confirmed as the account holder">Account details stay hidden until re-verification. Reply with neutral wording only.</Alert>
          <Thread items={[['m••••@proton.me', 'Today, 07:48', 'I lost my phone with the authenticator app and I can’t sign in.', 'customer']]} />
          <Select label="Template" items={['Lost second factor · neutral reply', 'Forgot password · neutral reply']} defaultSelectedKey="Lost second factor · neutral reply" />
          <TextArea label="Reply" defaultValue="We’ve sent you a secure link to confirm it’s you. It works for 24 hours." rows={3} />
          <ButtonGroup><Button size="m" onPress={() => { setSent(true); toast('Reply and re-verification link sent'); }}>Send reply and link</Button></ButtonGroup>
          <p className="text-body-small lh-secondary">Treat a suspected takeover as urgent. The customer can freeze the account from the link.</p>
        </div>
        <Card title="Confirmation" caption="Only re-verification with Sumsub confirms the sender">
          <Item label="Confirmation" description="Contact from outside the app" badge={<Tone>Not confirmed</Tone>} />
          <Item label="Re-verification" description={sent ? 'Link sent by email, expires in 24 h' : 'Not started'} badge={<Tone tone={sent ? 'azure' : 'neutral'}>{sent ? 'Link sent' : 'Not started'}</Tone>} />
          <p className="text-body-small lh-secondary">The customer’s account appears once the contact is confirmed.</p>
        </Card>
      </div>
    </>
  );
}

function SupportCustomer() {
  const [dispute, setDispute] = useState(null);
  return (
    <>
      <CaseHeader title="Mei Lin T••" badges={<Tone tone="green">Confirmed</Tone>} note="CUS-•••5512 · worded as the customer sees it · every view is recorded" />
      <div className="lh-section lh-stack">
        <div className="lh-stat-row lh-stat-row--4">
          <Stat value="10,480.00" description="USDC · ledger · read 10:21 UTC">Available balance</Stat><Stat value="2,000.00" description="1 withdrawal to bank">In transit</Stat>
          <Stat value="1" description="3 messages grouped">Open contacts</Stat><Stat value="0" description="None open">Complaints and disputes</Stat>
        </div>
        <div className="lh-console-grid">
          <Card title="What she can do">
            <Item label="Send and receive money" badge={<Tone tone="green">Available</Tone>} /><Item label="Pay with the card" badge={<Tone tone="green">Available</Tone>} /><Item label="Withdraw to a bank" description="1 withdrawal in recovery" badge={<Tone tone="green">Available</Tone>} />
          </Card>
          <Card title="Activity" caption="States as shown in the app">
            <Item label="Withdrawal to bank ••4471" description="Nov 21 · bank leg pending" value="−2,000.00" badge={<Tone tone="yellow">In recovery</Tone>} />
            <Item label="Card · Grab Singapore" description="Nov 20 · completed" value="−18.40" onPress={() => setDispute('start')} />
            <Item label="Deposit · USDC on Solana" description="Nov 18 · completed" value="+3,500.00" />
          </Card>
          <Card title="Message center"><Item label="Support reply" description="Nov 22, 18:30 · CT-10482" onPress={() => go('#/console/support/CT-10482')} /><Item label="Withdrawal is taking longer" description="Nov 22, 09:00 · automatic" /></Card>
          <Card title="Card" caption="Reap">
            <Alert tone="warning" title="Reap can’t be reached" action={<Button size="s" variant="outlined" tone="secondary" onPress={() => toast('Still unreachable')}>Retry</Button>}>Card states last refreshed 07:18 UTC, 3 h ago.</Alert>
            <Item label="Card ••7712" description="Active · Virtual · last refreshed 07:18 UTC" />
          </Card>
        </div>
      </div>
      <Modal isOpen={!!dispute} onOpenChange={(o) => !o && setDispute(null)} width="m">
        {dispute === 'start' ? (
          <Dialog title="Start a dispute for Mei Lin?" subtitle="Grab Singapore · −18.40 · Nov 20. She signs it in the app before it goes to Reap."
            footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Cancel</Button><Button size="l" onPress={() => setDispute('na')}>Start dispute</Button></ButtonGroup>}>
            <Select label="Reason" items={['Charged more than once', 'Didn’t receive the goods', 'Amount is wrong']} defaultSelectedKey="Charged more than once" />
            <TextArea label="What she told us" defaultValue="I was charged twice for the same ride." />
          </Dialog>
        ) : (
          <Dialog title="Disputes aren’t available yet" subtitle="Until responsibility with Reap is settled, disputes are started by the card team. We sent them the details." footer={<ButtonGroup><Button slot="close" size="l">OK</Button></ButtonGroup>} />
        )}
      </Modal>
    </>
  );
}

function MoneyCase() {
  const [requested, setRequested] = useState(false);
  const [close, setClose] = useState(false);
  return (
    <>
      <CaseHeader title="Reported missing deposit" badges={<><Tone>Owned by Priya Nair</Tone><Tone tone="yellow">{requested ? 'Correction requested' : 'Correction to request'}</Tone></>} note="MC-0213 · opened Nov 22 · customer told a named person holds it"
        actions={<><Button size="m" variant="outlined" tone="secondary" onPress={() => toast('Reassign opens a person picker')}>Reassign</Button><Button size="m" variant="outlined" tone="secondary" onPress={() => setClose(true)}>Close with outcome</Button></>} />
      <div className="lh-section lh-console-grid">
        <div className="lh-stack">
          <Card title="From the funding journey" caption="Nov 22, 11:40 UTC">
            <Item label="Network" description="USDC on Solana" /><Item label="Transaction reference" description="5hT9…aQ2e" /><Item label="Amount" description="1,250.00 USDC" />
            <Item label="Last known" description="Not seen by Lighthouse · Nov 22, 11:40 UTC" badge={<Tone>Not located</Tone>} />
            <Item label="Fresh status" description="Custody partner · 10:14 UTC · received to the deposit address" badge={<Tone tone="green">Located</Tone>} />
          </Card>
          <p className="text-body-medium lh-secondary">The platform didn’t credit it automatically: the memo was missing.</p>
          <ButtonGroup><Button size="m" variant="outlined" tone="secondary" onPress={() => toast('Status re-checked · still located')}>Re-check status</Button><Button size="m" isDisabled={requested} onPress={() => { setRequested(true); toast('Correction sent for approval'); }}>{requested ? 'Correction requested' : 'Request correction'}</Button></ButtonGroup>
        </div>
        <div className="lh-stack">
          <Card title="Partner escalation" caption="PE-0097 · Reap custody"><Item label="Raised" description="Nov 22, 14:02 UTC by Priya Nair" /><Item label="Partner reference" description="REAP-77410" /><Item label="Committed response" description="Answered · 24 h" badge={<Tone>Inside commitment</Tone>} /></Card>
          {requested && <Card title="Correction"><Item label="Credit 1,250.00 USDC to the customer" description="Waiting for a second approver" badge={<Tone tone="azure">Awaiting approval</Tone>} onPress={() => go('#/console/support/correction')} /></Card>}
        </div>
      </div>
      <Modal isOpen={close} onOpenChange={setClose} width="m">
        <Dialog title="Close MC-0213" subtitle="Required to close: what happened to the money."
          footer={<ButtonGroup><Button slot="close" variant="outlined" tone="secondary" size="l">Cancel</Button><Button size="l" onPress={() => { setClose(false); toast('Money case closed'); go('#/console/support'); }}>Close case</Button></ButtonGroup>}>
          <RadioGroup label="Outcome" options={['Credited or returned', 'Received but not creditable', 'Never received']} defaultValue="Credited or returned" />
        </Dialog>
      </Modal>
    </>
  );
}

function Correction() {
  return (
    <>
      <CaseHeader title="Approve a correction for MC-0213" badges={<Tone tone="azure">Awaiting your approval</Tone>} note="Requested by Priya Nair at 10:31 UTC · you weren’t involved in the case"
        actions={<><Button size="m" variant="outlined" tone="secondary" onPress={() => { toast('Returned to Priya with your reason'); go('#/console/support'); }}>Reject with reason</Button><Button size="m" onPress={() => { toast('Correction posted · passkey confirmed', 'success'); go('#/console/support'); }}>Approve</Button></>} />
      <div className="lh-section lh-console-grid">
        <Card title="Correction">
          {[['Amount', '1,250.00 USDC'], ['Direction', 'Credit to the customer'], ['Reason code', 'Deposit received without memo'], ['Posts as', 'Reversal entry attached to the deposit'], ['Balance after posting', '11,730.00 USDC']].map(([l, d]) => <Item key={l} label={l} description={d} />)}
        </Card>
        <Card title="Evidence">
          {[['Custody partner status', 'Received to the deposit address · 10:14 UTC'], ['Partner escalation PE-0097', 'Answered by Reap inside its commitment'], ['Customer report', 'USDC on Solana · 5hT9…aQ2e'], ['Mei Lin T••', 'CUS-•••5512']].map(([l, d]) => <Item key={l} label={l} description={d} />)}
          <p className="text-body-small lh-secondary">Approving asks for your passkey. The customer sees the correction in the app.</p>
        </Card>
      </div>
    </>
  );
}

/* ---------------- Customer app (what support hands off to) ---------------- */
const AppFrame = ({ title, children, note }) => (
  <>
    <Header title={title} caption="Customer app" />
    <div className="lh-section lh-app-frame">{children}</div>
    {note && <p className="lh-section text-caption-small lh-secondary">{note}</p>}
  </>
);

function AppHelp() {
  const [msg, setMsg] = useState('');
  const [state, setState] = useState('write');
  return (
    <AppFrame title="Get help" note="Proposal UXQ-97, UXQ-98: launch with written in-app messaging, plus email for people who can’t sign in.">
      {state === 'failed' && <Alert tone="danger" title="Your message wasn’t sent" action={<Button size="s" variant="outlined" tone="secondary" onPress={() => { setState('write'); go('#/console/support/app/contact'); }}>Try again</Button>}>We kept what you wrote. Check your connection and try again.</Alert>}
      <Item label="Withdrawal to bank ••4471" description="Nov 21 · sending" value="2,000.00 USDC" badge={<Tone>Attached</Tone>} />
      <p className="text-body-small lh-secondary">We attach this withdrawal so you don’t have to describe it.</p>
      <TextArea label="What happened?" placeholder="Describe it in your own words" value={msg} onChange={setMsg} rows={4} />
      <ButtonGroup><Button size="l" variant="outlined" tone="secondary" onPress={() => setState('failed')}>Send offline (prototype)</Button><Button size="l" onPress={() => { if (!msg.trim()) { toast('Write a few words first'); return; } go('#/console/support/app/contact'); }}>Send</Button></ButtonGroup>
      <p className="text-body-small lh-secondary">A person replies within 1 business day. Replies also arrive by email.</p>
      <Card title="Might help">
        <Item label="Why bank withdrawals can take 3 business days" onPress={() => toast('Help article')} /><Item label="What “sending” means for a withdrawal" onPress={() => toast('Help article')} /><Item label="Check the bank details you used" onPress={() => toast('Help article')} />
      </Card>
      <Card title="Earlier"><Item label="Card limit question" description="Resolved Oct 3" badge={<Tone tone="green">Resolved</Tone>} /></Card>
    </AppFrame>
  );
}

const CONTACT_STATES = {
  received: { badge: ['Received', 'neutral'], note: 'Reference CT-10482 · we’ll reply by today, 17:00', alert: null, extra: [] },
  waiting: { badge: ['Waiting for you', 'yellow'], note: 'Reference CT-10482', alert: ['warning', 'Support needs one thing from you', 'The transfer reference your bank shows for Nov 21.'], extra: [['Priya · Lighthouse Support', 'Today, 10:20', 'Thanks, Mei Lin. To trace this with our banking partner, could you send the reference your bank shows?', 'sent']] },
  late: { badge: ['Reply late', 'red'], note: 'Reference CT-10482', alert: ['danger', 'Our reply is late, sorry', 'We said we’d reply by 13:00 today. Your message is with a senior agent now.'], extra: [] },
  resolved: { badge: ['Resolved', 'green'], note: 'Reference CT-10482 · resolved today, 14:05', alert: ['info', 'Still not sorted?', 'Reply within 7 days and this conversation reopens.'], extra: [['Priya · Lighthouse Support', 'Today, 14:05', 'The withdrawal reached your bank at 13:52. It can take until tomorrow to show.', 'sent']] },
  complaint: { badge: ['Complaint', 'azure'], note: 'Complaint CMP-0412 · from contact CT-10482', alert: ['info', 'This is now a complaint', 'Reference CMP-0412. We’ll confirm we’ve received it within 2 business days.'], extra: [['Priya · Lighthouse Support', 'Today, 10:40', 'I’m sorry this has taken so long. I’ve recorded it as a complaint.', 'sent']] },
};
function AppContact({ preset }) {
  const [s, setS] = useState(preset.contact || 'received');
  const c = CONTACT_STATES[s];
  return (
    <AppFrame title="Withdrawal hasn’t arrived">
      <div className="lh-row-between"><Tone tone={c.badge[1]}>{c.badge[0]}</Tone><ToggleStates value={s} onChange={setS} /></div>
      <p className="text-body-small lh-secondary">{c.note}</p>
      {c.alert && <Alert tone={c.alert[0]} title={c.alert[1]}>{c.alert[2]}</Alert>}
      <Thread items={[['You', 'Nov 22, 18:04', 'I sent 2,000 USDC to my bank on Friday and it still isn’t there.', 'customer'], ...c.extra]} />
      {s !== 'complaint' && <><TextArea label="Message" placeholder="Write a message" /><div><Button size="l" onPress={() => toast('Message sent')}>Send</Button></div></>}
      <Item label="Withdrawal to bank ••4471" description="Nov 21" value="2,000.00 USDC" badge={<Tone>Attached</Tone>} />
    </AppFrame>
  );
}
function ToggleStates({ value, onChange }) {
  return <Select aria-label="Prototype state" items={[{ id: 'received', label: 'Received' }, { id: 'waiting', label: 'Waiting for you' }, { id: 'late', label: 'Reply late' }, { id: 'resolved', label: 'Resolved' }, { id: 'complaint', label: 'Now a complaint' }]} selectedKey={value} onSelectionChange={onChange} className="lh-filter-select" />;
}

function AppSignIn({ preset }) {
  const [step, setStep] = useState(preset.signin || 'signin');
  const [what, setWhat] = useState('I lost my phone or second factor');
  const box = (children) => <div className="lh-signin-box">{children}</div>;
  let body;
  if (step === 'signin') body = box(<><h2 className="text-subtitle-medium">Sign in</h2><TextField label="Email" defaultValue="m••••@proton.me" /><TextField label="Password" type="password" defaultValue="••••••••••" /><Button size="l" onPress={() => toast('Wrong password')}>Sign in</Button><Button size="m" variant="ghost" tone="secondary" onPress={() => { setWhat('I forgot my password'); setStep('contact'); }}>Forgot your password?</Button><Button size="m" variant="ghost" tone="secondary" onPress={() => setStep('contact')}>Can’t sign in another way? Contact support</Button></>);
  else if (step === 'contact') body = box(<><h2 className="text-subtitle-medium">Contact support</h2><p className="text-body-medium lh-secondary">We’ll reply by email. You don’t need to be signed in.</p>
    <RadioGroup label="What’s happening?" options={['I forgot my password', 'I lost my phone or second factor', 'I think someone else has access']} value={what} onChange={setWhat} />
    {what === 'I forgot my password'
      ? <><Alert tone="info" title="You can reset it yourself">It’s faster than waiting for support, and your account stays safe.</Alert><Button size="l" onPress={() => toast('Reset link sent')}>Reset password</Button></>
      : <><TextField label="Email" defaultValue="m••••@proton.me" /><TextArea label="Anything that helps" placeholder="For example, when you last signed in" /><Button size="l" onPress={() => setStep('ack')}>Send</Button></>}
    <p className="text-body-small lh-secondary">We’ll never ask for your password, codes or card number.</p></>);
  else if (step === 'ack') body = box(<><h2 className="text-subtitle-medium">Thanks, we’ve got it</h2><p className="text-body-medium lh-secondary">If m••••@proton.me belongs to a Lighthouse account, we’ll email you within 3 hours.</p><Button size="l" onPress={() => setStep('confirm')}>Open the email link (prototype)</Button><Button size="m" variant="ghost" tone="secondary" onPress={() => setStep('signin')}>Back to sign in</Button></>);
  else if (step === 'confirm') body = box(<><h2 className="text-subtitle-medium">Confirm it’s you</h2><p className="text-body-medium lh-secondary">To add a new second factor, we need to check that you’re the account holder.</p><Item label="Photo of the ID you signed up with" /><Item label="A short selfie video" /><Tone>Link expires in 23 h</Tone>
    <ButtonGroup><Button size="l" variant="outlined" tone="secondary" onPress={() => setStep('failed')}>Fail the check (prototype)</Button><Button size="l" onPress={() => setStep('done')}>Start</Button></ButtonGroup><Button size="m" variant="ghost" tone="secondary" onPress={() => setStep('expired')}>Open after 24 hours (prototype)</Button></>);
  else if (step === 'done') body = box(<><h2 className="text-subtitle-medium">You’re back in</h2><p className="text-body-medium lh-secondary">Set up a new second factor to finish. We’ve sent a notice to your email.</p><Button size="l" onPress={() => toast('Second factor setup opens here')}>Set up second factor</Button></>);
  else if (step === 'failed') body = box(<><h2 className="text-subtitle-medium">We couldn’t confirm it’s you</h2><p className="text-body-medium lh-secondary">Your account stays protected and nothing has changed. If you think this is a mistake, contact us again.</p><Button size="l" variant="outlined" tone="secondary" onPress={() => setStep('contact')}>Contact support again</Button></>);
  else body = box(<><h2 className="text-subtitle-medium">This link has expired</h2><p className="text-body-medium lh-secondary">Links work for 24 hours. Contact us again and we’ll send a new one.</p><Button size="l" variant="outlined" tone="secondary" onPress={() => setStep('contact')}>Contact support again</Button></>);
  return <AppFrame title="Can’t sign in" note="PRD UX-129: the same text appears whether or not an account exists for the email.">{body}</AppFrame>;
}

function AppDispute() {
  const [signed, setSigned] = useState(false);
  return (
    <AppFrame title="Sign your dispute">
      <Alert tone="info" title="Support started this dispute for you">We need your signature before we can send it to the card network.</Alert>
      <Item label="Card · Grab Singapore" description="Nov 20 · card ••7712" value="−18.40" /><Item label="Reason" description="Charged more than once" /><Item label="What you told us" description="I was charged twice for the same ride." />
      <p className="text-body-small lh-secondary">Link valid for 7 days. We’ll update you here and in your message center.</p>
      <ButtonGroup><Button size="l" variant="outlined" tone="secondary" onPress={() => toast('Support will call you back')}>Something’s wrong</Button><Button size="l" isDisabled={signed} onPress={() => { setSigned(true); toast('Dispute signed and sent', 'success'); }}>{signed ? 'Signed' : 'Sign and send'}</Button></ButtonGroup>
    </AppFrame>
  );
}
function AppData() {
  return (
    <AppFrame title="Delete my data" note="Proposal: 30 days from the customer’s message, the strictest common period.">
      <Tone tone="azure">Data request</Tone><p className="text-body-small lh-secondary">Request DSR-0088 · from conversation CT-10490</p>
      <Alert tone="info" title="Your request is recorded">We’ll respond within 30 days of your message on Nov 24.</Alert>
      <Thread items={[['You', 'Nov 24, 09:12', 'Please delete all my data, I’m closing my account.', 'customer']]} />
    </AppFrame>
  );
}
function AppDeposit() {
  return (
    <AppFrame title="Deposit you reported">
      <Tone tone="azure">With Priya, operations</Tone><p className="text-body-small lh-secondary">Reported Nov 22 · 1,250.00 USDC on Solana</p>
      <Alert tone="info" title="Priya from our operations team is tracing it">She’s checking with our custody partner and will update you here.</Alert>
      <Item label="Your report" description="USDC on Solana · 5hT9…aQ2e" value="1,250.00" /><Item label="Latest check" description="Today, 10:14 · received by our custody partner" badge={<Tone tone="green">Located</Tone>} />
    </AppFrame>
  );
}
