// Prototype data and state for Home (values from Figma 1.0.a Home). State lives in memory: a reload resets it.
import { createContext, useContext } from 'react';

export const initialState = {
  accounts: [
    { id: 'operating', name: 'Operating', balance: 345730.65, available: 11446.45, inFlight: 1284.2 },
    { id: 'reserve', name: 'Reserve', balance: 1441630.65 },
  ],
  transactions: [
    { id: 't1', name: 'Deli 77', sub: 'Card payment, today', amount: -63.53, method: 'Ops card ••6034', category: 'Meals', date: 'Today 12:41pm', status: 'Completed' },
    { id: 't2', name: 'Payment from Firefly', sub: 'Deposit, yesterday', amount: 1200, method: 'Bank deposit', category: 'Income', date: 'Yesterday 9:12am', status: 'Completed' },
    { id: 't3', name: 'Office Stop Co.', sub: 'Card payment, Oct 3', amount: -287.89, method: "Alan's card ••4417", category: 'Office supplies', date: '4:05pm Oct 3, 2026', status: 'Completed' },
  ],
  cards: [
    { id: 'c1', name: 'Ops card', last4: '6034', type: 'Virtual', balance: 2350.4, spent: 1284.2, frozen: false, holder: 'Dawid' },
    { id: 'c2', name: "Alan's card", last4: '4417', type: 'Virtual', balance: 640.12, spent: 287.89, frozen: false, holder: 'Alan' },
  ],
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
      return { ...state, cards: state.cards.map((c) => c.id === action.id ? { ...c, frozen: !c.frozen } : c) };
    default:
      return state;
  }
}

export const total = (s) => s.accounts.reduce((sum, a) => sum + a.balance, 0);
export const availableOf = (a) => a.id === 'operating' ? a.available : a.balance;

export const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);
