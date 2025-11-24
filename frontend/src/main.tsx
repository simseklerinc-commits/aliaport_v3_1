import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Enable dark mode globally
document.documentElement.classList.add('dark');

// Global error handler - prevent application crashes from unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent app from crashing
});

// Global error handler - prevent application crashes from uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  // Don't prevent default - let React handle it
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
