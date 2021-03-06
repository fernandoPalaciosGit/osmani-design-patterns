'use strict';

var _ = require('lodash'),
    utils = require('util'),
    path = require('path'),
    colors = require('colors'),
    projectPath = require('./options/packageOptions').projectPaths,
    _logMessage, _inspectObject, _logDebugging, _parseIterableWithKey;

_logMessage = function (mask, message) {
    /*eslint no-console: [0] */
    console.log(mask(message));
};

_inspectObject = function (object, depth) {
    /*eslint no-console: [0] */
    console.log(utils.inspect(object, {
        showHidden: false, depth: depth
    }));
};

/**
 * @param object {Object} object to inspect.
 * @param depth {Number} Specifies the number of times to recurse while formatting the object.
 */
_logDebugging = function (object) {
    /*eslint no-console: [0] */
    _logMessage(colors.cyan.underline, '---debug---');

    if (_.isArguments(object)) {
        console.log('arguments.length = ' + object.length);
        _.each(object, _inspectObject);

    } else {
        _inspectObject.apply({}, arguments);
    }
};

_parseIterableWithKey = function (hasOutputKey, iterable) {
    let obj = hasOutputKey ? {} : [];

    for (let entry of iterable.entries()) {
        hasOutputKey ? obj[entry[0]] = entry[1] : obj.push(entry[1]);
    }

    return obj;
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
        info: _.partial(_logMessage, colors.cyan.underline),
        debug: _.partialRight(_logDebugging, null),
        shortdebug: _.partialRight(_logDebugging, 2)
    },
    convert: {
        strSetToObj: _.partial(_parseIterableWithKey, false),
        strMapToObj: _.partial(_parseIterableWithKey, true)
    }
};
