// client/src/components/InvoiceUpload.js

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Loader from './Loader';
import InvoiceDetailPanel from './InvoiceDetailPanel';
import { FileTextIcon, UploadCloudIcon, EyeIcon, XIcon } from './icons';

// This list becomes the single source of truth for all available extraction fields.
const availablePrompts = [
  "Customer Code",
  "Customer Name",
  "Customer TRN",
  "Contact No",
  "SO No",
  "SO Date",
  "Salesman",
  "Dest Code",
  "Invoice No",
  "Invoice Date",
  "Payment Term"
];

// Refactored: Only main InvoiceUpload component remains here. All subcomponents are imported.
const InvoiceUpload = () => {
  const [invoices, setInvoices] = useState([]);
  const [newlyUploadedInvoices, setNewlyUploadedInvoices] = useState([]);
  const [files, setFiles] = useState([]); // Changed to array to allow removal
  // The old 'prompt' string state is replaced by an object to track checkbox states.
  const [selectedPrompts, setSelectedPrompts] = useState(
    availablePrompts.reduce((acc, prompt) => ({ ...acc, [prompt]: true }), {})
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDragging, setIsDragging] = useState(false); // For drag-and-drop UI

  // --- PAGINATION & SORTING STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const ITEMS_PER_PAGE = 10;


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

  const handleFileSelect = (selectedFiles) => {
    const newFiles = Array.from(selectedFiles).filter(
      (file) => !files.some((existingFile) => existingFile.name === file.name)
    );
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleFilesChange = (e) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const removeFile = (fileName) => {
    setFiles(files.filter(file => file.name !== fileName));
  };

  // New handler for managing checkbox state changes.
  const handlePromptCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setSelectedPrompts(prev => ({ ...prev, [name]: checked }));
  };

  const selectAllPrompts = (isSelected) => {
    setSelectedPrompts(
      availablePrompts.reduce((acc, prompt) => ({ ...acc, [prompt]: isSelected }), {})
    );
  };

  // --- Drag and Drop Handlers ---
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, [files]); // Dependency on files to ensure handleFileSelect has the latest state

  const handleUpload = async () => {
    // 1. Get an array of the selected prompt names.
    const activePrompts = Object.keys(selectedPrompts).filter(prompt => selectedPrompts[prompt]);

    // 2. Update validation logic.
    if (files.length === 0 || activePrompts.length === 0) {
      setError('Please select one or more PDF files and at least one field to extract.');
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

    // 3. Append the array of prompts to FormData.
    activePrompts.forEach(prompt => {
      formData.append('prompts[]', prompt);
    });

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

  // --- REFACTORED LOGIC ---
  // This logic is now broken into two separate, memoized calculations
  // for better performance and correctness.

  // 1. Memoize the sorted list of all invoices.
  const sortedInvoices = React.useMemo(() => {
    let sortableItems = [...invoices];
    sortableItems.sort((a, b) => {
      // Robustly get values, defaulting to null if not present
      const aVal = a.details?.[sortConfig.key] ?? a[sortConfig.key] ?? null;
      const bVal = b.details?.[sortConfig.key] ?? b[sortConfig.key] ?? null;

      // Handle nulls by pushing them to the bottom
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [invoices, sortConfig]);

  // 2. Paginate the sorted list for display.
  const paginatedInvoices = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedInvoices, currentPage]);


  const handleSaveInvoice = async (updatedInvoice) => {
    try {
      await axios.put(`/api/${updatedInvoice._id}`, updatedInvoice);
      setMessage('Invoice updated successfully!');
      fetchInvoices(); // Refresh the invoices list
      // Do not close the panel, allow the new save feedback to be visible
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving.');
      throw err; // Re-throw error to be caught in the panel
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

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderInvoiceTable = ({
    invoiceList,
    title,
    isNew = false,
    showExport = false,
    totalItemCount = 0,
  }) => {
    // --- FINAL FIX: Use fixed headers based on all available prompts ---
    const columns = availablePrompts;
    const totalCount = totalItemCount || invoiceList.length;

    // Don't render the table at all if there are no columns and no items,
    // which can happen on the very first render.
    if (invoiceList.length === 0 && !isNew) {
      return (
        <div className="max-w-7xl mx-auto mt-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
            {showExport && <button onClick={handleExport} className="opacity-50 cursor-not-allowed flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg shadow-md">Export to Excel</button>}
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <p className="text-center py-10 text-slate-500">No invoices processed yet.</p>
          </div>
        </div>
      );
    }

    return (
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
                  {columns.map(col => (
                    <th key={col} className="py-3 px-4 text-left font-semibold text-slate-600 cursor-pointer" onClick={() => requestSort(col)}>
                      {col}
                      {sortConfig.key === col && (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoiceList.length > 0 ? (
                  invoiceList.map((invoice) => (
                    <tr key={isNew ? `new-${invoice._id}` : invoice._id} className="hover:bg-sky-50/50">
                      {columns.map(col => (
                        <td key={col} className="py-3 px-4 text-slate-600">
                          {invoice.details?.[col] || 'N/A'}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => setSelectedInvoice(invoice)} className="text-sky-600 hover:text-sky-800 p-1 rounded-md hover:bg-sky-100">
                          <EyeIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={columns.length + 1} className="text-center py-10 text-slate-500">No invoices processed yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* --- PAGINATION CONTROLS --- */}
          {!isNew && totalCount > ITEMS_PER_PAGE && (
            <div className="flex justify-between items-center p-4">
              <span className="text-sm text-slate-600">
                Showing {Math.min(1 + (currentPage - 1) * ITEMS_PER_PAGE, totalCount)} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm rounded-md bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50">Previous</button>
                <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE), p + 1))} disabled={currentPage * ITEMS_PER_PAGE >= totalCount} className="px-3 py-1 text-sm rounded-md bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 px-4">
      {isLoading && <Loader />}
      <InvoiceDetailPanel
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onSave={handleSaveInvoice}
      />

      <div className="max-w-3xl mx-auto">
        <div
          className={`bg-white p-8 rounded-2xl shadow-lg border transition-all duration-300 ${isDragging ? 'border-indigo-600 ring-4 ring-indigo-200' : 'border-slate-200'}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg"><FileTextIcon className="w-6 h-6" /></div>
            <h2 className="text-2xl font-bold text-slate-800">Invoice Upload</h2>
          </div>
          <p className="text-slate-500 mt-2">Drag & drop your PDF files here or click to browse.</p>
          <div className="mt-6 space-y-6">
            {/* --- FILE INPUT & DROP ZONE --- */}
            <div>
              <label htmlFor="file-upload" className="relative cursor-pointer block w-full border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors duration-200">
                <UploadCloudIcon className="w-8 h-8 mx-auto text-slate-400" />
                <span className="mt-2 block text-sm font-semibold text-slate-600">
                  {isDragging ? 'Drop files here!' : 'Click to upload files'}
                </span>
              </label>
              <input id="file-upload" type="file" onChange={handleFilesChange} className="sr-only" multiple accept="application/pdf" />
            </div>
            {/* --- FILE PREVIEW LIST --- */}
            {files.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-700">Selected Files:</h3>
                <ul className="space-y-2">
                  {files.map(file => (
                    <li key={file.name} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-sm text-slate-800 truncate">{file.name}</span>
                      <button onClick={() => removeFile(file.name)} className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full">
                        <XIcon className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* --- PROMPT CHECKBOXES --- */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">Fields to Extract</label>
                <div className="space-x-4">
                  <button onClick={() => selectAllPrompts(true)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Select All</button>
                  <button onClick={() => selectAllPrompts(false)} className="text-sm font-semibold text-slate-500 hover:text-slate-700">Deselect All</button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                {availablePrompts.map((promptName) => (
                  <label key={promptName} className="flex items-center space-x-2 text-slate-600">
                    <input
                      type="checkbox"
                      name={promptName}
                      checked={selectedPrompts[promptName] || false}
                      onChange={handlePromptCheckboxChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{promptName}</span>
                  </label>
                ))}
              </div>
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

      {newlyUploadedInvoices.length > 0 && renderInvoiceTable({ invoiceList: newlyUploadedInvoices, title: "Last Uploaded Invoices", isNew: true })}

      {renderInvoiceTable({
        invoiceList: paginatedInvoices,
        title: "All Processed Invoices",
        showExport: true,
        totalItemCount: invoices.length,
      })}
    </div>
  );
};

export default InvoiceUpload;