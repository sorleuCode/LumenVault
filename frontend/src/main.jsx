

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { LoanContextProvider } from './context/LoanContext';
import { ToastContainer } from 'react-toastify';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>

    <LoanContextProvider>

      <App />
    </LoanContextProvider>
    <ToastContainer position="bottom-right" autoClose={5000}/>
  </React.StrictMode>
);

