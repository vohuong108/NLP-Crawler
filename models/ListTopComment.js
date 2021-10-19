const mongoose = require('mongoose');

const listTopCommentSchema = new mongoose.Schema({
    videoId: String,
    commentId: {type: String, unique: true, dropDups: true },
    content: String,
    author: String,
    likeCount: String,
    replies: { type: Array, default: [] },
    totalReplyCount: { type: Number, default: 0 },
    amountFetched: {type: Number, default: 0},
    nextPage: String,
    published: Date,
    updated: Date,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = mongoose.model('listTopComments', listTopCommentSchema);