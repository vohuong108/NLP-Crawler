const mongoose = require('mongoose');

const listId = new mongoose.Schema({
    videoIds: Array,
    keywords: Array,
    totalOfVideo: Number,
    nextPage: String,
    regionCode: String,
    state: { type: String, default: 'READY' },
    size: Number,
    index: Number,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('listIds', listId);;