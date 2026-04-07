import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Request persistent storage so iOS won't evict localStorage
if (navigator.storage?.persist) {
  navigator.storage.persist();
}
