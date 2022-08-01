const mongoose = require('mongoose');

const topCommentSchema = new mongoose.Schema({
    index: {type: Number, index: true},
    statusCode: Number,
    videoId: {type: String, require: true},
    videoIndex: {type: Number, require: true},
    commentId: {type: String, unique: true, dropDups: true },
    topLevelComment: Object,
    canReply: Boolean,
    totalReplyCount: Number,
    isPublic: Boolean,
    query: Object,
    nextPage: String,
    serial: Number,
    size: Number,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = mongoose.model('topComments', topCommentSchema);