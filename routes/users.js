const express = require('express')
const UserModel = require('../models/user')
const PostModel = require('../models/post')
const user = express.Router()
const bcrypt = require('bcrypt')

// GET USERS
user.get('/users', async (req, res) => {
    try {
        const users = await UserModel.find()

        res.status(200).send({
            statusCode: 200,
            users
        })
    } catch (e) {
        res.status(500).send({
            statusCode: 500,
            message: "Internal server error"
        })
    }
})

// GET USER ID
user.get('/users/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    try {
        const user = await UserModel.findById(userId);
        console.log(user)
        if (!user) {
            return res.status(404).send({
                statusCode: 404,
                message: "User not found"
            });
        }

        res.status(200).send({
            statusCode: 200,
            payload: user
        });
    } catch (e) {
        res.status(500).send({
            statusCode: 500,
            message: "Internal server error"
        });
    }
});

// CREATE USER
user.post('/users/create', async (req, res) => {

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)

    const newUser = new UserModel({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hashedPassword,
    })

    try {
        const user = await newUser.save()
        res.status(200).send({
            statusCode: 200,
            message: 'utente salvato con successo',
            user
        })
    } catch (e) {
        res.status(500).send({
            statusCode: 500,
            message: "Internal server error"
        })
    }
})

// PATCH USER ID
user.patch('/users/:userId/update', async (req, res) => {
    const { userId } = req.params

    try {
        const userExist = await UserModel.findById(userId)
        
        if(userExist){
            const userNewData = req.body
            const options = {new: true}
            const result = await UserModel.findByIdAndUpdate(userId, userNewData, options )

            res.status(200).send({
                statusCode: 200,
                message: "User edited successfully",
                result
            })

        } else {
            return res.status(404).send({
                statusCode: 404,
                message: "This post does not exist!"
            })
        }
    } catch (error) {
        res.status(500).send({
            statusCode: 500,
            message: "Internal server error"
        });
    }

})


// DELETE USER ID - DA FARE


// GET POST USER ID
user.get('/users/:userId/posts', async (req,res)=>{
    const {userId} = req.params

    try {
        const user = await UserModel.findById(userId)
        if (!user) {
            res.status(404).send({
                statusCode: 404,
                message: "User not found"
            })
        }
        const posts = await PostModel.find({ author: user })

        res.status(200).send({
            statusCode: 200,
            message: "Post findend successfully",
            payload: posts
        })

    } catch (error) {
        res.status(500).send({
            statusCode: 500,
            message: "Internal server error"
        });
    }
})
module.exports = user
