'use strict';
// NodeJs로 실행한 웹 서버 및 signaling
var os = require('os');
var nodeStatic = require('node-static');

// var http = require('http');
var socketIO = require('socket.io');

const https = require('https');
const fs = require('fs');
const options = {
    key: fs.readFileSync('./private.pem'),
    cert: fs.readFileSync('./public.pem')
};

var fileServer = new(nodeStatic.Server)();
let app = https
    .createServer(options, (req, res) => {
        fileServer.serve(req, res);
    })
    .listen(3000);

console.log('Started chating server...');

var io = socketIO.listen(app);
io
    .sockets
    .on('connection', function (socket) {
        // sockets.on(): 소켓이벤트를 연결 convenience function to log server messages on the
        // client
        function log() {
            var array = ['Message from server:'];
            array
                .push
                .apply(array, arguments);
            socket.emit('log', array);
        }

        socket.on('message', function (message) {
            log('Client said: ', message);
            // for a real app, would be room-only (not broadcast)
            if (message === "bye" && socket.rooms['foo']) {
                io
                    .of('/')
                    . in ('foo')
                    .clients((error, socketIds) => {
                        if (error) 
                            throw error;
                        
                        socketIds.forEach(socketId => {
                            io
                                .sockets
                                .sockets[socketId]
                                .leave('foo');
                        });
                    });
            }

            socket
                .broadcast
                .emit('message', message);
        });

        socket.on('create or join', function (room) {
            log('Received request to create or join room ' + room);

            var clientsInRoom = io
                .sockets
                .adapter
                .rooms[room];
            var numClients = clientsInRoom
                ? Object
                    .keys(clientsInRoom.sockets)
                    .length
                : 0;
            log('Room ' + room + ' now has ' + numClients + ' client(s)');

            if (numClients === 0) { //들어와있는 사람이 0명
                socket.join(room); //join()이 방에 들어가는거
                log('Client ID ' + socket.id + ' created room ' + room);
                socket.emit('created', room, socket.id);
                console.log('created'); //채팅방 생성

            } else if (numClients === 1 && numClients ===2) {
                log('Client ID ' + socket.id + ' joined room ' + room);
                io
                    .sockets
                    . in (room)
                    .emit('join', room);
                socket.join(room);
                socket.emit('joined', room, socket.id);
                io
                    .sockets
                    . in (room)
                    .emit('ready');
                console.log('joined'); //두번째 사용자 입장
            } else { // max two clients
                socket.emit('full', room); //full 이벤트 발생시킴
            }
        });

        socket.on('ipaddr', function () {
            var ifaces = os.networkInterfaces();
            for (var dev in ifaces) {
                ifaces[dev].forEach(function (details) {
                    if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
                        socket.emit('ipaddr', details.address);
                    }
                });
            }
        });

        socket.on('bye', function () {
            console.log('received bye');
        });

    });
