// server/controllers/bulkController.js

const { processPDF, identifyInvoiceRanges } = require('../services/geminiService');
const Invoice = require('../models/Invoice');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

exports.splitAndProcess = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No PDF file uploaded' });
        }

        // Prompts are sent as an array of strings by multer if appended as 'prompts[]'
        let prompts = req.body.prompts;

        // Ensure prompts is an array. If only one prompt is selected, multer might make it a string.
        if (prompts && !Array.isArray(prompts)) {
            prompts = [prompts];
        }

        if (!prompts || prompts.length === 0) {
            // Default prompts if none provided, or handle error. 
            // For now, let's assume prompts are required or use a default set.
            // return res.status(400).json({ message: 'Prompts are required' });
        }

        // 1. Identify ranges
        const ranges = await identifyInvoiceRanges(req.file.path);
        console.log('Identified ranges:', ranges);

        if (!ranges || ranges.length === 0) {
            return res.status(400).json({ message: 'Could not identify any invoices in the PDF.' });
        }

        // 2. Split PDF
        const originalPdfBytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(originalPdfBytes);
        const splitFiles = [];

        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            // pdf-lib is 0-indexed, user/gemini is 1-indexed
            const start = range.start - 1;
            const end = range.end - 1;

            const subDoc = await PDFDocument.create();
            const copiedPages = await subDoc.copyPages(pdfDoc, Array.from({ length: end - start + 1 }, (_, k) => k + start));
            copiedPages.forEach((page) => subDoc.addPage(page));

            const pdfBytes = await subDoc.save();
            const filename = `split_${Date.now()}_${i}.pdf`;
            const outputPath = path.join(__dirname, '..', 'uploads', filename);
            fs.writeFileSync(outputPath, pdfBytes);
            splitFiles.push({ path: outputPath, filename: filename, originalname: filename });
        }

        // 3. Process each split file
        const allInvoicesData = [];
        for (const file of splitFiles) {
            try {
                const extractedData = await processPDF(file.path, prompts);
                allInvoicesData.push({
                    pdfFilename: file.filename,
                    details: extractedData,
                });
            } catch (processingError) {
                console.error(`Failed to process split file ${file.filename}:`, processingError.message);
                // Optionally delete failed split file
            }
        }

        // 4. Save to DB
        if (allInvoicesData.length > 0) {
            const savedInvoices = await Invoice.insertMany(allInvoicesData);
            res.status(200).json({
                message: `Bulk split and process successful. Processed ${savedInvoices.length} invoices.`,
                data: savedInvoices
            });
        } else {
            res.status(400).json({ message: 'Failed to process any of the split invoices.' });
        }

    } catch (error) {
        next(error);
    }
};

exports.getBulkSplitInvoices = async (req, res, next) => {
    try {
        // Find invoices where pdfFilename starts with "split_"
        const invoices = await Invoice.find({ pdfFilename: { $regex: /^split_/ } }).sort({ createdAt: -1 });

        const plainInvoices = invoices.map(invoice => {
            return {
                _id: invoice._id,
                pdfFilename: invoice.pdfFilename,
                createdAt: invoice.createdAt,
                updatedAt: invoice.updatedAt,
                details: invoice.details ? Object.fromEntries(invoice.details) : {},
                dmsStatus: invoice.dmsStatus || 'Pending'
            };
        });

        res.json(plainInvoices);
    } catch (error) {
        next(error);
    }
};
