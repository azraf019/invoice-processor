const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: String,
  date: String,
  seller: String,
  buyer: String,
  totalAmount: Number,
  tax: Number,
  items: [{ description: String, quantity: Number, unitPrice: Number }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Invoice', invoiceSchema);