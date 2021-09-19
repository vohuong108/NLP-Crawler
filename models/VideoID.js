const mongoose = require('mongoose');

const VideoIDSchema = new mongoose.Schema({
    videoIds: Array,
    keywords: Array,
    totalOfVideo: Number,
    nextPage: String,
    retry: {type: Array, default: []},
    state: { type: String, default: 'UNCHECKED' },
});

module.exports = mongoose.model('VideoIDs', VideoIDSchema);;