import React from 'react';
import {
  Table as AriaTable, TableHeader, Column, TableBody, Row, Cell, ToggleButtonGroup as AriaToggleButtonGroup, ToggleButton as AriaToggleButton,
  Tabs as AriaTabs, TabList, Tab, TabPanel, Switch as AriaSwitch, Breadcrumbs as AriaBreadcrumbs, Breadcrumb, Link as AriaLink,
  RadioGroup as AriaRadioGroup, Radio, Label, Text, FieldError, DropZone as AriaDropZone, FileTrigger, Button as AriaButton,
  ComboBox as AriaComboBox, Input, Popover, ListBox, ListBoxItem, Group, ColorSwatchPicker as AriaColorSwatchPicker,
  ColorSwatchPickerItem, ColorSwatch, Heading,
} from 'react-aria-components';
import { cx, Button } from './Button.jsx';
import { Badge } from './Content.jsx';
import { Icon } from '../icons.jsx';

// Badge tones of the Figma file (green, red, amber, azure, yellow, neutral) on their subtle fills.
export function Tone({ tone = 'neutral', children }) { return <Badge tone={tone}>{children}</Badge>; }

// Serenity Table over the React Aria Table: Columns, Rows that open (onAction) and Cells; a cell value may be a node
// (a Badge). Rows take arrow keys and Enter; the first column is the row header.
export function Table({ label, columns, rows, onAction, selectionMode, selectedKeys, onSelectionChange, className, empty }) {
  return (
    <div className={cx('srn-table-wrap', className)}>
      <AriaTable aria-label={label} onRowAction={onAction} selectionMode={selectionMode} selectedKeys={selectedKeys} onSelectionChange={onSelectionChange} className="srn-table">
        <TableHeader className="srn-table-head">
          {columns.map((c, i) => (
            <Column key={c.id || c.label} id={c.id || c.label} isRowHeader={i === 0} className={cx('srn-table-col', 'text-caption-strong-small', c.align === 'end' && 'is-end')}>{c.label}</Column>
          ))}
        </TableHeader>
        <TableBody items={rows} className="srn-table-body" renderEmptyState={empty ? () => empty : undefined}>
          {(r) => (
            <Row id={r.id} className={({ isFocusVisible, isHovered }) => cx('srn-table-row', onAction && 'is-action', isHovered && 'is-hovered', isFocusVisible && 'effect-focus-inset-neutral')}>
              {columns.map((c) => (
                <Cell key={c.id || c.label} className={cx('srn-table-cell', 'text-body-medium', c.align === 'end' && 'is-end num', c.strong && 'text-body-strong-medium')}>{r[c.id || c.label]}</Cell>
              ))}
            </Row>
          )}
        </TableBody>
      </AriaTable>
    </div>
  );
}

// Serenity ToggleButtonGroup (size xs): the view switcher of a page (Manage · Subscriptions, All · Unpaid · Paid · Drafts).
export function ToggleButtonGroup({ label, items, value, onChange, size = 'xs' }) {
  return (
    <AriaToggleButtonGroup aria-label={label} selectionMode="single" disallowEmptySelection selectedKeys={[value]} onSelectionChange={(k) => { const [v] = [...k]; if (v) onChange(v); }} className="srn-toggle-group">
      {items.map((it) => {
        const id = typeof it === 'string' ? it : it.id; const text = typeof it === 'string' ? it : it.label;
        return (
          <AriaToggleButton key={id} id={id} className={({ isSelected, isFocusVisible }) => cx('srn-toggle', `srn-size-${size}`, 'text-label-medium', 'motion-feedback-select', isSelected && 'is-selected', isFocusVisible && 'effect-focus-neutral')}>{text}</AriaToggleButton>
        );
      })}
    </AriaToggleButtonGroup>
  );
}

// Serenity Tabs over the React Aria Tabs.
export function Tabs({ label, items, value, onChange, children }) {
  return (
    <AriaTabs selectedKey={value} onSelectionChange={onChange} className="srn-tabs">
      <TabList aria-label={label} className="srn-tablist">
        {items.map((t) => (
          <Tab key={t.id} id={t.id} className={({ isSelected, isFocusVisible }) => cx('srn-tab', 'text-label-medium', 'motion-feedback-indicator', isSelected && 'is-selected', isFocusVisible && 'effect-focus-inset-neutral')}>{t.label}</Tab>
        ))}
      </TabList>
      {items.map((t) => <TabPanel key={t.id} id={t.id} className="srn-tabpanel">{children}</TabPanel>)}
    </AriaTabs>
  );
}

// Serenity Switch (size l): the track and handle, the label and an optional description.
export function Switch({ children, description, ...props }) {
  return (
    <AriaSwitch {...props} className={({ isFocusVisible }) => cx('srn-switch', isFocusVisible && 'is-focus-visible')}>
      {({ isSelected, isFocusVisible }) => (
        <>
          <span className="srn-switch-text">
            <span className="text-body-strong-medium">{children}</span>
            {description && <span className="text-body-small lh-secondary">{description}</span>}
          </span>
          <span className={cx('srn-switch-track', 'motion-feedback-toggle', isSelected && 'is-on')} data-focus-ring={isFocusVisible || undefined}><span className="srn-switch-handle" /></span>
        </>
      )}
    </AriaSwitch>
  );
}

// Serenity Breadcrumbs: the way up from a detail page.
export function Breadcrumbs({ items }) {
  return (
    <AriaBreadcrumbs className="srn-breadcrumbs">
      {items.map((b, i) => (
        <Breadcrumb key={b.label} className="srn-breadcrumb text-body-medium">
          {i < items.length - 1 ? <AriaLink href={b.href} className={({ isFocusVisible }) => cx('srn-breadcrumb-link', isFocusVisible && 'effect-focus-neutral')}>{b.label}</AriaLink> : <span aria-current="page">{b.label}</span>}
          {i < items.length - 1 && <span className="srn-breadcrumb-sep" aria-hidden="true"><Icon name="chevron-right" size={16} /></span>}
        </Breadcrumb>
      ))}
    </AriaBreadcrumbs>
  );
}

// Serenity PageHeader with its parts: Breadcrumbs, the title (Subtitle/Medium) with a caption and Badges, a ToggleButtonGroup
// and the page actions at the trailing edge.
export function Header({ title, caption, crumbs, badges, toggles, actions, description }) {
  return (
    <header className="srn-page-header srn-page-header--rich">
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="srn-page-header-row">
        <div className="srn-page-header-titles">
          <h1 className="text-subtitle-medium srn-page-title">{title}{caption && <span className="text-body-medium lh-secondary srn-page-caption"> {caption}</span>}</h1>
          {badges && <div className="srn-page-badges">{badges}</div>}
        </div>
        {actions && <div className="srn-page-actions">{actions}</div>}
      </div>
      {description && <p className="text-body-medium lh-secondary">{description}</p>}
      {toggles}
    </header>
  );
}

// Serenity RadioGroup: the label, the Radios and an optional description.
export function RadioGroup({ label, description, options, errorMessage, ...props }) {
  return (
    <AriaRadioGroup {...props} className="srn-field srn-radio-group">
      <Label className="text-label-medium srn-field-label">{label}</Label>
      {description && <Text slot="description" className="text-body-small lh-secondary">{description}</Text>}
      <div className="srn-radios">
        {options.map((o) => (
          <Radio key={o.id || o} value={o.id || o} className={({ isFocusVisible }) => cx('srn-radio', 'text-body-medium', isFocusVisible && 'is-focus-visible')}>
            {({ isSelected, isFocusVisible }) => (<><span className={cx('srn-radio-dot', isSelected && 'is-selected')} data-focus-ring={isFocusVisible || undefined} aria-hidden="true" /><span>{o.label || o}</span></>)}
          </Radio>
        ))}
      </div>
      <FieldError className="srn-field-error text-body-small">{errorMessage}</FieldError>
    </AriaRadioGroup>
  );
}

// Serenity DropZone with a FileTrigger: drop a file or press the button to choose one.
export function DropZone({ label, description, button = 'Choose a file', onFile, file }) {
  return (
    <AriaDropZone onDrop={async (e) => { const f = e.items.find((i) => i.kind === 'file'); if (f) onFile(f.name); }}
      className={({ isDropTarget, isFocusVisible }) => cx('srn-dropzone', isDropTarget && 'is-target', isFocusVisible && 'effect-focus-neutral')}>
      <span className="srn-dropzone-icon" aria-hidden="true"><Icon name="file" size={20} /></span>
      <Text slot="label" className="text-body-strong-medium">{file || label}</Text>
      <span className="text-body-small lh-secondary">{file ? 'Added' : description}</span>
      <FileTrigger onSelect={(files) => { const f = files && files[0]; if (f) onFile(f.name); }}>
        <Button size="s" variant="outlined" tone="secondary">{file ? 'Replace' : button}</Button>
      </FileTrigger>
    </AriaDropZone>
  );
}

// Serenity Card: Dashboard: a titled region with an optional caption ("Updated 5 min ago", the source) and actions.
export function Card({ title, caption, actions, children, className }) {
  const id = React.useId();
  return (
    <section className={cx('srn-card', className)} aria-labelledby={id}>
      <div className="srn-card-head">
        <div><h2 id={id} className="text-body-strong-medium srn-card-title">{title}</h2>{caption && <p className="text-caption-small lh-secondary srn-card-caption">{caption}</p>}</div>
        {actions}
      </div>
      <div className="srn-card-body">{children}</div>
    </section>
  );
}

// Serenity ListBox-style rows used inside Cards: the label, the description, the value and a Badge.
export function Item({ label, description, value, badge, onPress }) {
  const body = (
    <>
      <span className="srn-item-text"><span className="text-body-strong-medium">{label}</span>{description && <span className="text-body-small lh-secondary">{description}</span>}</span>
      {value && <span className="text-body-medium num srn-item-value">{value}</span>}
      {badge}
      {onPress && <span className="srn-item-chevron" aria-hidden="true"><Icon name="chevron-right" size={16} /></span>}
    </>
  );
  return onPress
    ? <AriaButton onPress={onPress} className={({ isFocusVisible, isHovered }) => cx('srn-item', 'is-action', isHovered && 'is-hovered', isFocusVisible && 'effect-focus-inset-neutral')}>{body}</AriaButton>
    : <div className="srn-item">{body}</div>;
}

// Serenity ComboBox: the field with a list of matches under it.
export function ComboBox({ label, items, placeholder, errorMessage, ...props }) {
  return (
    <AriaComboBox {...props} className="srn-field">
      <Label className="text-label-medium srn-field-label">{label}</Label>
      <Group className={({ isFocusWithin, isInvalid }) => cx('srn-field-group', 'srn-size-l', isFocusWithin ? (isInvalid ? 'effect-focus-danger' : 'effect-focus-neutral') : (isInvalid ? 'effect-field-invalid' : 'effect-field-default'))}>
        <Input placeholder={placeholder} className="srn-input text-body-large" />
        <AriaButton className="srn-combobox-button" aria-label="Show suggestions"><Icon name="chevron-down" size={16} /></AriaButton>
      </Group>
      <FieldError className="srn-field-error text-body-small">{errorMessage}</FieldError>
      <Popover offset={4} className="srn-popover srn-popover--list effect-elevation-overlay motion-enter-pop motion-exit-pop">
        <ListBox className="srn-listbox" renderEmptyState={() => <p className="srn-listbox-empty text-body-medium">No matches.</p>}>
          {items.map((it) => (
            <ListBoxItem key={it.id} id={it.id} textValue={it.label} className={({ isFocused, isSelected }) => cx('srn-listbox-item', 'text-body-medium', isFocused && 'is-focused', isSelected && 'is-selected')}>
              {it.label}{it.description && <span className="lh-secondary text-body-small"> · {it.description}</span>}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaComboBox>
  );
}

// Serenity ColorSwatchPicker: the card designs.
export function SwatchPicker({ label, colors, value, onChange }) {
  return (
    <div className="srn-field">
      <span className="text-label-medium srn-field-label" id="swatch-label">{label}</span>
      <AriaColorSwatchPicker aria-labelledby="swatch-label" value={value} onChange={(c) => onChange(c.toString('hex'))} className="srn-swatches">
        {colors.map((c) => (
          <ColorSwatchPickerItem key={c.hex} color={c.hex} className={({ isSelected, isFocusVisible }) => cx('srn-swatch-item', isSelected && 'is-selected', isFocusVisible && 'effect-focus-neutral')}>
            <ColorSwatch colorName={c.name} className="srn-swatch" />
          </ColorSwatchPickerItem>
        ))}
      </AriaColorSwatchPicker>
    </div>
  );
}

// The card visual (Figma PaymentCard, a Lighthouse addition): the design colour, the company, the number and the expiry.
export function PaymentCard({ name, last4, color = '#2c2c54', company = 'Firefly LLC', expiry = '10/27', frozen, shown }) {
  return (
    <div className={cx('lh-payment-card', frozen && 'is-frozen')} style={{ '--lh-card-color': color }} role="img" aria-label={`${name}, card ending ${last4}${frozen ? ', frozen' : ''}`}>
      <span className="text-body-strong-medium">{company}</span>
      <span className="text-code-medium num">{shown ? `4242  4242  4242  ${last4}` : `••••  ••••  ••••  ${last4}`}</span>
      <span className="text-caption-small">Valid thru {expiry}</span>
    </div>
  );
}

// Serenity Alert (inline, in a Card or above content): tone icon, the title, the description and an action.
export function Alert({ tone = 'warning', title, children, action }) {
  const icon = { danger: 'close-circle', warning: 'alert-triangle', info: 'info', neutral: 'info', success: 'check-circle' }[tone];
  return (
    <div className={cx('srn-banner', `srn-banner--${tone}`, 'srn-alert')} role={tone === 'danger' ? 'alert' : undefined}>
      <span className="srn-banner-icon" aria-hidden="true"><Icon name={icon} size={20} /></span>
      <div className="srn-banner-text"><p className="text-body-strong-medium srn-banner-title">{title}</p>{children && <p className="text-body-medium srn-banner-desc">{children}</p>}</div>
      {action && <div className="srn-alert-action">{action}</div>}
    </div>
  );
}

export const H2 = ({ children, id }) => <Heading level={2} id={id} className="text-subtitle-small lh-h2">{children}</Heading>;
