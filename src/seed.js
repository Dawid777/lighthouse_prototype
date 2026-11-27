// Prototype data for the app pages, taken from the Figma screens (Cards 25:7122, Transactions 47:9901, Payments 51:5678,
// Money movement 84:7472, Invoices 55:12505, Tasks 63:5057, Settings 66:5057). Kept in memory; a reload resets it.

// The PaymentCard designs (Figma PaymentCard, property design): the ColorSwatchPicker of New card shows them in this order.
export const CARD_DESIGNS = [
  { id: 'graphite', name: 'Graphite' }, { id: 'sand', name: 'Sand' }, { id: 'aurora', name: 'Aurora' },
  { id: 'photo', name: 'Photo' }, { id: 'forest', name: 'Forest' },
];

// The Cards page list (Figma Cards 1.0) is the cards with listed !== false; Ops card and Alan's card belong to Home 1.0.a
// and are reached from there only.
export const cards = [
  { id: 'c1', name: 'Ops card', last4: '6034', type: 'Virtual', kind: 'credit', holder: 'Dawid', balance: 2350.4, spent: 1284.2, limit: 3000, status: 'Active', account: 'Operating ••4417', created: 'Mar 2, 2026', design: 'graphite', listed: false },
  { id: 'c2', name: "Alan's card", last4: '4417', type: 'Virtual', kind: 'credit', holder: 'Alan Rutledge', balance: 640.12, spent: 287.89, limit: 2000, status: 'Active', account: 'Operating ••4417', created: 'Apr 18, 2026', design: 'aurora', listed: false },
  { id: 'c3', name: 'Sofia’s card', last4: '5555', type: 'Physical', kind: 'debit', holder: 'Sofia Lindström', balance: 2000, spent: 0, limit: 2000, status: 'Active', account: 'Operating ••4417', created: 'May 3, 2026', design: 'forest' },
  { id: 'c4', name: 'AWS billing', last4: '0330', type: 'Virtual', kind: 'credit', holder: 'Sofia Lindström', balance: 500, spent: 1500, limit: 2000, status: 'Active', account: 'Card float ••6034', created: 'Jun 12, 2026', design: 'graphite' },
  { id: 'c5', name: 'Ads spend', last4: '3054', type: 'Virtual', kind: 'credit', holder: 'Sofia Lindström', balance: 500, spent: 1500, limit: 2000, status: 'Active', account: 'Card float ••6034', created: 'Jun 12, 2026', design: 'aurora' },
  { id: 'c6', name: 'Travel expenses', last4: '8628', type: 'Virtual', kind: 'credit', holder: 'Sofia Lindström', balance: 0, spent: 0, limit: 1000, status: 'Suspended', account: 'Card float ••6034', created: 'Jul 1, 2026', design: 'photo' },
  { id: 'c7', name: 'Kristin’s card', last4: '3745', type: 'Physical', kind: 'debit', holder: 'Kristin Watson', balance: 1163, spent: 837, limit: 2000, status: 'Active', account: 'Operating ••4417', created: 'Aug 9, 2026', design: 'sand' },
  { id: 'c8', name: 'Grocery / meals', last4: '4928', type: 'Virtual', kind: 'debit', holder: 'Kristin Watson', balance: 500, spent: 0, limit: 500, status: 'Active', account: 'Operating ••4417', created: 'Aug 9, 2026', design: 'forest' },
  { id: 'c9', name: 'Vendor payments', last4: '6112', type: 'Virtual', kind: 'credit', holder: 'Kristin Watson', balance: 2013, spent: 2987, limit: 5000, status: 'Active', account: 'Card float ••6034', created: 'Sep 1, 2026', design: 'graphite' },
];

// Card transactions (Figma Cards 1.5): group is the date heading of the phone list.
export const cardTransactions = [
  { id: 'ct1', merchant: 'Amazon Web Services', type: 'Card payment', date: 'Today, 9:14am', time: '9:14am', group: 'Today', amount: -412.6, status: 'Paid' },
  { id: 'ct2', merchant: 'Datadog', type: 'Merchant not allowed', date: 'Today, 8:02am', time: '8:02am', group: 'Today', amount: -49, status: 'Declined' },
  { id: 'ct3', merchant: 'Amazon Web Services', type: 'Card payment', date: 'Yesterday, 6:40pm', time: '6:40pm', group: 'Yesterday', amount: -887.4, status: 'Receipt missing' },
  { id: 'ct4', merchant: 'AWS Marketplace', type: 'Card payment', date: 'Yesterday, 11:05am', time: '11:05am', group: 'Yesterday', amount: -250, status: 'Paid' },
  { id: 'ct5', merchant: 'Amazon Web Services', type: 'Refund', date: 'Yesterday, 10:22am', time: '10:22am', group: 'Yesterday', amount: 50, status: 'Paid' },
  { id: 'ct6', merchant: 'Amazon Web Services', type: 'Card payment', date: 'Sep 30, 2026', time: 'Sep 30, 2026', group: 'Sep 2026', amount: -1342.18, status: 'Paid' },
  { id: 'ct7', merchant: 'Amazon Web Services', type: 'Card payment', date: 'Sep 15, 2026', time: 'Sep 15, 2026', group: 'Sep 2026', amount: -1120, status: 'Paid' },
  { id: 'ct8', merchant: 'AWS Marketplace', type: 'Card payment', date: 'Sep 3, 2026', time: 'Sep 3, 2026', group: 'Sep 2026', amount: -1500, status: 'Paid' },
];

// The transactions page list; the first three are the Home rows (t1–t3).
export const transactions = [
  { id: 't1', name: 'Deli 77', sub: 'Card payment, today', type: 'Card payment', card: '••4928', amount: -63.53, method: 'Ops card ••6034', category: 'Meals', date: '12:41pm Aug 27, 2026', status: 'Completed', account: 'Operating ••4417', ref: 'TXN-4R8K2PLA' },
  { id: 't2', name: 'Payment from Firefly', sub: 'Deposit, yesterday', type: 'Deposit', amount: 1200, method: 'Bank deposit', category: 'Income', date: '9:02am Aug 27, 2026', status: 'Completed', account: 'Operating ••4417', ref: 'TXN-7DPW1QXE' },
  { id: 't3', name: 'Office Stop Co.', sub: 'Card payment, Oct 3', type: 'Card payment', card: '••1147', amount: -287.89, method: "Jane's card ••1147", category: 'Office supplies', date: '4:18pm Aug 26, 2026', status: 'Pending', account: 'Operating ••4417', ref: 'TXN-9MQ2H5DK', needsReceipt: true },
  { id: 't4', name: 'Cashback, August', sub: 'Reward', type: 'Reward', amount: 6.81, method: 'Lighthouse rewards', category: 'Income', date: '11:07am Aug 26, 2026', status: 'Pending', account: 'Operating ••4417', ref: 'TXN-2CB8AUGR' },
  { id: 't5', name: 'Withdrawal to DBS ••4417', sub: 'Withdrawal', type: 'Withdrawal', amount: -500, method: 'Bank withdrawal', category: 'Transfer', date: '7:55pm Aug 25, 2026', status: 'Failed', account: 'Operating ••4417', ref: 'TXN-5WD0FAIL' },
  { id: 't6', name: "Lily's Eatery", sub: 'Card payment', type: 'Card payment', card: '••4928', amount: -12.4, method: 'Ops card ••6034', category: 'Meals', date: '1:12pm Aug 25, 2026', status: 'Completed', account: 'Operating ••4417', ref: 'TXN-1LE77QWE' },
  { id: 't7', name: 'Payment from Northwind Ltd', sub: 'Deposit', type: 'Deposit', amount: 3150, method: 'Bank deposit', category: 'Income', date: '10:24am Aug 24, 2026', status: 'Completed', account: 'Operating ••4417', ref: 'TXN-3NW3150Z' },
  { id: 't8', name: 'Grab', sub: 'Card payment', type: 'Card payment', card: '••5555', amount: -18.2, method: 'Sofia’s card ••5555', category: 'Travel', date: '8:41pm Aug 23, 2026', status: 'Completed', account: 'Operating ••4417', ref: 'TXN-8GRB18QZ' },
  { id: 't9', name: 'AWS', sub: 'Card payment', type: 'Card payment', card: '••0330', amount: -412.6, method: 'AWS billing ••0330', category: 'Software & SaaS', date: '6:03am Aug 23, 2026', status: 'Completed', account: 'Card float ••6034', ref: 'TXN-6AWS412P' },
  { id: 't10', name: 'Figma', sub: 'Card payment', type: 'Card payment', card: '••9081', amount: -45, method: 'Design card ••9081', category: 'Software & SaaS', date: '2:29pm Aug 22, 2026', status: 'Pending', account: 'Card float ••6034', ref: 'TXN-0FIG45YY' },
];

export const bills = [
  { id: 'b1', vendor: 'Tax Bureau Inc', invoice: 'INV-883346', due: 'Aug 12, 2026', amount: 11600, status: '21 days late', tone: 'red', group: 'inbox' },
  { id: 'b2', vendor: 'Nano Tech LLC', invoice: 'INV-001', due: 'Aug 20, 2026', amount: 1290, status: '13 days late', tone: 'red', group: 'inbox' },
  { id: 'b3', vendor: 'Debug LLC', invoice: 'INV-902', due: 'Aug 28, 2026', amount: 220, status: '5 days late', tone: 'red', group: 'inbox' },
  { id: 'b4', vendor: 'Meridian Health Supplies', invoice: 'INV-4471', due: 'Sep 3, 2026', amount: 12500, status: 'Due tomorrow', tone: 'amber', group: 'inbox' },
  { id: 'b5', vendor: 'Northwind Ltd', invoice: 'INV-2210', due: 'Sep 5, 2026', amount: 3480, status: 'Due in 3 days', tone: 'neutral', group: 'inbox' },
  { id: 'b6', vendor: 'Orion Labs', invoice: 'INV-1188', due: 'Sep 8, 2026', amount: 7900, status: 'Needs you', tone: 'azure', group: 'approval' },
  { id: 'b7', vendor: 'AWS', invoice: 'INV-AWS-0826', due: 'Sep 10, 2026', amount: 412.6, status: 'Needs you', tone: 'azure', group: 'approval' },
  { id: 'b8', vendor: 'Singtel', invoice: 'INV-SG-8841', due: 'Sep 12, 2026', amount: 74.9, status: 'Auto-pay', tone: 'neutral', group: 'scheduled' },
  { id: 'b9', vendor: 'Office Stop Co.', invoice: 'INV-7734', due: 'Sep 15, 2026', amount: 287.89, status: 'Auto-pay', tone: 'neutral', group: 'scheduled' },
  { id: 'b10', vendor: 'Acme Corp', invoice: 'INV-9002', due: 'Sep 30, 2026', amount: 2100, status: 'Auto-pay', tone: 'neutral', group: 'scheduled' },
  { id: 'b11', vendor: 'Cold Brew Co.', invoice: 'No invoice number', due: 'Sep 18, 2026', amount: 96, status: 'Draft', tone: 'neutral', group: 'inbox' },
  { id: 'b12', vendor: 'Linear', invoice: 'INV-LN-441', due: 'Sep 22, 2026', amount: 64, status: 'Draft', tone: 'neutral', group: 'inbox' },
  { id: 'b13', vendor: 'Northwind Traders', invoice: 'INV-7710', due: 'Sep 3, 2026', amount: 2300, status: 'Paid', tone: 'green', group: 'paid' },
];

export const customers = [
  { id: 'cu1', name: 'Northwind Ltd', email: 'billing@northwind.com', place: 'London, UK' },
  { id: 'cu2', name: 'Meridian Health', email: 'ap@meridian.health', place: 'Singapore' },
  { id: 'cu3', name: 'Alex Smith', email: 'alex@smithstudio.com', place: 'Lisbon, Portugal', company: 'Smith Studio' },
  { id: 'cu4', name: 'Acme Corp', email: 'finance@acme.co', place: 'New York, US' },
  { id: 'cu5', name: 'Orion Labs', email: 'ops@orionlabs.io', place: 'Berlin, Germany' },
];

// Invoice status: draft, unpaid (sent, viewed), overdue, paid, cancelled. Items are [description, quantity, unit price].
export const invoices = [
  { id: 'INV-0013', customer: 'Alex Smith', due: 'Nov 7, 2026', dueNote: 'due in 30 days', status: 'unpaid', viewed: true, items: [['Brand identity', 1, 2400], ['Website design', 1, 3200]], issued: 'Oct 8, 2026', reminders: true,
    activity: [['Viewed by Alex', '9:12am today'], ['Sent', '5:40pm Oct 8, 2026'], ['Created', '5:32pm Oct 8, 2026']] },
  { id: 'INV-0012', customer: 'Meridian Health', due: 'Oct 20, 2026', dueNote: 'due in 12 days', status: 'unpaid', items: [['Quarterly retainer', 1, 8450]], issued: 'Sep 20, 2026', reminders: true,
    activity: [['Sent', '10:02am Sep 20, 2026'], ['Created', '9:48am Sep 20, 2026']] },
  { id: 'INV-0011', customer: 'Northwind Ltd', due: 'Sep 30, 2026', dueNote: '8 days late', status: 'overdue', items: [['Strategy workshop', 1, 3200]], issued: 'Sep 1, 2026', reminders: true,
    activity: [['Due date passed', 'Sep 30, 2026'], ['Reminder sent', 'Sep 27, 2026'], ['Viewed', 'Sep 25, 2026']] },
  { id: 'INV-0010', customer: 'Acme Corp', due: 'Oct 15, 2026', dueNote: 'due in 7 days', status: 'unpaid', viewed: true, items: [['Design sprint', 1, 1200]], issued: 'Sep 15, 2026', reminders: true,
    activity: [['Viewed', 'Sep 18, 2026'], ['Sent', 'Sep 15, 2026']] },
  { id: 'DRAFT-0014', customer: 'Alex Smith', due: 'Nov 22, 2026', status: 'draft', items: [['Brand identity', 1, 2400], ['Website design', 1, 3200]], issued: '—', reminders: true,
    activity: [['Saved automatically', '2 hours ago']] },
  { id: 'INV-0009', customer: 'Orion Labs', due: 'Oct 2, 2026', status: 'paid', paidOn: 'Oct 2, 2026', items: [['Illustrations', 1, 2400]], issued: 'Sep 2, 2026', reminders: true,
    activity: [['Paid', 'Oct 2, 2026'], ['Sent', 'Sep 2, 2026']] },
  { id: 'INV-0008', customer: 'Northwind Ltd', due: 'Sep 28, 2026', status: 'paid', paidOn: 'Sep 28, 2026', items: [['Website maintenance', 1, 4150]], issued: 'Aug 28, 2026', reminders: true,
    activity: [['Paid', 'Sep 28, 2026'], ['Sent', 'Aug 28, 2026']] },
];

export const tasks = [
  { id: 'k1', title: 'Meridian Health Supplies', type: 'Payment', by: 'Expires in 6 hours', amount: 12500, status: 'Needs approval', tone: 'azure', request: true },
  { id: 'k2', title: 'Reserve → Operating', type: 'Internal transfer', by: 'Darrell Steward', amount: 50000, status: 'Needs approval', tone: 'azure' },
  { id: 'k3', title: 'Jason Green', type: 'Recurring monthly', by: 'Alice C.', amount: 5000, status: 'Needs approval', tone: 'azure' },
  { id: 'k4', title: 'Jason Green', type: 'Payment, due Sep 6', by: '—', amount: 1042.95, status: 'Needs approval', tone: 'azure' },
  { id: 'k5', title: 'Jane Black', type: 'Budget overspend', by: '—', amount: 480, status: 'Needs approval', tone: 'azure' },
  { id: 'k6', title: 'Bruce Collins', type: 'Team invite', by: 'Landon Shepherd', amount: null, status: 'Needs approval', tone: 'azure' },
  { id: 'k7', title: 'New daily payment limit', type: 'Limit change', by: 'Landon Shepherd', amount: 100000, status: 'Needs approval', tone: 'azure' },
  { id: 'k8', title: 'Dual admin approval', type: 'Policy change', by: 'Landon Shepherd', amount: null, status: 'Needs approval', tone: 'azure' },
  { id: 'k9', title: 'Foodpanda', type: 'Uncategorised, Sep 4', by: '—', amount: 300.03, status: 'Needs review', tone: 'amber' },
  { id: 'k10', title: 'Monarch Books', type: 'Receipt exemption', by: 'Landon Shepherd', amount: null, status: 'Needs review', tone: 'amber' },
  { id: 'k11', title: 'Forwarded emails', type: 'Pending auto-forward', by: '—', amount: null, status: 'Needs review', tone: 'amber' },
  { id: 'k12', title: 'Payroll, September', type: 'Runs Sep 1, 14 people', by: '—', amount: 82400, status: 'Scheduled', tone: 'neutral' },
];

export const completedTasks = [
  { id: 'd1', title: 'Northwind Traders', result: 'Payment approved by you', date: 'Sep 3, 2026', amount: 2300, status: 'Approved', tone: 'green' },
  { id: 'd2', title: 'Alice Cooper', result: 'Team invite approved', date: 'Sep 2, 2026', amount: null, status: 'Approved', tone: 'green' },
  { id: 'd3', title: 'Uber', result: 'Categorised as Travel', date: 'Sep 2, 2026', amount: 24.8, status: 'Done', tone: 'green' },
  { id: 'd4', title: 'Landon Shepherd', result: 'Receipt exemption declined', date: 'Sep 1, 2026', amount: null, status: 'Declined', tone: 'red' },
  { id: 'd5', title: 'Payroll, August', result: 'Released by you', date: 'Aug 1, 2026', amount: 79800, status: 'Released', tone: 'green' },
  { id: 'd6', title: 'Jason Green', result: 'Payment approved by you', date: 'Jul 28, 2026', amount: 1042.95, status: 'Approved', tone: 'green' },
  { id: 'd7', title: 'Single admin approval', result: 'Policy change declined', date: 'Jul 21, 2026', amount: null, status: 'Declined', tone: 'red' },
];

export const moneyMovement = {
  in: { total: 14067.2, avg: 11400, items: [['Northwind Ltd', 'Customer payment', 3150], ['Meridian Health', 'Customer payment', 1975], ['Acme Corp', 'Customer payment', 1450], ['Stripe payout', 'Payout', 8450]],
    series: [{ label: 'Sep', value: 12600 }, { label: 'Oct', value: 14067 }] },
  spent: { total: 89003.37, avg: 82600, items: [['Payroll, August', 'Payroll', -78900], ['DBS ••4417', 'Withdrawal', -3000], ['AWS', 'Card payment', -412.6], ['Apple', 'Card payment', -1299]],
    series: [{ label: 'Sep', value: 81200 }, { label: 'Oct', value: 89003 }] },
};
