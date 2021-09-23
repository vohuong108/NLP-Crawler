const mongoose = require('mongoose');

const listCommentSchema = new mongoose.Schema({
    parentId: String,
    videoId: String,
    comments: { type: Array, default: [] },
    amountFetched: {type: Number, default: 0},
    nextPage: String,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = mongoose.model('listComments', listCommentSchema);