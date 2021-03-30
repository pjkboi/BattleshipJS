const express = require('express');
const path = require('path');
const http = require('http');
const PORT = process.env.PORT || 3000;
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

//Set static folder
app.use(express.static(path.join(__dirname, "public")));

//Start server 
server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));

//Handle a connection request from web client 

const connections = [null, null];

io.on('connection', socket => {
    // console.log('new web socket connection');

    //Finding player
    let playerIndex = -1;
    for(const i in connections){
        if(connections[i] === null){
            playerIndex = i;
            break;
        }
    }

    socket.emit('player-number', playerIndex);

    console.log(`Player ${playerIndex} has connected`);

    //Ignore extra player
    if(playerIndex === -1){
        return;
    }

    connections[playerIndex] = false;

    //what player has connected 
    socket.broadcast.emit('player-connection', playerIndex);

    //Handle Disconnect
    socket.on('disconnect', () =>{
        console.log(`Player ${playerIndex} disconnected`);
        connections[playerIndex] = null;
        //who disconnected?
        socket.broadcast.emit('player-connection', playerIndex);
    });

    //On ready 
    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', playerIndex);
        connections[playerIndex] = true;
    });

    //Check player connections
    socket.on('check-players', () => {
        const players = [];
        for(const i in connections){
            connections[i] === null ? players.push({connected: false, ready: false}) : players.push({connected: true, ready: connections[i]});
        }
        socket.emit('check-players', players);
    });

    //On fire receive
    socket.on('fire', id => {
        console.log(`Shot fired from ${playerIndex}`, id);
        //emit to other player
        socket.broadcast.emit('fire', id);
    });

    //On fire reply 
    socket.on('fire-reply', square => {
        console.log(square);

        //forward to other player
        socket.broadcast.emit('fire-reply', square);
    });

    //set timeout connection
    // setTimeout(() => {
    //     connections[playerIndex] = null;
    //     socket.emit('timeout');
    //     socket.disconnect();
    // }, 600000) // 10 min limit per player
});