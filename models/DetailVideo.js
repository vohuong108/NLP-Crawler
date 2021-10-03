const mongoose = require('mongoose');

const detailVideoSchema = new mongoose.Schema({
    parentId: String,
    videoId: {type: String, unique: true, dropDups: true },
    title: String,
    description: String,
    duration: Number,
    publishedAt: Date,
    publisher: String,
    numOfView: Number,
    numOfLike: Number,
    numOfDislike: Number,
    url: String,
    tags: { type: Array, default: [] },
    categoryId: Number,
    other: Array,
    keywords: { type: Array, default: [] },

}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = mongoose.model('detailvideos', detailVideoSchema);