const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const fs = require('fs');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Initialize the database
const db = require('./models/db');
// We don't need to call init() here as it's automatically called when the module is required

// Run database schema check
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.resolve(__dirname, 'data/invoice.db');

// Function to check and fix database schema
function checkDatabaseSchema() {
    console.log('Checking database schema...');
    const dbConn = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database for schema check:', err.message);
            return;
        }

        // Check if product_images_enabled column exists in settings table
        dbConn.all("PRAGMA table_info(settings)", (err, rows) => {
            if (err) {
                console.error('Error getting settings table info:', err);
                dbConn.close();
                return;
            }

            const hasProductImagesEnabled = rows.some(row => row.name === 'product_images_enabled');
            if (!hasProductImagesEnabled) {
                console.log('Adding product_images_enabled column to settings table...');
                dbConn.run("ALTER TABLE settings ADD COLUMN product_images_enabled INTEGER DEFAULT 1", function(err) {
                    if (err) {
                        console.error('Error adding product_images_enabled column:', err);
                    } else {
                        console.log('Added product_images_enabled column to settings table');
                    }
                    dbConn.close();
                });
            } else {
                dbConn.close();
            }
        });
    });
}

// Run the schema check
checkDatabaseSchema();

// Import routes
const indexRouter = require('./routes/index');
const productsRouter = require('./routes/products');
const invoicesRouter = require('./routes/invoices');
const settingsRouter = require('./routes/settings');

// Initialize the app
const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(morgan('dev')); // Logging
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
// Serve files from uploads directory and its subdirectories
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/optimized', express.static(path.join(__dirname, 'uploads/optimized')));
app.use('/uploads/thumbnails', express.static(path.join(__dirname, 'uploads/thumbnails')));

// Routes
app.use('/', indexRouter);
app.use('/api/products', productsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/settings', settingsRouter);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'Error',
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
