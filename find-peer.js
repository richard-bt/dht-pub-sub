var DHT = require('bittorrent-dht')
var cli = require('commander')
var crypto = require('crypto')
var _ = require('lodash')
var Backbone = require('backbone')
var net = require('net')
var canihazip = require('canihazip')
var deasync = require('deasync')
var readline = require('readline')
var ed = require('ed25519-supercop')


// THIS IS SUPER GROSS, I'M SORRY
var done = false;
var externalIP = canihazip().then(function(ip){done=true;externalIP=ip});
deasync.loopWhile(function(){return !done});
console.log("ExternalIP:", externalIP);

var Peer = Backbone.Model.extend({
  idAttribute: 'customID',
  defaults: {
    host: null,
    port: null
  },
  initialize: function() {
    this.set({customID: this.get('host') + ':' + this.get('port')});
  }
});

var PeersCollection = Backbone.Collection.extend({
  model: Peer
});

var Peers = new PeersCollection();

var dht = new DHT({ verify: ed.verify })

dht.listen(20000, function () {
  console.log('now listening')
})

cli
  .version('0.0.1')
  .option('--seed [seed]')
  .option('--secret [secret]')

cli.parse(process.argv);

var keypair = ed.createKeyPair(ed.createSeed(cli.seed))

if (cli.secret) {
  var sha1Secret = cli.secret;
  setInterval(function() {
    dht.get(sha1Secret, function(err, res) {
      console.log('getErr:', err); 
      if (res && res.v) {
        console.log('getRes:', res.v.toString());
      }
    });
  }, 10000);
  //sha1Secret = crypto.createHash('sha1').update(secret).digest('hex');

  /*
  setInterval(function() {
    //dht.announce(sha1Secret, serverPort);
    dht.lookup(sha1Secret);
  }, 300); //announce and search every 5 minutes
  */
}

if (cli.seed) {
}

/*
dht.on('peer', function (newPeer, infoHash, from) {
  if (newPeer.host != externalIP && newPeer.port >= 31337 && newPeer.port <= 31437 && !Peers.get(newPeer.host + ':' + newPeer.port)) {
    console.log('Actual New Peer:', newPeer);
    console.log('From:', from.address, from.port);
    var newPeerModel = new Peer({host:newPeer.host, port:newPeer.port});
    Peers.add(newPeerModel);
    console.log('total peers', Peers.length);
  }
})
*/

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var opts = {
  seq: 0
};

rl.on('line', function(line){
  if (line[0] == '$') {
    eval(line.substring(1));
  } else {
    if (cli.seed) {
      // Announce DHT put update
      var value = new Buffer(line)
      opts = {
        k: keypair.publicKey,
        seq: 0 || (opts.seq + 1),
        v: value,
        sign: function (buf) {
          return ed.sign(buf, keypair.publicKey, keypair.secretKey)
        }
      }
      console.log("SEQUENCE", opts.seq);

      dht.put(opts, function (err, hash) {
        console.error('error=', err)
        console.log('hashDigest=', hash.toString('hex'))
      }) 
    }
  }
});
