import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress harmless WebRTC teardown errors on page reload/navigation
window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = event?.reason?.message || String(event?.reason || '');
  if (
    reasonStr.includes('PC manager is closed') ||
    reasonStr.includes('UnexpectedConnectionState') ||
    reasonStr.includes('could not establish data channel') ||
    reasonStr.includes('data transport is not ready')
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
