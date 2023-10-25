const express = require('express')
const UserModel = require('../models/user')
const PostModel = require('../models/post')
const user = express.Router()
const bcrypt = require('bcrypt')


const multer = require('multer')
const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
require('dotenv').config()
const crypto = require('crypto')

// Congif Cloaudinary
cloudinary.config({ 
    cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`, 
    api_key: `${process.env.CLOUDINARY_API_KEY}`, 
    api_secret: `${process.env.CLOUDINARY_API_SECRET}`
});

const cloudStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'user-profile',
        format: async (req, file) => 'png',
        public_id: (req, file) => file.name
    }
})

//Config Multer
const internalStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // posizione in cui salvare i file
        cb(null, './public')
    },
    filename: (req, file, cb) => {
        // generiamo un suffisso unico per il nostro file
        const uniqueSuffix = `${Date.now()}-${crypto.randomUUID()}`
        // qui ci recuperiamo da tutto solo l'estensione dello stesso file
        const fileExtension = file.originalname.split('.').pop()
        // eseguiamo la cb con il titolo completo
        cb(null, `${file.fieldname}-${uniqueSuffix}.${fileExtension}`)
    }
})

const upload = multer({ storage: internalStorage })
const cloudUpload = multer({ storage: cloudStorage })


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


// POST AVATAR SU CLOUD
user.post('/user/avatarUpload', cloudUpload.single('avatar'), async (req, res) => {
    try {
        // Effettua l'upload dell'immagine su Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path);

        if (result && result.secure_url) {
            const imageURL = result.secure_url;
            res.status(200).json({ avatar: imageURL });
        } else {
            res.status(500).send({
                statusCode: 500,
                message: "Errore nell'upload dell'immagine su Cloudinary"
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            statusCode: 500,
            message: "Errore interno del server"
        });
    }
});


// CLOUD COVER SU PATCH POST
user.post('/user/:userId/editAvatar', upload.single('avatar'), async (req, res) => {
    try {
      const userId = req.params;
      const file = req.file;
  
      const existingUser = await UserModel.findById(userId);

      if (!existingUser) {
          return res.status(404).json({
              statusCode: 404,
              message: "Utente non trovato."
          });
      }


        if (file) {
            console.log('Percorso del file:', file.path);
            const result = await cloudinary.uploader.upload(file.path);

            if (result && result.secure_url) {
                const avatarURL = result.secure_url;
                existingUser.avatar = avatarURL;
                const updatedUser = await existingUser.save();
                return res.status(200).json(updatedUser);
            } else {
                return res.status(500).json({
                    statusCode: 500,
                    message: "Errore nell'upload dell'immagine su Cloudinary"
                });
            }
        } else {
            return res.status(400).json({
                statusCode: 400,
                message: "Nessun file di avatar fornito."
            });
        }


    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Errore interno del server' });
    }
});

module.exports = user
