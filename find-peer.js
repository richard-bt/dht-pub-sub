var DHT = require('bittorrent-dht')
var cli = require('commander')
var crypto = require('crypto')
var _ = require('lodash')
var Backbone = require('backbone')
var net = require('net')
var canihazip = require('canihazip')

var externalIP = canihazip();

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
  var socket = net.createConnection(peer.get('host'), peer.get('port'));
  peer.set('socket', socket);
  socket.on('data', function(data) {
    console.log("GOT DATA", data);
  }).on('connect', function() {
    socket.write('HELLO PING');
  }).on('error', function() {
    console.log('UNABLE TO CONNECT TO PEER');
  }).on('end', function() {
    console.log('SOCKET DONE')
  });
});

var dht = new DHT()

dht.listen(20000, function () {
  console.log('now listening')
})

var server = net.createServer(function(socket) {
  socket.write('Hello 31337 h4xor');
  socket.pipe('socket');
});
server.listen(31337, '0.0.0.0');

cli
  .version('0.0.1')
  .option('-s, --secret [secret]')

cli.parse(process.argv);

if (cli.secret) {
  var secret = cli.secret;
  sha1Secret = crypto.createHash('sha1').update(secret).digest('hex');
  console.log('secret:', sha1Secret);
  dht.announce(sha1Secret, 31337);
  dht.lookup(sha1Secret);

  dht.on('peer', function (newPeer, infoHash, from) {
    //console.log(Peers.get(newPeer.host + ':' + newPeer.port));
    if (newPeer.host != externalIP && newPeer.port != 31337 && !Peers.get(newPeer.host + ':' + newPeer.port)) {
      console.log('New Peer:', newPeer);
      console.log('From:', from.address, from.port);
      var newPeerModel = new Peer({host:newPeer.host, port:newPeer.port});
      Peers.add(newPeerModel);
      console.log('total peers', Peers.length);
    }
  })
}


