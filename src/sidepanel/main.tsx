import React from 'react';
import ReactDOM from 'react-dom/client';
import '../ui/styles/globals.css';
import { SidePanelApp } from './SidePanelApp';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SidePanelApp />
  </React.StrictMode>,
);
