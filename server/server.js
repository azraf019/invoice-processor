const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const invoiceRoutes = require('./routes/invoiceRoutes');
const bulkRoutes = require('./routes/bulkRoutes');
const errorHandler = require('./middleware/errorHandler');
const path = require('path'); // --- FIX: Import the 'path' module ---
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

// The /api/pdf/:id route now handles serving files securely.
// This static route is no longer needed and can cause conflicts.
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api', invoiceRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/templates', require('./routes/templateRoutes'));

// Error Handling
app.use(errorHandler);

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
