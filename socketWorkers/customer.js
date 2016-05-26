function getRegistrationQuery() {
    var query = {
        type: api.constants.query.REGISTER,
        clientType: api.constants.client.CUSTOMER
    };
    return JSON.stringify(query);
}

function getSubmitTaskQuery(token, taskType, data) {
    var query = {
        type: api.constants.query.SUBMIT,
        token: token,
        task: {
            type: taskType,
            data: data
        }
    };
    return JSON.stringify(query);
}

function registerHandler(response) {
    if (response.status === api.constants.status.OK) {
        var token = response.token;
        console.log('Successfully registered. Token: %s.', token);
        onRegistered(response.status, token);
    } else {
        console.error('Can not register.');
        onRegistered(response.status)
    }
}

function submitHandler(response) {
    if (response.status === api.constants.status.OK) {
        var taskId = response.taskId;
        console.log('Task added (id: %s).', taskId);
    }
}

function addResponseHandlers(socket, handlers) {
    socket.on('data', function(res) {
        var response = JSON.parse(res);
        console.log('Supported res/req types: %s', JSON.stringify(Object.keys(handlers)));
        if (handlers.hasOwnProperty(response.type)) {
            handlers[response.type](response);
        } else {
            console.error('Can not find handler for request type %s', response.type);
        }
    });
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

function onRegistered(status, token) {
    if (status === api.constants.status.OK) {
        console.log('Can submit tasks.');
        socket.write(getSubmitTaskQuery(token, 'simple', [1, 2, 3, 4, 5, 6, 7, 8, 9]));
    }
}

function register() {
    socket.write(getRegistrationQuery());
}

function handleResult(response) {
    console.log('Received result: ', JSON.stringify(response.data));
}

var api = {};
global.api = api;
api.net = require('net');
api.constants = require('./constants.js');

var socket = getConnection({
    register: registerHandler,
    submit: submitHandler,
    resultResponse: handleResult
});

register();