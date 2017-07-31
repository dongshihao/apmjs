const process = require('process')
const _ = require('lodash')
const Promise = require('bluebird')
const fs = require('fs-extra')
const Package = require('./package')
const npm = require('./npm.js')
const path = require('path')

function Installer (dirname) {
  dirname = dirname || process.cwd()
  this.pathname = path.resolve(dirname, 'amd_modules')
}

Installer.prototype.install = function (packages) {
  return Promise
    .map(packages, pkg => pkg.setDirname(this.pathname))
    .map(pkg => this.installPackageIfNeeded(pkg))
    .then(() => this.saveMeta(packages))
}

Installer.prototype.saveMeta = function (pkgs) {
  var fields = ['name', 'version', 'filepath', 'fullpath']
  var meta = pkgs.map(pkg => _.pick(pkg, fields))
  var file = path.resolve(this.pathname, 'index.json')
  return fs.writeJson(file, meta, {spaces: 2})
}

Installer.prototype.installPackageIfNeeded = function (pkg) {
  return this
    .hasInstalled(pkg)
    .then(exists => {
      if (exists) { return }
      return this.installPackage(pkg)
    })
}

Installer.prototype.installPackage = function (pkg) {
  var url = pkg.descriptor.dist.tarball
  var dir = path.resolve(this.pathname, pkg.name)
  return npm.downloadPackage(url, dir)
}

Installer.prototype.hasInstalled = function (pkg) {
  var pkgPath = path.resolve(this.pathname, pkg.name)
  return Package.load(pkgPath)
    .then(installed => installed.equalTo(pkg))
    .catch(e => {
      if (e.code === 'ENOENT') {
        return false
      } else {
        throw e
      }
    })
}

module.exports = Installer
