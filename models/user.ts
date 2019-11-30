import mongoose, { Document } from 'mongoose';

const Schema = mongoose.Schema;

export interface IUser extends Document {
    firstname: string;
    lastname: string;
    username: string;
    dateOfBirth: string;
    email: string;
    password: string;
    isEmailConfirmed?: Boolean,
}

export const userSchema = new Schema({
    firstname: String,
    lastname: String,
    username: {type: String, unique: true},
    dateOfBirth: String,
    email: {type: String, unique: true},
    password: String,
    isEmailConfirmed: Boolean,
  });

export const User = mongoose.model<IUser>('Users', userSchema);