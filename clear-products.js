const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

console.log('Clearing all products and settings...');

db.serialize(() => {
    db.run("DELETE FROM settings", (err) => {
        if (err) {
            console.error('Error deleting settings:', err);
        } else {
            console.log('✓ All settings deleted');
        }
    });

    db.run("DELETE FROM products", (err) => {
        if (err) {
            console.error('Error deleting products:', err);
        } else {
            console.log('✓ All products deleted');
        }
    });

    // Reset auto-increment counters
    db.run("DELETE FROM sqlite_sequence WHERE name='products'", (err) => {
        if (err) console.error('Error resetting products counter:', err);
    });

    db.run("DELETE FROM sqlite_sequence WHERE name='settings'", (err) => {
        if (err) console.error('Error resetting settings counter:', err);
        else console.log('✓ ID counters reset');
    });
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err);
    } else {
        console.log('\n✅ Database cleared successfully!');
        console.log('You can now add fresh products and customizations from the Admin page.');
    }
});
