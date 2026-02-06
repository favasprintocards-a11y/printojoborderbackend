const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    category: { type: String, required: true },
    value: { type: String, required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
});

module.exports = mongoose.model('Setting', SettingSchema);
