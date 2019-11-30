import { Request, Response, NextFunction } from 'express'
import { User, IUser } from '../models/user';
import { secretkey, secretEmailkey } from '../secretkeys';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { INTERNAL_SERVER_ERROR, NOT_FOUND, BAD_REQUEST, ACCEPTED, UNAUTHORIZED } from 'http-status';
import { sendMail } from '../mailSender/mailSender';
import { Document } from 'mongoose';

interface IDataBaseUser {
    _id: string,
    firstname: string,
    lastname: string,
    username: string,
    dateOfBirth: string,
    email: string,
    password: string,
    isEmailConfirmed: Boolean,
    __v: number
}

interface ILogin {
    usernameOrEmail: string;
    password: string;
}


export async function confirmEmail(req: Request, res: Response, next: NextFunction) {
    try {
        const emailToken: any = jwt.verify(req.params.token, secretEmailkey);
        await User.updateOne({ username: emailToken.username }, { $set: {isEmailConfirmed: true} }, (err) => {
            if (err) res.redirect('http://localhost:3000', UNAUTHORIZED);
            res.redirect('http://localhost:3000', ACCEPTED);
        });
    }
    catch (err) {
        res.redirect(UNAUTHORIZED, 'http://localhost:3000');
    }
}

export async function resendEmailConfirmation(req: Request, res: Response, next: NextFunction) {
    const user: IDataBaseUser = req.body;
    try {
        const emailToken = jwt.sign({ username: user.username}, secretEmailkey, { algorithm: 'HS512', expiresIn: '7d' });
        sendMail(user.email, emailToken)
        .then(async () => {
            res.send(`Mail send to ${user.email} succesfuly`)
        })
        .catch((err) => {
            console.log(err)
            res.status(INTERNAL_SERVER_ERROR).send('Error occurred with sending email. please try again later')
        })
    }
    catch(err) {
        console.log(err)
        res.status(INTERNAL_SERVER_ERROR).send('Error occurred with generating email token. please try again later')
    }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
    const userToken = res.locals.user;
    const result = await User.findOne({ _id : userToken.uid }).exec();
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
    user.isEmailConfirmed = false;
    const userToInsert = new User(user)
    try {
        const emailToken = jwt.sign({ username: user.username}, secretEmailkey, { algorithm: 'HS512', expiresIn: '7d' });
        sendMail(user.email, emailToken)
        .then(async () => {
            await userToInsert.save();
            res.send('User signed up succesfully')
        })
        .catch((err) => {
            console.log(err)
            res.status(INTERNAL_SERVER_ERROR).send('Error occurred with sending email. please try again later')
        })
    }
    catch(err) {
        console.log(err)
        res.status(INTERNAL_SERVER_ERROR).send('Error occurred with generating email token. please try again later')
    }
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