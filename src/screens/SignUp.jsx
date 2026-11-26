import React, { useEffect, useRef, useState } from 'react';
import {
  Form, DialogTrigger, Popover as AriaPopover, Dialog as AriaDialog, Button as AriaButton, Autocomplete, useFilter, SearchField,
  Input, Group, ListBox, ListBoxItem,
} from 'react-aria-components';
import { Button, ButtonIcon, Link, SocialSignInButton, cx } from '../serenity/Button.jsx';
import { TextField, OTPField } from '../serenity/Fields.jsx';
import { Dialog, Modal, Tooltip, toast } from '../serenity/Overlays.jsx';
import { Meter } from '../serenity/Status.jsx';
import { MediaFrame } from '../serenity/Layout.jsx';
import { Icon, Jewel, GoogleMark } from '../icons.jsx';

// Sign up: email or phone (Figma page "1. Sign up: email or phone", node 8:2971, the split layout of the Serenity Sign up
// template). Steps live in the hash (#/signup/<step>), so the browser's Back goes to the previous step.
//   start (1.0) → password (1.1) → check-email (1.2) → the link in the email → Identity verification
//   start (1.0, a mobile number) → code (1.3) → Identity verification;  expired (1.4) is the link opened after 24 hours.
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => (reduced() ? 0 : ms);
const COUNTRIES = [
  { id: 'es', name: 'Spain', code: '+34', flag: '🇪🇸' }, { id: 'de', name: 'Germany', code: '+49', flag: '🇩🇪' },
  { id: 'pl', name: 'Poland', code: '+48', flag: '🇵🇱' }, { id: 'pt', name: 'Portugal', code: '+351', flag: '🇵🇹' },
  { id: 'gb', name: 'United Kingdom', code: '+44', flag: '🇬🇧' }, { id: 'us', name: 'United States', code: '+1', flag: '🇺🇸' },
];
const WORDS = ['watch', 'hand', 'sand', 'banana', 'river', 'paper', 'lemon', 'cloud', 'tiger', 'orbit', 'maple', 'piano', 'candle', 'harbor', 'velvet', 'pepper', 'island', 'rocket', 'meadow', 'copper'];
const fourWords = () => Array.from({ length: 4 }, () => WORDS[Math.floor(Math.random() * WORDS.length)]).join(' ');
const isPhone = (v) => /^[+\d(]/.test(v.trim());
const digits = (v) => v.replace(/\D/g, '');
const groupDigits = (d) => d.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
// In the prototype an address at firefly.com already has an account (1.0.d), and the SMS code is 2137.
const hasAccount = (v) => /@firefly\.com$/i.test(v.trim());
const CODE = '2137';

// Password strength for the Meter: the suggested four words are very strong; otherwise length and variety decide.
function strength(pw, suggested) {
  if (!pw) return null;
  if (pw === suggested || pw.trim().split(/\s+/).length >= 4) return { value: 100, label: 'Very strong', tone: 'success' };
  let s = 0;
  if (pw.length >= 10) s += 1; if (pw.length >= 14) s += 1; if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 1; if (/\d/.test(pw) && /[^\w\s]/.test(pw)) s += 1;
  return [
    { value: 15, label: 'Very weak', tone: 'danger' }, { value: 35, label: 'Weak', tone: 'danger' }, { value: 55, label: 'Fair', tone: 'warning' },
    { value: 80, label: 'Strong', tone: 'success' }, { value: 100, label: 'Very strong', tone: 'success' },
  ][s];
}

// The split layout (template 3.0 Start: split): the form side with the jewel, the brand media beside it from 1024, under the
// form at 768 on the steps whose template shows it (start, check-email, expired), none at 390.
function AuthLayout({ children, mediaBelow = false, footer = false }) {
  return (
    <div className={cx('lh-auth', mediaBelow && 'has-media-below')}>
      <div className="lh-auth-form">
        <header className="lh-auth-header"><a href="#/signup" className="lh-auth-logo" aria-label="Lighthouse"><Jewel size={32} /></a></header>
        <main id="main" className="lh-auth-main" tabIndex={-1}>
          <div className="lh-auth-content motion-navigate-fade">
            <span className="lh-auth-logo-inline" aria-hidden="true"><Jewel size={32} /></span>
            {children}
          </div>
        </main>
        {footer && <footer className="lh-auth-footer"><Link onPress={() => toast('Terms open in a new tab in the product')}>Terms and privacy</Link></footer>}
      </div>
      <div className="lh-auth-brand" aria-hidden="true"><MediaFrame ratio="4:5" /></div>
      {mediaBelow && <div className="lh-auth-media-below" aria-hidden="true"><MediaFrame ratio="16:9" /></div>}
    </div>
  );
}

const Title = ({ children, description }) => (
  <div className="lh-auth-heading">
    <h1 className="text-subtitle-large">{children}</h1>
    {description && <p className="text-body-medium lh-secondary">{description}</p>}
  </div>
);
const Legal = () => (
  <p className="text-body-medium lh-secondary">By continuing, you agree to our{' '}
    <AriaButton className={({ isFocusVisible }) => cx('lh-inline-link', isFocusVisible && 'effect-focus-neutral')} onPress={() => toast('Terms open in a new tab in the product')}>Terms and privacy</AriaButton>.
  </p>
);
const Switch = ({ question, children, ...props }) => (
  <p className="text-body-medium lh-secondary lh-switch">{question} <Link {...props} className="lh-inline-link">{children}</Link></p>
);
const ProtoNote = ({ children }) => <p className="text-caption-small lh-proto-note">{children}</p>;

// The country of the mobile number: a Popover with a SearchField over the list of countries (1.0.b).
function CountryPicker({ country, onChange, defaultOpen }) {
  const { contains } = useFilter({ sensitivity: 'base' });
  return (
    <DialogTrigger defaultOpen={defaultOpen}>
      <AriaButton aria-label={`Country code: ${country.name} ${country.code}`} className={({ isFocusVisible }) => cx('lh-country', 'text-body-large', 'motion-feedback-hover', isFocusVisible && 'effect-focus-neutral')}>
        <span aria-hidden="true">{country.flag}</span><span className="num">{country.code}</span><Icon name="chevron-down" size={16} />
      </AriaButton>
      <AriaPopover placement="bottom start" offset={8} className="srn-popover srn-popover--list lh-country-popover effect-elevation-overlay motion-enter-pop motion-exit-pop">
        <AriaDialog aria-label="Country code" className="lh-country-dialog">
          {({ close }) => (
            <Autocomplete filter={contains}>
              <SearchField aria-label="Search countries" autoFocus className="lh-country-search">
                <Group className={({ isFocusWithin }) => cx('srn-field-group', isFocusWithin ? 'effect-focus-neutral' : 'effect-field-default')}>
                  <span className="lh-muted" aria-hidden="true"><Icon name="search-s" size={16} /></span>
                  <Input placeholder="Search countries" className="srn-input text-body-medium" />
                </Group>
              </SearchField>
              <ListBox aria-label="Countries" className="srn-listbox" selectionMode="single" disallowEmptySelection selectedKeys={[country.id]}
                onSelectionChange={(keys) => { const [k] = [...keys]; if (k) { onChange(COUNTRIES.find((c) => c.id === k)); close(); } }}
                renderEmptyState={() => <p className="srn-listbox-empty text-body-medium">No country matches.</p>}>
                {COUNTRIES.map((c) => (
                  <ListBoxItem key={c.id} id={c.id} textValue={`${c.name} ${c.code}`} className={({ isFocused, isSelected }) => cx('srn-listbox-item', 'text-body-medium', isFocused && 'is-focused', isSelected && 'is-selected')}>
                    <span aria-hidden="true">{c.flag}</span> {c.name} ({c.code})
                  </ListBoxItem>
                ))}
              </ListBox>
            </Autocomplete>
          )}
        </AriaDialog>
      </AriaPopover>
    </DialogTrigger>
  );
}

export function SignUp({ step = 'start', preset = {}, go }) {
  const [contact, setContact] = useState(preset.contact ?? '');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [suggested, setSuggested] = useState('watch hand sand banana');
  const [password, setPassword] = useState(preset.password ?? 'watch hand sand banana');
  const [code, setCode] = useState(preset.code ?? '');
  const [errors, setErrors] = useState(preset.errors || {});
  const [play, setPlay] = useState(0);
  const [pending, setPending] = useState(!!preset.pending);
  const [why, setWhy] = useState(!!preset.why);
  const [seconds, setSeconds] = useState(32);
  const fieldRef = useRef(null);
  const email = isEmail(contact) ? contact.trim() : 'amara.okafor@example.com';

  const mounted = useRef(false);
  useEffect(() => { if (mounted.current) { setErrors({}); setPending(false); } mounted.current = true; }, [step]); // each step starts clean
  useEffect(() => { if (step !== 'code') return undefined; setSeconds(32); const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, [step]);
  useEffect(() => { if (preset.pending) { const t = setTimeout(() => go('check-email'), 2500); return () => clearTimeout(t); } return undefined; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (play) fieldRef.current?.focus(); }, [play]);
  const fail = (errs) => { setErrors(errs); setPlay((n) => n + 1); };

  if (step === 'start') {
    const phone = contact && isPhone(contact);
    const label = !contact ? 'Email or mobile' : phone ? 'Mobile' : 'Email';
    const submit = (e) => {
      e.preventDefault();
      if (!contact.trim()) return fail({ contact: 'Enter your email or mobile number.' });
      if (phone) {
        if (digits(contact).length < 9) return fail({ contact: 'Enter the whole mobile number.' });
        return go('code');
      }
      if (!isEmail(contact)) return fail({ contact: 'Enter an email like name@example.com.' });
      if (hasAccount(contact)) return fail({ contact: 'This email already has an account. Sign in below.' });
      return go('password');
    };
    return (
      <AuthLayout mediaBelow>
        <Title>Create account</Title>
        <Form onSubmit={submit} validationBehavior="aria" className="lh-auth-form-fields">
          <TextField key={`c-${play}`} label={label} placeholder="name@example.com" autoFocus inputRef={fieldRef} autoComplete="username"
            type={phone ? 'tel' : 'text'} size="l" value={phone ? groupDigits(digits(contact)) : contact}
            onChange={(v) => { setContact(isPhone(v) ? digits(v) : v); setErrors({}); }}
            prefix={phone ? <CountryPicker country={country} onChange={setCountry} defaultOpen={preset.countryOpen} /> : null}
            isInvalid={!!errors.contact} errorMessage={errors.contact} playError={!!errors.contact && play > 0} />
          <Button type="submit" size="l">Continue</Button>
        </Form>
        <div className="lh-or text-body-medium" role="separator">or</div>
        <SocialSignInButton mark={<GoogleMark />} onPress={() => { toast('Signed up with Google', 'success'); location.hash = '#/verify'; }}>Continue with Google</SocialSignInButton>
        <Legal />
        <Switch question="Already a member?" href="#/home">Sign in</Switch>
        <ProtoNote>Prototype: an address at firefly.com already has an account.</ProtoNote>
      </AuthLayout>
    );
  }

  if (step === 'password') {
    const st = strength(password, suggested);
    const submit = (e) => {
      e.preventDefault();
      if (!isEmail(email)) return fail({ email: 'Enter an email like name@example.com.' });
      if (!password) return fail({ password: 'Choose a password.' });
      if (st.value < 55) return fail({ password: 'Use four random words or a longer password.' });
      setPending(true);
      setTimeout(() => go('check-email'), wait(1200));
      return undefined;
    };
    const regenerate = () => { const w = fourWords(); setSuggested(w); setPassword(w); setErrors({}); };
    return (
      <AuthLayout>
        <Title>Create account</Title>
        <Form onSubmit={submit} validationBehavior="aria" className="lh-auth-form-fields">
          <TextField label="Email" size="l" value={email} onChange={(v) => setContact(v)} autoComplete="username" isReadOnly={pending}
            isInvalid={!!errors.email} errorMessage={errors.email} />
          <div className="lh-stack lh-stack--tight">
            <TextField key={`p-${play}`} label="Password" size="l" value={password} inputRef={fieldRef} autoComplete="new-password" isReadOnly={pending}
              onChange={(v) => { setPassword(v); setErrors({}); }} isInvalid={!!errors.password} errorMessage={errors.password} playError={!!errors.password && play > 0}
              trailing={<Tooltip content="Suggest new words" placement="top"><ButtonIcon size="xs" isSquare={false} aria-label="Suggest new words" onPress={regenerate} isDisabled={pending}><Icon name="refresh" size={16} /></ButtonIcon></Tooltip>} />
            {st && <Meter label="Password strength" value={st.value} valueLabel={st.label} tone={st.tone} />}
            <div><Link size="s" tone="secondary" onPress={() => setWhy(true)}>Why four random words?</Link></div>
          </div>
          <Button type="submit" size="l" isPending={pending} pendingLabel="Creating account">Continue</Button>
        </Form>
        <Legal />
        <Modal isOpen={why} onOpenChange={setWhy}>
          <Dialog title="Why four random words?" isDismissible>
            <p className="text-body-medium lh-secondary">Four-word passwords are easy to remember yet harder to hack.</p>
          </Dialog>
        </Modal>
      </AuthLayout>
    );
  }

  if (step === 'check-email') {
    return (
      <AuthLayout mediaBelow footer>
        <Title description="Check your email inbox and click on the link we sent to confirm registration.">Check your email</Title>
        <Button variant="outlined" tone="secondary" size="l" onPress={() => toast(`New link sent to ${email}`)}>Send a new link</Button>
        <Switch question="Wrong email?" onPress={() => go('start')}>Change it</Switch>
        <ProtoNote>Prototype: <Link size="s" className="lh-inline-link" href="#/verify">open the link from the email</Link> or <Link size="s" className="lh-inline-link" onPress={() => go('expired')}>open it after 24 hours</Link>.</ProtoNote>
      </AuthLayout>
    );
  }

  if (step === 'code') {
    const submit = (e) => {
      e.preventDefault();
      if (code.length < 4) return fail({ code: 'Enter all 4 digits.' });
      if (code !== CODE) return fail({ code: 'This code is wrong. Check the SMS or send a new code.' });
      setPending(true);
      setTimeout(() => { toast('Account created', 'success'); location.hash = '#/verify'; }, wait(1000));
      return undefined;
    };
    return (
      <AuthLayout>
        <Title>Create account</Title>
        <Form onSubmit={submit} validationBehavior="aria" className="lh-auth-form-fields">
          <OTPField key={`o-${play}`} label="Verification code" value={code} onChange={(v) => { setCode(v); setErrors({}); }} autoFocus inputRef={fieldRef}
            description="Enter the 4-digit code sent to your phone number via SMS." isInvalid={!!errors.code} errorMessage={errors.code} playError={!!errors.code && play > 0} />
          <p className="text-body-medium lh-secondary lh-switch">Didn’t get it?{' '}
            {seconds > 0
              ? <span className="lh-muted num">Resend (0:{String(seconds).padStart(2, '0')})</span>
              : <Link className="lh-inline-link" onPress={() => { setSeconds(32); toast('New code sent'); }}>Resend</Link>}
          </p>
          <Button type="submit" size="l" isPending={pending} pendingLabel="Creating account">Create account</Button>
        </Form>
        <Legal />
        <ProtoNote>Prototype: the code is {CODE}.</ProtoNote>
      </AuthLayout>
    );
  }

  // expired (1.4)
  return (
    <AuthLayout mediaBelow footer>
      <Title description={`Links work for 24 hours. We can send a new one to ${email}.`}>This link has expired</Title>
      <Button size="l" onPress={() => { toast(`New link sent to ${email}`); go('check-email'); }}>Send a new link</Button>
      <Switch question="Already confirmed?" href="#/home">Sign in</Switch>
    </AuthLayout>
  );
}
