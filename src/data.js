// Prototype data and state for Home (values from Figma 1.0.a Home). State lives in memory: a reload resets it.
import { createContext, useContext } from 'react';
import * as seed from './seed.js';

export const initialState = {
  accounts: [
    { id: 'operating', name: 'Operating', balance: 345730.65, available: 11446.45, inFlight: 1284.2 },
    { id: 'reserve', name: 'Reserve', balance: 1441630.65 },
  ],
  transactions: seed.transactions,
  cards: seed.cards,
  cardTransactions: seed.cardTransactions,
  bills: seed.bills,
  customers: seed.customers,
  invoices: seed.invoices,
  tasks: seed.tasks,
  completedTasks: seed.completedTasks,
  settings: { first: 'Andrew', last: 'Hale', email: 'andrew.hale@firefly.co', title: 'CEO', phone: '+56 4524 6553 45', country: null, city: null, language: 'English', timeZone: null, newsletter: true, analytics: true, marketing: false },
  month: { label: 'October 2026', moneyIn: 14067.2, moneyOut: 89003.37 },
  balanceSeries: [
    { label: 'Oct 6', value: 344000 }, { label: 'Oct 11', value: 351000 }, { label: 'Oct 16', value: 348000 },
    { label: 'Oct 21', value: 356000 }, { label: 'Oct 26', value: 353000 }, { label: 'Oct 31', value: 359000 },
  ],
  spending: [
    { name: 'Payroll', pct: 46, color: 'var(--color-chart-categorical-1-default)' },
    { name: 'Other', pct: 23, color: 'var(--color-chart-categorical-2-default)' },
    { name: 'Contractors', pct: 17, color: 'var(--color-chart-categorical-3-default)' },
    { name: 'Software & SaaS', pct: 14, color: 'var(--color-chart-categorical-4-default)' },
  ],
  spendingTotal: 89000,
  expenses: [],
  recipients: [],
};

let nextId = 100;
const id = (p) => `${p}${nextId++}`;
const round2 = (n) => Math.round(n * 100) / 100;

export function reducer(state, action) {
  switch (action.type) {
    case 'send': {
      const { from, to, value, note } = action;
      const accounts = state.accounts.map((a) => a.id !== from ? a : { ...a, balance: round2(a.balance - value), ...(a.id === 'operating' ? { available: round2(a.available - value) } : {}) });
      const acc = state.accounts.find((a) => a.id === from);
      return {
        ...state,
        accounts,
        month: { ...state.month, moneyOut: round2(state.month.moneyOut + value) },
        transactions: [{ id: id('t'), name: to, sub: 'Transfer, just now', amount: -value, method: `${acc.name} account`, category: note || 'Transfer', date: 'Just now', status: 'Processing', isNew: true }, ...state.transactions],
        recipients: [{ id: id('r'), name: to, amount: value, when: 'just now', isNew: true }, ...state.recipients],
      };
    }
    case 'deposit': {
      const { value } = action;
      return {
        ...state,
        accounts: state.accounts.map((a) => a.id !== 'operating' ? a : { ...a, balance: round2(a.balance + value), available: round2(a.available + value) }),
        month: { ...state.month, moneyIn: round2(state.month.moneyIn + value) },
        transactions: [{ id: id('t'), name: 'USDC deposit', sub: 'Deposit, just now', amount: value, method: 'Ethereum (ERC-20)', category: 'Deposit', date: 'Just now', status: 'Processing', isNew: true }, ...state.transactions],
      };
    }
    case 'expense':
      return { ...state, expenses: [{ id: id('e'), merchant: action.merchant, amount: action.value, category: action.category, note: action.note, isNew: true }, ...state.expenses] };
    case 'toggle-freeze':
      return { ...state, cards: state.cards.map((c) => c.id === action.id ? { ...c, frozen: !c.frozen, status: c.frozen ? 'Active' : 'Frozen', frozenAt: c.frozen ? null : 'today at 2:32pm' } : c) };
    case 'card-cancel':
      return { ...state, cards: state.cards.filter((c) => c.id !== action.id) };
    case 'card-create':
      return { ...state, cards: [{ ...action.card, id: id('c'), isNew: true }, ...state.cards] };
    case 'card-update':
      return { ...state, cards: state.cards.map((c) => c.id === action.id ? { ...c, ...action.patch } : c) };
    case 'tx-receipt':
      return { ...state, transactions: state.transactions.map((t) => t.id === action.id ? { ...t, receipt: action.file } : t) };
    case 'transfer': {
      const { from, to, value, note } = action;
      const accounts = state.accounts.map((a) => {
        if (a.id === from) return { ...a, balance: round2(a.balance - value), ...(a.id === 'operating' ? { available: round2(a.available - value) } : {}) };
        if (a.id === to) return { ...a, balance: round2(a.balance + value), ...(a.id === 'operating' ? { available: round2(a.available + value) } : {}) };
        return a;
      });
      const name = (x) => state.accounts.find((a) => a.id === x).name;
      return { ...state, accounts, transactions: [{ id: id('t'), name: `${name(from)} → ${name(to)}`, sub: 'Internal transfer, just now', type: 'Internal transfer', amount: from === 'operating' ? -value : value, method: 'Internal transfer', category: note || 'Transfer', date: 'Just now', status: 'Completed', account: `${name(from)} account`, ref: 'TXN-NEW', isNew: true }, ...state.transactions] };
    }
    case 'invoice-save':
      return { ...state, invoices: state.invoices.some((i) => i.id === action.invoice.id) ? state.invoices.map((i) => i.id === action.invoice.id ? action.invoice : i) : [action.invoice, ...state.invoices] };
    case 'invoice-update':
      return { ...state, invoices: state.invoices.map((i) => i.id === action.id ? { ...i, ...action.patch, activity: action.log ? [action.log, ...i.activity] : i.activity } : i) };
    case 'invoice-delete':
      return { ...state, invoices: state.invoices.filter((i) => i.id !== action.id) };
    case 'customer-create':
      return { ...state, customers: [...state.customers, { ...action.customer, id: id('cu') }] };
    case 'task-resolve': {
      const t = state.tasks.find((x) => x.id === action.id);
      return { ...state, tasks: state.tasks.filter((x) => x.id !== action.id), completedTasks: [{ id: id('d'), title: t.title, result: action.result, date: 'Today', amount: t.amount, status: action.status, tone: action.tone }, ...state.completedTasks] };
    }
    case 'tasks-clear':
      return { ...state, tasks: [] };
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    default:
      return state;
  }
}

export const total = (s) => s.accounts.reduce((sum, a) => sum + a.balance, 0);
export const availableOf = (a) => a.id === 'operating' ? a.available : a.balance;

export const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);
