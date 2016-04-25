var fs = require('fs');
var path = require('path');
var Bluebird = require('bluebird');
var mkdirp = require('mkdirp');
var request = require('request');
var hasha = require('hasha');

var logger = require('./logger');

function fetchBinaries(dest) {
  var phantomDest = path.resolve(dest);
  var host = 'https://bitbucket.org/ariya/phantomjs/downloads/';

  var phantomBinaries = [{
    description: 'Windows',
    url: host + 'phantomjs-1.9.8-windows.zip',
    filename: 'phantomjs-1.9.8-windows.zip',
    checksum: 'c5eed3aeb356ee597a457ab5b1bea870',
  }, {
    description: 'Max OS X',
    url: host + 'phantomjs-1.9.8-macosx.zip',
    filename: 'phantomjs-1.9.8-macosx.zip',
    checksum: 'fb850d56c033dd6e1142953904f62614',
  }, {
    description: 'Linux x86_64',
    url: host + 'phantomjs-1.9.8-linux-x86_64.tar.bz2',
    filename: 'phantomjs-1.9.8-linux-x86_64.tar.bz2',
    checksum: '4ea7aa79e45fbc487a63ef4788a18ef7',
  }, {
    description: 'Linux x86',
    url: host + 'phantomjs-1.9.8-linux-i686.tar.bz2',
    filename: 'phantomjs-1.9.8-linux-i686.tar.bz2',
    checksum: '814a438ca515c6f7b1b2259d0d5bc804',
  }];

  // verify the download checksum
  function verifyChecksum(file, binary) {
    return hasha.fromFile(file, { algorithm: 'md5' })
    .then(function (checksum) {
      if (binary.checksum !== checksum) {
        logger('Download checksum', checksum);
        logger('Expected checksum', binary.checksum);
        throw new Error(binary.description + ' checksum failed');
      }
    });
  }

  return Bluebird.fromCallback(function (cb) {
    mkdirp(phantomDest, cb);
  })
  .then(function () {
    var requiredDownloads = Bluebird.map(phantomBinaries, function (binary) {
      var filepath = path.join(phantomDest, binary.filename);
      logger('Verifying binary', filepath);
      return verifyChecksum(filepath, binary).then(() => false, () => binary);
    }).then(function (downloads) {
      return downloads.filter(Boolean);
    });

    return Bluebird.mapSeries(requiredDownloads, function (binary, idx) {
      var filepath = path.join(phantomDest, binary.filename);

      // add delays after the first download
      var chain = (idx === 0) ? Bluebird.resolve() : Bluebird.delay(3000);
      return chain.then(function () {
        logger('Downloading', binary.url);
        return new Bluebird(function (resolve, reject) {
          var ws = fs.createWriteStream(filepath)
          .on('finish', function () {
            verifyChecksum(filepath, binary)
            .then(resolve, reject);
          });

          // download binary, stream to destination
          request(binary.url)
          .on('error', reject)
          .pipe(ws);
        });
      });
    });
  });
}

module.exports = fetchBinaries;