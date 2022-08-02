const mongoose = require('mongoose');

const listTopCommentSchema = new mongoose.Schema({
    index: {type: Number, index: true},
    statusCode: Number,
    commentId: {type: String, require: true},
    commentIndex: {type: Number, require: true},
    replyId: {type: String, unique: true, dropDups: true },
    
    query: Object,
    nextPage: String,
    serial: Number,
    size: Number,
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = mongoose.model('listTopComments', listTopCommentSchema);