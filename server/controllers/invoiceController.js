// server/controllers/invoiceController.js

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

    // Clean up uploaded file
    fs.unlinkSync(pdfPath);

    res.status(200).json({ message: 'Invoice processed and saved', data: invoice.toObject() });
  } catch (error) {
    console.error('Controller error:', error.message);
    // Clean up file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
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
    
    // Map data to the desired Excel format
    const data = invoices.map(invoice => ({
      "Invoice Number": invoice.invoiceNumber,
      "Invoice Date": invoice.invoiceDate,
      "Supplier Name": invoice.supplierName,
      "Total Amount": invoice.totalAmount,
      "Payment Terms": invoice.paymentTerms,
      "Delivery Date": invoice.deliveryDate,
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

exports.bulkUpload = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No PDF files uploaded' });
    }
    if (!req.body.prompt) {
      return res.status(400).json({ message: 'A prompt is required for bulk processing' });
    }

    const prompt = req.body.prompt;
    const allInvoicesData = [];

    // Process each file with the Gemini API
    for (const file of req.files) {
      try {
        const extractedData = await processPDF(file.path, prompt);
        allInvoicesData.push(extractedData);
      } catch (processingError) {
        console.error(`Failed to process file ${file.originalname}:`, processingError);
        // This will skip failing files and continue with the rest
      } finally {
        // Clean up the uploaded file after processing it
        fs.unlinkSync(file.path);
      }
    }

    if (allInvoicesData.length === 0) {
        return res.status(400).json({ message: 'None of the uploaded PDFs could be processed.' });
    }

    // Save all successfully extracted invoice data to the database
    const savedInvoices = await Invoice.insertMany(allInvoicesData);

    // Respond with a summary and the data that was just saved
    res.status(200).json({
      message: `Bulk upload successful. Processed ${savedInvoices.length} of ${req.files.length} files.`,
      data: savedInvoices // Include the saved data in the response
    });
  } catch (error) {
    // Clean up any remaining files if the entire process fails
    if (req.files) {
        req.files.forEach(file => {
            try {
                fs.unlinkSync(file.path);
            } catch (cleanupError) {
                console.error(`Failed to clean up file ${file.path}:`, cleanupError);
            }
        });
    }
    next(error);
  }
};