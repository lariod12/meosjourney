import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initPlatformClass } from './utils/platform';
import { initLifecycle } from './services/background/lifecycle';
import './styles/mobile-touch.css';

// Initialize platform detection for mobile/Android optimizations
initPlatformClass();

// Initialize app lifecycle management (Android background/foreground)
if (window.Capacitor) {
  initLifecycle((elapsedMinutes, lastTime, currentTime) => {
    console.log(`App resumed after ${elapsedMinutes} minutes`);
    // Background penalties will be handled by PetPage component
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
