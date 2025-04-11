const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');

// GET settings page
router.get('/', settingController.getSettings);

// POST update settings
router.post('/', settingController.updateSettings);

// GET settings data (API)
router.get('/api', settingController.getSettingsData);

// POST update product images setting
router.post('/product-images', (req, res) => {
    const enabled = req.body.enabled === 'true' ? 1 : 0;

    // Log the request
    console.log('Updating product_images_enabled to:', enabled);
    console.log('Request body:', req.body);

    // Update the setting in the database
    const db = require('../models/db').getDb();
    db.run('UPDATE settings SET product_images_enabled = ? WHERE id = 1', [enabled], function(err) {
        if (err) {
            console.error('Error updating product_images_enabled:', err);
            return res.status(500).json({ error: err.message });
        }

        console.log('product_images_enabled updated successfully');
        return res.status(200).json({ success: true });
    });
});

module.exports = router;
