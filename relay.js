// Websocket Relay for ffmpeg MPEG-ts streaming and websocket relay
// Multiple streams supported.
// No authentication.
//
// Author: sskaje
//


const http = require('http');
const WebSocket = require('ws');
const url = require('url');

const STREAM_PORT = process.argv[2] || 8081,
    WEBSOCKET_PORT = process.argv[3] || 8082,
    RECORD_STREAM = false;

const wsServer = new WebSocket.Server({port: WEBSOCKET_PORT, perMessageDeflate: false});

wsServer.clients_by_path = [];
wsServer.connectionCount = 0;
wsServer.totalConnectionCount = 0;

wsServer.on('connection', function(socket, upgradeReq) {
    wsServer.connectionCount++;
    wsServer.totalConnectionCount++;

    const path = url.parse((upgradeReq || socket.upgradeReq).url).pathname;

    socket.client_id = wsServer.totalConnectionCount;
    socket.request_channel = path;

    console.log(
        'New WebSocket Connection['+socket.client_id+']: ',
        path,
        (upgradeReq || socket.upgradeReq).socket.remoteAddress,
        (upgradeReq || socket.upgradeReq).headers['user-agent'],
        '('+wsServer.connectionCount+' total)'
    );

    if (typeof wsServer.clients_by_path[path] === 'undefined') {
        wsServer.clients_by_path[path] = [];
    }
    wsServer.clients_by_path[path][socket.client_id] = socket;

    socket.on('close', function(code, message){
        wsServer.connectionCount--;

        // remove client
        delete wsServer.clients_by_path[this.request_channel][this.client_id];

        console.log(
            'Disconnected WebSocket ('+wsServer.connectionCount+' total)'
        );
    });
});

wsServer.broadcast = function(path, data) {
    if (typeof wsServer.clients_by_path[path] === 'undefined' || wsServer.clients_by_path[path].length <= 0) {
        return;
    }

    wsServer.clients_by_path[path].forEach(function(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

// HTTP Server to accept incomming MPEG-TS Stream from ffmpeg
var streamServer = http.createServer( function(request, response) {

    response.connection.setTimeout(0);
    console.log(
        'Stream Connected: ' +
        request.socket.remoteAddress + ':' +
        request.socket.remotePort
    );

    request.on('data', function(data){
        wsServer.broadcast(request.url, data);
        if (request.socket.recording) {
            request.socket.recording.write(data);
        }
    });

    request.on('end',function(){
        console.log('close');
        if (request.socket.recording) {
            request.socket.recording.close();
        }
    });

    // Record the stream to a local file?
    if (RECORD_STREAM) {
        var path = 'recordings/' + Date.now() + '.ts';
        request.socket.recording = fs.createWriteStream(path);
    }
}).listen(STREAM_PORT);

