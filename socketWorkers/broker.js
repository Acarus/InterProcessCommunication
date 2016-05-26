function addTaskToQueue(id) {
    for (var i = 0; i < tasks[id].subTasks.length; i++) {
        taskQueue.push({
            task: id,
            subTask: i
        });
    }
}

function getNextTask() {
    if (taskQueue.length) {
        var task = taskQueue[0];
        task.data = tasks[task.task].subTasks[task.subTask].data;
        console.log('Next task: %s', JSON.stringify(task));
        taskQueue = taskQueue.slice(1);
        return task;
    }
}

function getFreeWorker() {
    for (var id in clients) {
        if (clients[id].type === api.constants.client.WORKER
            && clients[id].state === api.constants.state.FREE) {
            return id;
        }
    }
}

function finishTaskProcessing(taskId) {
    tasks[taskId].result = [];
    tasks[taskId].subTasks.forEach(function (subTask) {
        tasks[taskId].result = tasks[taskId].result.concat(subTask.result);
    });
    var customer = tasks[taskId].sender;
    var customerConnection = clients[customer].connection;
    customerConnection.write(JSON.stringify({
        type: api.constants.query.RESULT_RESPONSE,
        data: tasks[taskId].result
    }));
}

function divideTask(data) {
    var subTasks = [],
        pos = 0;
    while (pos < data.length) {
        var subTask = {
            data: data.slice(pos, Math.min(pos + api.constants.PARTITION_SIZE, data.length)),
            state: api.constants.state.IN_QUEUE
        };
        subTasks.push(subTask);
        pos += api.constants.PARTITION_SIZE;
    }
    console.log('divided into: %s', JSON.stringify(subTasks));
    return subTasks;
}

function createTask(task, sender) {
    var taskObj = {
        sender: sender,
        type: task.type,
        subTasksCompleted: 0
    };
    taskObj.subTasks = divideTask(task.data);
    var uuid = api.uuid.v1();
    tasks[uuid] = taskObj;
    return uuid;
}

function isCustomer(clientId) {
    return clients[clientId] && clients[clientId].type === api.constants.client.CUSTOMER;
}

function onRegistered(request, socket) {
    var clientToken = api.uuid.v1();
    clients[clientToken] = {type: request.clientType, connection: socket};
    if (request.clientType === api.constants.client.WORKER) {
        clients[clientToken].state = api.constants.state.FREE;
    }
    var response = {
        type: api.constants.query.REGISTER,
        status: api.constants.status.OK,
        token: clientToken
    };
    return response;
}

function onSubmit(request) {
    if (isCustomer(request.token)) {
        var taskId = createTask(request.task, request.token);
        addTaskToQueue(taskId);
        var response = {
            type: api.constants.query.SUBMIT,
            status: api.constants.status.OK,
            taskId: taskId
        };
        return response;
    } else {
        // forbidden
    }
}

function onTaskProcessed(request) {
    if (request.status === api.constants.status.OK) {
        var taskId = request.task.task,
            subTask = request.task.subTask,
            data = request.task.data,
            workerId = request.token;
        tasks[taskId].subTasks[subTask].result = data;
        tasks[taskId].subTasks[subTask].state = api.constants.state.PROCESSED;
        tasks[taskId].subTasksCompleted++;
        if (tasks[taskId].subTasks.length === tasks[taskId].subTasksCompleted) {
            // task finished
            finishTaskProcessing(taskId);
        }
        clients[workerId].state = api.constants.state.FREE;
        console.log('Processed subTask: %s', JSON.stringify(tasks[taskId].subTasks[subTask]));
    } else {
        console.warn('Worker is not able to process data');
    }
}

function runServer(port, handlers) {
    api.net.createServer(function (socket) {
        console.log('New client connected');
        socket.on('data', function (req) {
            console.log('received: %s', req);
            var request = JSON.parse(req);
            if (handlers.hasOwnProperty(request.type)) {
                var response = handlers[request.type](request, socket);
                if (response) {
                    socket.write(JSON.stringify(response))
                }
            } else {
                console.error('Can not find handler for request type %s', response.type);
            }
        });
    }).listen(port);
}

function sendTaskToWorker(workerId, task) {
    clients[workerId].connection.write(JSON.stringify({
        type: api.constants.query.NEW_TASK,
        task: task
    }));
    clients[workerId].state = api.constants.state.BUSY;
}

function processTasks() {
    console.log('Queue size: %d', taskQueue.length);
    while (taskQueue.length) {
        var worker = getFreeWorker();
        console.log('Free worker: %d', worker);
        if (worker) {
            var task = getNextTask();
            console.log('Free task: %s', JSON.stringify(task));
            sendTaskToWorker(worker, task);
        } else {
            console.log('Exit from message loop');
            break;
        }
    }
}

global.api = {};
api.proccess = require('child_process');
api.os = require('os');
api.net = require('net');
api.uuid = require('uuid');
api.constants = require('./constants.js');

var tasks = {},
    clients = {},
    taskQueue = [];

setInterval(function () {
    console.log('queue:');
    console.dir(taskQueue);
    console.log('client:');
    console.dir(clients);
}, 1000);

setInterval(processTasks, api.constants.TASK_PROCESS_FREQUENCY);
runServer(api.constants.PORT, {
    register: onRegistered,
    submit: onSubmit,
    taskProcessed: onTaskProcessed
});
