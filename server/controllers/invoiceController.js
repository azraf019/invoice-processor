const Invoice = require('../models/Invoice');
const { processPDF } = require('../services/grokService');
const xlsx = require('xlsx');
const fs = require('fs');

exports.uploadInvoice = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const pdfPath = req.file.path;

    // Process PDF with Grok 3
    const extractedData = await processPDF(pdfPath, prompt);

    // Save to MongoDB
    const invoice = new Invoice({
      invoiceNumber: extractedData.invoiceNumber || 'N/A',
      date: extractedData.date || 'N/A',
      seller: extractedData.seller || 'N/A',
      buyer: extractedData.buyer || 'N/A',
      totalAmount: extractedData.totalAmount || 0,
      tax: extractedData.tax || 0,
      items: extractedData.items || [],
    });
    await invoice.save();

    // Clean up uploaded file
    fs.unlinkSync(pdfPath);

    res.json({ message: 'Invoice processed and saved', data: invoice });
  } catch (error) {
    next(error);
  }
};

exports.getInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    next(error);
  }
};

exports.exportExcel = async (req, res, next) => {
  try {
    const invoices = await Invoice.find();
    const data = invoices.map(invoice => ({
      InvoiceNumber: invoice.invoiceNumber,
      Date: invoice.date,
      Seller: invoice.seller,
      Buyer: invoice.buyer,
      TotalAmount: invoice.totalAmount,
      Tax: invoice.tax,
      Items: invoice.items.map(item => `${item.description} (Qty: ${item.quantity}, Price: ${item.unitPrice})`).join('; '),
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Invoices');
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=invoices.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};