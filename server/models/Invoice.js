const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, default: '' },
  invoiceDate: { type: String, default: '' },
  supplierName: { type: String, default: '' },
  totalAmount: { type: Number, default: 0 },
  paymentTerms: { type: String, default: '' },
  deliveryDate: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Invoice', invoiceSchema);