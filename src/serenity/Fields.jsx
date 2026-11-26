import React from 'react';
import {
  TextField as AriaTextField, NumberField as AriaNumberField, Select as AriaSelect, RadioGroup, Radio,
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
export function TextField({ label, optional, description, size = 's', errorMessage, suffix, inputRef, playError, placeholder, className, ...props }) {
  return (
    <AriaTextField {...props} className={cx('srn-field', 'motion-feedback-error', className)} data-motion-play={playError || undefined}>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <Group className={groupClass(size)}>
        <Input ref={inputRef} placeholder={placeholder} className="srn-input text-body-large" />
        {suffix && <span className="srn-field-suffix text-body-medium">{suffix}</span>}
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
export function TextArea({ label, optional, description, errorMessage, placeholder, className, ...props }) {
  return (
    <AriaTextField {...props} className={cx('srn-field', className)}>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <Group className={({ isFocusWithin }) => cx('srn-field-group', 'srn-field-group--area', isFocusWithin ? 'effect-focus-neutral' : 'effect-field-default')}>
        <AriaTextArea placeholder={placeholder} rows={2} className="srn-input srn-textarea text-body-large" />
      </Group>
      <FieldFoot description={description} errorMessage={errorMessage} />
    </AriaTextField>
  );
}

// Serenity Select over the React Aria Select: the trigger is the field box with the chevron (Feedback/Rotate); the list is
// a ListBox in a Popover with Enter/Pop.
export function Select({ label, items, size = 's', className, ...props }) {
  return (
    <AriaSelect {...props} className={cx('srn-field', className)}>
      <FieldLabel>{label}</FieldLabel>
      <AriaButton className={({ isFocusVisible }) => cx('srn-field-group', 'srn-select-trigger', `srn-size-${size}`, 'motion-feedback-hover', isFocusVisible ? 'effect-focus-neutral' : 'effect-field-default')}>
        <SelectValue className="srn-input text-body-large" />
        <span className="srn-select-chevron motion-feedback-rotate" aria-hidden="true"><Icon name="chevron-right" size={16} /></span>
      </AriaButton>
      <Popover offset={4} className="srn-popover srn-popover--list effect-elevation-overlay motion-enter-pop motion-exit-pop">
        <ListBox className="srn-listbox">
          {items.map((it) => (
            <ListBoxItem key={it} id={it} textValue={it} className={({ isFocused, isSelected }) => cx('srn-listbox-item', 'text-body-medium', isFocused && 'is-focused', isSelected && 'is-selected')}>
              {it}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

// Serenity SelectBoxGroup (single, horizontal) over the React Aria RadioGroup: each SelectBox is a Radio drawn as a card
// with a label and a description; the selected box has the 2 px Stroke/Inverse/Default border (Feedback/Select).
export function SelectBoxGroup({ label, options, className, ...props }) {
  return (
    <RadioGroup {...props} orientation="horizontal" className={cx('srn-field', className)}>
      <FieldLabel>{label}</FieldLabel>
      <div className="srn-selectbox-group">
        {options.map((o) => (
          <Radio key={o.id} value={o.id} className={({ isFocusVisible }) => cx('srn-selectbox', 'motion-feedback-select', 'motion-feedback-press', isFocusVisible && 'effect-focus-neutral')}>
            <span className="text-label-strong-small">{o.label}</span>
            <span className="text-body-small srn-selectbox-desc num">{o.description}</span>
          </Radio>
        ))}
      </div>
    </RadioGroup>
  );
}
