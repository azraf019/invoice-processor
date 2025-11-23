const express = require('express');
const router = express.Router();
const multer = require('multer');
const invoiceController = require('../controllers/invoiceController');
const fs = require('fs');
const path = require('path'); // Make sure path is imported

// --- DIAGNOSTIC MIDDLEWARE ---
// This will log every request that comes to this router.
router.use((req, res, next) => {
  console.log(`--- API ROUTER-LEVEL LOG ---`);
  console.log(`Time: ${Date.now()}`);
  console.log(`Request URL: ${req.originalUrl}`);
  console.log(`Request Type: ${req.method}`);
  next(); // Pass control to the next handler
});


// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // --- THIS IS THE FIX ---
    // Use an absolute path to ensure consistency.
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // This replaces spaces and any other non-standard characters with a hyphen.
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-');
    cb(null, Date.now() + '-' + sanitizedFilename);
  },
});
const upload = multer({ storage });

// Route for bulk PDF uploads (can also handle single files)
router.post('/bulk-upload', upload.array('files'), invoiceController.bulkUpload);

router.get('/', invoiceController.getInvoices);
router.get('/export-excel', invoiceController.exportExcel);

// --- NEW ROUTE ---
// Route to serve a specific PDF file by invoice ID
router.get('/pdf/:id', invoiceController.getInvoicePDF);

router.put('/:id', invoiceController.updateInvoice);

// Development route to clear the database
router.delete('/clear', invoiceController.clearInvoices);

module.exports = router;
