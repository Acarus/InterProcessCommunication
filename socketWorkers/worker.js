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

var client = api.net.connect({
    port: HOST,
    host: PORT
});

client.on('data', function(data) {
    var request = JSON.parse(data);
    var response = {
        uuid: request.uuid,
        data: processData(request.data)
    };
    client.write(JSON.stringify(response));
    client.end();
});
