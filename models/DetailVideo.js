const mongoose = require('mongoose');

const detailVideoSchema = new mongoose.Schema({
    parentId: String,
    videoId: String,
    title: String,
    description: String,
    duration: Number,
    publishedAt: Date,
    publisher: String,
    numOfView: Number,
    numOfLike: Number,
    numOfDislike: Number,
    url: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = mongoose.model('detailvideos', detailVideoSchema);