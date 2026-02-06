const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const connectDB = require("./mongodb.js");
const Client = require("./models/Client");
const Job = require("./models/Job");
const Product = require("./models/Product");
const Setting = require("./models/Setting");
const Staff = require("./models/Staff");
const Admin = require("./models/Admin");
const Category = require("./models/Category");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

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

// Health check / root route
app.get("/", (req, res) => {
    res.json({
        message: "Printo Job Order API is running (MongoDB)",
        version: "2.0.0",
        endpoints: ["/api/clients", "/api/jobs", "/api/products", "/api/settings", "/api/staff"]
    });
});

// --- Clients API ---

// Get all clients
app.get("/api/clients", async (req, res) => {
    try {
        const clients = await Client.find().sort({ name: 1 });
        const mappedClients = clients.map(c => ({ ...c._doc, id: c._id }));
        res.json({ message: "success", data: mappedClients });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Create new client
app.post("/api/clients", async (req, res) => {
    try {
        const client = new Client(req.body);
        await client.save();
        res.json({ message: "success", data: { ...client._doc, id: client._id } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get single client
app.get("/api/clients/:id", async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ error: "Client not found" });
        res.json({ message: "success", data: client });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update client
app.put("/api/clients/:id", async (req, res) => {
    try {
        const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ message: "success", data: client });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete client
app.delete("/api/clients/:id", async (req, res) => {
    try {
        await Client.findByIdAndDelete(req.params.id);
        res.json({ message: "success" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- Jobs API ---

// Get all jobs (optionally filter by client_id)
app.get("/api/jobs", async (req, res) => {
    try {
        let query = {};
        if (req.query.client_id) {
            query.client_id = req.query.client_id;
        }

        const jobs = await Job.find(query).sort({ created_at: -1 });

        // Map to flat structure for frontend compatibility (if needed)
        const flatJobs = jobs.map(job => {
            const product_types = [...new Set(job.items.map(i => i.product_type))].join(', ');
            const total_qty = job.items.reduce((sum, i) => sum + (i.quantity || 0), 0);
            return {
                ...job._doc,
                id: job._id,
                product_type: product_types,
                quantity: total_qty
            };
        });

        res.json({ message: "success", data: flatJobs });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get single job
app.get("/api/jobs/:id", async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('client_id');
        if (!job) return res.status(404).json({ error: "Job not found" });
        res.json({ message: "success", data: { ...job._doc, id: job._id } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Create new job
app.post("/api/jobs", upload.any(), async (req, res) => {
    try {
        const data = req.body;
        let items = [];
        try {
            items = JSON.parse(data.items || '[]');
        } catch (e) {
            console.error("Error parsing items JSON:", e);
        }

        // Handle Client Logic
        let clientId = data.client_id;
        if (!clientId) {
            let client = await Client.findOne({ $or: [{ phone: data.client_phone }, { name: data.client_name }] });
            if (client) {
                // Update client
                client.email = data.client_email;
                client.company = data.client_company;
                client.address = data.client_address;
                await client.save();
                clientId = client._id;
            } else {
                client = new Client({
                    name: data.client_name,
                    phone: data.client_phone,
                    email: data.client_email,
                    company: data.client_company,
                    address: data.client_address
                });
                await client.save();
                clientId = client._id;
            }
        }

        const newJob = new Job({
            submitted_by: data.submitted_by,
            submitted_contact: data.submitted_contact,
            client_id: clientId,
            client_name: data.client_name,
            client_phone: data.client_phone,
            client_email: data.client_email,
            client_company: data.client_company,
            client_address: data.client_address,
            special_instructions: data.special_instructions,
            expected_delivery_date: data.expected_delivery_date,
            priority: data.priority,
            delivery_mode: data.delivery_mode,
            total_amount: data.total_amount || 0,
            advance_amount: data.advance_amount || 0,
            gst_rate: data.gst_rate || 0,
            courier_charge: data.courier_charge || 0,
            items: items.map(item => ({
                ...item,
                common_front: item.common_front === '1' || item.common_front === 1 || item.common_front === true,
                common_back: item.common_back === '1' || item.common_back === 1 || item.common_back === true,
                custom_fields: typeof item.custom_fields === 'string' ? JSON.parse(item.custom_fields) : item.custom_fields
            }))
        });

        await newJob.save();

        // Generate PC ID
        // Note: In MongoDB, we use the timestamp/random for now or a counter. 
        // For simplicity and matching legacy, we can use a counter or just the stringified ID
        const shortId = newJob._id.toString().slice(-4).toUpperCase();
        newJob.job_id_display = `PC-${shortId}`;
        await newJob.save();

        res.json({ message: "success", id: newJob._id, job_id_display: newJob.job_id_display });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update status
app.put("/api/jobs/:id/status", async (req, res) => {
    try {
        await Job.findByIdAndUpdate(req.params.id, { status: req.body.status });
        res.json({ message: "success" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update Job Details
app.put("/api/jobs/:id", upload.any(), async (req, res) => {
    try {
        const data = req.body;
        let items = [];
        try {
            items = JSON.parse(data.items || '[]');
        } catch (e) {
            console.error("Error parsing items:", e);
        }

        const updatedJob = await Job.findByIdAndUpdate(req.params.id, {
            ...data,
            items: items.map(item => ({
                ...item,
                common_front: item.common_front === '1' || item.common_front === 1 || item.common_front === true,
                common_back: item.common_back === '1' || item.common_back === 1 || item.common_back === true,
                custom_fields: typeof item.custom_fields === 'string' ? JSON.parse(item.custom_fields) : item.custom_fields
            }))
        }, { new: true });

        res.json({ message: "success", data: updatedJob });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete Job
app.delete("/api/jobs/:id", async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.id);
        res.json({ message: "success" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- Admin API ---

// Products
app.get("/api/products", async (req, res) => {
    try {
        const products = await Product.find().sort({ name: 1 });
        const mapped = products.map(p => ({ ...p._doc, id: p._id }));
        res.json({ message: "success", data: mapped });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post("/api/products", async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.json({ message: "success", data: { ...product._doc, id: product._id } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete("/api/products/:id", async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "success" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put("/api/products/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ message: "success", data: { ...product._doc, id: product._id } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Settings
app.get("/api/settings", async (req, res) => {
    try {
        const settings = await Setting.find().sort({ category: 1, value: 1 });
        const mapped = settings.map(s => ({ ...s._doc, id: s._id }));
        res.json({ message: "success", data: mapped });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post("/api/settings", async (req, res) => {
    try {
        const setting = new Setting(req.body);
        await setting.save();
        res.json({ message: "success", data: { ...setting._doc, id: setting._id } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete("/api/settings/:id", async (req, res) => {
    try {
        await Setting.findByIdAndDelete(req.params.id);
        res.json({ message: "success" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put("/api/settings/:id", async (req, res) => {
    try {
        const setting = await Setting.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ message: "success", data: { ...setting._doc, id: setting._id } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Staff
app.get("/api/staff", async (req, res) => {
    try {
        const staff = await Staff.find().sort({ name: 1 });
        const mapped = staff.map(s => ({ ...s._doc, id: s._id }));
        res.json({ message: "success", data: mapped });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post("/api/staff", async (req, res) => {
    try {
        const staff = new Staff(req.body);
        await staff.save();
        res.json({ message: "success", data: { ...staff._doc, id: staff._id } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete("/api/staff/:id", async (req, res) => {
    try {
        await Staff.findByIdAndDelete(req.params.id);
        res.json({ message: "success" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put("/api/staff/:id", async (req, res) => {
    try {
        const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ message: "success", data: { ...staff._doc, id: staff._id } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Categories
app.get("/api/categories", async (req, res) => {
    try {
        const categories = await Category.find().sort({ display_name: 1 });
        const mapped = categories.map(c => ({ ...c._doc, id: c._id }));
        res.json({ message: "success", data: mapped });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post("/api/categories", async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.json({ message: "success", data: { ...category._doc, id: category._id } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete("/api/categories/:id", async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: "success" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put("/api/categories/:id", async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ message: "success", data: { ...category._doc, id: category._id } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin Login
app.post("/api/admin/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username, password });
        if (admin) {
            res.json({ message: "success", data: { id: admin._id, username: admin.username } });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start server
const seedAdmin = async () => {
    try {
        const count = await Admin.countDocuments();
        if (count === 0) {
            const admin = new Admin({ username: 'admin', password: 'admin123' });
            await admin.save();
            console.log("Default admin created: admin / admin123");
        }
    } catch (err) {
        console.error("Error seeding admin:", err);
    }
};

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT} (MongoDB)`);
    await seedAdmin();
});
