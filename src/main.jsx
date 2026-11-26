import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css'; // generated from the Serenity token JSON; never edited by hand
import './styles/motion.css'; // one class per Serenity motion pattern; never edited by hand
import './styles/base.css';
import './styles/components.css';
import './styles/app.css';
import { App } from './App.jsx';

// ?theme=dark or light shows that mode (otherwise the system's, or the one picked in the Account menu);
// ?screen=<id> opens one screen or state of src/App.jsx (the QA script uses both).
const params = new URLSearchParams(location.search);
let theme = params.get('theme');
if (!theme) { try { theme = window.localStorage.getItem('lh.theme'); } catch { theme = null; } }
if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
createRoot(document.getElementById('root')).render(<App initial={params.get('screen')} initialTheme={params.get('theme')} />);
