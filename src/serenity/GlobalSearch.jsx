import React from 'react';
import {
  Autocomplete, useFilter, SearchField, Input, Group, Button as AriaButton, ListBox, ListBoxItem, ListBoxSection, Header, Dialog as AriaDialog,
} from 'react-aria-components';
import { cx } from './Button.jsx';
import { Modal } from './Overlays.jsx';
import { Keyboard } from './Content.jsx';
import { Icon } from '../icons.jsx';

// Serenity GlobalSearch in a Modal width=l over the Scrim (type=modal): a SearchField over a ListBox of grouped results
// (ListBoxSection with its Header). Typing filters; Up and Down move through the results from the field, Enter opens one,
// Escape closes the dialog and focus returns to the Search row. ListBoxEmptyState when nothing matches.
export function GlobalSearch({ isOpen, onOpenChange, groups, onAction }) {
  const { contains } = useFilter({ sensitivity: 'base' });
  return (
    <Modal width="l" placement="top" isOpen={isOpen} onOpenChange={onOpenChange}>
      <AriaDialog aria-label="Search" className="srn-search">
        {({ close }) => (
          <Autocomplete filter={contains}>
            <SearchField aria-label="Search Lighthouse" autoFocus className="srn-search-field">
              <Group className={({ isFocusVisible }) => cx('srn-search-group', isFocusVisible && 'effect-focus-inset-neutral')}>
                <span className="srn-search-icon" aria-hidden="true"><Icon name="search" /></span>
                <Input placeholder="Search Lighthouse" className="srn-input text-body-large" />
                <AriaButton className={({ isFocusVisible }) => cx('srn-search-clear', isFocusVisible && 'effect-focus-neutral')} aria-label="Clear search"><Icon name="close" size={16} /></AriaButton>
                <Keyboard className="srn-search-esc">Esc</Keyboard>
              </Group>
            </SearchField>
            <ListBox
              aria-label="Results"
              className="srn-listbox srn-search-results"
              onAction={(key) => { const item = groups.flatMap((g) => g.items).find((i) => i.id === key); close(); if (item) setTimeout(item.run, 0); }}
              renderEmptyState={() => <p className="srn-listbox-empty text-body-medium">No results. Try another search.</p>}
            >
              {groups.map((g) => (
                <ListBoxSection key={g.name} id={g.name} className="srn-listbox-section">
                  <Header className="srn-listbox-header text-caption-strong-small">{g.name}</Header>
                  {g.items.map((it) => (
                    <ListBoxItem key={it.id} id={it.id} textValue={`${it.label} ${g.name}`}
                      className={({ isFocused }) => cx('srn-listbox-item', 'motion-feedback-hover', isFocused && 'is-focused')}>
                      <span className="text-body-medium">{it.label}</span>
                      {it.meta && <span className="text-body-medium srn-listbox-meta num">{it.meta}</span>}
                    </ListBoxItem>
                  ))}
                </ListBoxSection>
              ))}
            </ListBox>
          </Autocomplete>
        )}
      </AriaDialog>
    </Modal>
  );
}
