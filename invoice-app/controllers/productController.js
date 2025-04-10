const Product = require('../models/product');

// Get all products
exports.getAllProducts = (req, res) => {
    Product.getAll((err, products) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(products);
    });
};

// Get a single product by ID
exports.getProductById = (req, res) => {
    const id = req.params.id;
    
    Product.getById(id, (err, product) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    });
};

// Create a new product
exports.createProduct = (req, res) => {
    // Validate request
    if (!req.body.name || !req.body.price) {
        return res.status(400).json({ error: 'Product name and price are required' });
    }

    const product = {
        name: req.body.name,
        price: parseFloat(req.body.price)
    };

    Product.create(product, (err, newProduct) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json(newProduct);
    });
};

// Update a product
exports.updateProduct = (req, res) => {
    const id = req.params.id;
    
    // Validate request
    if (!req.body.name || !req.body.price) {
        return res.status(400).json({ error: 'Product name and price are required' });
    }

    const product = {
        name: req.body.name,
        price: parseFloat(req.body.price)
    };

    Product.update(id, product, (err, updatedProduct) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(updatedProduct);
    });
};

// Delete a product
exports.deleteProduct = (req, res) => {
    const id = req.params.id;
    
    Product.delete(id, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Product deleted successfully' });
    });
};
