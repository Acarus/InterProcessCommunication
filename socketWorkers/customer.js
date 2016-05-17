const HOST = '127.0.0.1';
const PORT = 8848;

var api = {};
global.api = api;
api.net = require('net');

var token = '';

function register() {
    var socket = new api.net.Socket();
    socket.connect({
        port: PORT,
        host: HOST
    }, function() {
        socket.on('data', function(res) {
            var response = JSON.parse(res);
            if (response.status === 'ok') {
                token = response.uuid;
                console.log('Successfully registered. Token: %s. ', token);
            } else {
                console.error('Can not register.');
            }
            socket.end();
        })
    });

    var request = {
        type: 'register',
        clientType: 'customer'
    };
    socket.write(JSON.stringify(request));
}

register();