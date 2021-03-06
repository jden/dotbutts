var request = require('request')
var tar = require('tar-stream').extract
var unzip = require('zlib').createUnzip
var package = require('./package.json')
var concat = require('concat-stream')
var memoize = require('memoizee')
var dot = require('dot-component')

function getTarball(repo) {
  var url = 'https://api.github.com/repos/' + repo + '/tarball/master'

  var first = true

  return request({
    url: url,
    headers: {
      'user-agent': package.name + '/'+package.version
    }
  })
  .pipe(unzip())
  .pipe(tar())

}

function _fetchDomains(cb) {
  var first = true
  var zone = {}

  getTarball('jden/registry.butts')
    .on('error', cb)
    .on('entry', function (header, data, next) {
      if (first) {
        first = false
        ref = header.name.match(/-([a-f0-9]{7})\//)[1]
      }
      var filePath = header.name.substr(header.name.indexOf('/'))
      if (header.type !== 'file' || !startsWith(filePath, '/domains/')) {
        return next()
      }
      var domain = filePath.substr('/domains/'.length)
      // console.log('domain:', domain)

      // add domain records to zone tree
      data.pipe(concat(function (buffer) {
        try {
          var json = parseZone(JSON.parse(buffer.toString()))
          dot.set(zone, domain.split('.').reverse().join('.'), json)
        } catch (e) {
          console.error('could not parse', domain, e)
          // console.log(buffer.toString())
        }
        next()
      }))

    })
    .on('finish', function () {
      console.log('syncd with .butts registry')
      cb(null, zone)
    })
}

var fetchDomains = memoize(_fetchDomains, {
    maxAge: 900e3,
    async: true,
    prefetch: true
  })

function parseZone(json) {
  // force all record keys to be lower case
  Object.keys(json)
    .filter(function (key) {
      return key[0] === '@'
    })
    .forEach(function (key) {
      var upper = key.toLowerCase()
      if (upper === key) { return }
      json[upper] = json[key]
      delete json[key]
    })
  return json
}

fetchDomains(function (err, domains) {
  if (err) {console.error(err)}
  // console.log(domains)
})

module.exports = fetchDomains

function startsWith(str, prefix) {
  return str.indexOf(prefix) === 0
}
require('assert')(startsWith('foo.butts','foo'))