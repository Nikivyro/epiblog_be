const express = require('express')
const PostModel = require('../models/post')
const commentModel = require('../models/comment')
const posts = express.Router()

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
        folder: 'public-cloud',
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


// POST COVER CON CLOUD
posts.post('/posts/cloudUpload', cloudUpload.single('cover'), async (req, res) => {
    try {
        // Effettua l'upload dell'immagine su Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path);

        if (result && result.secure_url) {
            const imageURL = result.secure_url;
            res.status(200).json({ cover: imageURL });
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

// POST COVER CON MULTER
posts.post('/posts/upload', upload.single('cover')  , async (req, res) => {
    const url = `${req.protocol}://${req.get('host')}` // http://localhost:5050

    console.log(req.file)

    try {
        const imgUrl = req.file.filename;
        res.status(200).json({ cover: `${url}/public/${imgUrl}` })
    } catch (e) {
        res.status(500).send({
            statusCode: 500,
            message: "Errore interno del server"
        })
    }

})

// GET ALL
posts.get('/posts', async (req, res)=> {
    const { page= 1, pageSize = 3 } = req.query
    try {
        const posts = await PostModel.find()
            .populate('author')
            .populate('comments')
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip((page -1) * pageSize)
        
        const totalPosts = await  PostModel.countDocuments()

        console.log('Query eseguita con successo');
        res.status(200)
            .send({
                statusCode: 200,
                currentPage: Number(page),
                totalPages: Math.ceil(totalPosts / pageSize),
                totalPosts,
                posts
            })
    } catch (error) {
        console.error('Errore nella rotta /posts:', error);
        res.status(500).send({
            statusCode: 500,
            message: "Errore interno del server"
        })
    }
})

// GET ONLY BY ID
posts.get('/posts/:postId', async (req, res)=> {
    const { postId } = req.params
    const postExist = await PostModel.findById(postId)

    if (!postExist) {
        return res.status(404).send({
            statusCode: 404,
            message: "This post does not exist!"
        })
    }
    try {
        const posts = await PostModel.findById(postId)

        res.status(200).send({
            statusCode: 200,
            message: "Post finded successfully",
            posts
        })

    } catch (error) {
        console.error('Errore nella rotta /posts:', error);
        res.status(500).send({
            statusCode: 500,
            message: "Errore interno del server"
        })
    }
})

// POST
posts.post('/posts/create', async (req, res) => {

    const newPost = new PostModel({
        title: req.body.title,
        category: req.body.category,
        cover: req.body.cover,
        content: req.body.content,
        readTime: {
            value: req.body.readTime.value,
            unit: req.body.readTime.unit,
        },
        author: req.body.author 
    })

    try {
        const post = await newPost.save()

        res.status(201).send({
            statusCode: 201,
            message: "Post saved successfully",
            payload: post
        })
    } catch (e) {
        res.status(500).send({
            statusCode: 500,
            message: "Errore interno del server"
        })
    }
})

// PATCH
posts.patch('/posts/update/:postId', cloudUpload.single('cover'), async (req, res) => {
    try {
        const postId = req.params.postId;
        const existingPost = await PostModel.findById(postId);

        if (!existingPost) {
            return res.status(404).json({
                statusCode: 404,
                message: "Post non trovato."
            });
        }

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            if (result && result.secure_url) {
                const imageURL = result.secure_url;
                existingPost.cover = imageURL;
            } else {
                return res.status(500).json({
                    statusCode: 500,
                    message: "Errore nell'upload dell'immagine su Cloudinary"
                });
            }
        }

        const dataToUpdate = req.body;
        const options = { new: true };
        const updatedPost = await PostModel.findByIdAndUpdate(postId, dataToUpdate, options);

        res.status(200).json(updatedPost);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            statusCode: 500,
            message: "Errore interno del server"
        });
    }
});

// CLOUD COVER PATCH
posts.post('/posts/:postId/uploadCover', cloudUpload.single('cover'), async (req, res) => {
    try {
        const postId = req.params.postId;
        const existingPost = await PostModel.findById(postId);

        if (!existingPost) {
            return res.status(404).json({
                statusCode: 404,
                message: "Post non trovato."
            });
        }

        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            if (result && result.secure_url) {
                const imageURL = result.secure_url;
                existingPost.cover = imageURL;
                const updatedPost = await existingPost.save();
                return res.status(200).json(updatedPost);
            } else {
                return res.status(500).json({
                    statusCode: 500,
                    message: "Errore nell'upload dell'immagine su Cloudinary"
                });
            }
        } else {
            return res.status(400).json({
                statusCode: 400,
                message: "Nessun file di copertina fornito."
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            statusCode: 500,
            message: "Errore interno del server"
        });
    }
});

// DELETE
posts.delete('/posts/delete/:postId', async (req, res) => {
    const { postId } = req.params
       
    try {
        const post = await PostModel.findByIdAndDelete(postId)
        if (!post) {
            return res.status(404).send({
                statusCode: 404,
                message: "Post not found or already deleted!"
            })
        }

        res.status(200).send({
            statusCode: 200,
            message: "Post deleted successfully",
        })

    } catch (error) {
        res.status(500).send({
            statusCode: 500,
            message: "Errore interno del server"
        })
    }
})


// COMMENTS
posts.get('/posts/:postId/comments', async (req, res) =>{
    const { postId } = req.params
    const postExist = await PostModel.findById(postId)

    if(!postExist) {
        return res.status(404).send({
            statusCode: 404,
            message: "This post does not exist!"
        })
    }

    try {
        const result = await commentModel.find({ refPost: postId }).populate('author');
        res.status(200).send({
            statusCode: 200,
            message:"Comments loaded successfully",
            result
        })
    } catch (error) {
        res.status(500).send({
            statusCode: 500,
            message: "Errore interno del server"
        })
    }
})

// GET SPECIFIC COMMENT
posts.get('/posts/:postId/comments/:commentId', async (req, res) =>{
    const { postId, commentId } = req.params
    const postExist = await PostModel.findById(postId)

    if(!postExist) {
        return res.status(404).send({
            statusCode: 404,
            message: "This post does not exist!"
        })
    }

    try {

        const commentExist= await commentModel.findById(commentId)
        if(!commentExist) {
            return res.status(404).send({
                statusCode: 404,
                message: "This comment does not exist!"
            })
        }

        res.status(200).send({
            statusCode: 200,
            message:"Comments loaded successfully",
            commentExist
        })
    } catch (error) {
        res.status(500).send({
            statusCode: 500,
            message: "Errore interno del server"
        })
    }
})

// POST A COMMENT
posts.post('/posts/:postId/comments/create', async (req, res) => {
    const { postId } = req.params;
    const postExist = await PostModel.findById(postId);

    if (!postExist) {
        return res.status(404).send({
            statusCode: 404,
            message: "This post does not exist!"
        });
    }

    const newComment = new commentModel({
        comment: req.body.comment,
        rate: req.body.rate,
        author: req.body.author,
        refPost: postId
    });

    try {
        const comment = await newComment.save();

        postExist.comments.push(comment);
        await postExist.save();

        res.status(201).send({
            statusCode: 201,
            message: "Comment saved successfully",
            payload: comment
        });
    } catch (error) {
        res.status(500).send({
            statusCode: 500,
            message: "Errore interno del server"
        });
    }
});

// PATCH A COMMENT
posts.patch('/posts/:postId/comments/update/:commentId', async(req, res) => {
    const { postId, commentId } = req.params
    const postExist = PostModel.findById(postId)
    
    if (!postExist) {
        return res.status(404).send({
            statusCode: 404,
            message: "This post does not exist!"
        });
    }

    try {
        const commentToUpdate = req.body
        const options = {new: true}
        const result = await commentModel.findByIdAndUpdate(commentId, commentToUpdate, options)

        res.status(200).send({
            statusCode: 200,
            message: "Comment updated successfully",
            result
        })

    } catch (error) {
        res.status(500).send({
            statusCode: 500,
            message: "Errore interno del server"
        }); 
    }
})

// DELETE COMMENT
posts.delete('/posts/:postId/delete/:commentId', async (req, res) => {
    const { postId, commentId } = req.params;

    try {
        const postExist = await PostModel.findById(postId);
        if (!postExist) {
            return res.status(404).send({
                statusCode: 404,
                message: "This post does not exist!"
            });
        }
        const comment = await commentModel.findOneAndDelete({ _id: commentId, refPost: postId });

        if (!comment) {
            return res.status(404).send({
                statusCode: 404,
                message: "This comment does not exist for the given post."
            });
        }
        
        postExist.comments.pull(comment._id);
        await postExist.save();

        res.status(204).send({
            statusCode: 204,
            message: 'Comment deleted successfully'
        }); // Ritorna una risposta vuota per indicare la cancellazione riuscita.
    } catch (error) {
        res.status(500).send({
            statusCode: 500,
            message: "Errore interno del server"
        });
    }
});

module.exports = posts