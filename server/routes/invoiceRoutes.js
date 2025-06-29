const express = require('express');
const router = express.Router();
const multer = require('multer');
const invoiceController = require('../controllers/invoiceController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.post('/upload', upload.single('pdf'), invoiceController.uploadInvoice);
router.get('/invoices', invoiceController.getInvoices);
router.get('/export-excel', invoiceController.exportExcel);

module.exports = router;