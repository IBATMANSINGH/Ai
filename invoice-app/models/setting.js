const dbModule = require('./db');
const db = dbModule.getDb();

class Setting {
    // Get all settings
    static getAll(callback) {
        const sql = 'SELECT * FROM settings LIMIT 1';
        db.get(sql, [], (err, row) => {
            if (err) {
                return callback(err, null);
            }
            return callback(null, row);
        });
    }

    // Update settings
    static update(settings, callback) {
        const sql = `UPDATE settings SET
            currency_code = ?,
            currency_symbol = ?,
            tax_rate = ?,
            tax_name = ?,
            tax_enabled = ?,
            company_name = ?,
            company_address = ?,
            company_phone = ?,
            company_email = ?,
            invoice_prefix = ?,
            invoice_starting_number = ?,
            date_format = ?,
            product_images_enabled = ?
            WHERE id = ?`;

        const params = [
            settings.currency_code,
            settings.currency_symbol,
            settings.tax_rate,
            settings.tax_name,
            settings.tax_enabled ? 1 : 0,
            settings.company_name,
            settings.company_address,
            settings.company_phone,
            settings.company_email,
            settings.invoice_prefix,
            settings.invoice_starting_number,
            settings.date_format,
            settings.product_images_enabled ? 1 : 0,
            settings.id
        ];

        console.log('SQL:', sql);
        console.log('Params:', params);

        db.run(sql, params, function(err) {
            if (err) {
                console.error('Database error:', err);
                return callback(err, null);
            }
            return callback(null, { id: settings.id, ...settings });
        });
    }

    // Get currency options
    static getCurrencyOptions() {
        return [
            { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
            { code: 'USD', symbol: '$', name: 'US Dollar' },
            { code: 'EUR', symbol: '€', name: 'Euro' },
            { code: 'GBP', symbol: '£', name: 'British Pound' },
            { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
            { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
            { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
            { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
            { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
            { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' }
        ];
    }

    // Get tax options
    static getTaxOptions() {
        return [
            { name: 'GST', description: 'Goods and Services Tax (India)' },
            { name: 'VAT', description: 'Value Added Tax' },
            { name: 'Sales Tax', description: 'General Sales Tax' },
            { name: 'No Tax', description: 'No Tax Applied' }
        ];
    }

    // Get date format options
    static getDateFormatOptions() {
        return [
            { format: 'DD/MM/YYYY', description: 'Day/Month/Year (31/12/2023)' },
            { format: 'MM/DD/YYYY', description: 'Month/Day/Year (12/31/2023)' },
            { format: 'YYYY-MM-DD', description: 'Year-Month-Day (2023-12-31)' }
        ];
    }
}

module.exports = Setting;
