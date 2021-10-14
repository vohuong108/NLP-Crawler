const mongoose = require('mongoose');

const listTopCommentSchema = new mongoose.Schema({
    parentId: String,
    commentId: {type: String, unique: true, dropDups: true },
    replies: { type: Array, default: [] },
    totalReplyCount: { type: Number, default: 0 },
    amountFetched: {type: Number, default: 0},
    nextPage: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = mongoose.model('listTopComments', listTopCommentSchema);