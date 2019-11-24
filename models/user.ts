import mongoose from 'mongoose';

export const User = mongoose.model('Users', { 
    firstname: String,
    lastname: String,
    username: String,
    dateOfBirth: Date,
    email: String,
    password: String
 });