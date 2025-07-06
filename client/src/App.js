// client/src/App.js

import React from 'react';
import './App.css';
import InvoiceUpload from './components/InvoiceUpload';

function App() {
  return (
<div className="App bg-slate-50 min-h-screen font-sans">
      <header className="py-10">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
            Invoice<span className="bg-gradient-to-r from-sky-500 to-indigo-500 text-transparent bg-clip-text">AI</span> Processor
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-slate-500">
            Automate your data entry. Upload single or multiple PDF invoices for instant extraction.
          </p>
        </div>
      </header>
      <main className="pb-16">
        <InvoiceUpload />
      </main>
    </div>
  );
}

export default App;