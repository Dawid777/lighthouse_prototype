import React, { useEffect, useState } from 'react';
import { Form } from 'react-aria-components';
import { Button, ButtonIcon, Link, cx } from '../serenity/Button.jsx';
import { Select, SelectBoxGroup } from '../serenity/Fields.jsx';
import { Tooltip, toast } from '../serenity/Overlays.jsx';
import { Banner, ProgressBar } from '../serenity/Status.jsx';
import { PageControl, CheckItem, CheckList } from '../serenity/Layout.jsx';
import { Icon, Jewel } from '../icons.jsx';

// Identity verification: ID and selfie (Figma page "👷 Design: Identity verification", node 17:6445, after the review fixes of
// Nov 26, 2026). Onboarding is full focus (SR-150): no Sidebar, an arrow back, the step dots in a PageControl centred in the
// top bar, the person's Avatar at the trailing end. Steps live in the hash (#/verify/<step>).
//   start (1.0) → document (1.1) → id-ready (1.2) → camera (1.2.a) → selfie (1.3) → face-scan (1.3.a) → checking (1.4) → done (1.5)
//   failed (1.5.a) and the unreadable photo (1.2.b) are the failure states.
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DOCS = [
  { id: 'id-card', label: 'ID card', description: 'Front and back', icon: 'id-card', noun: 'ID card' },
  { id: 'residence', label: 'Residence permit', description: 'Front and back', icon: 'id-card', noun: 'residence permit' },
  { id: 'passport', label: 'Passport', description: 'Photo page', icon: 'id-card', noun: 'passport' },
  { id: 'licence', label: 'Driving licence', description: 'Front and back', icon: 'id-card', noun: 'driving licence' },
];
const COUNTRIES = ['United Arab Emirates', 'Germany', 'Poland', 'Portugal', 'Spain', 'United Kingdom', 'United States'];
const DOTS = { document: 1, 'id-ready': 2, selfie: 3, checking: 4 };
const BACK = { start: null, document: 'start', 'id-ready': 'document', camera: 'id-ready', selfie: 'id-ready', 'face-scan': 'selfie', failed: null, done: null, checking: null };

function FlowLayout({ step, onBack, account, dark, title, children }) {
  const dots = DOTS[step];
  return (
    <div className={cx('lh-flow', dark && 'lh-flow--dark')} data-theme={dark ? 'dark' : undefined}>
      <header className="lh-flow-header">
        <div className="lh-flow-leading">
          {onBack && (
            <Tooltip content="Back" placement="bottom">
              <ButtonIcon size="m" isSquare={false} variant="ghost" aria-label="Back" onPress={onBack} className={dark ? 'lh-on-dark' : undefined}><Icon name="chevron-left" size={20} /></ButtonIcon>
            </Tooltip>
          )}
        </div>
        <div className="lh-flow-center">
          {dots && <PageControl count={4} current={dots} />}
          {title && <p className="text-body-strong-medium">{title}</p>}
        </div>
        <div className="lh-flow-trailing">{!dark && account}</div>
      </header>
      <main id="main" className="lh-flow-main" tabIndex={-1}>
        <div key={step} className="lh-flow-column motion-navigate-fade">{children}</div>
      </main>
    </div>
  );
}

const Head = ({ children, description }) => (
  <div className="lh-flow-heading">
    <span className="lh-flow-jewel" aria-hidden="true"><Jewel size={36} /></span>
    <h1 className="text-subtitle-large">{children}</h1>
    {description && <p className="text-body-medium lh-secondary">{description}</p>}
  </div>
);

export function Verify({ step = 'start', preset = {}, go, account }) {
  const [country, setCountry] = useState('United Arab Emirates');
  const [doc, setDoc] = useState(preset.doc ?? (step === 'document' ? null : 'id-card'));
  const [docError, setDocError] = useState(preset.docError || '');
  const [unreadable, setUnreadable] = useState(!!preset.unreadable);
  const [flash, setFlash] = useState(false);
  const d = DOCS.find((x) => x.id === doc) || DOCS[0];
  const back = BACK[step] ? () => go(BACK[step]) : null;
  const home = (msg, tone) => { toast(msg, tone); location.hash = '#/home'; };

  // The face scan and the check run by themselves: about 2.5 s for the scan, 3.5 s for the check in the prototype.
  useEffect(() => {
    if (step === 'face-scan') { const t = setTimeout(() => go('checking'), 2500); return () => clearTimeout(t); }
    if (step === 'checking') { const t = setTimeout(() => go('done'), 3500); return () => clearTimeout(t); }
    return undefined;
  }, [step, go]);

  if (step === 'start') {
    return (
      <FlowLayout step={step} account={account} onBack={() => { if (history.length > 1) history.back(); else location.hash = '#/home'; }}>
        <Head description="Two quick steps, about 2 minutes.">Verify your identity</Head>
        <ul className="lh-flow-steps">
          <li><span className="lh-flow-step-icon" aria-hidden="true"><Icon name="id-card" size={24} /></span><span><span className="text-body-strong-medium">A photo of your ID</span><span className="text-body-medium lh-secondary">Passport, ID card, residence permit or driving licence</span></span></li>
          <li><span className="lh-flow-step-icon" aria-hidden="true"><Icon name="face-id" size={24} /></span><span><span className="text-body-strong-medium">A quick selfie</span><span className="text-body-medium lh-secondary">So we know the ID is yours</span></span></li>
        </ul>
        <Button size="l" onPress={() => go('document')}>Start verification</Button>
        <p className="lh-flow-trust text-body-small lh-secondary"><Icon name="lock" size={16} />Encrypted and checked by Sumsub. Used only to verify you.</p>
      </FlowLayout>
    );
  }

  if (step === 'document') {
    const submit = (e) => { e.preventDefault(); if (!doc) { setDocError('Choose a document to continue.'); return; } go('id-ready'); };
    return (
      <FlowLayout step={step} onBack={back} account={account}>
        <Head>Choose your document</Head>
        <Form onSubmit={submit} validationBehavior="aria" className="lh-flow-form">
          <Select label="Issuing country" items={COUNTRIES} selectedKey={country} onSelectionChange={setCountry} size="l" />
          <SelectBoxGroup aria-label="Document" orientation="vertical" value={doc} onChange={(v) => { setDoc(v); setDocError(''); }}
            options={DOCS} isInvalid={!!docError} errorMessage={docError} />
          <Button type="submit" size="l">Continue</Button>
        </Form>
        <div><Link onPress={() => toast('National ID number check opens here in the product')}>Use your national ID number instead</Link></div>
      </FlowLayout>
    );
  }

  if (step === 'id-ready') {
    return (
      <FlowLayout step={step} onBack={back} account={account}>
        <Head>{`Get your ${d.noun} ready`}</Head>
        {unreadable && <Banner tone="danger" title="We couldn’t read the photo. Hold the card still in good light and try again." />}
        <CheckList>
          <CheckItem>Use the original card, not a copy</CheckItem>
          <CheckItem>Find a well-lit place without glare</CheckItem>
          <CheckItem>Keep all four corners in the photo</CheckItem>
        </CheckList>
        <Button size="l" onPress={() => go('camera')}>{unreadable ? 'Take photo again' : 'Take photo'}</Button>
        <div><Link onPress={() => { setUnreadable(false); toast(`${d.label} photo added`, 'success'); go('selfie'); }}>Upload a file instead</Link></div>
      </FlowLayout>
    );
  }

  if (step === 'camera') {
    const shoot = () => { setFlash(true); setTimeout(() => { setFlash(false); setUnreadable(false); go('selfie'); }, reduced() ? 0 : 450); };
    return (
      <FlowLayout step={step} onBack={back} account={account} dark title={`Front of your ${d.noun}`}>
        <div className={cx('lh-viewfinder', flash && 'is-flash')}><Icon name="scan" size={320} /></div>
        <p className="text-body-medium lh-flow-caption" aria-live="polite">{flash ? 'Photo taken' : `Fit the front of your ${d.noun === 'passport' ? 'photo page' : 'card'} inside the frame`}</p>
        <Tooltip content="Take photo" placement="top">
          <ButtonIcon size="l" isSquare={false} variant="solid" tone="staticwhite" aria-label="Take photo" onPress={shoot} className="lh-shutter"><Icon name="camera" size={20} /></ButtonIcon>
        </Tooltip>
      </FlowLayout>
    );
  }

  if (step === 'selfie') {
    return (
      <FlowLayout step={step} onBack={back} account={account}>
        <Head>Take a quick selfie</Head>
        <CheckList>
          <CheckItem>Find a well-lit place</CheckItem>
          <CheckItem>Keep your face inside the frame</CheckItem>
          <CheckItem>Take off hats and sunglasses</CheckItem>
        </CheckList>
        <Button size="l" onPress={() => go('face-scan')}>Start face scan</Button>
      </FlowLayout>
    );
  }

  if (step === 'face-scan') {
    return (
      <FlowLayout step={step} onBack={back} account={account} dark title="Face scan">
        <div className="lh-viewfinder lh-viewfinder--face"><Icon name="face-id" size={160} /></div>
        <p className="text-body-medium lh-flow-caption" aria-live="polite">Move your face into the frame and hold still</p>
      </FlowLayout>
    );
  }

  if (step === 'checking') {
    return (
      <FlowLayout step={step} onBack={back} account={account}>
        <Head description="This usually takes under 2 minutes. You can leave this page, we’ll email you when it’s done.">Checking your documents</Head>
        <ProgressBar label="Checking your ID and selfie" isIndeterminate />
        <Button size="l" onPress={() => home('We’ll email you when it’s done')}>Back to Lighthouse</Button>
      </FlowLayout>
    );
  }

  if (step === 'failed') {
    return (
      <FlowLayout step={step} onBack={back} account={account}>
        <Head>We couldn’t verify you</Head>
        <Banner tone="danger" title="Your selfie didn’t match the photo on your ID card." />
        <CheckList>
          <CheckItem>Use the same ID card as before</CheckItem>
          <CheckItem>Face the camera in good light</CheckItem>
        </CheckList>
        <Button size="l" onPress={() => go('selfie')}>Try again</Button>
        <div><Link onPress={() => toast('Support chat opens here in the product')}>Contact support</Link></div>
      </FlowLayout>
    );
  }

  // done (1.5)
  return (
    <FlowLayout step={step} onBack={back} account={account}>
      <Head>You’re verified</Head>
      <CheckList>
        <CheckItem>{`${d.label} checked`}</CheckItem>
        <CheckItem>Selfie matched</CheckItem>
      </CheckList>
      <Button size="l" onPress={() => home('Identity verified', 'success')}>Go to Home</Button>
    </FlowLayout>
  );
}
