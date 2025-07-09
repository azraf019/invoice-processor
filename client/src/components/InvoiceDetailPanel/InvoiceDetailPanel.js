import React, { useState, useEffect } from 'react';
import EditableDetailItem from '../EditableDetailItem/EditableDetailItem';
import XIcon from '../icons/XIcon';

const BACKEND_URL = 'http://localhost:5000';

const InvoiceDetailPanel = ({ invoice, onClose, onSave }) => {
    const [editedInvoice, setEditedInvoice] = useState(invoice);

    useEffect(() => {
        setEditedInvoice(invoice);
    }, [invoice]);

    if (!invoice || !editedInvoice) return null;

    const pdfUrl = `${BACKEND_URL}/uploads/${invoice.pdfFilename}`;

    const handleChange = (e, field) => {
        setEditedInvoice({ ...editedInvoice, [field]: e.target.value });
    };

    const handleSave = () => {
        onSave(editedInvoice);
    };

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-60 z-40" onClick={onClose}>
            <div className="fixed top-0 right-0 h-full w-[90vw] max-w-[1600px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out translate-x-0" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center p-4 border-b bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-800">Invoice Details: {editedInvoice.invoiceNumber || ''}</h2>
                        <div className="flex items-center gap-4">
                            <button onClick={handleSave} className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-300 shadow-md">
                                Save
                            </button>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200">
                                <XIcon className="w-6 h-6 text-slate-600" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 p-6 overflow-auto">
                        <div className="md:col-span-2 bg-slate-100 rounded-lg overflow-hidden h-[calc(100vh-100px)]">
                            <embed src={pdfUrl} type="application/pdf" className="w-full h-full" />
                        </div>
                        <div className="md:col-span-1 overflow-auto h-[calc(100vh-100px)]">
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">Extracted Data</h3>
                            <div className="bg-slate-50 p-4 rounded-lg border">
                                <dl className="divide-y divide-slate-200">
                                    <EditableDetailItem label="Invoice Number" value={editedInvoice.invoiceNumber} onChange={(e) => handleChange(e, 'invoiceNumber')} />
                                    <EditableDetailItem label="Supplier Name" value={editedInvoice.supplierName} onChange={(e) => handleChange(e, 'supplierName')} />
                                    <EditableDetailItem label="Total Amount" value={editedInvoice.totalAmount} onChange={(e) => handleChange(e, 'totalAmount')} />
                                    <EditableDetailItem label="Invoice Date" value={editedInvoice.invoiceDate} onChange={(e) => handleChange(e, 'invoiceDate')} />
                                    <EditableDetailItem label="Delivery Date" value={editedInvoice.deliveryDate} onChange={(e) => handleChange(e, 'deliveryDate')} />
                                    <EditableDetailItem label="Payment Terms" value={editedInvoice.paymentTerms} onChange={(e) => handleChange(e, 'paymentTerms')} />
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