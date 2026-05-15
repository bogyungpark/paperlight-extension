import React from 'react';
import ReactDOM from 'react-dom/client';
import '../ui/styles/globals.css';
import { ViewerApp } from './ViewerApp';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ViewerApp />
  </React.StrictMode>,
);
