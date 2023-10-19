const mongoose = require('mongoose')

const CommentSchema = new mongoose.Schema({
    comment: {
        type: String,
        required: true
    },
    rate:{
        type: Number,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userModel'
    },
    refPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'postModel'
    }
})

module.exports = mongoose.model('commentModel', CommentSchema, 'comments')