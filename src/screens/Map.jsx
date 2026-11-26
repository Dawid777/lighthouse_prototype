import React from 'react';
import { Link } from '../serenity/Button.jsx';
import { Jewel } from '../icons.jsx';

// The prototype map: every screen and state of the prototype, grouped by flow, each a link that opens it (?screen=<id>).
const GROUPS = [
  ['Sign up', (id) => id.startsWith('signup')],
  ['Identity verification', (id) => id.startsWith('verify')],
  ['Add money', (id) => id.startsWith('add-money')],
  ['Home and the app pages', (id) => !/^(signup|verify|add-money|map|console)/.test(id)],
  ['Internal consoles: Compliance and Support', (id) => id.startsWith('console')],
];
const label = (id) => id.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

export function PrototypeMap({ screens }) {
  const ids = Object.keys(screens);
  return (
    <main id="main" tabIndex={-1} className="lh-map">
      <div className="lh-map-head">
        <Jewel size={36} />
        <h1 className="text-subtitle-large">Prototype map</h1>
        <p className="text-body-medium lh-secondary">The customer journey starts at <Link className="lh-inline-link" href="#/signup">Create account</Link>; the app is at <Link className="lh-inline-link" href="#/home">Home</Link> and the internal tools at <Link className="lh-inline-link" href="#/console/compliance">Consoles</Link>. Each link below opens one screen or state.</p>
      </div>
      {GROUPS.map(([name, test]) => (
        <section key={name} className="lh-map-group" aria-labelledby={`map-${name}`}>
          <h2 id={`map-${name}`} className="text-subtitle-small">{name}</h2>
          <ul className="lh-map-list">
            {ids.filter(test).map((id) => <li key={id}><Link href={`?screen=${id}`}>{label(id)}</Link></li>)}
          </ul>
        </section>
      ))}
    </main>
  );
}
