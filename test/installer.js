const chai = require('chai')
const expect = chai.expect
const mock = require('mock-fs')
const Installer = require('../src/installer.js')
const npm = require('../src/utils/npm.js')
const fs = require('fs-extra')
const sinon = require('sinon')
const Package = require('../src/package.js')
const _ = require('lodash')
const fooDesc = require('./stub/foo.info.json').versions['1.0.0']
const foo = new Package(fooDesc)
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

describe('Installer', function () {
  var inst
  var barDesc = _.chain(fooDesc).clone().set('name', 'bar').value()
  var bar = new Package(_.chain(barDesc).clone().set('version', '2.0.0').value())
  var bazDesc = _.chain(fooDesc).clone().set('name', 'baz').value()
  var baz = new Package(bazDesc)

  beforeEach(function () {
    inst = new Installer('/root')
    sinon.stub(npm, 'downloadPackage').returns(Promise.resolve())
    mock({'/root': { 'amd_modules': {
      'bar': {'package.json': JSON.stringify(barDesc)},
      'baz': {'package.json': JSON.stringify(bazDesc)}
    }}})
  })
  afterEach(function () {
    npm.downloadPackage.restore()
    mock.restore()
  })
  describe('#installPackage()', function () {
    it('should install foo to /root/amd_modules/foo', function () {
      inst.installPackage(foo)
      expect(npm.downloadPackage).to.have.been.calledWith(
        'http://apm/foo/-/foo-1.0.0.tgz',
        '/root/amd_modules/foo'
      )
    })
  })
  describe('#saveMapping()', function () {
    it('should generate index.json', function () {
      var map = [{
        name: 'foo',
        version: '2.2.2',
        filepath: 'foo/a.js',
        fullpath: '/root/foo/a.js'
      }]
      var str = JSON.stringify(map, null, 2) + '\n'
      return inst.saveMapping(map)
        .then(() => fs.readFile('/root/amd_modules/index.json', {encoding: 'utf8'}))
        .then(index => expect(index).to.deep.equal(str))
    })
  })
  describe('#hasInstalled()', function () {
    it('should resolve as false if not installed', function () {
      return expect(inst.hasInstalled(foo)).to.eventually.equal(false)
    })
    it('should resolve as false if version not correct', function () {
      return expect(inst.hasInstalled(bar)).to.eventually.equal(false)
    })
    it('should resolve as true if installed correctly', function () {
      return expect(inst.hasInstalled(baz)).to.eventually.equal(true)
    })
  })
})
