const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: String,
    email: String,
    department: String,
    status: { type: String, default: 'Active' }
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('Staff', StaffSchema);
