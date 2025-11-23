import React, { useState, useEffect } from 'react';
import EditableDetailItem from '../EditableDetailItem/EditableDetailItem';
import XIcon from '../icons/XIcon';
import axios from 'axios'; // Import axios

const InvoiceDetailPanel = ({ invoice, onClose, onSave }) => {
    const [editedInvoice, setEditedInvoice] = useState(null);
    const [saveState, setSaveState] = useState('idle'); // idle, saving, saved
    const [pdfUrl, setPdfUrl] = useState(null); // State to hold the blob URL
    const [pdfError, setPdfError] = useState(null);

    useEffect(() => {
        if (invoice) {
            setEditedInvoice(invoice);
            setSaveState('idle'); // Reset save state when a new invoice is opened
            setPdfUrl(null); // Clear previous PDF
            setPdfError(null);

            const fetchPdf = async () => {
                try {
                    const response = await axios.get(`/api/pdf/${invoice._id}`, {
                        responseType: 'blob',
                    });
                    const blob = new Blob([response.data], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    setPdfUrl(url);
                } catch (error) {
                    console.error("Error fetching PDF:", error);
                    setPdfError("Could not load PDF. It may have been deleted.");
                }
            };
            fetchPdf();
        }

        // Cleanup function to revoke the object URL on unmount
        return () => {
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }
        };
    }, [invoice]);

    if (!invoice) return null;

    const handleChange = (key, value) => {
        setEditedInvoice(prev => ({
            ...prev,
            details: {
                ...prev.details,
                [key]: value
            }
        }));
    };

    const handleSave = async () => {
        setSaveState('saving');
        try {
            await onSave(editedInvoice);
            setSaveState('saved');
            // Close the panel after a short delay to show the "Saved!" state
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error("Save failed:", error);
            setSaveState('idle'); // Reset on error
        }
    };

    // Helper to determine input type based on label
    const getInputType = (label) => {
        // Reverted: Always return 'text' to handle inconsistent date formats gracefully.
        return 'text';
    };

    const getSaveButtonContent = () => {
        switch (saveState) {
            case 'saving':
                return 'Saving...';
            case 'saved':
                return 'Saved! ✔';
            default:
                return 'Save';
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-60 z-40" onClick={onClose}>
            <div className="fixed top-0 right-0 h-full w-[90vw] max-w-[1600px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center p-4 border-b bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-800">Invoice Details: {editedInvoice?.details?.['Invoice Number'] || ''}</h2>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={handleSave} 
                                disabled={saveState !== 'idle'}
                                className={`text-white py-2 px-4 rounded-lg transition-colors duration-300 shadow-md ${saveState === 'saved' ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'} ${saveState !== 'idle' ? 'cursor-not-allowed' : ''}`}
                            >
                                {getSaveButtonContent()}
                            </button>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200">
                                <XIcon className="w-6 h-6 text-slate-600" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-auto">
                        <div className="md:col-span-2 bg-slate-100 rounded-lg overflow-hidden h-[calc(100vh-100px)] flex items-center justify-center">
                            {pdfError ? (
                                <div className="text-center text-red-600">
                                    <p className="font-semibold">Error</p>
                                    <p>{pdfError}</p>
                                </div>
                            ) : pdfUrl ? (
                                <embed src={pdfUrl} type="application/pdf" className="w-full h-full" />
                            ) : (
                                <p className="text-slate-500">Loading PDF...</p>
                            )}
                        </div>
                        <div className="md:col-span-1 overflow-auto h-[calc(100vh-100px)]">
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">Extracted Data</h3>
                            <div className="bg-slate-50 p-4 rounded-lg border">
                                <dl className="divide-y divide-slate-200">
                                    {/* --- DYNAMIC RENDERING - Reverted to simple text inputs --- */}
                                    {editedInvoice && editedInvoice.details && Object.entries(editedInvoice.details).map(([key, value]) => (
                                        <EditableDetailItem
                                            key={key}
                                            label={key}
                                            value={value}
                                            type={getInputType(key)} // This will now always be 'text'
                                            onChange={(e) => handleChange(key, e.target.value)}
                                        />
                                    ))}
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailPanel; 