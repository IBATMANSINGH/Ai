const Product = require('../models/product');
const Setting = require('../models/setting');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const validator = require('../utils/validator');
const imageProcessor = require('../utils/imageProcessor');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Use absolute path to ensure correct directory location
        const uploadDir = path.resolve(__dirname, '../uploads');
        console.log('Upload directory:', uploadDir);

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            console.log('Creating upload directory');
            try {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log('Upload directory created successfully');
            } catch (err) {
                console.error('Error creating upload directory:', err);
            }
        }

        // Verify directory exists before proceeding
        if (fs.existsSync(uploadDir)) {
            console.log('Upload directory exists, proceeding with upload');
            cb(null, uploadDir);
        } else {
            console.error('Upload directory does not exist after creation attempt');
            cb(new Error('Could not create upload directory'), null);
        }
    },
    filename: function(req, file, cb) {
        // Generate unique filename with timestamp and original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = 'product-' + uniqueSuffix + ext;
        console.log('Generated filename:', filename);
        cb(null, filename);
    }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
    console.log('Received file:', file.originalname, 'mimetype:', file.mimetype);
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        console.log('File accepted');
        cb(null, true);
    } else {
        console.log('File rejected: not an image');
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Initialize multer upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
}).single('product_image'); // 'product_image' is the name of the file input field

console.log('Multer initialized with product_image field');

// Get all products
exports.getAllProducts = (req, res) => {
    try {
        console.log('Getting all products');
        Product.getAll((err, products) => {
            if (err) {
                console.error('Error getting all products:', err);
                return res.status(500).json({
                    error: err.message,
                    code: 'DB_ERROR',
                    details: 'Failed to retrieve products from database'
                });
            }
            console.log(`Retrieved ${products.length} products`);
            res.json(products);
        });
    } catch (error) {
        console.error('Unexpected error in getAllProducts:', error);
        res.status(500).json({
            error: 'An unexpected error occurred',
            code: 'SERVER_ERROR',
            details: error.message
        });
    }
};

// Get a single product by ID
exports.getProductById = (req, res) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({
                error: 'Product ID is required',
                code: 'INVALID_REQUEST',
                details: 'Missing product ID in request parameters'
            });
        }

        console.log(`Getting product with ID: ${id}`);

        Product.getById(id, (err, product) => {
            if (err) {
                console.error(`Error getting product with ID ${id}:`, err);
                return res.status(500).json({
                    error: err.message,
                    code: 'DB_ERROR',
                    details: 'Failed to retrieve product from database'
                });
            }

            if (!product) {
                console.log(`Product with ID ${id} not found`);
                return res.status(404).json({
                    error: 'Product not found',
                    code: 'NOT_FOUND',
                    details: `No product exists with ID ${id}`
                });
            }

            console.log(`Retrieved product: ${product.name}`);
            res.json(product);
        });
    } catch (error) {
        console.error('Unexpected error in getProductById:', error);
        res.status(500).json({
            error: 'An unexpected error occurred',
            code: 'SERVER_ERROR',
            details: error.message
        });
    }
};

// Create a new product
exports.createProduct = (req, res) => {
    console.log('Create product request received');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    // First check if product images are enabled
    Setting.getAll((settingErr, settings) => {
        if (settingErr) {
            console.error('Error getting settings:', settingErr);
            return res.status(500).json({ error: settingErr.message });
        }

        console.log('Settings retrieved:', settings);
        console.log('Product images enabled:', settings.product_images_enabled);

        // Handle file upload if product images are enabled
        if (settings && settings.product_images_enabled) {
            console.log('Processing file upload with multer');
            upload(req, res, function(uploadErr) {
                if (uploadErr instanceof multer.MulterError) {
                    // A Multer error occurred when uploading
                    console.error('Multer error:', uploadErr);
                    return res.status(400).json({ error: uploadErr.message });
                } else if (uploadErr) {
                    // An unknown error occurred when uploading
                    console.error('Upload error:', uploadErr);
                    return res.status(500).json({ error: uploadErr.message });
                }

                console.log('File upload processed successfully');
                console.log('Request file after upload:', req.file);

                // Process the product creation after successful upload
                processProductCreation(req, res);
            });
        } else {
            // If product images are disabled, just process the product creation
            console.log('Product images disabled, skipping file upload');
            processProductCreation(req, res);
        }
    });
};

// Helper function to process product creation
function processProductCreation(req, res) {
    console.log('Processing product creation');
    console.log('Request body in processProductCreation:', req.body);

    // Validate and sanitize inputs
    const errors = [];

    // Validate product name
    const nameValidation = validator.validateProductName(req.body.name);
    if (!nameValidation.valid) {
        errors.push(nameValidation.message);
    }

    // Validate price
    const priceValidation = validator.validatePrice(req.body.price);
    if (!priceValidation.valid) {
        errors.push(priceValidation.message);
    }

    // If validation failed, return error response
    if (errors.length > 0) {
        console.error('Validation errors:', errors);
        return res.status(400).json({
            error: 'Validation failed',
            details: errors,
            received: { name: req.body.name, price: req.body.price }
        });
    }

    try {
        // Use sanitized values from validation
        const sanitizedName = nameValidation.sanitized;
        const sanitizedPrice = priceValidation.sanitized;

        console.log('File in processProductCreation:', req.file);

        // Validate file if present
        if (req.file) {
            const fileTypeValidation = validator.validateFileType(req.file);
            const fileSizeValidation = validator.validateFileSize(req.file);

            if (!fileTypeValidation.valid) {
                return res.status(400).json({ error: fileTypeValidation.message });
            }

            if (!fileSizeValidation.valid) {
                return res.status(400).json({ error: fileSizeValidation.message });
            }
        }

        // Process image if present
        let imagePath = null;

        if (req.file) {
            try {
                // Create uploads/optimized directory if it doesn't exist
                const optimizedDir = path.join(__dirname, '../uploads/optimized');
                if (!fs.existsSync(optimizedDir)) {
                    fs.mkdirSync(optimizedDir, { recursive: true });
                }

                // Create uploads/thumbnails directory if it doesn't exist
                const thumbnailsDir = path.join(__dirname, '../uploads/thumbnails');
                if (!fs.existsSync(thumbnailsDir)) {
                    fs.mkdirSync(thumbnailsDir, { recursive: true });
                }

                const originalPath = req.file.path;
                const filename = path.basename(originalPath);
                const optimizedPath = path.join(optimizedDir, filename);
                const thumbnailPath = path.join(thumbnailsDir, filename);

                console.log('Optimizing image:', originalPath);

                // Optimize image asynchronously
                imageProcessor.optimizeImage(originalPath, optimizedPath)
                    .then(result => {
                        if (result.success) {
                            console.log('Image optimized successfully:', optimizedPath);
                            // Delete original file after optimization
                            fs.unlink(originalPath, err => {
                                if (err) console.error('Error deleting original image:', err);
                            });
                        } else {
                            console.error('Error optimizing image:', result.error);
                        }
                    })
                    .catch(err => console.error('Error in image optimization:', err));

                // Generate thumbnail asynchronously
                imageProcessor.generateThumbnail(originalPath, thumbnailPath)
                    .then(result => {
                        if (result.success) {
                            console.log('Thumbnail generated successfully:', thumbnailPath);
                        } else {
                            console.error('Error generating thumbnail:', result.error);
                        }
                    })
                    .catch(err => console.error('Error in thumbnail generation:', err));

                // Use optimized image path for the product
                imagePath = `/uploads/optimized/${filename}`;
            } catch (imageErr) {
                console.error('Error processing image:', imageErr);
                // Fallback to original image if optimization fails
                imagePath = `/uploads/${req.file.filename}`;
            }
        }

        const product = {
            name: sanitizedName,
            price: sanitizedPrice,
            image_path: imagePath
        };

        console.log('Creating product with sanitized data:', product);

        Product.create(product, (err, newProduct) => {
            if (err) {
                console.error('Database error creating product:', err);
                return res.status(500).json({ error: err.message });
            }
            console.log('Product created successfully:', newProduct);
            res.status(201).json(newProduct);
        });
    } catch (error) {
        console.error('Unexpected error in processProductCreation:', error);
        res.status(500).json({ error: 'An unexpected error occurred while creating the product' });
    }
};

// Update a product
exports.updateProduct = (req, res) => {
    const id = req.params.id;

    // First check if product images are enabled
    Setting.getAll((settingErr, settings) => {
        if (settingErr) {
            return res.status(500).json({ error: settingErr.message });
        }

        // Handle file upload if product images are enabled
        if (settings && settings.product_images_enabled) {
            upload(req, res, function(uploadErr) {
                if (uploadErr instanceof multer.MulterError) {
                    // A Multer error occurred when uploading
                    return res.status(400).json({ error: uploadErr.message });
                } else if (uploadErr) {
                    // An unknown error occurred when uploading
                    return res.status(500).json({ error: uploadErr.message });
                }

                // Process the product update after successful upload
                processProductUpdate(id, req, res);
            });
        } else {
            // If product images are disabled, just process the product update
            processProductUpdate(id, req, res);
        }
    });
};

// Helper function to process product update
function processProductUpdate(id, req, res) {
    // Validate request
    if (!req.body.name || !req.body.price) {
        return res.status(400).json({ error: 'Product name and price are required' });
    }

    // If a new file was uploaded, include the image_path
    const product = {
        name: req.body.name,
        price: parseFloat(req.body.price)
    };

    // Only update image_path if a new file was uploaded
    if (req.file) {
        product.image_path = `/uploads/${req.file.filename}`;

        // If there's an existing image, we should delete it
        // First get the current product to check for existing image
        Product.getById(id, (getErr, existingProduct) => {
            if (getErr) {
                console.error('Error fetching existing product:', getErr);
            } else if (existingProduct && existingProduct.image_path) {
                // Try to delete the old image file
                const oldImagePath = path.join(__dirname, '..', existingProduct.image_path);
                if (fs.existsSync(oldImagePath)) {
                    try {
                        fs.unlinkSync(oldImagePath);
                    } catch (unlinkErr) {
                        console.error('Error deleting old image file:', unlinkErr);
                    }
                }
            }

            // Continue with the update
            updateProductInDatabase(id, product, res);
        });
    } else {
        // No new image, just update the other fields
        updateProductInDatabase(id, product, res);
    }
}

// Helper function to update the product in the database
function updateProductInDatabase(id, product, res) {
    Product.update(id, product, (err, updatedProduct) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(updatedProduct);
    });
};

// Delete a product
exports.deleteProduct = (req, res) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({
                error: 'Product ID is required',
                code: 'INVALID_REQUEST',
                details: 'Missing product ID in request parameters'
            });
        }

        console.log(`Deleting product with ID: ${id}`);

        // First get the product to check if it has an image
        Product.getById(id, (getErr, product) => {
            if (getErr) {
                console.error(`Error getting product with ID ${id} for deletion:`, getErr);
                return res.status(500).json({
                    error: getErr.message,
                    code: 'DB_ERROR',
                    details: 'Failed to retrieve product for deletion'
                });
            }

            if (!product) {
                console.log(`Product with ID ${id} not found for deletion`);
                return res.status(404).json({
                    error: 'Product not found',
                    code: 'NOT_FOUND',
                    details: `No product exists with ID ${id}`
                });
            }

            console.log(`Found product for deletion: ${product.name}`);

            // Delete the product from the database
            Product.delete(id, (deleteErr, result) => {
                if (deleteErr) {
                    console.error(`Error deleting product with ID ${id}:`, deleteErr);
                    return res.status(500).json({
                        error: deleteErr.message,
                        code: 'DB_ERROR',
                        details: 'Failed to delete product from database'
                    });
                }

                // If the product had an image, delete the image file
                if (product.image_path) {
                    const imagePath = path.join(__dirname, '..', product.image_path);
                    console.log(`Checking for image file at: ${imagePath}`);

                    if (fs.existsSync(imagePath)) {
                        try {
                            console.log(`Deleting image file: ${imagePath}`);
                            fs.unlinkSync(imagePath);
                            console.log('Image file deleted successfully');
                        } catch (unlinkErr) {
                            console.error('Error deleting image file:', unlinkErr);
                            // Continue with the response even if image deletion fails
                        }
                    } else {
                        console.log('Image file not found on disk');
                    }
                }

                console.log(`Product with ID ${id} deleted successfully`);
                res.json({
                    message: 'Product deleted successfully',
                    id: id
                });
            });
        });
    } catch (error) {
        console.error('Unexpected error in deleteProduct:', error);
        res.status(500).json({
            error: 'An unexpected error occurred',
            code: 'SERVER_ERROR',
            details: error.message
        });
    }
};
