const NUMBER_OF_WORKERS = 5;
const LISTEN_PORT = 8848;
const partitionSize = 3;

global.api = {};
api.proccess = require('child_process');
api.os = require('os');
api.net = require('net');
api.uuid = require('uuid');

var tasks = {},
    clients = {},
    taskQueue = [];

function addTaskToQueue(id) {
    for (var i = 0; i < tasks[id].subTasks.length; i++) {
        taskQueue.push({
            task: id,
            subTask: i
        });
    }
}

function divideTask(data) {
    var subTasks = [],
        pos = 0;
    while (pos < data.length) {
        var subTask = {
            data: data.slice(pos, Math.min(pos + partitionSize, data.length - 1)),
            state: 'IN_QUEUE'
        };
        subTasks.push(subTask);
        pos += partitionSize;
    }
    return subTasks;
}

function createTask(task) {
    var taskObj = {
        type: task.type,
        subTasksCompleted: 0
    };
    taskObj.subTasks = divideTask(task.data);
    var uuid = api.uuid.v1();
    tasks[uuid] = taskObj;
    return uuid;
}

function isCustomer(clientId) {
    return clients[clientId] && clients[clientId].type === 'customer';
}

function runServer(port) {
    api.net.createServer(function(socket) {
        console.log('New client connected');
        socket.on('data', function(req) {
            var request = JSON.parse(req);
            if (request.type === 'register') {
                var clientId = api.uuid.v1();
                clients[clientId] = {type: request.clientType};
                var response = {status: 'ok', uuid: clientId};
                socket.write(JSON.stringify(response));
            } else if(request.type === 'submit') {
                if (isCustomer(request.uuid)) {
                    var taskId = createTask(request.task);
                    addTaskToQueue(taskId);
                } else {
                    // forbidden
                }
            } else {
                // bad request
            }
        });
    }).listen(port);
}

setInterval(function() {
    console.log('queue: %s', JSON.stringify(taskQueue));
    console.log('clients:');
    console.dir(clients);
}, 1000);

runServer(LISTEN_PORT);