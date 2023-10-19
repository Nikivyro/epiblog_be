const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        require: true
    },
    cover: {
        type: String,

    },
    content:{
        type: String
    },
    readTime: {
        value: {
            type: Number
        },
        unit: {
            type: String,
            enum: ["minuti", "ore"]
        }
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userModel'
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'commentModel'
        }
    ]
}, { timestamps: true, strict: true })

module.exports = mongoose.model('postModel', PostSchema, 'posts')