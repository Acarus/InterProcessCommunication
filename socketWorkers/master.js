const NUMBER_OF_WORKERS = 1;
const LISTEN_PORT = 8848;

global.api = {};
api.proccess = require('child_process');
api.os = require('os');
api.net = require('net');
api.uuid = require('uuid');

var task = [2, 17, 3, 2, 5, 7, 15, 22, 1, 14, 15, 9, 0, 11];
var results = {};
var tasksProcessingOrder = [];
var tasksReturned = 0;
var tasksProcessed = 0;

function nextPartOfData() {
    var partSize = task.length / NUMBER_OF_WORKERS;
    if (tasksReturned === NUMBER_OF_WORKERS - 1) {
        return task.slice(tasksReturned * partSize);
    } else {
        return task.slice(tasksReturned * partSize, tasksReturned * partSize + partSize - 1);
    }
}

function runServer(port) {
    api.net.createServer(function(socket) {
        console.log('New worker connected');
        var workerUUID = uuid.v1();
        var request = {
            uuid: workerUUID,
            data: nextPartOfData()
        };
        socket.write(JSON.stringify(request));
        tasksProcessingOrder.push(workerUUID);
        console.log('Sent %d part of data to worker %s.', tasksReturned, workerUUID);
        socket.on('data', function(processedData) {
            results[processedData.uuid] = processedData.data;
            tasksProcessed++;
            if (tasksProcessed === tasksReturned) {
                var result = [];
                tasksProcessingOrder.forEach(function(i, uuid) {
                    result = result.concat(results[uuid]);
                });
                console.log('Processed data: ${result}');
                process.exit(0);
            }
        });
    }).listen(port);
}

function runWorker() {
    console.log('Run new worker');
    api.proccess.spawn('node', ['./worker.js']);
}

runServer(LISTEN_PORT);
for (var i = 0; i < NUMBER_OF_WORKERS; i++) {
    runWorker();
}