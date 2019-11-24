import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken';
import { secretkey } from '../secretkey';
import { UNAUTHORIZED } from 'http-status';

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const { userToken } = req.cookies;
    try {
        const user = jwt.verify(userToken, secretkey);
        res.locals.user = user;
        next();
    } catch(err) {
        console.error('Captured:', err);
        res.status(UNAUTHORIZED).send('Token not valid');
    }
}