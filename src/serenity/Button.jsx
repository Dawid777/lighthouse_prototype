import React from 'react';
import { Button as AriaButton, Link as AriaLink } from 'react-aria-components';
import { ProgressCircle } from './ProgressCircle.jsx';

export const cx = (...a) => a.filter(Boolean).join(' ');

// Serenity Button over the React Aria Button (get_component "Button"): variant, tone, size xs–xxl, isSquare (off: the pill;
// RQ-066), isPending, leading and trailing. Press motion Feedback/Press; isPending swaps the label for ProgressCircle
// with Feedback/Pending. With href it renders a React Aria Link drawn as the same Button.
export function Button({ variant = 'solid', tone = 'primary', size = 'xs', isSquare = false, isPending = false, pendingLabel, leading, trailing, className, children, href, ...props }) {
  const cls = ({ isFocusVisible }) => cx(
    'srn-button', `srn-button--${variant}-${tone}`, `srn-size-${size}`, isSquare && 'srn-button--square',
    'text-label-medium', 'motion-feedback-press', isFocusVisible && 'effect-focus-neutral', className,
  );
  if (href) {
    return <AriaLink href={href} {...props} className={cls}><span className="srn-button-label">{leading}{children}{trailing}</span></AriaLink>;
  }
  return (
    <AriaButton {...props} isPending={isPending} className={cls}>
      <span className="motion-feedback-pending">
        <span data-motion-part="label" className="srn-button-label">{leading}{children}{trailing}</span>
        <span data-motion-part="spinner"><ProgressCircle label={pendingLabel || 'Loading'} isHidden={!isPending} /></span>
      </span>
    </AriaButton>
  );
}

// Serenity Button: Icon, an icon-only Button; aria-label names it. isSquare on (the Figma default isRounded=off) takes the
// size radius, off is the circle.
export function ButtonIcon({ variant = 'ghost', tone = 'secondary', size = 'xs', isSquare = true, className, children, ...props }) {
  return (
    <AriaButton
      {...props}
      className={({ isFocusVisible }) => cx('srn-button-icon', `srn-button-icon--${variant}-${tone}`, `srn-size-${size}`, !isSquare && 'srn-button-icon--round', 'motion-feedback-press', isFocusVisible && 'effect-focus-neutral', className)}
    >
      {children}
    </AriaButton>
  );
}

// Serenity ButtonGroup: the Buttons that finish a task, side by side (they share the width in a Dialog footer).
export function ButtonGroup({ children, className }) {
  return <div className={cx('srn-button-group', className)}>{children}</div>;
}

// Serenity Link over the React Aria Link: tone and size; standalone (not inline).
export function Link({ tone = 'primary', size = 's', className, children, ...props }) {
  return (
    <AriaLink {...props} className={({ isFocusVisible }) => cx('srn-link', `srn-link--${tone}`, size === 's' ? 'text-body-medium' : 'text-body-large', 'motion-feedback-hover', isFocusVisible && 'effect-focus-neutral', className)}>
      {children}
    </AriaLink>
  );
}
