const Setting = require('../models/setting');

// Get settings page
exports.getSettings = (req, res) => {
    Setting.getAll((err, settings) => {
        if (err) {
            return res.status(500).render('error', {
                title: 'Error',
                message: 'Error loading settings',
                error: err
            });
        }

        // Get currency, tax, and date format options
        const currencyOptions = Setting.getCurrencyOptions();
        const taxOptions = Setting.getTaxOptions();
        const dateFormatOptions = Setting.getDateFormatOptions();

        res.render('settings', {
            title: 'Settings',
            settings,
            currencyOptions,
            taxOptions,
            dateFormatOptions
        });
    });
};

// Update settings
exports.updateSettings = (req, res) => {
    console.log('Request body:', req.body);

    // Validate request
    if (!req.body.currency_code || !req.body.currency_symbol) {
        const error = { status: 400, message: 'Currency code and symbol are required' };
        console.error('Validation error:', error);

        // Check if this is an AJAX request
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(400).render('error', {
            title: 'Error',
            message: error.message,
            error: error
        });
    }

    const settings = {
        id: req.body.id,
        currency_code: req.body.currency_code,
        currency_symbol: req.body.currency_symbol,
        tax_rate: parseFloat(req.body.tax_rate) || 0,
        tax_name: req.body.tax_name,
        tax_enabled: req.body.tax_enabled === 'on' ? 1 : 0,
        company_name: req.body.company_name || '',
        company_address: req.body.company_address || '',
        company_phone: req.body.company_phone || '',
        company_email: req.body.company_email || '',
        invoice_prefix: req.body.invoice_prefix || 'INV-',
        invoice_starting_number: parseInt(req.body.invoice_starting_number) || 1000,
        date_format: req.body.date_format || 'DD/MM/YYYY',
        product_images_enabled: req.body.product_images_enabled === 'on' ? 1 : 0
    };

    console.log('Updating settings with:', settings);

    Setting.update(settings, (err, updatedSettings) => {
        if (err) {
            console.error('Error updating settings:', err);

            // Check if this is an AJAX request
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(500).json({ error: err.message });
            }

            return res.status(500).render('error', {
                title: 'Error',
                message: 'Error updating settings: ' + err.message,
                error: err
            });
        }

        // Check if this is an AJAX request
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(200).json({ success: true, message: 'Settings updated successfully' });
        }

        // Redirect back to settings page with success message
        res.redirect('/settings?success=true');
    });
};

// Get settings data (API)
exports.getSettingsData = (req, res) => {
    Setting.getAll((err, settings) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(settings);
    });
};
