function getRegistrationQuery() {
    var query = {
        type: api.constants.query.REGISTER,
        clientType: api.constants.client.WORKER
    };
    return JSON.stringify(query);
}

function getConnection(handlers) {
    var socket = new api.net.Socket();
    socket.connect({
        port: api.constants.PORT,
        host: api.constants.HOST
    });
    addResponseHandlers(socket, handlers);
    return socket;
}

function addResponseHandlers(socket, handlers) {
    socket.on('data', function (req) {
        console.log('Received: %s', req);
        var request = JSON.parse(req);
        if (handlers.hasOwnProperty(request.type)) {
            var response = handlers[request.type](request);
            if (response) {
                console.log('Response from %s: %s', request.type, JSON.stringify(response));
                socket.write(JSON.stringify(response));
            }
        } else {
            console.warn('Received unsupported request of type: %s', request.type);
        }
    });
}

function register(handlers) {
    var socket = getConnection(handlers);
    socket.write(getRegistrationQuery());
}

function onRegistered(response) {
    if (response.status === api.constants.status.OK) {
        console.log('Can process tasks.');
        token = response.token;
    }
}

function processTask(request) {
    console.log('Start processing new task: %s', JSON.stringify(request));
    console.log('token: %s', token);
    var response = {
        type: api.constants.query.TASK_PROCESSED,
        status: api.constants.status.OK,
        task: request.task,
        token: token
    };
    response.task.data = response.task.data.map(function(item) {
        return item * 2
    });
    return response;
}

var api = {};
global.api = api;
api.net = require('net');
api.constants = require('./constants.js');

var token, handlers = {register: onRegistered, newTask: processTask};
register(handlers);