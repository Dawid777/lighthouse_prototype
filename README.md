# Lighthouse prototype

A clickable prototype of the Lighthouse web app, built on **Serenity 2.0**: React Aria Components styled with the Serenity tokens and motion patterns, in Light and Dark, at every width. It is built in stages and deployed on Vercel. It is for trying and testing flows, not production code: component and prop names follow Serenity, and the shipping code stays with the developers.

## Stage 1: Home

The source is the Figma file *Lighthouse (Web App) Serenity 2.0*, page **👷 Design: Home**, iteration **1.0.a Home**:

| Width | Figma frame |
| --- | --- |
| Desktop 1440 | `71:5507` |
| Tablet 768 | `74:27435` |
| Phone 390 | `53:5059` |

### What you can click

- **Sidebar** (Serenity Sidebar over the React Aria NavigationTree): every section; sections other than Home show a placeholder. Collapse sidebar or ⌘B / Ctrl+B turns it into the rail (with Tooltips); the logo expands it again. The choice is remembered.
- **Search**: the Search row, ⌘K / Ctrl+K or / opens GlobalSearch (pages, actions, transactions, cards, accounts). Type to filter, arrows and Enter to open.
- **Send**: form with validation, review, send. The new transaction, the new balance and the recipient show up on Home.
- **Add money**: the stage 2 flow below.
- **Balance chart**: hover, tap or focus a point; Left, Right, Home and End move between points.
- **Spending donut and legend**: hover, focus or tap to highlight a category.
- **Rows** (transactions, cards, accounts, expenses, recipients): a GridList, so arrows move and Enter opens the detail. On desktop it opens in a Sheet from the right, below 1024 in a centred Modal (SR-276). Cards can be frozen and unfrozen.
- **Submit an expense**: the expense appears under Expenses.
- **Account menu** (the avatar): Settings, Help, the theme (Light, Dark, System) and Log out.
- **Tablet and phone**: the TopBar with the menu (the Sidebar in a Sheet from the left), search, notifications and the account menu.

State lives in memory, so reloading the page resets it.

### Screens and states

Every screen and state has an address, `?screen=<id>`, and `?theme=dark` or `?theme=light` picks the mode:

`home`, `home-after-actions`, `home-rail`, `send-form`, `send-review`, `send-done`, `add-money`, `expense`, `detail-transaction`, `detail-card`, `detail-account`, `search`, `drawer`, `cards`.

For example `/?screen=send-review&theme=dark`. The map is `SCREENS` in `src/App.jsx`.

## Stage 2: one journey, Sign up → Identity verification → Home → Add money

The prototype now opens on **Create account** and runs the whole journey:

| Flow | Figma page | What you can click |
| --- | --- | --- |
| Sign up: email or phone | `8:2971` | Email path: password with four suggested words, the strength Meter, "Why four random words?", Check your email, the expired link. Phone path: the country (search), the SMS code with Resend. Continue with Google skips to verification. |
| Identity verification: ID and selfie | `17:6445` | Start, choose the document, get it ready, the camera, the selfie, the face scan, Checking (runs by itself), You're verified → Home. |
| Add money | `545:21868` | Bank transfer or USDC from a wallet; the wallet check; the network (Base, Solana, another); the address with Copy address. |

Prototype rules, also written on the screens: an address at firefly.com already has an account, the SMS code is 2137, a wallet address containing "dead" can't be used, and Check your email offers the email link (and the link after 24 hours). The bank transfer, the arrival time and the fee stay placeholders until PT-1; Base and Solana both stay until UXQ-17.

The **Prototype map** (`#/map`, also in the Account menu) links every screen and state. Their ids: `signup`, `signup-phone`, `signup-country`, `signup-email-taken`, `signup-password`, `signup-password-weak`, `signup-why`, `signup-creating`, `signup-check-email`, `signup-code`, `signup-code-wrong`, `signup-code-incomplete`, `signup-expired`, `verify`, `verify-document`, `verify-document-error`, `verify-id-ready`, `verify-camera`, `verify-unreadable`, `verify-selfie`, `verify-face-scan`, `verify-checking`, `verify-done`, `verify-failed`, `add-money`, `add-money-wallet`, `add-money-wallet-blocked`, `add-money-network`, `add-money-network-other`, `add-money-address`, `add-money-address-error`.

The brand photo beside the forms is the Serenity template's placeholder (glassRibbon) until the Lighthouse brand image arrives.

## Stage 3: the whole Lighthouse prototype

Every screen in the Figma file is in the prototype, linked together. The Sidebar reaches each section; the Account menu has Settings and the Prototype map.

| Section | Figma | What you can click |
| --- | --- | --- |
| Cards | `25:7122` | The list (Manage · Subscriptions), a card's Overview and Transactions, Show number, Freeze, Edit card, Cancel this card, New card → Card ready. |
| Transactions | `47:9901` | The month's list with a type filter, a transaction's details with the receipt DropZone, Transfer funds (form, review, done), Send money (pick or upload a bill). |
| Payments | `51:5678` | Inbox · Needs approval · Scheduled · Paid, the overdue Meter, Upload bill. |
| Money movement, Move money | `84:7472`, `84:7474` | Money in · Money spent, the month chart, an empty month; Transfer, Deposit and Request. |
| Invoices | `55:12505` | All · Unpaid · Paid · Drafts; New invoice (customer, new customer, items, errors, preview, sent); details for unpaid, overdue, paid, draft and cancelled invoices with More (mark as paid, duplicate, reminders, cancel), Payment link and Send reminder; Customers; Reminders with the email preview. |
| Tasks | `63:5057` | Incomplete · Completed, a payment request with Approve and Decline (with a reason), all caught up. |
| Settings | `66:5057` | Account, Preferences (the theme switch works), Privacy and data. |
| Consoles | `471:7471`, `474:7471` | A separate section at `#/console/...`: the Compliance queue, screening match with decisions and evidence access, customer view with revealed identifiers, EDD with a partially applied restriction, four-eyes approval, breach clocks, reporting; the Support queue (live, empty, can't load), contacts confirmed and not, customer view and dispute, money case and correction approval, and the customer-app screens (get help, contact states, can't sign in and recovery, dispute, data request, missing deposit). |

Team has no screens in Figma yet, so it stays a placeholder.

## Stack

Vite, React 18 and React Aria Components 1.22.

- `src/styles/tokens.css`: every Serenity token (Light and Dark, Desktop, Tablet and Mobile, Reduced motion) and the `.text-*` and `.effect-*` classes. `src/styles/motion.css`: one class per Serenity motion pattern. Both come from the Serenity plugin's prototype starter and are never edited by hand; copy them again after a plugin update.
- `src/serenity/`: the Serenity components over React Aria (Button, Button: Icon, Link, TextField, NumberField, TextArea, Select, SelectBoxGroup, Dialog, Modal, Sheet, Popover, Menu, Tooltip, Toast, Stat, Badge, EmptyState, DescriptionList, Avatar, Keyboard, PageHeader, GridList, Chart, Sidebar, TopBar, GlobalSearch).
- `src/styles/components.css` and `src/styles/app.css`: their styles and the layout, tokens only.
- `src/screens/`: Home, the placeholder, the flows (Send, Add money, Expense) and the detail panel.
- `src/data.js`: the prototype data and state.

## Run locally

```bash
npm install
npm run dev          # open the address it prints
```

## QA

```bash
npm run build
npm run qa           # screenshots at 1440, 768, 390 in Light and Dark, axe (WCAG 2.2 AA), focus rings, reduced motion
node qa/flows.mjs    # clicks through every flow on Home
```

Both serve `dist/` from disk through Playwright, so no server is needed. When Playwright's own Chromium is not installed, point them at an installed Chrome: `CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run qa`. The report and screenshots land in `qa/report/`.
