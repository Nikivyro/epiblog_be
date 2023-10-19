const mongoose = require('mongoose')

const  UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        default: "https://cdn.iconscout.com/icon/free/png-512/free-avatar-370-456322.png"
    },
    birthDate: {
        type: String
    },
    password: {
        type: String,
        required: true,
        min: 8
    },
    role: {
        type: String,
        enum: ["author", "admin"],
        default: "author"
    }
}, { timestamps: true, strict: true });

module.exports = mongoose.model('userModel', UserSchema, 'users')