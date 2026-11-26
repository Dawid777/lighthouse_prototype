# Lighthouse prototype

A clickable prototype of the Lighthouse web app, built on **Serenity 2.0**, done in stages. It is deployed on Vercel.

## Stage 1: Home

The source is the Figma file *Lighthouse (Web App) Serenity 2.0*, page **👷 Design: Home**, iteration **1.0.a Home**:

| Width | Figma frame |
| --- | --- |
| Desktop 1440 | `71:5507` |
| Tablet 768 | `74:27435` |
| Phone 390 | `53:5059` |

This iteration is the one used because it is built only from Serenity 2.0 library components (none of the local "Lighthouse additions") and it is the only Home iteration with all three widths drawn.

### What you can click

- **Sidebar**: links to every section. Sections other than Home show a placeholder for now. The sidebar collapses to a rail and the logo expands it again.
- **Search**: the sidebar row or ⌘K / Ctrl+K opens a command palette with pages, actions, transactions, cards and accounts. It works with arrow keys and Enter.
- **Send**: a form with validation, then review, then confirm. The new transaction, the new balance and the recipient all show up on Home.
- **Add money**: shows the deposit details with copy buttons, plus a "Simulate deposit" button for the prototype.
- **Balance chart**: hover or focus a point to see its value, and use the arrow keys to move between points.
- **Spending donut and legend**: hover or tap to highlight a category.
- **Rows** (transactions, cards, accounts, expenses, recipients): open a detail sheet. Cards can be frozen and unfrozen.
- **Submit an expense**: the expense appears under Expenses.
- **Tablet and phone**: a top bar with a drawer (the Sidebar as a sheet over a scrim), search, notifications and the account menu.

State lives in memory, so reloading the page resets it.

## Stack

This is static HTML, CSS and JS with no build step. Vercel serves the folder as-is.

- `styles/tokens.css`: the Serenity 2.0 tokens (Light), with values copied from the Figma variables. Values marked `--proto-*` are prototype-only stand-ins.
- `styles/app.css`: layout and components. Breakpoints are at 1024 (desktop shell) and 1200 (two columns).
- `scripts/icons.js`: the Serenity icons exported from Figma.
- `scripts/app.js`: data, rendering and interactions.

**Planned next step:** move to React Aria Components with the Serenity token package once npm installs are available in the build environment.

## Run locally

```bash
npx serve .
# or
python3 -m http.server 8000
```
