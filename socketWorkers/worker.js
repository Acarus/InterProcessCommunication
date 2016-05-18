const HOST = '127.0.0.1';
const PORT = 8848;

var api = {};
global.api = api;
api.net = require('net');

function getRegistrationQuery() {
    var query = {
        type: 'register',
        clientType: 'worker'
    };
    return JSON.stringify(query);
}

function getConnection() {
    var socket = new api.net.Socket();
    socket.connect({
        port: PORT,
        host: HOST
    });
    return socket;
}

function register(callback) {
    var socket = getConnection();
    socket.on('data', function(res) {
        var response = JSON.parse(res);
        if (response.status === 'ok') {
            var token = response.token;
            console.log('Successfully registered. Token: %s.', token);
            callback(response.status, token);
        } else {
            console.error('Can not register.');
            callback(response.status)
        }
        socket.end();
    });
    socket.write(getRegistrationQuery());
}

function onRegistered(status, token) {
    if (status === 'ok') {
        console.log('Can process tasks.');
    }
}

register(onRegistered);