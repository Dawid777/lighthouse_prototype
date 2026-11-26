import React from 'react';
import {
  TextField as AriaTextField, NumberField as AriaNumberField, Select as AriaSelect, RadioGroup, Radio, Checkbox as AriaCheckbox,
  Label, Input, TextArea as AriaTextArea, Group, Text, FieldError, Button as AriaButton, SelectValue, Popover, ListBox, ListBoxItem,
} from 'react-aria-components';
import { cx } from './Button.jsx';
import { Icon } from '../icons.jsx';

// Shared parts of every field (Label, Description, FieldError): Serenity Label is Label/Medium, Description and FieldError Body/Small.
function FieldLabel({ children, optional }) {
  return (
    <Label className="text-label-medium srn-field-label">
      {children}{optional && <span className="srn-field-optional"> (optional)</span>}
    </Label>
  );
}
function FieldFoot({ description, errorMessage }) {
  return (
    <>
      {description && <Text slot="description" className="srn-field-description text-body-small">{description}</Text>}
      <FieldError className="srn-field-error text-body-small">{errorMessage}</FieldError>
    </>
  );
}
// The InputGroup box: Surface/Default, Stroke/Control, Field/Default effect, the focus ring while focus is inside.
const groupClass = (size) => ({ isFocusWithin, isInvalid }) => cx(
  'srn-field-group', `srn-size-${size}`,
  isFocusWithin ? (isInvalid ? 'effect-focus-danger' : 'effect-focus-neutral') : (isInvalid ? 'effect-field-invalid' : 'effect-field-default'),
);

// Serenity TextField over the React Aria TextField (get_component "TextField"): label, description, size, isInvalid with the
// FieldError, a Suffix after the value. Feedback/Error plays once on a failed submit (playError).
export function TextField({ label, optional, description, size = 's', errorMessage, suffix, prefix, trailing, inputRef, playError, placeholder, className, inputClassName, ...props }) {
  return (
    <AriaTextField {...props} className={cx('srn-field', 'motion-feedback-error', className)} data-motion-play={playError || undefined}>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <Group className={groupClass(size)}>
        {prefix}
        <Input ref={inputRef} placeholder={placeholder} className={cx('srn-input', 'text-body-large', inputClassName)} />
        {suffix && <span className="srn-field-suffix text-body-medium">{suffix}</span>}
        {trailing}
      </Group>
      <FieldFoot description={description} errorMessage={errorMessage} />
    </AriaTextField>
  );
}

// Serenity NumberField over the React Aria NumberField, steppers off, with a text Suffix (the currency code).
export function NumberField({ label, description, size = 's', errorMessage, suffix, inputRef, playError, placeholder, className, ...props }) {
  return (
    <AriaNumberField {...props} className={cx('srn-field', 'motion-feedback-error', className)} data-motion-play={playError || undefined}>
      <FieldLabel>{label}</FieldLabel>
      <Group className={groupClass(size)}>
        <Input ref={inputRef} placeholder={placeholder} className="srn-input text-body-large num" />
        {suffix && <span className="srn-field-suffix text-body-medium">{suffix}</span>}
      </Group>
      <FieldFoot description={description} errorMessage={errorMessage} />
    </AriaNumberField>
  );
}

// Serenity TextArea over the React Aria TextField with a TextArea.
export function TextArea({ label, optional, description, errorMessage, placeholder, className, rows = 2, inputClassName, ...props }) {
  return (
    <AriaTextField {...props} className={cx('srn-field', className)}>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <Group className={({ isFocusWithin }) => cx('srn-field-group', 'srn-field-group--area', isFocusWithin ? 'effect-focus-neutral' : 'effect-field-default')}>
        <AriaTextArea placeholder={placeholder} rows={rows} className={cx('srn-input', 'srn-textarea', 'text-body-large', inputClassName)} />
      </Group>
      <FieldFoot description={description} errorMessage={errorMessage} />
    </AriaTextField>
  );
}

// Serenity Select over the React Aria Select: the trigger is the field box with the chevron (Feedback/Rotate); the list is
// a ListBox in a Popover with Enter/Pop.
export function Select({ label, items, size = 's', className, placeholder = 'Select one', errorMessage, description, ...props }) {
  return (
    <AriaSelect {...props} placeholder={placeholder} className={cx('srn-field', className)}>
      <FieldLabel>{label}</FieldLabel>
      <AriaButton className={({ isFocusVisible }) => cx('srn-field-group', 'srn-select-trigger', `srn-size-${size}`, 'motion-feedback-hover', isFocusVisible ? (props.isInvalid ? 'effect-focus-danger' : 'effect-focus-neutral') : (props.isInvalid ? 'effect-field-invalid' : 'effect-field-default'))}>
        <SelectValue className="srn-input text-body-large" />
        <span className="srn-select-chevron motion-feedback-rotate" aria-hidden="true"><Icon name="chevron-right" size={16} /></span>
      </AriaButton>
      <Popover offset={4} className="srn-popover srn-popover--list effect-elevation-overlay motion-enter-pop motion-exit-pop">
        <ListBox className="srn-listbox">
          {items.map((raw) => { const it = typeof raw === 'string' ? { id: raw, label: raw } : raw; return (
            <ListBoxItem key={it.id} id={it.id} textValue={it.label} className={({ isFocused, isSelected }) => cx('srn-listbox-item', 'text-body-medium', isFocused && 'is-focused', isSelected && 'is-selected')}>
              {it.label}
            </ListBoxItem>
          ); })}
        </ListBox>
      </Popover>
      <FieldFoot description={description} errorMessage={errorMessage} />
    </AriaSelect>
  );
}

// Serenity SelectBoxGroup (single, horizontal) over the React Aria RadioGroup: each SelectBox is a Radio drawn as a card
// with a label and a description; the selected box has the 2 px Stroke/Inverse/Default border (Feedback/Select).
export function SelectBoxGroup({ label, options, orientation = 'horizontal', errorMessage, className, ...props }) {
  return (
    <RadioGroup {...props} orientation={orientation} className={cx('srn-field', className)}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className={cx('srn-selectbox-group', orientation === 'vertical' && 'srn-selectbox-group--vertical')}>
        {options.map((o) => (
          <Radio key={o.id} value={o.id} className={({ isFocusVisible }) => cx('srn-selectbox', orientation === 'vertical' && 'srn-selectbox--row', 'motion-feedback-select', 'motion-feedback-press', isFocusVisible && 'effect-focus-neutral')}>
            {o.icon && <span className="srn-selectbox-icon" aria-hidden="true"><Icon name={o.icon} size={24} /></span>}
            <span className="srn-selectbox-text">
              <span className={orientation === 'vertical' ? 'text-body-strong-medium' : 'text-label-strong-small'}>{o.label}</span>
              {o.description && <span className="text-body-small srn-selectbox-desc num">{o.description}</span>}
            </span>
            {orientation === 'vertical' && <span className="srn-radio-mark" aria-hidden="true" />}
          </Radio>
        ))}
      </div>
      <FieldError className="srn-field-error text-body-small">{errorMessage}</FieldError>
    </RadioGroup>
  );
}

// Serenity Checkbox over the React Aria Checkbox: the box (Stroke/Control, Fill/Inverse when selected) and its label.
export function Checkbox({ children, className, ...props }) {
  return (
    <AriaCheckbox {...props} className={({ isFocusVisible }) => cx('srn-checkbox', 'text-body-medium', isFocusVisible && 'is-focus-visible', className)}>
      {({ isSelected, isFocusVisible }) => (
        <>
          <span className={cx('srn-checkbox-box', 'motion-feedback-toggle', isSelected && 'is-selected')} data-focus-ring={isFocusVisible || undefined} aria-hidden="true">{isSelected && <Icon name="check" size={16} />}</span>
          <span>{children}</span>
        </>
      )}
    </AriaCheckbox>
  );
}

// Serenity OTPField: four OTPCells over one real input (autocomplete one-time-code, numeric), so typing, paste and the SMS
// autofill all work; the cell after the last digit shows the focus while the field has focus.
export function OTPField({ label, description, errorMessage, value, onChange, length = 4, isInvalid, inputRef, playError, autoFocus }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <AriaTextField value={value} onChange={(v) => onChange(v.replace(/\D/g, '').slice(0, length))} isInvalid={isInvalid} autoFocus={autoFocus}
      className={cx('srn-field', 'srn-otp', 'motion-feedback-error')} data-motion-play={playError || undefined}>
      <FieldLabel>{label}</FieldLabel>
      <div className="srn-otp-cells">
        {Array.from({ length }, (_, i) => {
          const isActive = focused && (i === Math.min(value.length, length - 1));
          return <span key={i} aria-hidden="true" data-focus-ring={isActive || undefined} className={cx('srn-otp-cell', 'text-body-large', 'num', isInvalid ? (isActive ? 'effect-focus-danger' : 'effect-field-invalid') : (isActive ? 'effect-focus-neutral' : 'effect-field-default'))}>{value[i] || ''}</span>;
        })}
        <Input ref={inputRef} inputMode="numeric" autoComplete="one-time-code" maxLength={length} className="srn-otp-input"
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      </div>
      <FieldFoot description={description} errorMessage={errorMessage} />
    </AriaTextField>
  );
}
