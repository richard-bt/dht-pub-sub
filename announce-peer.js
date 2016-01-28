var DHT = require('bittorrent-dht')
var cli = require('commander')
var crypto = require('crypto')

var dht = new DHT();

dht.listen(20000, function () {
  console.log('now listening');
})

cli
  .version('0.0.1')
  .option('-s, --secret [secret]')

cli.parse(process.argv);

if (cli.secret) {
  var secret = cli.secret;
  sha1Secret = crypto.createHash('sha1').update(secret).digest('hex');
  console.log('secret:', sha1Secret);
  dht.announce(sha1Secret, 31337);
}
