const mongoose = require('mongoose');

const SiteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true
    },
    content: {
        type: String, // Storing JSON string of canvasElements
        required: true
    },
    themes: {
        type: String, // Optional: Storing theme preferences
        default: '{}'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Site', SiteSchema);
