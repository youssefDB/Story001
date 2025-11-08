import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Create a simple, robust logger that writes directly to the DOM.
// This helps debug issues where React might fail to render.
const logContainer = document.createElement('div');
logContainer.style.cssText = `
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 150px;
  overflow-y: auto;
  background: rgba(0, 20, 0, 0.85);
  color: #00ff00;
  border-top: 1px solid #00ff00;
  padding: 5px;
  font-family: monospace;
  font-size: 12px;
  z-index: 99999;
  white-space: pre-wrap;
  word-wrap: break-word;
`;
document.body.appendChild(logContainer);

const log = (message: string) => {
  const p = document.createElement('p');
  p.style.cssText = `margin: 0; padding: 2px 0; border-bottom: 1px solid #333;`;
  p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logContainer.appendChild(p);
  // Auto-scroll to the bottom
  logContainer.scrollTop = logContainer.scrollHeight;
};

// Global error handler to catch anything that slips through
window.addEventListener('error', (event) => {
  log(`UNCAUGHT ERROR: ${event.message}`);
});
window.addEventListener('unhandledrejection', (event) => {
  log(`UNHANDLED PROMISE REJECTION: ${event.reason}`);
});

log('index.tsx script started successfully.');

const root = ReactDOM.createRoot(rootElement);

try {
    log('Attempting to call root.render()...');
    root.render(
      <React.StrictMode>
        <ErrorBoundary log={log}>
          <App log={log} />
        </ErrorBoundary>
      </React.StrictMode>
    );
    log('root.render() called without throwing an immediate error.');
} catch (error) {
    log(`FATAL ERROR during initial render: ${error instanceof Error ? error.message : String(error)}`);
}
