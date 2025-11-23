// server/models/Invoice.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  // Store the filename of the original PDF for later retrieval
  pdfFilename: { type: String, required: true },
  
  // A 'details' field to dynamically store key-value pairs.
  details: {
    type: Map,
    of: mongoose.Schema.Types.Mixed, // Allows any data type for values
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Invoice', invoiceSchema);
