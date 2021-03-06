/**
 * @file log.js
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _globalWindow = require('global/window');

var _globalWindow2 = _interopRequireDefault(_globalWindow);

var _browser = require('./browser');

var log = undefined;

/**
 * Log messages to the console and history based on the type of message
 *
 * @param  {String} type
 *         The name of the console method to use.
 * @param  {Array} args
 *         The arguments to be passed to the matching console method.
 * @param  {Boolean} [stringify]
 *         By default, only old IEs should get console argument stringification,
 *         but this is exposed as a parameter to facilitate testing.
 */
var logByType = function logByType(type, args) {
  var stringify = arguments.length <= 2 || arguments[2] === undefined ? !!_browser.IE_VERSION && _browser.IE_VERSION < 11 : arguments[2];

  // If there's no console then don't try to output messages, but they will
  // still be stored in `log.history`.
  //
  // Was setting these once outside of this function, but containing them
  // in the function makes it easier to test cases where console doesn't exist
  // when the module is executed.
  var fn = _globalWindow2['default'].console && _globalWindow2['default'].console[type] || function () {};

  if (type !== 'log') {

    // add the type to the front of the message when it's not "log"
    args.unshift(type.toUpperCase() + ':');
  }

  // add to history
  log.history.push(args);

  // add console prefix after adding to history
  args.unshift('koment:');

  // IEs previous to 11 log objects uselessly as "[object Object]"; so, JSONify
  // objects and arrays for those less-capable browsers.
  if (stringify) {
    args = args.map(function (a) {
      if (a && typeof a === 'object' || Array.isArray(a)) {
        try {
          return JSON.stringify(a);
        } catch (x) {
          return String(a);
        }
      }

      // Cast to string before joining, so we get null and undefined explicitly
      // included in output (as we would in a modern console).
      return String(a);
    }).join(' ');
  }

  // Old IE versions do not allow .apply() for console methods (they are
  // reported as objects rather than functions).
  if (!fn.apply) {
    fn(args);
  } else {
    fn[Array.isArray(args) ? 'apply' : 'call'](console, args);
  }
};

exports.logByType = logByType;
/**
 * Log plain debug messages
 *
 * @function log
 */
log = function () {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  logByType('log', args);
};

/**
 * Keep a history of log messages
 *
 * @type {Array}
 */
log.history = [];

/**
 * Log error messages
 *
 * @method error
 */
log.error = function () {
  for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  return logByType('error', args);
};

/**
 * Log warning messages
 *
 * @method warn
 */
log.warn = function () {
  for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }

  return logByType('warn', args);
};

exports['default'] = log;