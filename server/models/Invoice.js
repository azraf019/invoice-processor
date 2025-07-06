// server/models/Invoice.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String },
  invoiceDate: { type: String },
  supplierName: { type: String },
  totalAmount: { type: Number },
  paymentTerms: { type: String },
  deliveryDate: { type: String },
  // --- NEW FIELD ---
  // Store the filename of the original PDF for later retrieval
  pdfFilename: { type: String, required: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Invoice', invoiceSchema);
