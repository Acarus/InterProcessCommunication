const NUMBER_OF_WORKERS = 5;
const LISTEN_PORT = 8848;

global.api = {};
api.proccess = require('child_process');
api.os = require('os');
api.net = require('net');
api.uuid = require('uuid');

var task = [2, 17, 3, 2, 5, 7, 15, 22, 1, 14, 15, 9, 0, 11],
    workerProcessedData = {},
    processingOrder = [],
    partsReturned = 0,
    partsProcessed = 0;

function nextPartOfData() {
    var partSize = task.length / NUMBER_OF_WORKERS;
    var nextPart = [];
    if (partsReturned === NUMBER_OF_WORKERS - 1) {
        nextPart = task.slice(partSize * partsReturned);
    } else {
        nextPart = task.slice(partSize * partsReturned, partSize * (partsReturned + 1));
    }
    partsReturned++;
    return nextPart;
}

function runServer(port) {
    api.net.createServer(function(socket) {
        console.log('New worker connected');
        var workerUUID = api.uuid.v1();
        var request = {
            uuid: workerUUID,
            data: nextPartOfData()
        };
        console.log('Request: %s', JSON.stringify(request));
        socket.write(JSON.stringify(request));
        processingOrder.push(workerUUID);
        console.log('Sent %d part of data to worker %s.', partsReturned, workerUUID);
        socket.on('data', function(response) {
            var processedData = JSON.parse(response);
            console.log('Received data %s from worker %s', JSON.stringify(processedData.data), processedData.uuid);
            workerProcessedData[processedData.uuid] = processedData.data;
            partsProcessed++;
            console.log('Task processed %d and task returned %d', partsProcessed, partsReturned);
            if (partsProcessed === NUMBER_OF_WORKERS) {
                console.log('Processing order: %s', JSON.stringify(processingOrder));
                console.log('Processed data: %s', JSON.stringify(workerProcessedData));
                var finalData = [];
                processingOrder.forEach(function(uuid) {
                    finalData = finalData.concat(workerProcessedData[uuid]);
                });
                console.log('Final data: %s', JSON.stringify(finalData));
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