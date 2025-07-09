// client/src/components/InvoiceUpload.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from './Loader';
import InvoiceDetailPanel from './InvoiceDetailPanel';
import { FileTextIcon, UploadCloudIcon, EyeIcon } from './icons';

// Refactored: Only main InvoiceUpload component remains here. All subcomponents are imported.
const InvoiceUpload = () => {
    const [invoices, setInvoices] = useState([]);
    const [newlyUploadedInvoices, setNewlyUploadedInvoices] = useState([]);
    const [files, setFiles] = useState(null);
    const [prompt, setPrompt] = useState('Extract invoiceNumber, invoiceDate, supplierName, totalAmount, paymentTerms, and deliveryDate.');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    useEffect(() => { fetchInvoices(); }, []);

    const fetchInvoices = async () => {
        try {
            const response = await axios.get('/api');
            setInvoices(response.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setError('Could not fetch processed invoices.');
        }
    };

    const handleFilesChange = (e) => setFiles(e.target.files);
    const handlePromptChange = (e) => setPrompt(e.target.value);

    const handleUpload = async () => {
        if (!files || files.length === 0 || !prompt) {
            setError('Please select one or more PDF files and enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError('');
        setMessage('');
        setNewlyUploadedInvoices([]);

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        formData.append('prompt', prompt);

        try {
            const response = await axios.post('/api/bulk-upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setMessage(response.data.message);
            const newInvoices = response.data.data;
            setNewlyUploadedInvoices(newInvoices);
            setInvoices(prevInvoices => [...newInvoices, ...prevInvoices]);
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred during upload.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveInvoice = async (updatedInvoice) => {
        try {
            await axios.put(`/api/${updatedInvoice._id}`, updatedInvoice);
            setMessage('Invoice updated successfully!');
            fetchInvoices(); // Refresh the invoices list
            setSelectedInvoice(null); // Close the panel
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred while saving.');
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get('/api/export-excel', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'invoices.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting data:', error);
            setError('Failed to export data.');
        }
    };

    const renderInvoiceTable = (invoiceList, title, { isNew = false, showExport = false } = {}) => (
      <div className={`max-w-7xl mx-auto mt-12 ${isNew ? 'mb-8' : ''}`}>
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-800">{title} {isNew && '✨'}</h2>
              {showExport && (
                  <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-md">
                      Export to Excel
                  </button>
              )}
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                      <thead className="bg-slate-100">
                          <tr>
                              <th className="py-3 px-4 text-left font-semibold text-slate-600">Invoice Number</th>
                              <th className="py-3 px-4 text-left font-semibold text-slate-600">Invoice Date</th>
                              <th className="py-3 px-4 text-left font-semibold text-slate-600">Supplier Name</th>
                              <th className="py-3 px-4 text-right font-semibold text-slate-600">Total Amount</th>
                              <th className="py-3 px-4 text-left font-semibold text-slate-600">Payment Terms</th>
                              <th className="py-3 px-4 text-left font-semibold text-slate-600">Delivery Date</th>
                              <th className="py-3 px-4 text-center font-semibold text-slate-600">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                          {invoiceList.length > 0 ? (
                              invoiceList.map((invoice) => (
                                  <tr key={isNew ? `new-${invoice._id}` : invoice._id} className="hover:bg-sky-50/50">
                                      <td className="py-3 px-4 text-slate-700 font-medium">{invoice.invoiceNumber || 'N/A'}</td>
                                      <td className="py-3 px-4 text-slate-500">{invoice.invoiceDate || 'N/A'}</td>
                                      <td className="py-3 px-4 text-slate-700">{invoice.supplierName || 'N/A'}</td>
                                      <td className="py-3 px-4 text-right text-slate-700 font-semibold">{invoice.totalAmount != null ? `$${invoice.totalAmount.toFixed(2)}` : 'N/A'}</td>
                                      <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{invoice.paymentTerms || 'N/A'}</td>
                                      <td className="py-3 px-4 text-slate-500">{invoice.deliveryDate || 'N/A'}</td>
                                      <td className="py-3 px-4 text-center">
                                          <button onClick={() => setSelectedInvoice(invoice)} className="text-sky-600 hover:text-sky-800 p-1 rounded-md hover:bg-sky-100">
                                              <EyeIcon className="w-5 h-5" />
                                          </button>
                                      </td>
                                  </tr>
                              ))
                          ) : (
                              <tr><td colSpan="7" className="text-center py-10 text-slate-500">No invoices processed yet.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
  );

    return (
        <div className="space-y-12 px-4">
            {isLoading && <Loader />}
            <InvoiceDetailPanel
                invoice={selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
                onSave={handleSaveInvoice}
            />

            <div className="max-w-3xl mx-auto">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg"><FileTextIcon className="w-6 h-6" /></div>
                        <h2 className="text-2xl font-bold text-slate-800">Invoice Upload</h2>
                    </div>
                    <p className="text-slate-500 mt-2">Upload one or more PDF files for processing.</p>
                    <div className="mt-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">PDF File(s)</label>
                            <input type="file" onChange={handleFilesChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors duration-200" multiple />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Extraction Prompt</label>
                            <textarea value={prompt} onChange={handlePromptChange} rows="3" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
                        </div>
                        <button onClick={handleUpload} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                            <UploadCloudIcon className="w-5 h-5" />
                            <span>{isLoading ? 'Processing...' : 'Upload & Process'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mt-8 space-y-4">
                {message && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-r-lg" role="alert"><p className="font-bold">Success</p><p>{message}</p></div>}
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
            </div>

            {newlyUploadedInvoices.length > 0 && renderInvoiceTable(newlyUploadedInvoices, "Last Uploaded Invoices", { isNew: true })}
            
            {renderInvoiceTable(invoices, "All Processed Invoices", { showExport: true })}
        </div>
    );
};

export default InvoiceUpload;