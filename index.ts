import express from 'express';
import cors from 'cors';
import userRouter from './routers/userRouter';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import socketIo, { Socket } from 'socket.io';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { IDataBaseUser } from './controllers/userController';
import { json } from 'body-parser';

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

const sockets: Socket[] = [];

const io = socketIo.listen(server);

let currentTurn = undefined;
let currentBoard = undefined

interface IGame {
  square: {
    column: number;
    row: number;
    isChecker: boolean;
    checkerColor: 'white' | 'black' | undefined;
    squareColor: 'white' | 'black';
    shouldHighlight: boolean;
    isKing: boolean;
  }
}

const gameInit: IGame[][] = Array.from({ length: 8 }, (v, rowIndex) => Array.from({ length: 8 }, (v, columnIndex) => {
  const checkerColor = rowIndex <= 2 ? 'white' : (rowIndex >= 5 ? 'black' : undefined);
  const evenRow = columnIndex % 2 === 0;
  const rowsAllowed = rowIndex <= 2 && rowIndex >= 5;
  const isChecker = (checkerColor !== undefined) && (rowIndex % 2 === 0 ? evenRow : !evenRow);
  return {
      square: {
          row: rowIndex,
          column: columnIndex,
          isChecker: isChecker,
          checkerColor: isChecker ? checkerColor : undefined,
          squareColor: columnIndex % 2 === 0 ? rowIndex % 2 === 0 ? 'black' : 'white' : rowIndex % 2 === 0 ? 'white' : 'black',
          shouldHighlight: false,
          isKing: false,
      }
  }
}))

const moveChecker = (game: IGame[][], current: {row: number, col: number}, target: {row: number, col: number}) => {
  //if eated
  if(Math.abs(current.row - target.row) === 2) {
      const eatedRow = (current.row+target.row)/2
      const eatedCol = (current.col+target.col)/2
      game[eatedRow][eatedCol].square.isChecker = false;
      game[eatedRow][eatedCol].square.checkerColor = undefined;
  }
  const currentChecker = game[current.row][current.col].square;
  game[current.row][current.col].square.isChecker = false;
  game[target.row][target.col].square.isChecker = true;
  game[target.row][target.col].square.checkerColor = currentChecker.checkerColor;
  if(target.row === 7 && currentChecker.checkerColor === 'white') {
    game[target.row][target.col].square.isKing = true;
  }
  else if(target.row === 0 && currentChecker.checkerColor === 'black') {
    game[target.row][target.col].square.isKing = true;
  }
  game[current.row][current.col].square.checkerColor = undefined;
  return game;
}


const checkIfTwoPlayersConnected = () => {
  return Boolean(io.sockets.adapter.rooms['room'].length === 2);
}

let roomsGames = {};

const toggleTurn = (currentTurn: number) => {
  if (currentTurn === 0) {
    return 1;
  }
  return 0;
}

io.on('connection', (socket: Socket) => {
    const user: IDataBaseUser = socket.handshake.query.user;
    socket.join('room');
    if(checkIfTwoPlayersConnected()) {
      roomsGames = {
        'room': {
          'board': gameInit,
          'turn': 0
        }
      };
      io.to('room').emit('gameStart', Object.keys(io.sockets.adapter.rooms['room'].sockets)[0]);
    }
    console.log('User connected')
    socket.on('disconnect', () => {
      console.log('user disconnected')
    })
    socket.on('move', ({ current, target }) => {
      const currentPlayer = roomsGames['room'].turn;
      const shouldUseMove = Object.keys(io.sockets.adapter.rooms['room'].sockets)[currentPlayer] === socket.id;
      if (shouldUseMove) {
        console.log('-------OLD-------');
        printBoard(roomsGames['room'].board);
        if (currentPlayer === 0) {
          current.row = 7 - current.row;
          current.col = 7 - current.col;
          target.row = 7 - target.row;
          target.col = 7 - target.col;
          roomsGames['room'].board = moveChecker(roomsGames['room'].board, current, target);
          roomsGames['room'].turn = toggleTurn(roomsGames['room'].turn);
        } else {
          roomsGames['room'].board = moveChecker(roomsGames['room'].board, current, target);
          roomsGames['room'].turn = toggleTurn(roomsGames['room'].turn);
          current.row = 7 - current.row;
          current.col = 7 - current.col;
          target.row = 7 - target.row;
          target.col = 7 - target.col;
        }
        socket.to('room').emit('moveEnd', {current, target});
        console.log('-------NEW-------');
        printBoard(roomsGames['room'].board);
        // console.log(JSON.stringify(roomsGames['room'].board));
      }
    })
  })

  const printBoard = (board: IGame[][]) => {
    board.map((row, rowIndex) => row.map((col, colIndex) => {
      const color = board[rowIndex][colIndex].square.checkerColor
      process.stdout.write(color === 'black' ? ' 🍦 ' : color === 'white' ? ' 🍪 ' : ' 🍫 ');
      if(colIndex === 7) {
        console.log('');
      }
    }))
  }

module.exports = server;