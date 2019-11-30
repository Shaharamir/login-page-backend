import express from 'express';
import cors from 'cors';
import userRouter from './routers/userRouter';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import socketIo from 'socket.io';
import { Server } from 'http';
import { AddressInfo } from 'net';

const app = express();

mongoose.connect('mongodb://admin:admin123@ds345028.mlab.com:45028/heroku_p7btz6j3', {useNewUrlParser: true});

app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/user', userRouter);

app.get('/', (req: any, res: any) => {
    res.send('Its working!');
});

const server: Server = app.listen(8080, () => {
    const serverAdress: AddressInfo | string = server.address();
    if(typeof serverAdress === 'object') {
        const host = serverAdress.address
        const port = serverAdress.port
        console.log(`App is working at http://${host}:${port}`)
    }
})

const io = socketIo.listen(server);

io.on('connection', socket => {
    console.log('User connected')
    socket.on('disconnect', () => {
      console.log('user disconnected')
    })
  })

module.exports = server;