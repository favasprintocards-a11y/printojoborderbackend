const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Commencing full dynamic data reset (Targeting db.sqlite)...");

    // Clear settings/options
    db.run("DELETE FROM settings", (err) => {
        if (err && !err.message.includes('no such table')) console.error("Error clearing settings:", err.message);
        else console.log("✓ Settings cleared");
    });

    // Clear product types
    db.run("DELETE FROM products", (err) => {
        if (err && !err.message.includes('no such table')) console.error("Error clearing products:", err.message);
        else console.log("✓ Products cleared");
    });

    // Clear custom categories
    db.run("DELETE FROM custom_categories", (err) => {
        if (err && !err.message.includes('no such table')) console.error("Error clearing custom categories:", err.message);
        else console.log("✓ Custom Categories cleared");
    });

    // Clear staff members
    db.run("DELETE FROM staff", (err) => {
        if (err && !err.message.includes('no such table')) console.error("Error clearing staff:", err.message);
        else console.log("✓ Staff members cleared");
    });

    // Clear jobs and items
    db.run("DELETE FROM job_items", (err) => {
        if (err && !err.message.includes('no such table')) console.error("Error clearing job items:", err.message);
        else console.log("✓ Job items cleared");
    });
    db.run("DELETE FROM jobs", (err) => {
        if (err && !err.message.includes('no such table')) console.error("Error clearing jobs:", err.message);
        else console.log("✓ Jobs cleared");
    });

    // Clear clients
    db.run("DELETE FROM clients", (err) => {
        if (err && !err.message.includes('no such table')) console.error("Error clearing clients:", err.message);
        else console.log("✓ Clients cleared");
    });

    console.log("\nFull reset complete. All dynamic data has been removed from the Admin and Jobs pages.");
});

db.close();
