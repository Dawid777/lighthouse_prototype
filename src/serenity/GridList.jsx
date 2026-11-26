import React from 'react';
import { GridList as AriaGridList, GridListItem as AriaGridListItem } from 'react-aria-components';
import { cx } from './Button.jsx';
import { Icon } from '../icons.jsx';

// Serenity GridList with its GridListHeader: a list people move through with the arrow keys; Enter or a press runs onAction.
// The header is drawn above the rows and names the list (aria-labelledby).
export function GridList({ id, header, children, onAction, className }) {
  const headerId = `${id}-header`;
  return (
    <div className={cx('srn-gridlist-wrap', className)}>
      {header && <h2 id={headerId} className="srn-gridlist-header text-label-strong-small">{header}</h2>}
      <AriaGridList aria-labelledby={header ? headerId : undefined} aria-label={header ? undefined : id} onAction={onAction} className="srn-gridlist" layout="stack">
        {children}
      </AriaGridList>
    </div>
  );
}

// Serenity GridListItem, size l (44 high on touch): label, description, the value before the chevron (iconTrailing).
// A row inserted by the person enters with Enter/Item.
export function GridListItem({ id, children, description, value, isNew, ...props }) {
  return (
    <AriaGridListItem id={id} textValue={typeof children === 'string' ? children : undefined} {...props}
      className={({ isFocusVisible }) => cx('srn-gridlist-item', 'motion-feedback-hover', isNew && 'motion-enter-item', isFocusVisible && 'effect-focus-inset-neutral')}>
      <span className="srn-gridlist-text">
        <span className="srn-gridlist-label text-body-large">{children}</span>
        {description && <span className="srn-gridlist-desc text-body-medium">{description}</span>}
      </span>
      {value && <span className="srn-gridlist-value text-body-large num">{value}</span>}
      <span className="srn-gridlist-chevron" aria-hidden="true"><Icon name="chevron-right" /></span>
    </AriaGridListItem>
  );
}
