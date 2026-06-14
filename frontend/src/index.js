import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initMonitoring } from './utils/monitoring';

// Initialise error monitoring before anything renders (no-op without a DSN).
initMonitoring();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Report web vitals for performance monitoring
// In production, send to analytics endpoint
reportWebVitals(process.env.REACT_APP_DEBUG === 'true' ? console.log : undefined);
