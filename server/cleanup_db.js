const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'db.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to database for cleanup.');

    const defaultProducts = ["PVC ID Card", "Smart Card", "RFID Card", "Membership Card", "Loyalty Card", "OP Card", "Other"];
    const defaultSettings = [
        'Offset', 'Digital', 'Thermal', 'Single Side', 'Double Side', 'Glossy', 'Matte', 'Laminated',
        'Lanyard', 'Holder', 'Punch Hole', 'Keychain', 'PVC', 'Plastic', 'Paper', 'Metal',
        'Standard', 'Custom', 'Spiral', 'Hardbound', 'Softbound', 'Stapled', 'Square', 'Rounded',
        '80 GSM', '100 GSM', '130 GSM', '170 GSM', '250 GSM', '300 GSM'
    ];
    const defaultCategories = ['printing_type', 'printing_mode', 'finish', 'accessories', 'card_size', 'material', 'binding', 'corner', 'paper_thickness'];

    db.serialize(() => {
        // Delete default products
        const productPlaceholders = defaultProducts.map(() => '?').join(',');
        db.run(`DELETE FROM products WHERE name IN (${productPlaceholders})`, defaultProducts, function (err) {
            if (err) console.error('Error deleting products:', err.message);
            else console.log(`Deleted ${this.changes} default products.`);
        });

        // Delete default settings
        const settingPlaceholders = defaultSettings.map(() => '?').join(',');
        db.run(`DELETE FROM settings WHERE value IN (${settingPlaceholders})`, defaultSettings, function (err) {
            if (err) console.error('Error deleting settings:', err.message);
            else console.log(`Deleted ${this.changes} default settings.`);
        });

        // Delete default categories
        const catPlaceholders = defaultCategories.map(() => '?').join(',');
        db.run(`DELETE FROM custom_categories WHERE name IN (${catPlaceholders})`, defaultCategories, function (err) {
            if (err) console.error('Error deleting categories:', err.message);
            else console.log(`Deleted ${this.changes} default categories.`);
        });

        db.close((err) => {
            if (err) console.error('Error closing database:', err.message);
            else console.log('Cleanup complete and database closed.');
        });
    });
});
