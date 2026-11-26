import React from 'react';
import {
  ModalOverlay, Modal as AriaModal, Dialog as AriaDialog, Heading, Text, SheetOverlay, Sheet as AriaSheet,
  Popover as AriaPopover, Menu as AriaMenu, MenuItem as AriaMenuItem, MenuSection as AriaMenuSection, Header, Separator,
  TooltipTrigger, Tooltip as AriaTooltip, OverlayArrow,
  UNSTABLE_ToastRegion as ToastRegion, UNSTABLE_Toast as AriaToast, UNSTABLE_ToastContent as ToastContent, UNSTABLE_ToastQueue as ToastQueue,
  Button as AriaButton,
} from 'react-aria-components';
import { flushSync } from 'react-dom';
import { cx, ButtonIcon } from './Button.jsx';
import { Icon } from '../icons.jsx';

// Serenity Dialog: the title (Subtitle/Small), an optional subtitle, the body Slot and the ButtonGroup footer. isDismissible
// shows the close Button: Icon (slot="close"); a Dialog shows Cancel or the X, never both (SR-059).
export function Dialog({ title, subtitle, isDismissible = false, footer, children, className, ...props }) {
  return (
    <AriaDialog {...props} className={cx('srn-dialog', className)}>
      <div className="srn-dialog-head">
        <div className="srn-dialog-titles">
          <Heading slot="title" className="text-subtitle-small srn-dialog-title">{title}</Heading>
          {subtitle && <Text slot="description" className="text-body-medium srn-dialog-subtitle">{subtitle}</Text>}
        </div>
        {isDismissible && <ButtonIcon slot="close" size="s" isSquare={false} aria-label="Close"><Icon name="close" size={20} /></ButtonIcon>}
      </div>
      <div className="srn-dialog-body">{children}</div>
      {footer && <div className="srn-dialog-foot">{footer}</div>}
    </AriaDialog>
  );
}

// Serenity Modal in its ModalOverlay (Scrim type=modal): width s 400, m 560, l 640; on mobile the screen minus Gap/16 gutters.
// Enter/Dialog and Exit/Dialog on the Modal, Enter/Scrim and Exit/Scrim on the overlay.
export function Modal({ width = 's', isOpen, onOpenChange, isDismissable = true, className, children, placement = 'center' }) {
  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={isDismissable} className={cx('srn-modal-overlay', `srn-modal-overlay--${placement}`, 'motion-enter-scrim', 'motion-exit-scrim')}>
      <AriaModal className={cx('srn-modal', `srn-modal--${width}`, 'effect-elevation-dialog', 'motion-enter-dialog', 'motion-exit-dialog', className)}>
        {children}
      </AriaModal>
    </ModalOverlay>
  );
}

// Serenity Sheet over the React Aria SheetOverlay and Sheet: position start (the phone drawer) or end (a side panel), full
// height, Corner radius/Container/L on its open edge, Elevation/Dialog. Enter/Sheet · Exit/Sheet: in React Aria code the
// sheet travels from its edge by the browser's scroll snapping (chapter 07, Enter/Sheet), so no CSS travel is added;
// the Scrim fades with Enter/Scrim · Exit/Scrim. Focus moves in once the sheet has entered.
export function Sheet({ position = 'end', isOpen, onOpenChange, className, children, size = 'm' }) {
  return (
    <SheetOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      position={position}
      className={cx('srn-sheet-overlay', 'motion-enter-scrim', 'motion-exit-scrim')}
      data-motion-size={size}
    >
      <AriaSheet className={cx('srn-sheet', `srn-sheet--${position}`, 'effect-elevation-dialog', className)}>
        {children}
      </AriaSheet>
    </SheetOverlay>
  );
}

// Serenity Popover: Surface/Floating, Corner radius/Container/M, Elevation/Overlay; Enter/Pop and Exit/Pop from the trigger.
export function Popover({ className, children, ...props }) {
  return (
    <AriaPopover offset={8} {...props} className={cx('srn-popover', 'effect-elevation-overlay', 'motion-enter-pop', 'motion-exit-pop', className)}>
      {children}
    </AriaPopover>
  );
}

// Serenity Menu, MenuSection and MenuItem (size s on desktop, l on touch) over the React Aria Menu.
export function Menu({ className, children, ...props }) {
  return <AriaMenu {...props} className={cx('srn-menu', className)}>{children}</AriaMenu>;
}
export function MenuSection({ title, children, ...props }) {
  return (
    <AriaMenuSection {...props} className="srn-menu-section">
      {title && <Header className="srn-menu-header">{title}</Header>}
      {children}
    </AriaMenuSection>
  );
}
export function MenuItem({ children, description, leading, trailing, className, ...props }) {
  return (
    <AriaMenuItem {...props} textValue={props.textValue || (typeof children === 'string' ? children : undefined)}
      className={({ isFocused, isSelected }) => cx('srn-menu-item', 'motion-feedback-hover', isFocused && 'is-focused', isSelected && 'is-selected', className)}>
      {({ isSelected }) => (
        <>
          {leading}
          <span className="srn-menu-item-text">
            <Text slot="label" className={isSelected ? 'text-body-strong-medium' : 'text-body-medium'}>{children}</Text>
            {description && <Text slot="description" className="text-body-small srn-menu-item-desc">{description}</Text>}
          </span>
          {trailing}
          {isSelected && <span className="srn-menu-item-check" aria-hidden="true"><Icon name="check-circle" size={16} bold /></span>}
        </>
      )}
    </AriaMenuItem>
  );
}
export const MenuSeparator = () => <Separator className="srn-separator" />;

// Serenity Tooltip: Surface/Inverse, Body/Small inverse text, Elevation/Overlay/Borderless, 4 px from the trigger; Enter/Slide.
export function Tooltip({ content, placement = 'end', children, delay = 600 }) {
  return (
    <TooltipTrigger delay={delay} closeDelay={0}>
      {children}
      <AriaTooltip placement={placement} offset={4} className="srn-tooltip text-caption-small effect-elevation-overlay-borderless motion-enter-slide motion-exit-slide">
        {content}
      </AriaTooltip>
    </TooltipTrigger>
  );
}

// Serenity Toast (variant solid, tone neutral or success) in a ToastRegion centred at the top, Gap/40 from the top edge.
// Enter/Toast and Exit/Toast; it closes by itself after 4 s (no action), with the close Button: Icon.
export const toastQueue = new ToastQueue({
  maxVisibleToasts: 3,
  wrapUpdate(fn) {
    if ('startViewTransition' in document && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const vt = document.startViewTransition(() => flushSync(fn));
      vt.ready.catch(() => {}); // a newer transition (another toast, the theme) may skip this one
      vt.finished.catch(() => {});
    } else fn();
  },
});
export const toast = (title, tone = 'neutral') => toastQueue.add({ title, tone }, { timeout: 4000 });

export function Toasts() {
  return (
    <ToastRegion queue={toastQueue} className="srn-toast-region">
      {({ toast: t }) => (
        <AriaToast toast={t} className={cx('srn-toast', 'text-body-strong-medium', 'effect-elevation-overlay', 'motion-enter-toast', 'motion-exit-toast')} style={{ viewTransitionName: t.key }}>
          {t.content.tone === 'success' && <span className="srn-toast-icon" aria-hidden="true"><Icon name="check-circle" size={20} /></span>}
          <ToastContent className="srn-toast-content"><Text slot="title">{t.content.title}</Text></ToastContent>
          <AriaButton slot="close" aria-label="Close" className={({ isFocusVisible }) => cx('srn-toast-close', 'motion-feedback-press', isFocusVisible && 'effect-focus-inverse-neutral')}>
            <Icon name="close" size={16} />
          </AriaButton>
        </AriaToast>
      )}
    </ToastRegion>
  );
}

export { OverlayArrow };
