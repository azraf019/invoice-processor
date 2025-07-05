// server/routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const invoiceController = require('../controllers/invoiceController');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Routes for single and bulk PDF uploads
router.post('/upload', upload.single('pdf'), invoiceController.uploadInvoice);
router.post('/bulk-upload', upload.array('files'), invoiceController.bulkUpload);

router.get('/', invoiceController.getInvoices);
router.get('/export-excel', invoiceController.exportExcel);

module.exports = router;