// server/routes/bulkRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const bulkController = require('../controllers/bulkController');
const fs = require('fs');
const path = require('path');

// Multer storage configuration (reused from invoiceRoutes but kept separate)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-');
        cb(null, Date.now() + '-' + sanitizedFilename);
    },
});
const upload = multer({ storage });

router.post('/split', upload.single('file'), bulkController.splitAndProcess);

module.exports = router;
