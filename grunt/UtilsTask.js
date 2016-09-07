'use strict';

var _ = require('lodash'),
    path = require('path'),
    colors = require('colors'),
    projectPath = require('./options/packageOptions').projectPaths,
    _logMessage;

_logMessage = function (mask, message) {
    /*eslint no-console: [0] */
    console.log(mask(message));
};

module.exports = {
    getPath: function (filename) {
        return path.basename(filename, '.js');
    },
    validateOptions: function (list, selected) {
        var valid = _.isString(selected) && _.isArray(list) && !_.isEmpty(list) &&
            _.find(list, function (option) {
                return _.includes(option, selected);
            });

        if (!_.isString(valid)) {
            throw new Error('Not valid selected option target (--mask, --reporter, --compile).');
        }

        return valid;
    },
    getPlatformCommands: function () {
        var isWindowsOS = /^win/.test(process.platform),
            windowsOS = './commands/windows',
            unixOS = './commands/unix';

        return isWindowsOS ? require(windowsOS) : require(unixOS);
    },
    getProyectPath: function (resource) {
        return _.join([
            projectPath.protocol, '://',
            projectPath.host, ':',
            projectPath.port, '/',
            projectPath.root, '/',
            resource], '');
    },
    logger: {
        alert: _.partial(_logMessage, colors.red.underline),
        warning: _.partial(_logMessage, colors.yellow.underline),
        info: _.partial(_logMessage, colors.cyan.underline)
    }
};
