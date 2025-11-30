// client/src/components/BulkSplitUpload.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from './Loader';
import { FileTextIcon, UploadCloudIcon, XIcon, EyeIcon } from './icons';
import InvoiceDetailPanel from './InvoiceDetailPanel/InvoiceDetailPanel';

// Reusing the same prompts list for consistency
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

const BulkSplitUpload = () => {
    const [file, setFile] = useState(null);
    const [selectedPrompts, setSelectedPrompts] = useState(
        availablePrompts.reduce((acc, prompt) => ({ ...acc, [prompt]: true }), {})
    );
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [processedInvoices, setProcessedInvoices] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isBulkUploading, setIsBulkUploading] = useState(false);

    // --- DATA FETCHING ---
    const fetchBulkInvoices = async () => {
        try {
            const response = await axios.get('/api/bulk-split-invoices');
            setProcessedInvoices(response.data);
        } catch (error) {
            console.error('Error fetching bulk invoices:', error);
            // Fallback to local storage if API fails or for initial state if needed, 
            // but API is preferred for persistence.
        }
    };

    useEffect(() => {
        fetchBulkInvoices();
    }, []);

    // --- FILE HANDLING ---
    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setError('');
        setMessage('');
    };

    const handleFilesChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const removeFile = () => {
        setFile(null);
    };

    // --- PROMPT HANDLING ---
    const handlePromptCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setSelectedPrompts(prev => ({ ...prev, [name]: checked }));
    };

    const selectAllPrompts = (isSelected) => {
        setSelectedPrompts(
            availablePrompts.reduce((acc, prompt) => ({ ...acc, [prompt]: isSelected }), {})
        );
    };

    // --- DRAG AND DROP ---
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    // --- UPLOAD & SAVE ---
    const handleUpload = async () => {
        const activePrompts = Object.keys(selectedPrompts).filter(prompt => selectedPrompts[prompt]);

        if (!file || activePrompts.length === 0) {
            setError('Please select a PDF file and at least one field to extract.');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');
        setProcessedInvoices([]);

        const formData = new FormData();
        formData.append('file', file);
        activePrompts.forEach(prompt => {
            formData.append('prompts[]', prompt);
        });

        try {
            const response = await axios.post('/api/bulk-split-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage(response.data.message);
            setProcessedInvoices(response.data.data);
            // Refresh list to ensure we have the latest state from DB
            fetchBulkInvoices();
        } catch (err) {
            console.error("Upload error:", err);
            setError(err.response?.data?.message || 'An error occurred during upload.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveInvoice = async (updatedInvoice) => {
        try {
            await axios.put(`/api/${updatedInvoice._id}`, updatedInvoice);
            setMessage('Invoice updated successfully!');
            fetchBulkInvoices(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred while saving.');
            throw err;
        }
    };

    const handleBulkDMSUpload = async () => {
        setIsBulkUploading(true);
        setMessage('Starting bulk DMS upload...');

        // Iterate through all processed invoices
        for (let i = 0; i < processedInvoices.length; i++) {
            const invoice = processedInvoices[i];

            // Skip if already uploaded
            if (invoice.dmsStatus === 'Uploaded') continue;

            try {
                // Update UI to show current item being processed
                setMessage(`Uploading invoice ${i + 1} of ${processedInvoices.length}...`);

                await axios.post(`/api/dms/${invoice._id}`);

                // Update local state to reflect success immediately
                setProcessedInvoices(prev => prev.map(inv =>
                    inv._id === invoice._id ? { ...inv, dmsStatus: 'Uploaded' } : inv
                ));

            } catch (err) {
                console.error(`Failed to upload invoice ${invoice._id}`, err);
                // Update local state to reflect failure
                setProcessedInvoices(prev => prev.map(inv =>
                    inv._id === invoice._id ? { ...inv, dmsStatus: 'Failed' } : inv
                ));
            }

            // Wait for 3 seconds before next request
            if (i < processedInvoices.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        setIsBulkUploading(false);
        setMessage('Bulk DMS upload completed.');
        fetchBulkInvoices(); // Final refresh to ensure consistency
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
                        <h2 className="text-2xl font-bold text-slate-800">Bulk Split Upload</h2>
                    </div>
                    <p className="text-slate-500 mt-2">Upload a single large PDF. We will split it into individual invoices and process them.</p>

                    <div className="mt-6 space-y-6">
                        {/* FILE INPUT */}
                        <div>
                            <label htmlFor="bulk-file-upload" className="relative cursor-pointer block w-full border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors duration-200">
                                <UploadCloudIcon className="w-8 h-8 mx-auto text-slate-400" />
                                <span className="mt-2 block text-sm font-semibold text-slate-600">
                                    {isDragging ? 'Drop file here!' : 'Click to upload file'}
                                </span>
                            </label>
                            <input id="bulk-file-upload" type="file" onChange={handleFilesChange} className="sr-only" accept="application/pdf" />
                        </div>

                        {/* FILE PREVIEW */}
                        {file && (
                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                                <span className="text-sm text-slate-800 truncate">{file.name}</span>
                                <button onClick={removeFile} className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* PROMPTS */}
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

            {processedInvoices.length > 0 && (
                <div className="max-w-full mx-auto mt-12 mb-8 px-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-slate-800">Processed Invoices ✨</h2>
                        <button
                            onClick={handleBulkDMSUpload}
                            disabled={isBulkUploading}
                            className={`flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 shadow-md ${isBulkUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isBulkUploading ? 'Uploading...' : 'Bulk Upload DMS'}
                        </button>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm table-fixed">
                                <thead className="bg-slate-100">
                                    <tr>
                                        {/* Removed PDF Name Column */}
                                        {availablePrompts.map(col => <th key={col} className="py-3 px-2 text-left font-semibold text-slate-600 break-words w-24">{col}</th>)}
                                        <th className="py-3 px-2 text-center font-semibold text-slate-600 w-24">DMS Status</th>
                                        <th className="py-3 px-2 text-center font-semibold text-slate-600 w-20">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {processedInvoices.map((invoice) => (
                                        <tr key={invoice._id} className="hover:bg-sky-50/50">
                                            {/* Removed PDF Name Cell */}
                                            {availablePrompts.map(col => (
                                                <td key={col} className="py-3 px-2 text-slate-600 break-words">{invoice.details?.[col] || 'N/A'}</td>
                                            ))}
                                            <td className="py-3 px-2 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${invoice.dmsStatus === 'Uploaded' ? 'bg-green-100 text-green-800' :
                                                    invoice.dmsStatus === 'Failed' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {invoice.dmsStatus || 'Pending'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                                <button onClick={() => setSelectedInvoice(invoice)} className="text-sky-600 hover:text-sky-800 p-1 rounded-md hover:bg-sky-100">
                                                    <EyeIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkSplitUpload;
