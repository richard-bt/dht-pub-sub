var DHT = require('bittorrent-dht')

var hash = 'e3821b9539cacff680e418124272177c47477157'

var dht = new DHT()

dht.listen(20000, function () {
  console.log('now listening')
})

// find peers for the given torrent info hash
dht.lookup(hash)

dht.on('peer', function (peer, infoHash, from) {
  console.log('found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.host + ':' + from.port)
})
