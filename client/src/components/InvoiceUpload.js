// client/src/components/InvoiceUpload.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Loader = () => (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex flex-col items-center justify-center z-50">
    <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-white mb-4"></div>
    <div className="text-white text-xl">Processing... Please Wait</div>
  </div>
);

const InvoiceUpload = () => {
  // State for all invoices in the DB
  const [invoices, setInvoices] = useState([]);
  // State for ONLY the most recently uploaded invoices
  const [newlyUploadedInvoices, setNewlyUploadedInvoices] = useState([]);
  
  // Form and UI states
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState('Extract invoiceNumber, invoiceDate, supplierName, totalAmount, paymentTerms, and deliveryDate.');
  const [bulkFiles, setBulkFiles] = useState(null);
  const [bulkPrompt, setBulkPrompt] = useState('Extract invoiceNumber, invoiceDate, supplierName, totalAmount, paymentTerms, and deliveryDate.');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all invoices on initial component mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Function to fetch all processed invoices from the DB
  const fetchInvoices = async () => {
    try {
      // FIXED: Corrected API endpoint
      const response = await axios.get('/api');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Could not fetch processed invoices.');
    }
  };

  // Handlers for file and prompt changes
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handlePromptChange = (e) => setPrompt(e.target.value);
  const handleBulkFilesChange = (e) => setBulkFiles(e.target.files);
  const handleBulkPromptChange = (e) => setBulkPrompt(e.target.value);

  // --- UPDATED LOGIC FOR SINGLE UPLOAD ---
  const handleUpload = async () => {
    if (!file || !prompt) {
      setError('Please select a file and enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');
    setNewlyUploadedInvoices([]); // Clear previous results

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('prompt', prompt);

    try {
      // FIXED: Corrected API endpoint
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setMessage(response.data.message);
      const newInvoice = response.data.data;
      
      // Update state instantly with the new data from the response
      setNewlyUploadedInvoices([newInvoice]);
      setInvoices(prevInvoices => [newInvoice, ...prevInvoices]); // Add to the top of the main list

    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during single upload.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- UPDATED LOGIC FOR BULK UPLOAD ---
  const handleBulkUpload = async () => {
    if (!bulkFiles || bulkFiles.length === 0 || !bulkPrompt) {
      setError('Please select one or more PDF files and enter a prompt for bulk upload.');
      return;
    }
    setIsLoading(true);
    setError('');
    setMessage('');
    setNewlyUploadedInvoices([]); // Clear previous results

    const formData = new FormData();
    for (let i = 0; i < bulkFiles.length; i++) {
        formData.append('files', bulkFiles[i]);
    }
    formData.append('prompt', bulkPrompt);

    try {
      // FIXED: Corrected API endpoint
      const response = await axios.post('/api/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage(response.data.message);
      const newInvoices = response.data.data;

      // Update state instantly with the new data from the response
      setNewlyUploadedInvoices(newInvoices);
      setInvoices(prevInvoices => [...newInvoices, ...prevInvoices]); // Add to the top of the main list

    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during bulk upload.');
    } finally {
      setIsLoading(false);
    }
  };

  // Logic for exporting data to Excel
  const handleExport = async () => {
    try {
      // FIXED: Corrected API endpoint
      const response = await axios.get('/api/export-excel', {
        responseType: 'blob',
      });
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

  return (
    <>
      {/* Upload Forms Section */}
      <div className="max-w-3xl mx-auto p-6 border rounded-lg shadow-xl bg-white mb-8">
        {isLoading && <Loader />}
        {message && <div className="bg-green-100 text-green-800 p-3 rounded mb-4">{message}</div>}
        {error && <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{error}</div>}

        <div className="mb-8 p-4 border rounded-md bg-gray-50">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Single Invoice Upload 📄</h2>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium">PDF File</label>
            <input type="file" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mt-1" accept="application/pdf" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium">Extraction Prompt</label>
            <textarea value={prompt} onChange={handlePromptChange} rows="3" className="w-full p-2 border rounded mt-1" />
          </div>
          <button onClick={handleUpload} disabled={isLoading} className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors duration-300">
            {isLoading ? 'Processing...' : 'Upload & Process'}
          </button>
        </div>

        <div className="p-4 border rounded-md bg-gray-50">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Bulk Invoice Upload 📂</h2>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium">PDF Files</label>
            <input type="file" onChange={handleBulkFilesChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 mt-1" accept="application/pdf" multiple />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium">Extraction Prompt for Bulk Upload</label>
            <textarea value={bulkPrompt} onChange={handleBulkPromptChange} rows="3" className="w-full p-2 border rounded mt-1" />
          </div>
          <button onClick={handleBulkUpload} disabled={isLoading} className="w-full bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 disabled:bg-teal-300 transition-colors duration-300">
            {isLoading ? 'Processing...' : 'Bulk Upload & Process'}
          </button>
        </div>
      </div>

      {/* --- NEW SECTION: Display Newly Uploaded Invoices --- */}
      {newlyUploadedInvoices.length > 0 && (
        <div className="max-w-6xl mx-auto p-6 border-2 border-green-400 rounded-lg shadow-xl bg-green-50 mb-8">
            <h2 className="text-2xl font-semibold text-green-800 mb-4">Last Uploaded Invoices ✨</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-green-200">
                        <tr>
                            <th className="py-2 px-4 border-b text-left">Invoice Number</th>
                            <th className="py-2 px-4 border-b text-left">Invoice Date</th>
                            <th className="py-2 px-4 border-b text-left">Supplier Name</th>
                            <th className="py-2 px-4 border-b text-right">Total Amount</th>
                            <th className="py-2 px-4 border-b text-left">Payment Terms</th>
                            <th className="py-2 px-4 border-b text-left">Delivery Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {newlyUploadedInvoices.map((invoice) => (
                            <tr key={`new-${invoice._id}`} className="hover:bg-green-100">
                                <td className="py-2 px-4 border-b">{invoice.invoiceNumber || 'N/A'}</td>
                                <td className="py-2 px-4 border-b">{invoice.invoiceDate || 'N/A'}</td>
                                <td className="py-2 px-4 border-b">{invoice.supplierName || 'N/A'}</td>
                                <td className="py-2 px-4 border-b text-right">{invoice.totalAmount != null ? invoice.totalAmount.toFixed(2) : 'N/A'}</td>
                                <td className="py-2 px-4 border-b">{invoice.paymentTerms || 'N/A'}</td>
                                <td className="py-2 px-4 border-b">{invoice.deliveryDate || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Main Invoice List Table Section */}
      <div className="max-w-6xl mx-auto p-6 border rounded-lg shadow-xl bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">All Processed Invoices</h2>
          <button onClick={handleExport} className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-300">
            Export to Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 border-b text-left">Invoice Number</th>
                <th className="py-2 px-4 border-b text-left">Invoice Date</th>
                <th className="py-2 px-4 border-b text-left">Supplier Name</th>
                <th className="py-2 px-4 border-b text-right">Total Amount</th>
                <th className="py-2 px-4 border-b text-left">Payment Terms</th>
                <th className="py-2 px-4 border-b text-left">Delivery Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-100">
                    <td className="py-2 px-4 border-b">{invoice.invoiceNumber || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{invoice.invoiceDate || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{invoice.supplierName || 'N/A'}</td>
                    <td className="py-2 px-4 border-b text-right">{invoice.totalAmount != null ? invoice.totalAmount.toFixed(2) : 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{invoice.paymentTerms || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{invoice.deliveryDate || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">No invoices processed yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default InvoiceUpload;
