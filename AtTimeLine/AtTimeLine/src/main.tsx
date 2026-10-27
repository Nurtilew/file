import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Prevent silent blank screen from unhandled rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled Promise rejection trapped:', event.reason);
});

// Prevent silent blank screen from window error events
window.addEventListener('error', (event) => {
  console.warn('Global error trapped:', event.error || event.message);
});

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (err) {
    console.error('Initial React mounting failure:', err);
    rootElement.innerHTML = `
      <div style="min-height:100vh;background-color:#150d08;color:#f7ede2;display:flex;align-items:center;justify-content:center;padding:24px;font-family:sans-serif;text-align:center;">
        <div style="max-width:440px;background:#23170f;border:1px solid #4a3325;border-radius:24px;padding:32px;">
          <h2 style="color:#fff;margin:0 0 12px 0;font-size:20px;">QazaqFin AI: Қайта жүктеу</h2>
          <p style="color:#c98e60;font-size:13px;line-height:1.6;margin-bottom:20px;">Бетті жаңарту арқылы қосымшаны қалыпты жұмыс күйіне қайтарыңыз.</p>
          <button onclick="window.location.reload();" style="background:#c98e60;color:#110905;border:none;padding:12px 24px;border-radius:12px;font-weight:bold;cursor:pointer;">
            Қайта жүктеу
          </button>
        </div>
      </div>
    `;
  }
}
