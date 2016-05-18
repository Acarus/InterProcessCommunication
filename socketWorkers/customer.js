const HOST = '127.0.0.1';
const PORT = 8848;

function getRegistrationQuery() {
    var query = {
        type: 'register',
        clientType: 'customer'
    };
    return JSON.stringify(query);
}

function getSubmitTaskQuery(token, taskType, data) {
    var query = {
        type: 'submit',
        token: token,
        task: {
            type: taskType,
            data: data
        }
    };
    return JSON.stringify(query);
}

function registerHandler(response) {
    if (response.status === 'ok') {
        var token = response.token;
        console.log('Successfully registered. Token: %s.', token);
        onRegistered(response.status, token);
    } else {
        console.error('Can not register.');
        onRegistered(response.status)
    }
}

function submitHandler(response) {
    if (response.status === 'ok') {
        var taskId = response.taskId;
        console.log('Task added (id: %s).', taskId);
    }
}

function addResponseHandlers(socket, handlers) {
    socket.on('data', function(res) {
        var response = JSON.parse(res);
        if (handlers[response.type]) {
            handlers[response.type](response);
        } else {
            console.error('Can not find handler for request type %s', response.type);
        }
    });
}

function getConnection(handlers) {
    var socket = new api.net.Socket();
    socket.connect({
        port: PORT,
        host: HOST
    });
    addResponseHandlers(socket, handlers);
    return socket;
}

function onRegistered(status, token) {
    if (status === 'ok') {
        console.log('Can submit tasks.');
        socket.write(getSubmitTaskQuery(token, 'simple', [1, 2, 3, 4, 5, 6, 7, 8, 9]));
    }
}

function register() {
    socket.write(getRegistrationQuery());
}

var api = {};
global.api = api;
api.net = require('net');

var socket = getConnection({
    register: registerHandler,
    submit: submitHandler
});

register();