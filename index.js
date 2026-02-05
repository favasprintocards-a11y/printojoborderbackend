const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const db = require("./database.js");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// File Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage: storage });

// Routes

// --- Clients API ---

// Get all clients
app.get("/api/clients", (req, res) => {
    const sql = "SELECT * FROM clients ORDER BY name ASC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: rows,
        });
    });
});

// Create new client
app.post("/api/clients", (req, res) => {
    const { name, company, email, phone, address, notes } = req.body;
    const sql = "INSERT INTO clients (name, company, email, phone, address, notes) VALUES (?,?,?,?,?,?)";
    const params = [name, company, email, phone, address, notes];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: { id: this.lastID, ...req.body }
        });
    });
});

// Get single client
app.get("/api/clients/:id", (req, res) => {
    const sql = "SELECT * FROM clients WHERE id = ?";
    db.get(sql, [req.params.id], (err, row) => {
        if (err || !row) {
            return res.status(400).json({ error: err ? err.message : "Client not found" });
        }
        res.json({ message: "success", data: row });
    });
});

// Update client
app.put("/api/clients/:id", (req, res) => {
    const { name, company, email, phone, address, notes } = req.body;
    const sql = `UPDATE clients SET 
        name = ?, company = ?, email = ?, phone = ?, address = ?, notes = ?
        WHERE id = ?`;
    const params = [name, company, email, phone, address, notes, req.params.id];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "success", changes: this.changes });
    });
});

// Delete client
app.delete("/api/clients/:id", (req, res) => {
    const sql = "DELETE FROM clients WHERE id = ?";
    db.run(sql, [req.params.id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "success", changes: this.changes });
    });
});

// --- Jobs API ---

// Get all jobs (optionally filter by client_id)
app.get("/api/jobs", (req, res) => {
    let sql = "SELECT * FROM jobs ORDER BY created_at DESC";
    let params = [];


    if (req.query.client_id) {
        sql = `SELECT 
            jobs.*,
            GROUP_CONCAT(DISTINCT job_items.product_type) as product_type,
            SUM(job_items.quantity) as quantity
            FROM jobs 
            LEFT JOIN job_items ON jobs.id = job_items.job_id
            WHERE jobs.client_id = ?
            GROUP BY jobs.id
            ORDER BY jobs.created_at DESC`;
        params = [req.query.client_id];
    } else {
        sql = `SELECT 
            jobs.*,
            GROUP_CONCAT(DISTINCT job_items.product_type) as product_type,
            SUM(job_items.quantity) as quantity
            FROM jobs 
            LEFT JOIN job_items ON jobs.id = job_items.job_id
            GROUP BY jobs.id
            ORDER BY jobs.created_at DESC`;
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: rows,
        });
    });
});

// Get single job
app.get("/api/jobs/:id", (req, res) => {
    const jobSql = `
        SELECT jobs.*, clients.company as client_company, clients.address as client_address
        FROM jobs 
        LEFT JOIN clients ON jobs.client_id = clients.id
        WHERE jobs.id = ?`;
    db.get(jobSql, [req.params.id], (err, job) => {
        if (err || !job) {
            return res.status(400).json({ error: err ? err.message : "Job not found" });
        }

        const itemsSql = "SELECT * FROM job_items WHERE job_id = ?";
        db.all(itemsSql, [req.params.id], (err, items) => {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "success", data: { ...job, items } });
        });
    });
});

// Create new job
app.post("/api/jobs", upload.any(), (req, res) => {
    const data = req.body;
    let items = [];
    try {
        items = JSON.parse(data.items || '[]');
    } catch (e) {
        console.error("Error parsing items JSON:", e);
    }

    // Handle Client (Find or Create)
    const clientName = data.client_name;
    const clientPhone = data.client_phone;
    const clientEmail = data.client_email;
    const clientCompany = data.client_company || '';
    const clientAddress = data.client_address || '';

    const findOrCreateClient = () => {
        return new Promise((resolve, reject) => {
            if (data.client_id) {
                return resolve(data.client_id);
            }

            db.get("SELECT id FROM clients WHERE phone = ? OR name = ?", [clientPhone, clientName], (err, row) => {
                if (row) {
                    // Update existing client info if needed
                    db.run("UPDATE clients SET email = ?, company = ?, address = ? WHERE id = ?", [clientEmail, clientCompany, clientAddress, row.id]);
                    resolve(row.id);
                } else {
                    db.run("INSERT INTO clients (name, phone, email, company, address) VALUES (?, ?, ?, ?, ?)", [clientName, clientPhone, clientEmail, clientCompany, clientAddress], function (err) {
                        if (err) reject(err); // Reject if there's an error creating client
                        else resolve(this.lastID);
                    });
                }
            });
        });
    };

    findOrCreateClient().then(clientId => {
        const jobSql = `INSERT INTO jobs (
            submitted_by, submitted_contact, 
            client_id, client_name, client_phone, client_email, client_company, client_address,
            special_instructions, expected_delivery_date, priority, delivery_mode,
            total_amount, advance_amount, gst_rate, courier_charge
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        const jobParams = [
            data.submitted_by,
            data.submitted_contact,
            clientId,
            clientName,
            clientPhone,
            clientEmail,
            clientCompany,
            clientAddress,
            data.special_instructions,
            data.expected_delivery_date,
            data.priority,
            data.delivery_mode,
            data.total_amount || 0,
            data.advance_amount || 0,
            data.gst_rate || 0,
            data.courier_charge || 0
        ];

        db.run(jobSql, jobParams, function (err) {
            if (err) return res.status(400).json({ error: err.message });

            const jobId = this.lastID;
            const jobIdDisplay = `PC-${String(jobId).padStart(4, "0")}`;
            db.run("UPDATE jobs SET job_id_display = ? WHERE id = ?", [jobIdDisplay, jobId]);

            const itemSql = `INSERT INTO job_items (
                    job_id, product_type, card_size, quantity, printing_type, printing_mode, finish, accessories, material, variable_data, additional_info, common_front, common_back, rate, advance_amount, binding, corner, paper_thickness, custom_fields
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

            if (items.length === 0) {
                return res.json({ message: "success", id: jobId, job_id_display: jobIdDisplay });
            }

            let completed = 0;
            let hasError = false;
            items.forEach((item, index) => {
                db.run(itemSql, [
                    jobId,
                    item.product_type,
                    item.card_size,
                    item.quantity,
                    item.printing_type,
                    item.printing_mode,
                    item.finish,
                    item.accessories,
                    item.material || '',
                    item.variable_data,
                    item.additional_info || '',
                    item.common_front ? 1 : 0,
                    item.common_back ? 1 : 0,
                    item.rate || 0,
                    item.advance_amount || 0,
                    item.binding || '',
                    item.corner || '',
                    item.paper_thickness || '',
                    item.custom_fields ? (typeof item.custom_fields === 'string' ? item.custom_fields : JSON.stringify(item.custom_fields)) : '{}'
                ], function (err) {
                    if (err && !hasError) {
                        hasError = true;
                        return res.status(400).json({ error: err.message });
                    }
                    completed++;
                    if (completed === items.length && !hasError) {
                        res.json({ message: "success", id: jobId, job_id_display: jobIdDisplay });
                    }
                });
            });
        });
    }).catch(err => {
        res.status(400).json({ error: err.message });
    });
});

// Update status
app.put("/api/jobs/:id/status", (req, res) => {
    const { status } = req.body;
    db.run("UPDATE jobs SET status = ? WHERE id = ?", [status, req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", changes: this.changes });
    });
});

// Update Job Details
app.put("/api/jobs/:id", upload.any(), (req, res) => {
    const data = req.body;
    let items = [];
    try {
        items = JSON.parse(data.items || '[]');
    } catch (e) {
        console.error("Error parsing items:", e);
    }
    const files = req.files || [];
    const jobId = req.params.id;

    // Handle Client (Find or Create)
    const clientName = data.client_name;
    const clientPhone = data.client_phone;
    const clientEmail = data.client_email;
    const clientCompany = data.client_company || '';
    const clientAddress = data.client_address || '';

    const findOrCreateClient = () => {
        return new Promise((resolve, reject) => {
            if (data.client_id) {
                return resolve(data.client_id);
            }
            db.get("SELECT id FROM clients WHERE phone = ? OR name = ?", [clientPhone, clientName], (err, row) => {
                if (row) {
                    db.run("UPDATE clients SET email = ?, company = ?, address = ? WHERE id = ?", [clientEmail, clientCompany, clientAddress, row.id]);
                    resolve(row.id);
                } else {
                    db.run("INSERT INTO clients (name, phone, email, company, address) VALUES (?, ?, ?, ?, ?)", [clientName, clientPhone, clientEmail, clientCompany, clientAddress], function (err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    });
                }
            });
        });
    };

    findOrCreateClient().then(clientId => {
        const jobSql = `UPDATE jobs SET 
            submitted_by = ?, submitted_contact = ?, 
            client_id = ?, client_name = ?, client_phone = ?, client_email = ?, client_company = ?, client_address = ?,
            special_instructions = ?, expected_delivery_date = ?, priority = ?, delivery_mode = ?,
            total_amount = ?, advance_amount = ?, gst_rate = ?, courier_charge = ?
            WHERE id = ?`;

        const jobParams = [
            data.submitted_by,
            data.submitted_contact,
            clientId,
            clientName,
            clientPhone,
            clientEmail,
            clientCompany,
            clientAddress,
            data.special_instructions,
            data.expected_delivery_date,
            data.priority,
            data.delivery_mode,
            data.total_amount || 0,
            data.advance_amount || 0,
            data.gst_rate || 0,
            data.courier_charge || 0,
            jobId
        ];

        db.run(jobSql, jobParams, function (err) {
            if (err) return res.status(400).json({ error: err.message });

            // Delete old items
            db.run("DELETE FROM job_items WHERE job_id = ?", [jobId], (err) => {
                if (err) return res.status(400).json({ error: err.message });

                // Insert new items
                const itemSql = `INSERT INTO job_items (
                    job_id, product_type, card_size, quantity, printing_type, printing_mode, finish, accessories, material, variable_data, additional_info, common_front, common_back, rate, advance_amount, binding, corner, paper_thickness, custom_fields
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

                if (items.length === 0) {
                    return res.json({ message: "success" });
                }

                let completed = 0;
                let hasError = false;

                items.forEach((item, index) => {

                    db.run(itemSql, [
                        jobId,
                        item.product_type,
                        item.card_size,
                        item.quantity,
                        item.printing_type,
                        item.printing_mode,
                        item.finish,
                        item.accessories,
                        item.material || '',
                        item.variable_data,
                        item.additional_info || '',
                        item.common_front ? 1 : 0,
                        item.common_back ? 1 : 0,
                        item.rate || 0,
                        item.advance_amount || 0,
                        item.binding || '',
                        item.corner || '',
                        item.paper_thickness || '',
                        item.custom_fields ? (typeof item.custom_fields === 'string' ? item.custom_fields : JSON.stringify(item.custom_fields)) : '{}'
                    ], function (err) {
                        if (err && !hasError) {
                            hasError = true;
                            return res.status(400).json({ error: err.message });
                        }
                        completed++;
                        if (completed === items.length && !hasError) {
                            res.json({ message: "success" });
                        }
                    });
                });
            });
        });
    }).catch(err => {
        res.status(400).json({ error: err.message });
    });
});

// Delete Job
app.delete("/api/jobs/:id", (req, res) => {
    const sql = "DELETE FROM jobs WHERE id = ?";
    db.run(sql, req.params.id, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "success", changes: this.changes });
    });
});

// --- Admin API (Products & Settings) ---

// Products
app.get("/api/products", (req, res) => {
    db.all("SELECT * FROM products ORDER BY name", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

app.post("/api/products", (req, res) => {
    db.run("INSERT INTO products (name) VALUES (?)", [req.body.name], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", data: { id: this.lastID, name: req.body.name } });
    });
});

app.delete("/api/products/:id", (req, res) => {
    db.run("DELETE FROM products WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", changes: this.changes });
    });
});

app.put("/api/products/:id", (req, res) => {
    db.run("UPDATE products SET name = ? WHERE id = ?", [req.body.name, req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", changes: this.changes });
    });
});

// Settings (Customizations)
app.get("/api/settings", (req, res) => {
    db.all("SELECT * FROM settings ORDER BY category, value", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

app.post("/api/settings", (req, res) => {
    const { category, value, product_id } = req.body;
    db.run("INSERT INTO settings (category, value, product_id) VALUES (?,?,?)", [category, value, product_id || null], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", data: { id: this.lastID, category, value, product_id } });
    });
});

app.delete("/api/settings/:id", (req, res) => {
    db.run("DELETE FROM settings WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", changes: this.changes });
    });
});

app.put("/api/settings/:id", (req, res) => {
    const { category, value, product_id } = req.body;
    db.run("UPDATE settings SET category = ?, value = ?, product_id = ? WHERE id = ?",
        [category, value, product_id || null, req.params.id], function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "success", changes: this.changes });
        });
});

// --- Staff API ---
app.get("/api/staff", (req, res) => {
    db.all("SELECT * FROM staff ORDER BY name ASC", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

app.post("/api/staff", (req, res) => {
    const { name, phone, email, department } = req.body;
    db.run("INSERT INTO staff (name, phone, email, department) VALUES (?,?,?,?)", [name, phone, email, department], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", data: { id: this.lastID, ...req.body } });
    });
});

app.delete("/api/staff/:id", (req, res) => {
    db.run("DELETE FROM staff WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", changes: this.changes });
    });
});

app.put("/api/staff/:id", (req, res) => {
    const { name, phone, email, department } = req.body;
    db.run("UPDATE staff SET name = ?, phone = ?, email = ?, department = ? WHERE id = ?",
        [name, phone, email, department, req.params.id], function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ message: "success", changes: this.changes });
        });
});

// --- Admin Auth API ---
app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM admins WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) return res.status(400).json({ error: err.message });
        if (row) {
            res.json({ message: "success", data: { id: row.id, username: row.username } });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    });
});

// --- Custom Categories API ---
app.get("/api/categories", (req, res) => {
    db.all("SELECT * FROM custom_categories ORDER BY display_name", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

app.post("/api/categories", (req, res) => {
    const { name, display_name } = req.body;
    db.run("INSERT INTO custom_categories (name, display_name) VALUES (?, ?)", [name, display_name], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", data: { id: this.lastID, name, display_name } });
    });
});

app.delete("/api/categories/:id", (req, res) => {
    db.run("DELETE FROM custom_categories WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", changes: this.changes });
    });
});

app.put("/api/categories/:id", (req, res) => {
    const { display_name } = req.body;
    db.run("UPDATE custom_categories SET display_name = ? WHERE id = ?", [display_name, req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: "success", changes: this.changes });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
