import { Request, Response, NextFunction } from 'express'
import { User } from '../models/user';
import { secretkey } from '../secretkey';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OK, INTERNAL_SERVER_ERROR, NOT_FOUND, BAD_REQUEST } from 'http-status';

interface IUser {
    firstname: string;
    lastname: string;
    username: string;
    dateOfBirth: string;
    email: string;
    password: string;
}

interface IDataBaseUser {
    _id: string,
    firstname: string,
    lastname: string,
    username: string,
    dateOfBirth: string,
    email: string,
    password: string,
    __v: number
}

interface ILogin {
    usernameOrEmail: string;
    password: string;
}


export async function getUser(req: Request, res: Response, next: NextFunction) {
    const userToken = res.locals.user;
    const result: IDataBaseUser = await User.findOne({ _id : userToken.uid }).exec();
    if (result) {
        result.password = undefined;
        result.__v = undefined;
        res.send(result);
    }
    else res.status(NOT_FOUND).end();
}

export async function signUpUser(req: Request, res: Response, next: NextFunction) {
    const user: IUser = req.body
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(user.password, salt);
    user.password = hashPassword;
    const userToInsert = new User(user)
    await userToInsert.save();
    res.send("User signed up succesfully")
}

export async function loginUser(req: Request, res: Response, next: NextFunction) {
    const loginDetails: ILogin = req.body;
    const user = await User.findOne({
        $or: [
            { email: loginDetails.usernameOrEmail },
            { username: loginDetails.usernameOrEmail }
        ]
    }).exec();

    if (!user) return res.status(NOT_FOUND).send('user not found');

    const passwordIsValid = await bcrypt.compare(loginDetails.password, user.password);
    if (!passwordIsValid) return res.status(BAD_REQUEST).send('wrong password');

    try {
        const token = jwt.sign({ uid: user._id }, secretkey, { algorithm: 'HS512', expiresIn: '7d' });
        res.cookie('userToken', token);
        res.send('user logged in succesfuly')
    } catch (e) {
        console.error('Captured:', e);
        res.status(INTERNAL_SERVER_ERROR).send('Please try again later, There was an error creating a token');
    }
}

export async function checkIfUsernameExist(req: Request, res: Response, next: NextFunction) {
    const result = await User.findOne({ username : req.params.username }).exec();
    if(result) {
        res.send('username already exist')
    }
    else res.status(NOT_FOUND).send({exist: false});
}

export async function checkIfEmailExist(req: Request, res: Response, next: NextFunction) {
    const result = await User.findOne({ email : req.params.email }).exec();
    if(result) {
        res.send('email already exist')
    }
    else res.status(NOT_FOUND).send({exist: false});
}