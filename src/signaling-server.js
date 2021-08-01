const config = require('../config.json');

const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });
const clientsInChannel = [];

const addClient = (channel, client) => {
    clientsInChannel.push({ channel, client });
}

const getClients = (channelToSend, me) =>
    clientsInChannel.filter(({ channel, client }) => channel === channelToSend && client != me && client.readyState === WebSocket.OPEN).map(({ client }) => client);


wss.on('connection', (ws, channel) => {
    console.debug('🤝 new connection')
    addClient(channel, ws);

    ws.on('message', (data) => {
        console.log(`sending ${JSON.stringify(data)} to channel:${channel}`);
        getClients(channel, ws).forEach((client) => client.send(data));
    });
});

server.on('upgrade', function upgrade(request, socket, head) {
    const url = request.url || 'signaling/all';
    const channel = url.match(/signaling\/(.+)/)[1];

    wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit('connection', ws, channel);
    });
});

console.info('listening on', config.signalingServer.port);
server.listen(config.signalingServer.port);
