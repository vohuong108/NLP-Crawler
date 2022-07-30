const mongoose = require('mongoose');

const listTopCommentSchema = new mongoose.Schema({
    index: Number,
    commentId: String,
    commentIndex: Number,
    replySize: Number,

    commentId: {type: String, unique: true, dropDups: true },
    topLevelComment: Object,
    canReply: Boolean,
    totalReplyCount: Number,
    isPublic: Boolean,
    nextPage: String,
    serial: Number,
    size: Number,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = mongoose.model('listTopComments', listTopCommentSchema);