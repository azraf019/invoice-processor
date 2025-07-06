const express = require('express');
const router = express.Router();
const multer = require('multer');
const invoiceController = require('../controllers/invoiceController');
const fs = require('fs');
const path = require('path'); // Make sure path is imported

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

// Routes for single and bulk PDF uploads
router.post('/upload', upload.single('pdf'), invoiceController.uploadInvoice);
router.post('/bulk-upload', upload.array('files'), invoiceController.bulkUpload);

router.get('/', invoiceController.getInvoices);
router.get('/export-excel', invoiceController.exportExcel);

// Route to get a specific invoice's PDF
// This route is no longer needed if using express.static, but can be kept for other purposes if needed.
// router.get('/:id/pdf', invoiceController.getInvoicePDF);

// Development route to clear the database
router.delete('/clear', invoiceController.clearInvoices);

module.exports = router;
