const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: './config/config.env' });
const connectDB = require('./config/db');
const animalRoutes = require('./routes/animalRoutes');
const authRoutes = require('./routes/authRoutes');
const adoptionRoutes = require('./routes/adoptionRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// Routes
app.use('/api/animals', animalRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/adoptions', adoptionRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Server Error'
    });
});

// Server Setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🐾 Stray Animal Server running on port ${PORT}`);
});