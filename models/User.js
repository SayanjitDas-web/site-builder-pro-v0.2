const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: ['admin', 'editor'],
        default: 'editor'
    },
    installedPlugins: [{
        type: String, // Storing Plugin IDs (strings) instead of ObjectIds for easier syncing with official list which uses string IDs
        default: []
    }]
});

module.exports = mongoose.model('User', UserSchema);
