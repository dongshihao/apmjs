#!/usr/bin/env node
;(function () { // wrapper in case we're in module_context mode
  // windows: running "npm blah" in this folder will invoke WSH, not node.
  /* global WScript */
  if (typeof WScript !== 'undefined') {
    WScript.echo(
      'npm does not work when run\n' +
        'with the Windows Scripting Host\n\n' +
        "'cd' to a different directory,\n" +
        "or type 'npm.cmd <args>',\n" +
        "or type 'node npm <args>'."
    )
    WScript.quit(1)
    return
  }

  process.title = 'npm'

  var log = require('npmlog')
  var path = require('path')
  var npm = require('npm')
  var npmconf = require('npm/lib/config/core.js')
  var errorHandler = require('npm/lib/utils/error-handler.js')

  var configDefs = npmconf.defs
  var shorthands = configDefs.shorthands
  var types = configDefs.types
  var nopt = require('nopt')

  log.level = 'verbose'

  // if npm is called as "npmg" or "npm_g", then
  // run in global mode.
  if (path.basename(process.argv[1]).slice(-1) === 'g') {
    process.argv.splice(1, 1, 'npm', '-g')
  }

  var conf = nopt(types, shorthands)
  npm.argv = conf.argv.remain
  if (npm.deref(npm.argv[0])) npm.command = npm.argv.shift()
  else conf.usage = true

  if (conf.version) {
    console.log(npm.version)
    return
  }

  if (conf.versions) {
    npm.command = 'version'
    conf.usage = false
    npm.argv = []
  }

  log.info('using', 'npm@%s', npm.version)
  log.info('using', 'node@%s', process.version)

  process.on('uncaughtException', errorHandler)

  if (conf.usage && npm.command !== 'help') {
    npm.argv.unshift(npm.command)
    npm.command = 'help'
  }

  // now actually fire up npm and run the command.
  // this is how to use npm programmatically:
  conf._exit = true
  npm.load(conf, function (er) {
    if (er) return errorHandler(er)

    var npmInstall = npm.commands.install
    Object.defineProperty(npm.commands, 'npmInstall', {
      get: () => npmInstall
    })
    Object.defineProperty(npm.commands, 'install', {
      get: function () {
        return require('../src/commands/install.js')
      }
    })

    npm.commands[npm.command](npm.argv, errorHandler, conf)
  })
})()
