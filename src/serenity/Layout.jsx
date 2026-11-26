import React from 'react';
import { Disclosure as AriaDisclosure, DisclosurePanel, Heading, Button as AriaButton } from 'react-aria-components';
import { cx } from './Button.jsx';
import { Icon } from '../icons.jsx';

// Serenity PageControl with its PageIndicators: the step dots of a full-focus flow (SR-150), centred in the top bar. The dots
// are not buttons here (the steps run in order), so the control is one image of the progress with a text name.
export function PageControl({ count, current }) {
  return (
    <div className="srn-page-control" role="img" aria-label={`Step ${current} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={cx('srn-page-indicator', 'motion-feedback-indicator', i + 1 === current && 'is-current')} />
      ))}
    </div>
  );
}

// Serenity MediaFrame, media on: the brand photo (the template's glassRibbon photo, a placeholder until the Lighthouse brand
// image arrives), Corner radius/Container/L, ratio 4:5 beside the form and 16:9 under it.
export function MediaFrame({ src = './brand-glass-ribbon.jpg', ratio = '4:5', className }) {
  return (
    <div className={cx('srn-media-frame', `srn-media-frame--${ratio.replace(':', '-')}`, className)}>
      <img src={src} alt="" className="srn-media-img" />
    </div>
  );
}

// Serenity CheckItem: a check icon and one line.
export function CheckItem({ children, size = 'm' }) {
  return (
    <li className={cx('srn-check-item', size === 'l' ? 'text-body-large' : 'text-body-medium')}>
      <span className="srn-check-icon" aria-hidden="true"><Icon name="check" size={16} /></span>
      <span>{children}</span>
    </li>
  );
}
export function CheckList({ children }) {
  return <ul className="srn-check-list">{children}</ul>;
}

// Serenity Disclosure over the React Aria Disclosure: the trigger row with the chevron (Feedback/Rotate) and the panel
// (Expand/Height).
export function Disclosure({ title, children }) {
  return (
    <AriaDisclosure className="srn-disclosure">
      <Heading level={3} className="srn-disclosure-heading">
        <AriaButton slot="trigger" className={({ isFocusVisible }) => cx('srn-disclosure-trigger', 'text-body-strong-medium', 'motion-feedback-hover', isFocusVisible && 'effect-focus-neutral')}>
          <span className="srn-disclosure-chevron motion-feedback-rotate" aria-hidden="true"><Icon name="chevron-down" size={16} /></span>
          {title}
        </AriaButton>
      </Heading>
      <DisclosurePanel className="srn-disclosure-panel motion-expand-height">
        <div className="text-body-medium srn-disclosure-body">{children}</div>
      </DisclosurePanel>
    </AriaDisclosure>
  );
}
