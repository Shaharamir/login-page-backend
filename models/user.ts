import mongoose from 'mongoose';

export const User = mongoose.model('Users', { 
    firstname: String,
    lastname: String,
    username: String,
    dateOfBirth: String,
    email: String,
    password: String,
    isEmailConfirmed: Boolean,
 });