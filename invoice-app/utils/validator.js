/**
 * Utility functions for input validation and sanitization
 */

// Validate product name
exports.validateProductName = (name) => {
    if (!name || typeof name !== 'string') {
        return { valid: false, message: 'Product name is required' };
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length === 0) {
        return { valid: false, message: 'Product name cannot be empty' };
    }
    
    if (trimmedName.length > 100) {
        return { valid: false, message: 'Product name cannot exceed 100 characters' };
    }
    
    // Check for potentially dangerous characters
    if (/[<>]/.test(trimmedName)) {
        return { valid: false, message: 'Product name contains invalid characters' };
    }
    
    return { valid: true, sanitized: trimmedName };
};

// Validate product price
exports.validatePrice = (price) => {
    // Convert to number if string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numPrice)) {
        return { valid: false, message: 'Price must be a valid number' };
    }
    
    if (numPrice < 0) {
        return { valid: false, message: 'Price cannot be negative' };
    }
    
    if (numPrice > 9999999.99) {
        return { valid: false, message: 'Price is too large' };
    }
    
    // Round to 2 decimal places
    const sanitizedPrice = Math.round(numPrice * 100) / 100;
    
    return { valid: true, sanitized: sanitizedPrice };
};

// Validate file type
exports.validateFileType = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
    if (!file) {
        return { valid: true, message: 'No file provided' }; // No file is valid
    }
    
    if (!allowedTypes.includes(file.mimetype)) {
        return { 
            valid: false, 
            message: `Invalid file type. Allowed types: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`
        };
    }
    
    return { valid: true };
};

// Validate file size
exports.validateFileSize = (file, maxSizeBytes = 5 * 1024 * 1024) => {
    if (!file) {
        return { valid: true, message: 'No file provided' }; // No file is valid
    }
    
    if (file.size > maxSizeBytes) {
        return { 
            valid: false, 
            message: `File is too large. Maximum size is ${Math.round(maxSizeBytes / (1024 * 1024))}MB`
        };
    }
    
    return { valid: true };
};

// Sanitize string input
exports.sanitizeString = (str) => {
    if (!str || typeof str !== 'string') {
        return '';
    }
    
    // Remove potentially dangerous characters
    return str.trim()
        .replace(/[<>]/g, '') // Remove < and > characters
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Validate and sanitize ID
exports.validateId = (id) => {
    // Convert to number if string
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(numId) || numId <= 0) {
        return { valid: false, message: 'Invalid ID' };
    }
    
    return { valid: true, sanitized: numId };
};
