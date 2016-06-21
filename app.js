var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

server.listen(8080);

var logger  = io.log;

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// usernames which are currently connected to the chat
var usernames = {};
var usersockets = {};
// rooms which are currently available in chat
//var rooms = ['room1','room2','room3'];  //#Al Change em
var rooms = {};
var gameseq = {};
var gameCount = 0;
var gamePlayers = {}


io.sockets.on('connection', function (socket) {
	
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
                usersockets[username] = socket;
                
                // send client to room 1
                // store the room name in the socket session for this client
		//socket.room = 'room1';
		//socket.join('room1');
		// echo to client they've connected
		//socket.emit('updatechat', 'SERVER', 'you have connected to room1');
		// echo to room 1 that a person has connected to their room
		//socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
		//socket.emit('updaterooms', rooms, 'room1');
                
                socket.emit('updateusers', usernames, username);
                socket.broadcast.emit('updateusers', usernames);                
                logger.info("***" + "adduser" + "***");
	});
	
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
                    //logger.info("***" + "1st " + socket.room  + " ***");
                    io.sockets.in(socket.room).emit('updatechat', socket.username, data);
                
                
//                if( (gameseq[socket.room]) == '0' ) {
//                    gameseq[socket.room] = data; 
//                    logger.info("*** gameseq[socket.room]" + gameseq[socket.room] + "***");
//                
//                    //next player
//                    logger.info("***" + "B4" + "***");
//                    
//                    socketU = usersockets[gamePlayers[socket.username]];  
//                   socketU.emit('play', 2, data);   
//                    logger.info("***" + "2nd" + "***");
//                }
//                else {
                    //Check if correct seq or next play
                    logger.info("***" + '1-> ' + socket.room  + " ***");
                    logger.info("***" + "1-> " + data  + " ***");
                    logger.info("***" + '1-> ' + gameseq[socket.room]  + " ***");                    
                    var colPlayed = data.split(',');
                    var colGame = {};
                    
                    if(gameseq[socket.room] == '0') {
                        if(colPlayed.length < 3) {
                            gameseq[socket.room] = data;
                            logger.info("***" + "2-> " + "socket.room " + socket.room  + " ***");
                            colGame = gameseq[socket.room].split(',');      
                        }
                        else {
                            gameseq[socket.room] = '';
                            logger.info("***" + "3-> " + "socket.room " + socket.room  + " ***");
                            colGame = gameseq[socket.room].split(',');
                            
                        }                        
                    }
                    else {
                        if(gameseq[socket.room] == null ){
                            if(colPlayed.length < 3) {
                                gameseq[socket.room] = data;
                                logger.info("***" + "4-> "  + "socket.room " + socket.room  + " ***");
                                colGame = gameseq[socket.room].split(',');      
                             }
                             else {
                                gameseq[socket.room] = '';
                                logger.info("***" + "5-> "  + "socket.room " + socket.room  + " ***");
                                colGame = gameseq[socket.room].split(',');
                             }
                        }
                        else {
                            colGame = gameseq[socket.room].split(',');
                        }    
                    }
                        
                    
                    var loss = false;
                    
                    logger.info("***" + "7-> " + gameseq[socket.room]  + " ***");
                    logger.info("***" + "7-> colPlayed.length " + colPlayed.length + "***");
                    logger.info("***" + "7-> colGame.length " + colGame.length + "***");
                    logger.info("***" + "7-> gameseq[socket.room]" + gameseq[socket.room] + "***");
                        
                    if(colPlayed.length != colGame.length + 1 ){
                        //Incoorect sequences
                        //socket.username loses for socket.room
                        logger.info("***" + "9-> xxxx ***");
                        if(colPlayed.length > 2) {
                            loss = true;
                            logger.info("***" + "9-> Loss 1 ***");
                        }
                    }
                    else {        
                        logger.info("***" + "10-> Normal play ***");                        
                        for (var i = 0; i < colGame.length; i++) {
                            if(colGame[i] == colPlayed[i]){
                                //match
                            }
                            else {
                                //socket.username loses for socket.room
                                loss = true;
                                logger.info("***" + "11-> Loss 2 ***");
                                logger.info("***" + "11-> " + colGame[i] + '  ' + colPlayed[i] + " ***");
                            }
                        }                          
                    }
                    
                    if(loss) {
                            //broadcast game loss and expected color sequence      
                            //gameResult
                            logger.info("***" + "12-> Loss x ***");
                           
                            socket.broadcast.to(socket.room).emit('gameResult', gamePlayers[socket.username]);        
                        }
                    else {
                            //All fine 
                            gameseq[socket.room] = data;
                            logger.info("***" + "13-> gameseq[socket.room] " + gameseq[socket.room] + "***");
                            socketU = usersockets[gamePlayers[socket.username]];  
                            logger.info("***" + "13-> colGame.length + 1 " + (colGame.length + 1) + "***");
                            logger.info("***" + "13-> colPlayed[colPlayed.length-1] " + colPlayed[colPlayed.length-1] + "***");
                            
                            socketU.emit('play', colGame.length + 1, colPlayed[colPlayed.length-1]);                            
                    }                        

//                }
                
                logger.info("***" + "14-> " + "sendchat" + "***");

	});
	
	socket.on('switchRoom', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		socket.emit('updaterooms', rooms, newroom);
	});
	

	socket.on('accept', function (challenger) {
		//Setup game room
                gameCount++;
                rooms['Game' + gameCount] = 'Game' + gameCount;
                gameseq['Game' + gameCount] = null;
                gamePlayers[socket.username] = challenger;
                gamePlayers[challenger] = socket.username;
                
                socket.room = 'Game' + gameCount;                
		// add the client's username to the global list
		socket.join('Game' + gameCount);
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have Accepted challenge for ' + 'Game' + gameCount);
                socketU = usersockets[challenger];                
                socketU.join('Game' + gameCount);
		socketU.emit('updatechat', 'SERVER', 'your Challenge has been Accepted to ' + 'Game' + gameCount);
                
		// echo to game that a person has connected to their GAME
      
                socket.broadcast.to('Game' + gameCount).emit('updatechat', 'SERVER ', challenger + ' vs ' + socket.username + 'Game' + gameCount);
		
                socket.emit('updaterooms', rooms, 'Game' + gameCount);
		socketU.emit('updaterooms', rooms, 'Game' + gameCount);
		
                socketU.emit('gameStart', socket.username, challenger, 'Game' + gameCount);
                socket.emit('gameStart', socket.username, challenger, 'Game' + gameCount);
                
                //socketU is challenger;
                
                socketU.emit('play', 1, '');
                
                logger.info("***" + "accept" + "***");
                
	});


	socket.on('reject', function (challenger) {
		socket.emit('updatechat', 'SERVER', 'you have REJECTED challenge by ' + challenger);                
		socketU = usersockets[user];                

                socketU.emit('rejectChallenge', socket.username, challenger);
                socket.emit('rejectChallenge', challenger, socket.username);

                socketU.emit('updatechat', 'SERVER', socket.username + ' have REJECTED challenge ');
                socket.emit('updatechat', 'SERVER', socket.username + ' have REJECTED challenge ');
                
                logger.info("***" + "reject" + "***");
                
	});
        
        
	socket.on('challengeUser', function(user, points){
		//socket.leave(socket.room);
		//socket.join(newroom);
		//socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		
                // sent message to OLD room
		//socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
                // 
                // update socket session room title
		//socket.room = newroom;
		//socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		
                
                
                
                socket.emit('updatechat', 'SERVER', 'you ' + socket.username + ' have challenged '+ user + ' for ' + points + ' points');
		socketU = usersockets[user];                
                socketU.emit('challenge', user, socket.username, points);
                
                logger.info("***" + "challengeUser" + "***");
	});


        
                                
	socket.on('gameResult', function(user, challenger, gameWinner, score){
 
                //rooms[game]
                                
		socketU = usersockets[challenger];                
                socketU.emit('gameResult', gameWinner);
                socket.emit('gameResult', gameWinner);

                //socket.broadcast.to('Game' + gameCount).emit('updatechat', 'SERVER ', challenger + ' vs ' + socket.username + 'Game' + gameCount);
                
                logger.info("***" + "gameResult" + "***");
	});

	socket.on('resetGame', function(datestr, user, game, challenger, gameWinner,  score){
		socket.leave(game);
                //socket.emit('gameEnd', socket.username);
                
                //socket.broadcast.to('Game' + gameCount).emit('updatechat', 'SERVER ', challenger + ' vs ' + socket.username + ' Game' + gameCount);

                delete gamePlayers[socket.username];
                
                logger.info("***" + "resetGame" + "***");
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
                
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		
            // echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
                delete usersockets[socket.username];
                
                logger.info("***" + "disconnect" + "***");
                
	});
});
