// client/src/App.js

import React from 'react';
import './App.css';
import InvoiceUpload from './components/InvoiceUpload';
import BulkSplitUpload from './components/BulkSplitUpload';

function App() {
  const [activeTab, setActiveTab] = React.useState(() => {
    return localStorage.getItem('activeTab') || 'standard';
  });

  React.useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

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
      <main className="pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
            <button
              onClick={() => setActiveTab('standard')}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'standard'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              Standard Upload
            </button>
            <button
              onClick={() => setActiveTab('bulk-split')}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'bulk-split'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              Bulk Split Upload
            </button>
          </div>
        </div>

        <div className={activeTab === 'standard' ? 'block' : 'hidden'}>
          <InvoiceUpload isActive={activeTab === 'standard'} />
        </div>
        <div className={activeTab === 'bulk-split' ? 'block' : 'hidden'}>
          <BulkSplitUpload />
        </div>
      </main>
    </div>
  );
}

export default App;