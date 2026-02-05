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
  dmsStatus: {
    type: String,
    enum: ['Pending', 'Uploaded', 'Failed'],
    default: 'Pending'
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    default: null
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Invoice', invoiceSchema);
