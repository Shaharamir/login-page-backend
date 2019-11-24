import express from 'express';
const app = express();
import cors from 'cors';
import userRouter from './routers/userRouter';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

mongoose.connect('mongodb://admin:admin123@ds345028.mlab.com:45028/heroku_p7btz6j3', {useNewUrlParser: true});

app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/user', userRouter);

app.get('/', (req: any, res: any) => {
    res.send('Its working!');
});

const server = app.listen(8080, () => {
    //@ts-ignore
    const host = server.address().address
    //@ts-ignore
    const port = server.address().port
    console.log('App is working at http://%s:%s', host, port)
})

module.exports = server;