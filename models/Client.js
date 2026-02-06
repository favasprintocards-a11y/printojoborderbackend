const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    company: String,
    email: String,
    phone: String,
    address: String,
    notes: String
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('Client', ClientSchema);
