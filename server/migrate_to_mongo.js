const sqlite3 = require('sqlite3').verbose();
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

// Models
const Client = require('./models/Client');
const Job = require('./models/Job');
const Product = require('./models/Product');
const Setting = require('./models/Setting');
const Staff = require('./models/Staff');
const Admin = require('./models/Admin');
const Category = require('./models/Category');

const dbPath = path.join(__dirname, 'db.sqlite');
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    console.error("MONGODB_URI not found in .env");
    process.exit(1);
}

const migrate = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB.");

        const db = new sqlite3.Database(dbPath);

        // Utility to promisify db.all
        const query = (sql, params = []) => new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        console.log("Migrating Categories...");
        const sqlCats = await query("SELECT * FROM custom_categories");
        for (const c of sqlCats) {
            await Category.findOneAndUpdate({ name: c.name }, { display_name: c.display_name }, { upsert: true });
        }

        console.log("Migrating Products...");
        const sqlProds = await query("SELECT * FROM products");
        const prodMap = {}; // SQLite ID -> Mongo ID
        for (const p of sqlProds) {
            const mp = await Product.findOneAndUpdate({ name: p.name }, { name: p.name }, { upsert: true, new: true });
            prodMap[p.id] = mp._id;
        }

        console.log("Migrating Settings...");
        const sqlSettings = await query("SELECT * FROM settings");
        for (const s of sqlSettings) {
            await Setting.findOneAndUpdate(
                { category: s.category, value: s.value },
                { product_id: s.product_id ? prodMap[s.product_id] : null },
                { upsert: true }
            );
        }

        console.log("Migrating Staff...");
        const sqlStaff = await query("SELECT * FROM staff");
        for (const s of sqlStaff) {
            await Staff.findOneAndUpdate({ name: s.name }, { ...s, created_at: s.created_at }, { upsert: true });
        }

        console.log("Migrating Admins...");
        const sqlAdmins = await query("SELECT * FROM admins");
        for (const a of sqlAdmins) {
            await Admin.findOneAndUpdate({ username: a.username }, { password: a.password }, { upsert: true });
        }

        console.log("Migrating Clients...");
        const sqlClients = await query("SELECT * FROM clients");
        const clientMap = {};
        for (const c of sqlClients) {
            const mc = await Client.findOneAndUpdate({ phone: c.phone, name: c.name }, { ...c }, { upsert: true, new: true });
            clientMap[c.id] = mc._id;
        }

        console.log("Migrating Jobs...");
        const sqlJobs = await query("SELECT * FROM jobs");
        for (const j of sqlJobs) {
            const items = await query("SELECT * FROM job_items WHERE job_id = ?", [j.id]);
            const mJob = new Job({
                ...j,
                client_id: j.client_id ? clientMap[j.client_id] : null,
                items: items.map(i => ({
                    ...i,
                    common_front: i.common_front === 1,
                    common_back: i.common_back === 1,
                    custom_fields: i.custom_fields ? JSON.parse(i.custom_fields) : {}
                }))
            });
            await mJob.save();
        }

        console.log("Migration Successful!");
        db.close();
        mongoose.disconnect();

    } catch (err) {
        console.error("Migration Failed:", err);
    }
};

migrate();
