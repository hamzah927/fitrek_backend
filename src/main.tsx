import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize dark mode from localStorage
const isDarkMode = localStorage.getItem('fitrek-storage')
  ? JSON.parse(localStorage.getItem('fitrek-storage')!).state.isDarkMode
  : false;

// Apply dark mode class immediately
if (isDarkMode) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);