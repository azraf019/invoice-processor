// client/src/App.js

import React from 'react';
import './App.css';
import InvoiceUpload from './components/InvoiceUpload';

function App() {
  return (
    <div className="App bg-gray-100 min-h-screen py-10">
      <header className="App-header text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800">Invoice Processor AI</h1>
        <p className="text-gray-600">Upload single or multiple PDF invoices for automated data extraction.</p>
      </header>
      <main>
        <InvoiceUpload />
      </main>
    </div>
  );
}

export default App;