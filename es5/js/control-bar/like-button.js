/**
 * @file koment-toggle.js
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _videoJs = require('video.js');

var _videoJs2 = _interopRequireDefault(_videoJs);

var _utilsToTitleCase = require('../utils/to-title-case');

var _utilsToTitleCase2 = _interopRequireDefault(_utilsToTitleCase);

var _utilsDom = require('../utils/dom');

var Dom = _interopRequireWildcard(_utilsDom);

var _komentButton = require('./koment-button');

var _komentButton2 = _interopRequireDefault(_komentButton);

/**
 * The button component for toggling and selecting koment
 * Chapters act much differently than other text tracks
 * Cues are navigation vs. other tracks of alternative languages
 *
 * @param {Object} player  Player object
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @extends Button
 * @class LikeButton
 */

var Component = _videoJs2['default'].getComponent('Component');

var LikeButton = (function (_KomentButton) {
  _inherits(LikeButton, _KomentButton);

  function LikeButton(player, options, ready) {
    _classCallCheck(this, LikeButton);

    _get(Object.getPrototypeOf(LikeButton.prototype), 'constructor', this).call(this, player, options, ready);
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */

  _createClass(LikeButton, [{
    key: 'buildCSSClass',
    value: function buildCSSClass() {
      return 'like-button ' + _get(Object.getPrototypeOf(LikeButton.prototype), 'buildCSSClass', this).call(this);
    }
  }, {
    key: 'createEl',
    value: function createEl() {
      return _get(Object.getPrototypeOf(LikeButton.prototype), 'createEl', this).call(this, 'button', {
        innerHTML: '<div class="line" ></div><div class="line" ></div><div class="line" ></div><div class="line" ></div><div class="line" ></div><div class="line" ></div><div class="line" ></div><div class="line" ></div>'
      });
    }

    /**
     * Handle click on text track
     *
     * @method handleClick
     */
  }, {
    key: 'handleClick',
    value: function handleClick(event) {
      _get(Object.getPrototypeOf(LikeButton.prototype), 'handleClick', this).call(this, event);
      this.addClass('active');
      this.setTimeout(this.disable, 300);
    }
  }, {
    key: 'disable',
    value: function disable() {
      this.removeClass('active');
    }
  }]);

  return LikeButton;
})(_komentButton2['default']);

LikeButton.prototype.controlText_ = 'Like';

Component.registerComponent('LikeButton', LikeButton);
exports['default'] = LikeButton;
module.exports = exports['default'];