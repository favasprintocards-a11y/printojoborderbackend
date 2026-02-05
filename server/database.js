const sqlite3 = require('sqlite3').verbose();

const DBSOURCE = "db.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message)
        throw err
    } else {
        console.log('Connected to the SQLite database.')
        db.run(`CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id_display TEXT,
            submitted_by TEXT NOT NULL,
            submitted_contact TEXT,
            
            client_id INTEGER,
            client_name TEXT NOT NULL,
            client_phone TEXT,
            client_email TEXT,
            client_company TEXT,
            client_address TEXT,

            product_type TEXT,
            card_size TEXT,
            quantity INTEGER,
            printing_type TEXT,
            printing_mode TEXT,
            finish TEXT,
            accessories TEXT, 
            variable_data TEXT,

            file_path TEXT,
            special_instructions TEXT,

            expected_delivery_date TEXT,
            priority TEXT,
            delivery_mode TEXT,

            status TEXT DEFAULT 'Received',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
            (err) => {
                if (err) {
                    // Table already created
                }

                // Try to add client_id column if it doesn't exist (for migration)
                db.run("ALTER TABLE jobs ADD COLUMN client_id INTEGER", (err) => { });
                db.run("ALTER TABLE jobs ADD COLUMN client_company TEXT", (err) => { });
                db.run("ALTER TABLE jobs ADD COLUMN client_address TEXT", (err) => { });

                // Add material column
                db.run("ALTER TABLE jobs ADD COLUMN material TEXT", (err) => {
                    // Ignore error
                });

                // Migration: Move existing product data to job_items if job_items is empty
                db.get("SELECT count(*) as count FROM job_items", [], (err, row) => {
                    if (row && row.count === 0) {
                        db.all("SELECT id, product_type, card_size, quantity, printing_type, printing_mode, finish, accessories, material, variable_data, file_path FROM jobs", [], (err, rows) => {
                            if (rows) {
                                rows.forEach(job => {
                                    db.run(`INSERT INTO job_items (job_id, product_type, card_size, quantity, printing_type, printing_mode, finish, accessories, material, variable_data, file_path) 
                                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                        [job.id, job.product_type, job.card_size, job.quantity, job.printing_type, job.printing_mode, job.finish, job.accessories, job.material, job.variable_data, job.file_path]);
                                });
                            }
                        });
                    }
                });
            });

        db.run(`CREATE TABLE IF NOT EXISTS job_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER NOT NULL,
            product_type TEXT,
            card_size TEXT,
            quantity INTEGER,
            printing_type TEXT,
            printing_mode TEXT,
            finish TEXT,
            accessories TEXT,
            material TEXT,
            variable_data TEXT,
            file_path TEXT,
            rate REAL DEFAULT 0,
            common_front INTEGER DEFAULT 0,
            common_back INTEGER DEFAULT 0,
            FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            company TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            value TEXT NOT NULL,
            product_id INTEGER,
            FOREIGN KEY(product_id) REFERENCES products(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            department TEXT,
            status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )`, (err) => {
            if (!err) {
                // Seed Default Admin (admin / admin123)
                // In a real app, use bcrypt. Here simple text for prototype as requested.
                db.run("INSERT OR IGNORE INTO admins (username, password) VALUES (?,?)", ['admin', 'admin123']);
            }
        });

        db.run("ALTER TABLE settings ADD COLUMN product_id INTEGER", (err) => {
            // Ignore error if exists
        });

        db.serialize(() => {
            db.run("ALTER TABLE jobs ADD COLUMN total_amount REAL DEFAULT 0", (err) => { });
            db.run("ALTER TABLE jobs ADD COLUMN advance_amount REAL DEFAULT 0", (err) => { });
            db.run("ALTER TABLE job_items ADD COLUMN common_front INTEGER DEFAULT 0", (err) => { });
            db.run("ALTER TABLE job_items ADD COLUMN common_back INTEGER DEFAULT 0", (err) => { });
            db.run("ALTER TABLE job_items ADD COLUMN rate REAL DEFAULT 0", (err) => { });
            db.run("ALTER TABLE jobs ADD COLUMN gst_rate REAL DEFAULT 0", (err) => { });
            db.run("ALTER TABLE jobs ADD COLUMN courier_charge REAL DEFAULT 0", (err) => { });
            db.run("ALTER TABLE job_items ADD COLUMN binding TEXT", (err) => { });
            db.run("ALTER TABLE job_items ADD COLUMN corner TEXT", (err) => { });
            db.run("ALTER TABLE job_items ADD COLUMN paper_thickness TEXT", (err) => { });
            db.run("ALTER TABLE job_items ADD COLUMN custom_fields TEXT", (err) => { });
            db.run("ALTER TABLE job_items ADD COLUMN additional_info TEXT", (err) => { });
            db.run("ALTER TABLE job_items ADD COLUMN advance_amount REAL DEFAULT 0", (err) => { });
        });

        db.run(`CREATE TABLE IF NOT EXISTS custom_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL
        )`);
    }
});

module.exports = db
