var DHT = require('bittorrent-dht')
var cli = require('commander')
var crypto = require('crypto')
var _ = require('lodash')
var Backbone = require('backbone')
var net = require('net')
var canihazip = require('canihazip')
var deasync = require('deasync')
var readline = require('readline')

// THIS IS SUPER GROSS, I'M SORRY
var done = false;
var externalIP = canihazip().then(function(ip){done=true;externalIP=ip});
deasync.loopWhile(function(){return !done});
console.log("ExternalIP:", externalIP);

var Peer = Backbone.Model.extend({
  idAttribute: 'customID',
  defaults: {
    host: null,
    port: null,
    socket: null
  },
  initialize: function() {
    this.set({customID: this.get('host') + ':' + this.get('port')});
  }
});

var PeersCollection = Backbone.Collection.extend({
  model: Peer
});

var Peers = new PeersCollection();

Peers.on('add', function(peer) {
  var socket = net.createConnection(peer.get('port'), peer.get('host'));
  peer.set('socket', socket);
  socket.on('data', function(data) {
    console.log("GOT DATA", data.toString());
  }).on('connect', function() {
    socket.write('ping');
  }).on('error', function(error) {
    console.log('UNABLE TO CONNECT TO PEER', error);
  }).on('end', function() {
    console.log('SOCKET DONE')
  });
});

var dht = new DHT()

dht.listen(20000, function () {
  console.log('now listening')
})

cli
  .version('0.0.1')
  .option('-s, --secret [secret]')
  .option('-p, --port [port]')

cli.parse(process.argv);

var serverPort = cli.port || 31337;

var server = net.createServer(function(socket) {
  socket.write('Hello 31337 h4xor');

  socket.on('data', function(data) {
    var assumedString = data.toString();
    if (assumedString.toUpperCase() === 'PING') {
      socket.write('PONG');
    } else {
      console.log("IN:", assumedString);
      socket.write(assumedString.toUpperCase());
    }
  });
});
server.listen(serverPort, '0.0.0.0');

if (cli.secret) {
  var secret = cli.secret;
  sha1Secret = crypto.createHash('sha1').update(secret).digest('hex');
  console.log('secret:', sha1Secret);
  dht.announce(sha1Secret, 31337);
  dht.lookup(sha1Secret);

  dht.on('peer', function (newPeer, infoHash, from) {
    if (newPeer.host != externalIP && newPeer.port >= 31337 && newPeer.port <= 31437 && !Peers.get(newPeer.host + ':' + newPeer.port)) {
      console.log('Actual New Peer:', newPeer);
      console.log('From:', from.address, from.port);
      var newPeerModel = new Peer({host:newPeer.host, port:newPeer.port});
      Peers.add(newPeerModel);
      console.log('total peers', Peers.length);
    }
  })
}

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', function(line){
  Peers.each(function(peer) {
    var peerSocket = peer.get('socket');
    peerSocket.write(line);
  });
});
