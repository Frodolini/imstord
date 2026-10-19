import React from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import { StoreProvider } from './store.jsx';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <App />
      </StoreProvider>
    </MotionConfig>
  </React.StrictMode>,
);
