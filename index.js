'use strict';
var path = require('path');
var helmsman = require('helmsman');

function run() {
  helmsman({
    localDir: path.join(__dirname, 'bin'),
    prefix: 'flarectl',
    usePath: true
  }).parse();
}

module.exports = run;
