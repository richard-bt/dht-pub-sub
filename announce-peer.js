var DHT = require('bittorrent-dht')

var hash = 'e3821b9539cacff680e418124272177c47477157'

var dht = new DHT()

dht.listen(20000, function () {
  console.log('now listening')
})

dht.announce(hash, 31337, function(result) {
  console.log('RESULT OF ANNOUNCE', result);
});
