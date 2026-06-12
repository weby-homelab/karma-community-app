import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Admin from './Admin.jsx'

// Theme Initialization
const initTheme = () => {
  const tg = window.Telegram?.WebApp;
  const updateClass = () => {
    let isDark = true;
    if (tg?.colorScheme) {
      isDark = tg.colorScheme === 'dark';
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    document.documentElement.classList.toggle('theme-dark', isDark);
    document.documentElement.classList.toggle('theme-light', !isDark);
  };

  if (tg) {
    tg.onEvent('themeChanged', updateClass);
  } else {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    if (media.addEventListener) {
      media.addEventListener('change', updateClass);
    } else {
      media.addListener(updateClass);
    }
  }
  updateClass();
};

initTheme();

const path = window.location.pathname;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {path === '/admin' ? <Admin /> : <App />}
  </StrictMode>,
)

