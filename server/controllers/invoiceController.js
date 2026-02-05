// server/controllers/invoiceController.js

const { processPDF } = require('../services/geminiService');
const Invoice = require('../models/Invoice');
const fs = require('fs'); // Import the fs module
const path = require('path'); // Import the path module
const dmsService = require('../services/dmsService');

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
    const templateId = req.body.templateId && req.body.templateId !== '' ? req.body.templateId : null;
    const allInvoicesData = [];

    for (const file of req.files) {
      try {
        const extractedData = await processPDF(file.path, prompts);

        // Prepare data for the new schema
        allInvoicesData.push({
          pdfFilename: file.filename,
          details: extractedData,
          templateId: templateId
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
exports.uploadToDMS = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const fullPath = path.join(__dirname, '..', 'uploads', invoice.pdfFilename);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'PDF file not found on server.' });
    }

    const metaObj = invoice.details ? Object.fromEntries(invoice.details) : {};
    const success = await dmsService.uploadToDMS(fullPath, invoice.pdfFilename, metaObj);

    if (success) {
      invoice.dmsStatus = 'Uploaded';
      await invoice.save();
      res.status(200).json({ message: 'Successfully uploaded to DMS.' });
    } else {
      invoice.dmsStatus = 'Failed';
      await invoice.save();
      res.status(500).json({ message: 'Failed to upload to DMS. Check server logs.' });
    }
  } catch (error) {
    next(error);
  }
};

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

exports.getInvoices = async (req, res, next) => {
  try {
    const { templateId } = req.query;
    let query = {};

    if (templateId && templateId !== '' && templateId !== 'null') {
      query.templateId = templateId;
    } else {
      query.templateId = null;
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    // Manually construct the response to ensure the 'details' Map is converted
    const plainInvoices = invoices.map(invoice => {
      return {
        _id: invoice._id,
        pdfFilename: invoice.pdfFilename,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        updatedAt: invoice.updatedAt,
        details: invoice.details ? Object.fromEntries(invoice.details) : {},
        dmsStatus: invoice.dmsStatus || 'Pending',
        templateId: invoice.templateId
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
    // 1. Collect all possible keys from all invoices.
    // NOTE: For better isolation, export should probably also filter by template.
    // But keeping it global for now or just respecting the same filtering logic if passed would be better.
    // For simplicity, let's keep it global or we can parse query params if needed later.
    const allKeys = new Set();
    invoices.forEach(invoice => {
      if (invoice.details) {
        const detailsObj = Object.fromEntries(invoice.details);
        Object.keys(detailsObj).forEach(key => allKeys.add(key));
      }
    });
    const headers = Array.from(allKeys);

    // 2. Create data rows based on the collected keys.
    const data = invoices.map(invoice => {
      const row = {};
      // Convert the Map to a plain object
      const detailsObj = invoice.details ? Object.fromEntries(invoice.details) : {};

      headers.forEach(header => {
        row[header] = detailsObj[header] || '';
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
    // Updated to only clear for specific template if provided, or clear all?
    // User probably expects "Clear" to clear the CURRENT view.

    const { templateId } = req.query;
    let query = {};

    if (templateId && templateId !== '' && templateId !== 'null') {
      query.templateId = templateId;
    } else {
      query.templateId = null;
    }

    // We only delete files if we are deleting ALL invoices or if we implement reference counting.
    // Since files are unique per invoice, we can delete files associated with the verified invoices.
    const invoicesToDelete = await Invoice.find(query);
    const directory = 'uploads';

    for (const inv of invoicesToDelete) {
      const filePath = path.join(directory, inv.pdfFilename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Invoice.deleteMany(query);
    res.status(200).json({ message: 'Invoices cleared successfully.' });
  } catch (error) {
    next(error);
  }
};
