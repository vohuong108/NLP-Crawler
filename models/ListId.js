const mongoose = require('mongoose');

const listId = new mongoose.Schema({
    videoIds: Array,
    keywords: Array,
    totalOfVideo: Number,
    nextPage: String,
    state: { type: String, default: 'READY' },
    index: Number,
});

module.exports = mongoose.model('listIds', listId);;