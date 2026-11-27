import React, { useEffect, useRef, useState } from 'react';
import { Keyboard as AriaKeyboard } from 'react-aria-components';
import { cx } from './Button.jsx';
import { Icon } from '../icons.jsx';

// Feedback/Value: a shown number that changes cross-fades its new value in (the old one leaves upward).
export function Value({ children, className }) {
  const [prev, setPrev] = useState(null);
  const last = useRef(children);
  useEffect(() => {
    if (last.current !== children) { setPrev(last.current); last.current = children; const t = setTimeout(() => setPrev(null), 400); return () => clearTimeout(t); }
  }, [children]);
  return (
    <span className={cx('motion-feedback-value', className)}>
      <span data-motion-part="slot">
        {prev !== null && <span data-motion-part="leave" aria-hidden="true">{prev}</span>}
        <span data-motion-part={prev !== null ? 'enter' : undefined}>{children}</span>
      </span>
    </span>
  );
}

// Serenity Stat: the value (size l Web/Display/Large, m Web/Display/Small), its label and an optional description line.
export function Stat({ value, children, description, size = 'm', id }) {
  return (
    <div className={cx('srn-stat', `srn-stat--${size}`)}>
      <p id={id} className={cx(size === 'l' ? 'text-web-display-large' : 'text-web-display-small', 'srn-stat-value', 'num')}><Value>{value}</Value></p>
      <p className={cx(size === 'l' ? 'text-web-body-large' : 'text-web-body-medium', 'srn-stat-label')}>{children}</p>
      {description && <p className="text-web-label-small srn-stat-desc num">{description}</p>}
    </div>
  );
}

// Serenity Badge (subtle, neutral, size m by default).
export function Badge({ children, variant = 'subtle', tone = 'neutral', size = 'm' }) {
  return <span className={cx('srn-badge', `srn-badge--${variant}-${tone}`, `srn-size-${size}`, 'text-caption-strong-small')}>{children}</span>;
}

// Serenity EmptyState: the icon, the title, the description and one action (outlined, secondary).
export function EmptyState({ icon = 'inbox', title, description, action, size = 's', headingLevel = 3 }) {
  const H = `h${headingLevel}`;
  return (
    <div className={cx('srn-empty', `srn-empty--${size}`)}>
      <span className="srn-empty-icon" aria-hidden="true"><Icon name={icon} /></span>
      <div className="srn-empty-text">
        <H className="text-body-strong-medium srn-empty-title">{title}</H>
        {description && <p className="text-body-medium srn-empty-desc">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// Serenity DescriptionList, isStriped (SR-271: no lines between rows, every other row on Surface/Sunken), labelPosition side.
export function DescriptionList({ items, columns }) {
  return (
    <dl className={columns ? 'srn-dl srn-dl--columns' : 'srn-dl'}>
      {items.filter(Boolean).map(([term, value]) => (
        <div className="srn-dl-item" key={term}>
          <dt className="text-body-medium srn-dl-term">{term}</dt>
          <dd className="text-body-medium srn-dl-value num">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// Serenity Avatar: the person's photo, never initials (SR-291).
export function Avatar({ src, size = 's', alt = '' }) {
  return <img className={cx('srn-avatar', `srn-avatar--${size}`)} src={src} alt={alt} />;
}

// Serenity Keyboard: the shortcut as keys (<kbd>), size m next to Body/Medium text.
export function Keyboard({ children, size = 'm', className }) {
  return <AriaKeyboard className={cx('srn-keyboard', size === 'm' ? 'text-body-medium' : 'text-body-small', className)}>{children}</AriaKeyboard>;
}

// Serenity PageHeader at the top of the Pane: the page h1 in Subtitle/Medium.
export function PageHeader({ children, toolbar }) {
  return (
    <header className="srn-page-header">
      <h1 className="text-subtitle-medium srn-page-title">{children}</h1>
      {toolbar}
    </header>
  );
}
