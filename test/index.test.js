require('mochi')

var getRecord = require('../getRecord')
var records = {
  qux: {
    '@ns': ['foo'],
    '@cname': ['foo.bar.baz.']
  },
  baz: {
    bar: {
      foo: {
        '@a': ['1.2.3.4']
      }
    }
  }
}

describe('getRecord', function () {
  it('resolves a simple record', function (done) {  
    getRecord(records, 'foo.bar.baz','a', function (err, records) {
      records.should.deep.equal([{
        name: 'foo.bar.baz.',
        type: 'a',
        data:['1.2.3.4']
      }])
      done(err)
    })
  })

  it('resolves a top level record', function (done) {  
      getRecord(records, 'qux','ns', function (err, records) {
        records.should.deep.equal([{
          name: 'qux.',
          type: 'ns',
          data:['foo']
        }])
        done(err)
      })
    })

  it('resovles a local cname redirect', function (done) {
    getRecord(records, 'qux', 'a', function (err, records) {
      records.should.deep.equal([
        {
          name: 'qux.',
          type: 'cname',
          data: ['foo.bar.baz.']
        },
        {
          name: 'foo.bar.baz.',
          type: 'a',
          data:['1.2.3.4']
        }
      ])
      done(err)
    })
  })

  it('returns false if record not found', function (done) {
    getRecord(records, 'foo.bar', 'a', function (err, records) {
      records.should.deep.equal([false])
      done(err)
    })
  })

})

describe('getRecord.single', function () {

  it('gets an A record', function (done) {

    getRecord.single(records, 'foo.bar.baz','a', function (err, record) {
      record.should.deep.equal({
        name: 'foo.bar.baz.',
        type: 'a',
        data:['1.2.3.4']
      })
      done(err)
    })

  })

  it('gets an A record via CNAME', function (done) {

    getRecord.single(records, 'qux','a', function (err, record) {
      record.should.deep.equal({
        name: 'qux.',
        type: 'cname',
        data: ['foo.bar.baz.']
      })
      done(err)
    })

  })



})
