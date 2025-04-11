/**
 * Utility functions for image processing
 *
 * Note: This is a simplified version that doesn't actually process images
 * but maintains the same API for compatibility.
 */
const fs = require('fs');
const path = require('path');

// Resize and optimize image (simplified version without sharp)
exports.optimizeImage = async (inputPath, outputPath, options = {}) => {
    try {
        // Create directory if it doesn't exist
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Simply copy the file instead of processing it
        fs.copyFileSync(inputPath, outputPath);

        console.log(`Image copied from ${inputPath} to ${outputPath}`);

        return {
            success: true,
            path: outputPath
        };
    } catch (error) {
        console.error('Error copying image:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Generate thumbnail (simplified version without sharp)
exports.generateThumbnail = async (inputPath, outputPath, size = 200) => {
    try {
        // Create directory if it doesn't exist
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Simply copy the file instead of generating a thumbnail
        fs.copyFileSync(inputPath, outputPath);

        console.log(`Thumbnail copied from ${inputPath} to ${outputPath}`);

        return {
            success: true,
            path: outputPath
        };
    } catch (error) {
        console.error('Error generating thumbnail:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
