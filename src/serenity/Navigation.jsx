import React from 'react';
import {
  NavigationTree, NavigationTreeItem as AriaNavigationTreeItem, NavigationTreeItemContent, Link as AriaLink,
  Button as AriaButton, MenuTrigger, DialogTrigger, Dialog as AriaDialog, Heading,
} from 'react-aria-components';
import { cx, ButtonIcon } from './Button.jsx';
import { Keyboard, Avatar } from './Content.jsx';
import { Popover, Tooltip } from './Overlays.jsx';
import { Icon, Logo } from '../icons.jsx';

export const NAV = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'cards', label: 'Cards', icon: 'credit-card' },
  { id: 'transactions', label: 'Transactions', icon: 'switch-horizontal' },
  { id: 'payments', label: 'Payments', icon: 'send' },
  { id: 'invoices', label: 'Invoices', icon: 'file' },
  { id: 'tasks', label: 'Tasks', icon: 'check-circle' },
  { id: 'team', label: 'Team', icon: 'user' },
];

// Serenity NavigationTreeItem (expanded) and NavigationTreeItem: Icon (the rail) over the React Aria NavigationTreeItem: the
// link is current when its href is the tree's selectedRoute (aria-current="page", neutral fill, strong label, bold icon).
// In the rail the label is the accessible name and shows as a Tooltip on hover and focus.
function NavItem({ item, isRail, size, onNavigate }) {
  return (
    <AriaNavigationTreeItem id={item.id} href={`#/${item.id}`} textValue={item.label} className="srn-nav-row">
      <NavigationTreeItemContent>
        {({ isCurrent, isFocusVisible, isHovered }) => (
          <AriaLink
            onPress={onNavigate}
            className={cx('srn-nav-item', `srn-size-${size}`, isRail && 'srn-nav-item--icon', 'motion-feedback-hover', isCurrent && 'is-current', isHovered && 'is-hovered', isFocusVisible && 'effect-focus-inset-neutral')}
            aria-label={isRail ? item.label : undefined}
          >
            <span className="srn-nav-icon"><Icon name={item.icon} bold={isCurrent} /></span>
            {!isRail && <span className={cx('srn-nav-label', isCurrent ? 'text-body-strong-large' : 'text-body-large')}>{item.label}</span>}
            {isRail && <span className="srn-rail-tip text-caption-small" aria-hidden="true">{item.label}</span>}
          </AriaLink>
        )}
      </NavigationTreeItemContent>
    </AriaNavigationTreeItem>
  );
}

// The Search row: a NavigationTreeItem drawn as a Button (code) with its key, ⌘K; Search: Icon in the rail.
function SearchRow({ isRail, size, onSearch, isSearchOpen }) {
  const row = (
    <AriaButton
      onPress={onSearch}
      aria-label={isRail ? 'Search' : undefined}
      aria-keyshortcuts="Meta+K Control+K"
      className={({ isFocusVisible }) => cx('srn-nav-item', `srn-size-${size}`, isRail && 'srn-nav-item--icon', 'motion-feedback-hover', isSearchOpen && 'is-pressed', isFocusVisible && 'effect-focus-inset-neutral')}
    >
      <span className="srn-nav-icon"><Icon name="search" /></span>
      {!isRail && <span className="srn-nav-label text-body-large">Search</span>}
      {!isRail && <Keyboard>⌘K</Keyboard>}
      {isRail && <span className="srn-rail-tip text-caption-small" aria-hidden="true">Search ⌘K</span>}
    </AriaButton>
  );
  return row;
}

// Serenity Sidebar, type basic: the logo symbol and Collapse sidebar on top, the Search row and the NavigationTree in the Slot,
// the Account at the bottom. size m (40 px items) on desktop, l (48 px) in the phone drawer. isExpanded off is the rail:
// the logo itself expands it (it shows the sidebar icon on hover and focus). Expand/Width between the rail and 240 px.
export function Sidebar({ route, isExpanded = true, size = 'm', onToggle, onClose, onSearch, isSearchOpen, accountMenu, onNavigate, inDrawer = false }) {
  const isRail = !isExpanded;
  return (
    <div className={cx('srn-sidebar', `srn-sidebar--${size}`, isRail && 'is-rail', inDrawer && 'srn-sidebar--drawer')} data-expanded={isExpanded || undefined}>
      <div className="srn-sidebar-top">
        {isRail ? (
          <Tooltip content={<>Expand sidebar <Keyboard size="s" className="srn-tooltip-kbd">⌘B</Keyboard></>} placement="end">
            <AriaButton aria-label="Expand sidebar" aria-keyshortcuts="Meta+B Control+B" onPress={onToggle}
              className={({ isFocusVisible }) => cx('srn-brand', 'srn-brand--rail', 'motion-feedback-hover', isFocusVisible && 'effect-focus-neutral')}>
              <span className="srn-brand-logo"><Logo /></span>
              <span className="srn-brand-expand" aria-hidden="true"><Icon name="sidebar" /></span>
            </AriaButton>
          </Tooltip>
        ) : (
          <AriaLink href="#/home" onPress={onNavigate} aria-label="Firefly LLC, Home" className={({ isFocusVisible }) => cx('srn-brand', isFocusVisible && 'effect-focus-neutral')}>
            <span className="srn-brand-logo"><Logo size={size === 'l' ? 40 : 32} /></span>
            <span className="srn-brand-name text-body-strong-medium">Firefly LLC</span>
          </AriaLink>
        )}
        {!isRail && !inDrawer && (
          <Tooltip content={<>Collapse sidebar <Keyboard size="s" className="srn-tooltip-kbd">⌘B</Keyboard></>} placement="bottom">
            <ButtonIcon size="xs" aria-label="Collapse sidebar" aria-keyshortcuts="Meta+B Control+B" aria-expanded="true" onPress={onToggle}><Icon name="sidebar" /></ButtonIcon>
          </Tooltip>
        )}
        {inDrawer && <ButtonIcon size="l" isSquare={false} slot="close" aria-label="Close menu" onPress={onClose}><Icon name="close" size={20} /></ButtonIcon>}
      </div>

      <div className="srn-sidebar-slot">
        <SearchRow isRail={isRail} size={size} onSearch={onSearch} isSearchOpen={isSearchOpen} />
        <NavigationTree aria-label="Primary" selectedRoute={`#/${route}`} className="srn-nav-tree">
          {NAV.map((item) => <NavItem key={item.id} item={item} isRail={isRail} size={size} onNavigate={onNavigate} />)}
        </NavigationTree>
      </div>

      {!inDrawer && <div className="srn-sidebar-bottom">{accountMenu}</div>}
    </div>
  );
}

// The Account: Avatar inside a MenuTrigger Button; its Menu opens in a Popover above it (Sidebar) or under it (TopBar).
export function AccountTrigger({ children, placement = 'top start' }) {
  return (
    <MenuTrigger>
      <AriaButton aria-label="Account: Dawid" className={({ isFocusVisible }) => cx('srn-account', 'motion-feedback-press', isFocusVisible && 'effect-focus-neutral')}>
        <Avatar src="./assets/avatar.jpg" size="s" />
      </AriaButton>
      <Popover placement={placement} className="srn-popover--menu">{children}</Popover>
    </MenuTrigger>
  );
}

// Dialog: Notifications under the bell: the title and, with nothing new, an EmptyState.
export function NotificationsTrigger({ children }) {
  return (
    <DialogTrigger>
      <ButtonIcon size="m" isSquare={false} aria-label="Notifications"><Icon name="bell" size={20} /></ButtonIcon>
      <Popover placement="bottom end" className="srn-popover--wide">
        <AriaDialog className="srn-popover-dialog" aria-labelledby="notif-title">
          <Heading id="notif-title" slot="title" className="text-body-strong-medium srn-popover-title">Notifications</Heading>
          {children}
        </AriaDialog>
      </Popover>
    </DialogTrigger>
  );
}

// Serenity TopBar, breakpoint mobile (below 1024, SR-276): the menu Button: Icon first, the logo, then search, notifications
// and the account at the trailing edge. isSticky: Scroll/Lift shows the Separator once content scrolls under it.
export function TopBar({ onMenu, onSearch, isMenuOpen, notifications, account, isScrolled }) {
  return (
    <header className={cx('srn-topbar', 'motion-scroll-lift')} data-scrolled={isScrolled || undefined}>
      <div className="srn-topbar-leading">
        <ButtonIcon size="m" isSquare={false} aria-label="Open menu" aria-expanded={isMenuOpen} onPress={onMenu}><Icon name="menu" size={20} /></ButtonIcon>
        <AriaLink href="#/home" aria-label="Firefly LLC, Home" className={({ isFocusVisible }) => cx('srn-topbar-logo', isFocusVisible && 'effect-focus-neutral')}><Logo size={40} /></AriaLink>
      </div>
      <div className="srn-topbar-trailing">
        <ButtonIcon size="m" isSquare={false} aria-label="Search" onPress={onSearch}><Icon name="search-s" size={20} /></ButtonIcon>
        {notifications}
        {account}
      </div>
    </header>
  );
}
