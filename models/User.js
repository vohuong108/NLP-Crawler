const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    parentId: String,
    videoId: {type: String, unique: true, dropDups: true },
    comments: { type: Array, default: [] },
    amountFetched: {type: Number, default: 0},
    nextPage: {type: String, default: ''}
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = mongoose.model('users', userSchema);