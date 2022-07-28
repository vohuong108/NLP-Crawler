// const mongoose = require('mongoose');

// const detailVideoSchema = new mongoose.Schema({
//     parentId: String,
//     videoId: {type: String, unique: true, dropDups: true },
//     title: String,
//     description: String,
//     duration: Number,
//     publishedAt: String,
//     publisher: String,
//     statistics: Object,
//     url: String,
//     topicDetails: { type: Object, default: {} },
//     categoryId: Number,
//     other: Object,

// }, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

// module.exports = mongoose.model('detailvideos', detailVideoSchema);

const mongoose = require('mongoose');

const detailVideoSchema = new mongoose.Schema({
    parentId: String,
    videoId: {type: String, unique: true, dropDups: true },
    parentIndex: Number,
    content: Object,

}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

module.exports = mongoose.model('detailvideos', detailVideoSchema);