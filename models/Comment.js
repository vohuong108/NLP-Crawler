const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    videoId: String,
    comments: Array,
    numofFetchedComments: {type: Number, default: 0},
    nextPage: String,
}, { timestamps: { createdAt: 'created_at'}});

module.exports = mongoose.model('Comments', CommentSchema);;