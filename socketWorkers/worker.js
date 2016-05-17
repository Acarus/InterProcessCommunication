const HOST = '127.0.0.1';
const PORT = 8848;

var api = {};
global.api = api;
api.net = require('net');

function processData(data) {
    return data.map(function(item) {
        return 2 * item;
    });
}

var socket = new api.net.Socket();
socket.connect({
    port: PORT,
    host: HOST
}, function() {
    socket.on('data', function(data) {
        var request = JSON.parse(data);
        console.dir(request);
        var response = {
            uuid: request.uuid,
            data: processData(request.data)
        };
        socket.write(JSON.stringify(response));
        socket.end();
    });
});
