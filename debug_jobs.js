const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'server/db.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to database.');

    db.all("SELECT id, created_at, client_name, job_id_display FROM jobs ORDER BY created_at DESC", [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return;
        }
        console.log("Found " + rows.length + " jobs:");
        rows.forEach(row => {
            console.log(`${row.id} - ${row.created_at} - ${row.client_name} - ${row.job_id_display}`);
        });
        db.close();
    });
});
