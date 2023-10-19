const express = require('express')
const register = express.Router()
const UserModel = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

register.post('/register', async (req, res) => {
    const existingUser = await UserModel.findOne({ email: req.body.email });
  
    if (existingUser) {
      return res.status(400).json({
        statusCode: 400,
        message: 'L\'email è già registrata. Prova con un\'altra email.'
      });
    }
    
    // Hash della password
    const salt = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
  
    const newUser = new UserModel({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPassword,
    });
  
    try {
      const savedUser = await newUser.save();
      res.status(201).json({
        statusCode: 201,
        message: 'Registrazione avvenuta con successo. Ora puoi effettuare il login.'
      });
    } catch (error) {
      res.status(500).json({
        statusCode: 500,
        message: 'Errore durante la registrazione.'
      });
    }
});

module.exports = register