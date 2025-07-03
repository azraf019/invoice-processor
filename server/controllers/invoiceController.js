const { processPDF } = require('../services/geminiService');
const Invoice = require('../models/Invoice');
const xlsx = require('xlsx');
const fs = require('fs');

exports.uploadInvoice = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }
    if (!req.body.prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    const pdfPath = req.file.path;
    const prompt = req.body.prompt;
    const extractedData = await processPDF(pdfPath, prompt);
    console.log('Extracted data to save:', extractedData);

    const invoice = new Invoice(extractedData);
    await invoice.save();

    res.status(200).json({ message: 'Invoice processed and saved', data: invoice.toObject() });
  } catch (error) {
    console.error('Controller error:', error.message);
    next(error);
  }
};

exports.getInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices.map(invoice => invoice.toObject()));
  } catch (error) {
    next(error);
  }
};

exports.exportExcel = async (req, res, next) => {
  try {
    const invoices = await Invoice.find();
    const data = invoices.map(invoice => ({
      LoadingPort: invoice.loadingPort,
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