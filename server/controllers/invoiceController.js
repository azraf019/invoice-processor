// server/controllers/invoiceController.js

const { processPDF } = require('../services/pdfProcessorService');
const Invoice = require('../models/Invoice');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path'); // Import the path module

// ... (getInvoices, exportExcel, clearInvoices functions remain the same) ...


exports.bulkUpload = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No PDF files uploaded' });
    }
    // Prompts should be an array
    if (!req.body.prompts || !Array.isArray(req.body.prompts) || req.body.prompts.length === 0) {
      return res.status(400).json({ message: 'A non-empty array of prompts is required' });
    }

    const prompts = req.body.prompts;
    const allInvoicesData = [];

    for (const file of req.files) {
      try {
        const extractedData = await processPDF(file.path, prompts);
        
        // Prepare data for the new schema
        allInvoicesData.push({
          pdfFilename: file.filename,
          details: extractedData, // The extracted data is now stored in the 'details' map
        });

      } catch (processingError) {
        console.error(`Failed to process file ${file.originalname}:`, processingError.message);
        // If one file fails, delete it and continue
        try { fs.unlinkSync(file.path); } catch (e) { console.error("Error cleaning up file:", e); }
      }
      // We don't delete successful files here
    }

    if (allInvoicesData.length === 0) {
      return res.status(400).json({ message: 'None of the uploaded PDFs could be processed.' });
    }

    const savedInvoices = await Invoice.insertMany(allInvoicesData);

    res.status(200).json({
      message: `Bulk upload successful. Processed ${savedInvoices.length} of ${req.files.length} files.`,
      data: savedInvoices
    });
  } catch (error) {
    // Clean up any remaining files if the entire process fails
    if (req.files) {
      req.files.forEach(file => {
        try { fs.unlinkSync(file.path); } catch (e) { console.error("Error cleaning up file:", e); }
      });
    }
    next(error);
  }
};

exports.updateInvoice = async (req, res, next) => {
  try {
      const { id } = req.params;
      // The body will now contain the entire 'details' object
      const { details } = req.body;

      // Find the invoice first
      const invoice = await Invoice.findById(id);
      if (!invoice) {
          return res.status(404).json({ message: 'Invoice not found' });
      }

      // Overwrite the details map.
      // For more granular updates, a different approach would be needed,
      // but for this app's flow, replacing the whole map is robust.
      invoice.details = details;
      
      const updatedInvoice = await invoice.save();

      res.status(200).json({ message: 'Invoice updated successfully', data: updatedInvoice.toObject() });
  } catch (error) {
      next(error);
  }
};

// --- NEW FUNCTION ---
/**
 * Serves the PDF file associated with an invoice.
 */
exports.getInvoicePDF = async (req, res, next) => {
    try {
        console.log(`--- DEBUG: getInvoicePDF called with id: ${req.params.id} ---`);
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice || !invoice.pdfFilename) {
            console.log(`--- DEBUG: Invoice not found or pdfFilename missing. ---`);
            return res.status(404).json({ message: 'Invoice or PDF not found.' });
        }
        
        console.log(`--- DEBUG: Found invoice. pdfFilename: ${invoice.pdfFilename} ---`);
        const pdfPath = path.join(__dirname, '..', 'uploads', invoice.pdfFilename);
        console.log(`--- DEBUG: Constructed pdfPath: ${pdfPath} ---`);

        if (fs.existsSync(pdfPath)) {
            console.log(`--- DEBUG: File exists. Sending file. ---`);
            res.sendFile(pdfPath);
        } else {
            console.log(`--- DEBUG: File does NOT exist at path. ---`);
            return res.status(404).json({ message: 'PDF file not found on server.' });
        }
    } catch (error) {
        console.error(`--- DEBUG: Error in getInvoicePDF: ${error.message} ---`);
        next(error);
    }
};

// Correctly handle the details map when sending response
exports.getInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    // Manually construct the response to ensure the 'details' Map is converted
    const plainInvoices = invoices.map(invoice => {
      return {
        _id: invoice._id,
        pdfFilename: invoice.pdfFilename,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        details: invoice.details ? Object.fromEntries(invoice.details) : {}
      };
    });
    res.json(plainInvoices);
  } catch (error) {
    next(error);
  }
};

exports.exportExcel = async (req, res, next) => {
  try {
    const invoices = await Invoice.find();
    
    // Since columns are dynamic, we need to handle them differently.
    // 1. Collect all possible keys from all invoices.
    const allKeys = new Set();
    invoices.forEach(invoice => {
      if (invoice.details) {
        Object.keys(invoice.details).forEach(key => allKeys.add(key));
      }
    });
    const headers = Array.from(allKeys);

    // 2. Create data rows based on the collected keys.
    const data = invoices.map(invoice => {
      const row = {};
      headers.forEach(header => {
        row[header] = invoice.details ? invoice.details[header] : '';
      });
      return row;
    });

    const ws = xlsx.utils.json_to_sheet(data, { header: headers });
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

exports.clearInvoices = async (req, res, next) => {
  try {
    // Also delete all files in the uploads directory
    const directory = 'uploads';
    fs.readdir(directory, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        // Keep .gitkeep if it exists
        if (file !== '.gitkeep') {
          fs.unlink(path.join(directory, file), err => {
            if (err) throw err;
          });
        }
      }
    });

    await Invoice.deleteMany({});
    res.status(200).json({ message: 'Database and uploaded files cleared successfully.' });
  } catch (error) {
    next(error);
  }
};
