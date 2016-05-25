#!/usr/bin/env node
var dashdash = require('dashdash');
var CF = require('cloudflare');
exports.command = {
  description: 'Show current CloudFlare IP ranges'
};

var options = [
  {names: ['help', 'h'], type: 'bool', help: 'Print this help and exit'},
  {names: ['api-key'], type: 'string', help: 'CloudFlare API key', helpArg: 'KEY', env: 'FLARE_API_KEY'},
  {names: ['api-email'], type: 'string', help: 'CloudFlare API email', helpArg: 'EMAIL', env: 'FLARE_API_EMAIL'}
];

if (require.main === module) {
  var parser = dashdash.createParser({options: options});
  var opts;

  try {
    opts = parser.parse(process.argv);
  } catch (err) {
    console.error('help: error: %s', err.message);
    process.exit(1);
  }

  if (opts.help) {
    var help = parser.help({includeEnv: true}).trimRight();
    console.log('usage: flarectl ip [OPTIONS]\n' +
                'options:\n' +
                help);
    process.exit(0);
  }

  var cf = new CF({
    email: opts.api_email,
    key: opts.api_key
  });

  cf.readIPs().then(function (ips) {
    console.log('IPv4: %s', ips.IPv4CIDRs.join(', '));
    console.log('IPv6: %s', ips.IPv6CIDRs.join(', '));
  }).catch(function (err) {
    console.error('Error fetching IPs: %s', err.message);
    process.exit(-1);
  });
}
