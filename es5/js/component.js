/**
 * @file component.js
 *
 * Player Component - Base class for all UI objects
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _globalWindow = require('global/window');

var _globalWindow2 = _interopRequireDefault(_globalWindow);

var _utilsDomJs = require('./utils/dom.js');

var Dom = _interopRequireWildcard(_utilsDomJs);

var _utilsFnJs = require('./utils/fn.js');

var Fn = _interopRequireWildcard(_utilsFnJs);

var _utilsGuidJs = require('./utils/guid.js');

var Guid = _interopRequireWildcard(_utilsGuidJs);

var _utilsEventsJs = require('./utils/events.js');

var Events = _interopRequireWildcard(_utilsEventsJs);

var _utilsLogJs = require('./utils/log.js');

var _utilsLogJs2 = _interopRequireDefault(_utilsLogJs);

var _utilsToTitleCaseJs = require('./utils/to-title-case.js');

var _utilsToTitleCaseJs2 = _interopRequireDefault(_utilsToTitleCaseJs);

var _utilsMergeOptionsJs = require('./utils/merge-options.js');

var _utilsMergeOptionsJs2 = _interopRequireDefault(_utilsMergeOptionsJs);

/**
 * Base UI Component class
 * Components are embeddable UI objects that are represented by both a
 * javascript object and an element in the DOM. They can be children of other
 * components, and can have many children themselves.
 * ```js
 *     // adding a button to the player
 *     var button = player.addChild('button');
 *     button.el(); // -> button element
 * ```
 * ```html
 *     <div class="video-js">
 *       <div class="koment-button">Button</div>
 *     </div>
 * ```
 * Components are also event targets.
 * ```js
 *     button.on('click', function() {
 *       console.log('Button Clicked!');
 *     });
 *     button.trigger('customevent');
 * ```
 *
 * @param {Object} player  Main Player
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @class Component
 */

var Component = (function () {
  function Component(player, options, ready) {
    _classCallCheck(this, Component);

    // The component might be the player itself and we can't pass `this` to super
    if (!player && this.play) {
      this.player_ = player = this; // eslint-disable-line
    } else {
        this.player_ = player;
      }

    // Make a copy of prototype.options_ to protect against overriding defaults
    this.options_ = (0, _utilsMergeOptionsJs2['default'])({}, this.options_);

    // Updated options with supplied options
    options = this.options_ = (0, _utilsMergeOptionsJs2['default'])(this.options_, options);

    // Get ID from options or options element if one is supplied
    this.id_ = options.id || options.el && options.el.id;

    // If there was no ID from the options, generate one
    if (!this.id_) {
      // Don't require the player ID function in the case of mock players
      var id = player && player.id && player.id() || 'no_player';

      this.id_ = id + '_component_' + Guid.newGUID();
    }

    this.name_ = options.name || null;

    // Create element if one wasn't provided in options
    if (options.el) {
      this.el_ = options.el;
    } else if (options.createEl !== false) {
      this.el_ = this.createEl();
    }

    this.children_ = [];
    this.childIndex_ = {};
    this.childNameIndex_ = {};

    // Add any child components in options
    if (options.initChildren !== false) {
      this.initChildren();
    }

    this.ready(ready);
    // Don't want to trigger ready here or it will before init is actually
    // finished for all children that run this constructor

    if (options.reportTouchActivity !== false) {
      this.enableTouchActivity();
    }
  }

  /**
   * Dispose of the component and all child components
   *
   * @method dispose
   */

  _createClass(Component, [{
    key: 'dispose',
    value: function dispose() {
      this.trigger({ type: 'dispose', bubbles: false });

      // Dispose all children.
      if (this.children_) {
        for (var i = this.children_.length - 1; i >= 0; i--) {
          if (this.children_[i].dispose) {
            this.children_[i].dispose();
          }
        }
      }

      // Delete child references
      this.children_ = null;
      this.childIndex_ = null;
      this.childNameIndex_ = null;

      // Remove all event listeners.
      this.off();

      // Remove element from DOM
      if (this.el_.parentNode) {
        this.el_.parentNode.removeChild(this.el_);
      }

      Dom.removeElData(this.el_);
      this.el_ = null;
    }

    /**
     * Return the component's player
     *
     * @return {Player}
     * @method player
     */
  }, {
    key: 'player',
    value: function player() {
      return this.player_;
    }

    /**
     * Deep merge of options objects
     * Whenever a property is an object on both options objects
     * the two properties will be merged using mergeOptions.
     *
     * ```js
     *     Parent.prototype.options_ = {
     *       optionSet: {
     *         'childOne': { 'foo': 'bar', 'asdf': 'fdsa' },
     *         'childTwo': {},
     *         'childThree': {}
     *       }
     *     }
     *     newOptions = {
     *       optionSet: {
     *         'childOne': { 'foo': 'baz', 'abc': '123' }
     *         'childTwo': null,
     *         'childFour': {}
     *       }
     *     }
     *
     *     this.options(newOptions);
     * ```
     * RESULT
     * ```js
     *     {
     *       optionSet: {
     *         'childOne': { 'foo': 'baz', 'asdf': 'fdsa', 'abc': '123' },
     *         'childTwo': null, // Disabled. Won't be initialized.
     *         'childThree': {},
     *         'childFour': {}
     *       }
     *     }
     * ```
     *
     * @param  {Object} obj Object of new option values
     * @return {Object}     A NEW object of this.options_ and obj merged
     * @method options
     */
  }, {
    key: 'options',
    value: function options(obj) {
      _utilsLogJs2['default'].warn('this.options() has been deprecated and will be moved to the constructor in 6.0');

      if (!obj) {
        return this.options_;
      }

      this.options_ = (0, _utilsMergeOptionsJs2['default'])(this.options_, obj);
      return this.options_;
    }

    /**
     * Get the component's DOM element
     * ```js
     *     var domEl = myComponent.el();
     * ```
     *
     * @return {Element}
     * @method el
     */
  }, {
    key: 'el',
    value: function el() {
      return this.el_;
    }

    /**
     * Create the component's DOM element
     *
     * @param  {String=} tagName  Element's node type. e.g. 'div'
     * @param  {Object=} properties An object of properties that should be set
     * @param  {Object=} attributes An object of attributes that should be set
     * @return {Element}
     * @method createEl
     */
  }, {
    key: 'createEl',
    value: function createEl(tagName, properties, attributes) {
      return Dom.createEl(tagName, properties, attributes);
    }
  }, {
    key: 'localize',
    value: function localize(string) {
      var code = this.player_.language && this.player_.language();
      var languages = this.player_.languages && this.player_.languages();

      if (!code || !languages) {
        return string;
      }

      var language = languages[code];

      if (language && language[string]) {
        return language[string];
      }

      var primaryCode = code.split('-')[0];
      var primaryLang = languages[primaryCode];

      if (primaryLang && primaryLang[string]) {
        return primaryLang[string];
      }

      return string;
    }

    /**
     * Return the component's DOM element where children are inserted.
     * Will either be the same as el() or a new element defined in createEl().
     *
     * @return {Element}
     * @method contentEl
     */
  }, {
    key: 'contentEl',
    value: function contentEl() {
      return this.contentEl_ || this.el_;
    }

    /**
     * Get the component's ID
     * ```js
     *     var id = myComponent.id();
     * ```
     *
     * @return {String}
     * @method id
     */
  }, {
    key: 'id',
    value: function id() {
      return this.id_;
    }

    /**
     * Get the component's name. The name is often used to reference the component.
     * ```js
     *     var name = myComponent.name();
     * ```
     *
     * @return {String}
     * @method name
     */
  }, {
    key: 'name',
    value: function name() {
      return this.name_;
    }

    /**
     * Get an array of all child components
     * ```js
     *     var kids = myComponent.children();
     * ```
     *
     * @return {Array} The children
     * @method children
     */
  }, {
    key: 'children',
    value: function children() {
      return this.children_;
    }

    /**
     * Returns a child component with the provided ID
     *
     * @return {Component}
     * @method getChildById
     */
  }, {
    key: 'getChildById',
    value: function getChildById(id) {
      return this.childIndex_[id];
    }

    /**
     * Returns a child component with the provided name
     *
     * @return {Component}
     * @method getChild
     */
  }, {
    key: 'getChild',
    value: function getChild(name) {
      return this.childNameIndex_[name];
    }

    /**
     * Adds a child component inside this component
     * ```js
     *     myComponent.el();
     *     // -> <div class='my-component'></div>
     *     myComponent.children();
     *     // [empty array]
     *
     *     var myButton = myComponent.addChild('MyButton');
     *     // -> <div class='my-component'><div class="my-button">myButton<div></div>
     *     // -> myButton === myComponent.children()[0];
     * ```
     * Pass in options for child constructors and options for children of the child
     * ```js
     *     var myButton = myComponent.addChild('MyButton', {
     *       text: 'Press Me',
     *       buttonChildExample: {
     *         buttonChildOption: true
     *       }
     *     });
     * ```
     *
     * @param {String|Component} child The class name or instance of a child to add
     * @param {Object=} options Options, including options to be passed to children of the child.
     * @param {Number} index into our children array to attempt to add the child
     * @return {Component} The child component (created by this process if a string was used)
     * @method addChild
     */
  }, {
    key: 'addChild',
    value: function addChild(child) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
      var index = arguments.length <= 2 || arguments[2] === undefined ? this.children_.length : arguments[2];

      var component = undefined;
      var componentName = undefined;

      // If child is a string, create nt with options
      if (typeof child === 'string') {
        componentName = child;

        // Options can also be specified as a boolean, so convert to an empty object if false.
        if (!options) {
          options = {};
        }

        // Same as above, but true is deprecated so show a warning.
        if (options === true) {
          _utilsLogJs2['default'].warn('Initializing a child component with `true` is deprecated. Children should be defined in an array when possible, but if necessary use an object instead of `true`.');
          options = {};
        }

        // If no componentClass in options, assume componentClass is the name lowercased
        // (e.g. playButton)
        var componentClassName = options.componentClass || (0, _utilsToTitleCaseJs2['default'])(componentName);

        // Set name through options
        options.name = componentName;

        // Create a new object & element for this controls set
        // If there's no .player_, this is a player
        var ComponentClass = Component.getComponent(componentClassName);

        if (!ComponentClass) {
          throw new Error('Component ' + componentClassName + ' does not exist');
        }

        // data stored directly on the koment object may be
        // misidentified as a component to retain
        // backwards-compatibility with 4.x. check to make sure the
        // component class can be instantiated.
        if (typeof ComponentClass !== 'function') {
          return null;
        }

        component = new ComponentClass(this.player_ || this, options);

        // child is a component instance
      } else {
          component = child;
        }

      this.children_.splice(index, 0, component);

      if (typeof component.id === 'function') {
        this.childIndex_[component.id()] = component;
      }

      // If a name wasn't used to create the component, check if we can use the
      // name function of the component
      componentName = componentName || component.name && component.name();

      if (componentName) {
        this.childNameIndex_[componentName] = component;
      }

      // Add the UI object's element to the container div (box)
      // Having an element is not required
      if (typeof component.el === 'function' && component.el()) {
        var childNodes = this.contentEl().children;
        var refNode = childNodes[index] || null;

        this.contentEl().insertBefore(component.el(), refNode);
      }

      // Return so it can stored on parent object if desired.
      return component;
    }

    /**
     * Remove a child component from this component's list of children, and the
     * child component's element from this component's element
     *
     * @param  {Component} component Component to remove
     * @method removeChild
     */
  }, {
    key: 'removeChild',
    value: function removeChild(component) {
      if (typeof component === 'string') {
        component = this.getChild(component);
      }

      if (!component || !this.children_) {
        return;
      }

      var childFound = false;

      for (var i = this.children_.length - 1; i >= 0; i--) {
        if (this.children_[i] === component) {
          childFound = true;
          this.children_.splice(i, 1);
          break;
        }
      }

      if (!childFound) {
        return;
      }

      this.childIndex_[component.id()] = null;
      this.childNameIndex_[component.name()] = null;

      var compEl = component.el();

      if (compEl && compEl.parentNode === this.contentEl()) {
        this.contentEl().removeChild(component.el());
      }
    }

    /**
     * Add and initialize default child components from options
     * ```js
     *     // when an instance of MyComponent is created, all children in options
     *     // will be added to the instance by their name strings and options
     *     MyComponent.prototype.options_ = {
     *       children: [
     *         'myChildComponent'
     *       ],
     *       myChildComponent: {
     *         myChildOption: true
     *       }
     *     };
     *
     *     // Or when creating the component
     *     var myComp = new MyComponent(player, {
     *       children: [
     *         'myChildComponent'
     *       ],
     *       myChildComponent: {
     *         myChildOption: true
     *       }
     *     });
     * ```
     * The children option can also be an array of
     * child options objects (that also include a 'name' key).
     * This can be used if you have two child components of the
     * same type that need different options.
     * ```js
     *     var myComp = new MyComponent(player, {
     *       children: [
     *         'button',
     *         {
     *           name: 'button',
     *           someOtherOption: true
     *         },
     *         {
     *           name: 'button',
     *           someOtherOption: false
     *         }
     *       ]
     *     });
     * ```
     *
     * @method initChildren
     */
  }, {
    key: 'initChildren',
    value: function initChildren() {
      var _this = this;

      var children = this.options_.children;

      if (children) {
        (function () {
          // `this` is `parent`
          var parentOptions = _this.options_;

          var handleAdd = function handleAdd(child) {
            var name = child.name;
            var opts = child.opts;

            // Allow options for children to be set at the parent options
            // e.g. koment(id, { controlBar: false });
            // instead of koment(id, { children: { controlBar: false });
            if (parentOptions[name] !== undefined) {
              opts = parentOptions[name];
            }

            // Allow for disabling default components
            // e.g. options['children']['posterImage'] = false
            if (opts === false) {
              return;
            }

            // Allow options to be passed as a simple boolean if no configuration
            // is necessary.
            if (opts === true) {
              opts = {};
            }

            // We also want to pass the original player options to each component as well so they don't need to
            // reach back into the player for options later.
            opts.playerOptions = _this.options_.playerOptions;

            // Create and add the child component.
            // Add a direct reference to the child by name on the parent instance.
            // If two of the same component are used, different names should be supplied
            // for each
            var newChild = _this.addChild(name, opts);

            if (newChild) {
              _this[name] = newChild;
            }
          };

          // Allow for an array of children details to passed in the options
          var workingChildren = undefined;
          var Tech = Component.getComponent('Tech');

          if (Array.isArray(children)) {
            workingChildren = children;
          } else {
            workingChildren = Object.keys(children);
          }

          workingChildren
          // children that are in this.options_ but also in workingChildren  would
          // give us extra children we do not want. So, we want to filter them out.
          .concat(Object.keys(_this.options_).filter(function (child) {
            return !workingChildren.some(function (wchild) {
              if (typeof wchild === 'string') {
                return child === wchild;
              }
              return child === wchild.name;
            });
          })).map(function (child) {
            var name = undefined;
            var opts = undefined;

            if (typeof child === 'string') {
              name = child;
              opts = children[name] || _this.options_[name] || {};
            } else {
              name = child.name;
              opts = child;
            }

            return { name: name, opts: opts };
          }).filter(function (child) {
            // we have to make sure that child.name isn't in the techOrder since
            // techs are registerd as Components but can't aren't compatible
            // See https://github.com/koment/video.js/issues/2772
            var c = Component.getComponent(child.opts.componentClass || (0, _utilsToTitleCaseJs2['default'])(child.name));

            return c && !Tech.isTech(c);
          }).forEach(handleAdd);
        })();
      }
    }

    /**
     * Allows sub components to stack CSS class names
     *
     * @return {String} The constructed class name
     * @method buildCSSClass
     */
  }, {
    key: 'buildCSSClass',
    value: function buildCSSClass() {
      // Child classes can include a function that does:
      // return 'CLASS NAME' + this._super();
      return '';
    }

    /**
     * Add an event listener to this component's element
     * ```js
     *     var myFunc = function() {
     *       var myComponent = this;
     *       // Do something when the event is fired
     *     };
     *
     *     myComponent.on('eventType', myFunc);
     * ```
     * The context of myFunc will be myComponent unless previously bound.
     * Alternatively, you can add a listener to another element or component.
     * ```js
     *     myComponent.on(otherElement, 'eventName', myFunc);
     *     myComponent.on(otherComponent, 'eventName', myFunc);
     * ```
     * The benefit of using this over `VjsEvents.on(otherElement, 'eventName', myFunc)`
     * and `otherComponent.on('eventName', myFunc)` is that this way the listeners
     * will be automatically cleaned up when either component is disposed.
     * It will also bind myComponent as the context of myFunc.
     * **NOTE**: When using this on elements in the page other than window
     * and document (both permanent), if you remove the element from the DOM
     * you need to call `myComponent.trigger(el, 'dispose')` on it to clean up
     * references to it and allow the browser to garbage collect it.
     *
     * @param  {String|Component} first   The event type or other component
     * @param  {Function|String}      second  The event handler or event type
     * @param  {Function}             third   The event handler
     * @return {Component}
     * @method on
     */
  }, {
    key: 'on',
    value: function on(first, second, third) {
      var _this2 = this;

      if (typeof first === 'string' || Array.isArray(first)) {
        Events.on(this.el_, first, Fn.bind(this, second));

        // Targeting another component or element
      } else {
          (function () {
            var target = first;
            var type = second;
            var fn = Fn.bind(_this2, third);

            // When this component is disposed, remove the listener from the other component
            var removeOnDispose = function removeOnDispose() {
              return _this2.off(target, type, fn);
            };

            // Use the same function ID so we can remove it later it using the ID
            // of the original listener
            removeOnDispose.guid = fn.guid;
            _this2.on('dispose', removeOnDispose);

            // If the other component is disposed first we need to clean the reference
            // to the other component in this component's removeOnDispose listener
            // Otherwise we create a memory leak.
            var cleanRemover = function cleanRemover() {
              return _this2.off('dispose', removeOnDispose);
            };

            // Add the same function ID so we can easily remove it later
            cleanRemover.guid = fn.guid;

            // Check if this is a DOM node
            if (first.nodeName) {
              // Add the listener to the other element
              Events.on(target, type, fn);
              Events.on(target, 'dispose', cleanRemover);

              // Should be a component
              // Not using `instanceof Component` because it makes mock players difficult
            } else if (typeof first.on === 'function') {
                // Add the listener to the other component
                target.on(type, fn);
                target.on('dispose', cleanRemover);
              }
          })();
        }

      return this;
    }

    /**
     * Remove an event listener from this component's element
     * ```js
     *     myComponent.off('eventType', myFunc);
     * ```
     * If myFunc is excluded, ALL listeners for the event type will be removed.
     * If eventType is excluded, ALL listeners will be removed from the component.
     * Alternatively you can use `off` to remove listeners that were added to other
     * elements or components using `myComponent.on(otherComponent...`.
     * In this case both the event type and listener function are REQUIRED.
     * ```js
     *     myComponent.off(otherElement, 'eventType', myFunc);
     *     myComponent.off(otherComponent, 'eventType', myFunc);
     * ```
     *
     * @param  {String=|Component}  first  The event type or other component
     * @param  {Function=|String}       second The listener function or event type
     * @param  {Function=}              third  The listener for other component
     * @return {Component}
     * @method off
     */
  }, {
    key: 'off',
    value: function off(first, second, third) {
      if (!first || typeof first === 'string' || Array.isArray(first)) {
        Events.off(this.el_, first, second);
      } else {
        var target = first;
        var type = second;
        // Ensure there's at least a guid, even if the function hasn't been used
        var fn = Fn.bind(this, third);

        // Remove the dispose listener on this component,
        // which was given the same guid as the event listener
        this.off('dispose', fn);

        if (first.nodeName) {
          // Remove the listener
          Events.off(target, type, fn);
          // Remove the listener for cleaning the dispose listener
          Events.off(target, 'dispose', fn);
        } else {
          target.off(type, fn);
          target.off('dispose', fn);
        }
      }

      return this;
    }

    /**
     * Add an event listener to be triggered only once and then removed
     * ```js
     *     myComponent.one('eventName', myFunc);
     * ```
     * Alternatively you can add a listener to another element or component
     * that will be triggered only once.
     * ```js
     *     myComponent.one(otherElement, 'eventName', myFunc);
     *     myComponent.one(otherComponent, 'eventName', myFunc);
     * ```
     *
     * @param  {String|Component}  first   The event type or other component
     * @param  {Function|String}       second  The listener function or event type
     * @param  {Function=}             third   The listener function for other component
     * @return {Component}
     * @method one
     */
  }, {
    key: 'one',
    value: function one(first, second, third) {
      var _this3 = this,
          _arguments = arguments;

      if (typeof first === 'string' || Array.isArray(first)) {
        Events.one(this.el_, first, Fn.bind(this, second));
      } else {
        (function () {
          var target = first;
          var type = second;
          var fn = Fn.bind(_this3, third);

          var newFunc = function newFunc() {
            _this3.off(target, type, newFunc);
            fn.apply(null, _arguments);
          };

          // Keep the same function ID so we can remove it later
          newFunc.guid = fn.guid;

          _this3.on(target, type, newFunc);
        })();
      }

      return this;
    }

    /**
     * Trigger an event on an element
     * ```js
     *     myComponent.trigger('eventName');
     *     myComponent.trigger({'type':'eventName'});
     *     myComponent.trigger('eventName', {data: 'some data'});
     *     myComponent.trigger({'type':'eventName'}, {data: 'some data'});
     * ```
     *
     * @param  {Event|Object|String} event  A string (the type) or an event object with a type attribute
     * @param  {Object} [hash] data hash to pass along with the event
     * @return {Component}       self
     * @method trigger
     */
  }, {
    key: 'trigger',
    value: function trigger(event, hash) {
      Events.trigger(this.el_, event, hash);
      return this;
    }

    /**
     * Bind a listener to the component's ready state.
     * Different from event listeners in that if the ready event has already happened
     * it will trigger the function immediately.
     *
     * @param  {Function} fn Ready listener
     * @param  {Boolean} sync Exec the listener synchronously if component is ready
     * @return {Component}
     * @method ready
     */
  }, {
    key: 'ready',
    value: function ready(fn) {
      var sync = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

      if (fn) {
        if (this.isReady_) {
          if (sync) {
            fn.call(this);
          } else {
            // Call the function asynchronously by default for consistency
            this.setTimeout(fn, 1);
          }
        } else {
          this.readyQueue_ = this.readyQueue_ || [];
          this.readyQueue_.push(fn);
        }
      }
      return this;
    }

    /**
     * Trigger the ready listeners
     *
     * @return {Component}
     * @method triggerReady
     */
  }, {
    key: 'triggerReady',
    value: function triggerReady() {
      this.isReady_ = true;

      // Ensure ready is triggerd asynchronously
      this.setTimeout(function () {
        var readyQueue = this.readyQueue_;

        // Reset Ready Queue
        this.readyQueue_ = [];

        if (readyQueue && readyQueue.length > 0) {
          readyQueue.forEach(function (fn) {
            fn.call(this);
          }, this);
        }

        // Allow for using event listeners also
        this.trigger('ready');
      }, 1);
    }

    /**
     * Finds a single DOM element matching `selector` within the component's
     * `contentEl` or another custom context.
     *
     * @method $
     * @param  {String} selector
     *         A valid CSS selector, which will be passed to `querySelector`.
     *
     * @param  {Element|String} [context=document]
     *         A DOM element within which to query. Can also be a selector
     *         string in which case the first matching element will be used
     *         as context. If missing (or no element matches selector), falls
     *         back to `document`.
     *
     * @return {Element|null}
     */
  }, {
    key: '$',
    value: function $(selector, context) {
      return Dom.$(selector, context || this.contentEl());
    }

    /**
     * Finds a all DOM elements matching `selector` within the component's
     * `contentEl` or another custom context.
     *
     * @method $$
     * @param  {String} selector
     *         A valid CSS selector, which will be passed to `querySelectorAll`.
     *
     * @param  {Element|String} [context=document]
     *         A DOM element within which to query. Can also be a selector
     *         string in which case the first matching element will be used
     *         as context. If missing (or no element matches selector), falls
     *         back to `document`.
     *
     * @return {NodeList}
     */
  }, {
    key: '$$',
    value: function $$(selector, context) {
      return Dom.$$(selector, context || this.contentEl());
    }

    /**
     * Check if a component's element has a CSS class name
     *
     * @param {String} classToCheck Classname to check
     * @return {Component}
     * @method hasClass
     */
  }, {
    key: 'hasClass',
    value: function hasClass(classToCheck) {
      return Dom.hasElClass(this.el_, classToCheck);
    }

    /**
     * Add a CSS class name to the component's element
     *
     * @param {String} classToAdd Classname to add
     * @return {Component}
     * @method addClass
     */
  }, {
    key: 'addClass',
    value: function addClass(classToAdd) {
      Dom.addElClass(this.el_, classToAdd);
      return this;
    }

    /**
     * Remove a CSS class name from the component's element
     *
     * @param {String} classToRemove Classname to remove
     * @return {Component}
     * @method removeClass
     */
  }, {
    key: 'removeClass',
    value: function removeClass(classToRemove) {
      Dom.removeElClass(this.el_, classToRemove);
      return this;
    }

    /**
     * Add or remove a CSS class name from the component's element
     *
     * @param  {String} classToToggle
     * @param  {Boolean|Function} [predicate]
     *         Can be a function that returns a Boolean. If `true`, the class
     *         will be added; if `false`, the class will be removed. If not
     *         given, the class will be added if not present and vice versa.
     *
     * @return {Component}
     * @method toggleClass
     */
  }, {
    key: 'toggleClass',
    value: function toggleClass(classToToggle, predicate) {
      Dom.toggleElClass(this.el_, classToToggle, predicate);
      return this;
    }

    /**
     * Show the component element if hidden
     *
     * @return {Component}
     * @method show
     */
  }, {
    key: 'show',
    value: function show() {
      this.removeClass('koment-hidden');
      return this;
    }

    /**
     * Hide the component element if currently showing
     *
     * @return {Component}
     * @method hide
     */
  }, {
    key: 'hide',
    value: function hide() {
      this.addClass('koment-hidden');
      return this;
    }

    /**
     * Lock an item in its visible state
     * To be used with fadeIn/fadeOut.
     *
     * @return {Component}
     * @private
     * @method lockShowing
     */
  }, {
    key: 'lockShowing',
    value: function lockShowing() {
      this.addClass('koment-lock-showing');
      return this;
    }

    /**
     * Unlock an item to be hidden
     * To be used with fadeIn/fadeOut.
     *
     * @return {Component}
     * @private
     * @method unlockShowing
     */
  }, {
    key: 'unlockShowing',
    value: function unlockShowing() {
      this.removeClass('koment-lock-showing');
      return this;
    }

    /**
     * Set or get the width of the component (CSS values)
     * Setting the video tag dimension values only works with values in pixels.
     * Percent values will not work.
     * Some percents can be used, but width()/height() will return the number + %,
     * not the actual computed width/height.
     *
     * @param  {Number|String=} num   Optional width number
     * @param  {Boolean} skipListeners Skip the 'resize' event trigger
     * @return {Component} This component, when setting the width
     * @return {Number|String} The width, when getting
     * @method width
     */
  }, {
    key: 'width',
    value: function width(num, skipListeners) {
      return this.dimension('width', num, skipListeners);
    }

    /**
     * Get or set the height of the component (CSS values)
     * Setting the video tag dimension values only works with values in pixels.
     * Percent values will not work.
     * Some percents can be used, but width()/height() will return the number + %,
     * not the actual computed width/height.
     *
     * @param  {Number|String=} num     New component height
     * @param  {Boolean=} skipListeners Skip the resize event trigger
     * @return {Component} This component, when setting the height
     * @return {Number|String} The height, when getting
     * @method height
     */
  }, {
    key: 'height',
    value: function height(num, skipListeners) {
      return this.dimension('height', num, skipListeners);
    }

    /**
     * Set both width and height at the same time
     *
     * @param  {Number|String} width Width of player
     * @param  {Number|String} height Height of player
     * @return {Component} The component
     * @method dimensions
     */
  }, {
    key: 'dimensions',
    value: function dimensions(width, height) {
      // Skip resize listeners on width for optimization
      return this.width(width, true).height(height);
    }

    /**
     * Get or set width or height
     * This is the shared code for the width() and height() methods.
     * All for an integer, integer + 'px' or integer + '%';
     * Known issue: Hidden elements officially have a width of 0. We're defaulting
     * to the style.width value and falling back to computedStyle which has the
     * hidden element issue. Info, but probably not an efficient fix:
     * http://www.foliotek.com/devblog/getting-the-width-of-a-hidden-element-with-jquery-using-width/
     *
     * @param  {String} widthOrHeight  'width' or 'height'
     * @param  {Number|String=} num     New dimension
     * @param  {Boolean=} skipListeners Skip resize event trigger
     * @return {Component} The component if a dimension was set
     * @return {Number|String} The dimension if nothing was set
     * @private
     * @method dimension
     */
  }, {
    key: 'dimension',
    value: function dimension(widthOrHeight, num, skipListeners) {
      if (num !== undefined) {
        // Set to zero if null or literally NaN (NaN !== NaN)
        if (num === null || num !== num) {
          num = 0;
        }

        // Check if using css width/height (% or px) and adjust
        if (('' + num).indexOf('%') !== -1 || ('' + num).indexOf('px') !== -1) {
          this.el_.style[widthOrHeight] = num;
        } else if (num === 'auto') {
          this.el_.style[widthOrHeight] = '';
        } else {
          this.el_.style[widthOrHeight] = num + 'px';
        }

        // skipListeners allows us to avoid triggering the resize event when setting both width and height
        if (!skipListeners) {
          this.trigger('resize');
        }

        // Return component
        return this;
      }

      // Not setting a value, so getting it
      // Make sure element exists
      if (!this.el_) {
        return 0;
      }

      // Get dimension value from style
      var val = this.el_.style[widthOrHeight];
      var pxIndex = val.indexOf('px');

      if (pxIndex !== -1) {
        // Return the pixel value with no 'px'
        return parseInt(val.slice(0, pxIndex), 10);
      }

      // No px so using % or no style was set, so falling back to offsetWidth/height
      // If component has display:none, offset will return 0
      // TODO: handle display:none and no dimension style using px
      return parseInt(this.el_['offset' + (0, _utilsToTitleCaseJs2['default'])(widthOrHeight)], 10);
    }

    /**
     * Get width or height of computed style
     * @param  {String} widthOrHeight  'width' or 'height'
     * @return {Number|Boolean} The bolean false if nothing was set
     * @method currentDimension
     */
  }, {
    key: 'currentDimension',
    value: function currentDimension(widthOrHeight) {
      var computedWidthOrHeight = 0;

      if (widthOrHeight !== 'width' && widthOrHeight !== 'height') {
        throw new Error('currentDimension only accepts width or height value');
      }

      if (typeof _globalWindow2['default'].getComputedStyle === 'function') {
        var computedStyle = _globalWindow2['default'].getComputedStyle(this.el_);

        computedWidthOrHeight = computedStyle.getPropertyValue(widthOrHeight) || computedStyle[widthOrHeight];
      } else if (this.el_.currentStyle) {
        // ie 8 doesn't support computed style, shim it
        // return clientWidth or clientHeight instead for better accuracy
        var rule = 'offset' + (0, _utilsToTitleCaseJs2['default'])(widthOrHeight);

        computedWidthOrHeight = this.el_[rule];
      }

      // remove 'px' from variable and parse as integer
      computedWidthOrHeight = parseFloat(computedWidthOrHeight);
      return computedWidthOrHeight;
    }

    /**
     * Get an object which contains width and height values of computed style
     * @return {Object} The dimensions of element
     * @method currentDimensions
     */
  }, {
    key: 'currentDimensions',
    value: function currentDimensions() {
      return {
        width: this.currentDimension('width'),
        height: this.currentDimension('height')
      };
    }

    /**
     * Get width of computed style
     * @return {Integer}
     * @method currentWidth
     */
  }, {
    key: 'currentWidth',
    value: function currentWidth() {
      return this.currentDimension('width');
    }

    /**
     * Get height of computed style
     * @return {Integer}
     * @method currentHeight
     */
  }, {
    key: 'currentHeight',
    value: function currentHeight() {
      return this.currentDimension('height');
    }

    /**
     * Emit 'tap' events when touch events are supported
     * This is used to support toggling the controls through a tap on the video.
     * We're requiring them to be enabled because otherwise every component would
     * have this extra overhead unnecessarily, on mobile devices where extra
     * overhead is especially bad.
     *
     * @private
     * @method emitTapEvents
     */
  }, {
    key: 'emitTapEvents',
    value: function emitTapEvents() {
      // Track the start time so we can determine how long the touch lasted
      var touchStart = 0;
      var firstTouch = null;

      // Maximum movement allowed during a touch event to still be considered a tap
      // Other popular libs use anywhere from 2 (hammer.js) to 15, so 10 seems like a nice, round number.
      var tapMovementThreshold = 10;

      // The maximum length a touch can be while still being considered a tap
      var touchTimeThreshold = 200;

      var couldBeTap = undefined;

      this.on('touchstart', function (event) {
        // If more than one finger, don't consider treating this as a click
        if (event.touches.length === 1) {
          // Copy pageX/pageY from the object
          firstTouch = {
            pageX: event.touches[0].pageX,
            pageY: event.touches[0].pageY
          };
          // Record start time so we can detect a tap vs. "touch and hold"
          touchStart = new Date().getTime();
          // Reset couldBeTap tracking
          couldBeTap = true;
        }
      });

      this.on('touchmove', function (event) {
        // If more than one finger, don't consider treating this as a click
        if (event.touches.length > 1) {
          couldBeTap = false;
        } else if (firstTouch) {
          // Some devices will throw touchmoves for all but the slightest of taps.
          // So, if we moved only a small distance, this could still be a tap
          var xdiff = event.touches[0].pageX - firstTouch.pageX;
          var ydiff = event.touches[0].pageY - firstTouch.pageY;
          var touchDistance = Math.sqrt(xdiff * xdiff + ydiff * ydiff);

          if (touchDistance > tapMovementThreshold) {
            couldBeTap = false;
          }
        }
      });

      var noTap = function noTap() {
        couldBeTap = false;
      };

      // TODO: Listen to the original target. http://youtu.be/DujfpXOKUp8?t=13m8s
      this.on('touchleave', noTap);
      this.on('touchcancel', noTap);

      // When the touch ends, measure how long it took and trigger the appropriate
      // event
      this.on('touchend', function (event) {
        firstTouch = null;
        // Proceed only if the touchmove/leave/cancel event didn't happen
        if (couldBeTap === true) {
          // Measure how long the touch lasted
          var touchTime = new Date().getTime() - touchStart;

          // Make sure the touch was less than the threshold to be considered a tap
          if (touchTime < touchTimeThreshold) {
            // Don't let browser turn this into a click
            event.preventDefault();
            this.trigger('tap');
            // It may be good to copy the touchend event object and change the
            // type to tap, if the other event properties aren't exact after
            // Events.fixEvent runs (e.g. event.target)
          }
        }
      });
    }

    /**
     * Report user touch activity when touch events occur
     * User activity is used to determine when controls should show/hide. It's
     * relatively simple when it comes to mouse events, because any mouse event
     * should show the controls. So we capture mouse events that bubble up to the
     * player and report activity when that happens.
     * With touch events it isn't as easy. We can't rely on touch events at the
     * player level, because a tap (touchstart + touchend) on the video itself on
     * mobile devices is meant to turn controls off (and on). User activity is
     * checked asynchronously, so what could happen is a tap event on the video
     * turns the controls off, then the touchend event bubbles up to the player,
     * which if it reported user activity, would turn the controls right back on.
     * (We also don't want to completely block touch events from bubbling up)
     * Also a touchmove, touch+hold, and anything other than a tap is not supposed
     * to turn the controls back on on a mobile device.
     * Here we're setting the default component behavior to report user activity
     * whenever touch events happen, and this can be turned off by components that
     * want touch events to act differently.
     *
     * @method enableTouchActivity
     */
  }, {
    key: 'enableTouchActivity',
    value: function enableTouchActivity() {
      // Don't continue if the root player doesn't support reporting user activity
      if (!this.player() || !this.player().reportUserActivity) {
        return;
      }

      // listener for reporting that the user is active
      var report = Fn.bind(this.player(), this.player().reportUserActivity);

      var touchHolding = undefined;

      this.on('touchstart', function () {
        report();
        // For as long as the they are touching the device or have their mouse down,
        // we consider them active even if they're not moving their finger or mouse.
        // So we want to continue to update that they are active
        this.clearInterval(touchHolding);
        // report at the same interval as activityCheck
        touchHolding = this.setInterval(report, 250);
      });

      var touchEnd = function touchEnd(event) {
        report();
        // stop the interval that maintains activity if the touch is holding
        this.clearInterval(touchHolding);
      };

      this.on('touchmove', report);
      this.on('touchend', touchEnd);
      this.on('touchcancel', touchEnd);
    }

    /**
     * Creates timeout and sets up disposal automatically.
     *
     * @param {Function} fn The function to run after the timeout.
     * @param {Number} timeout Number of ms to delay before executing specified function.
     * @return {Number} Returns the timeout ID
     * @method setTimeout
     */
  }, {
    key: 'setTimeout',
    value: function setTimeout(fn, timeout) {
      fn = Fn.bind(this, fn);

      // window.setTimeout would be preferable here, but due to some bizarre issue with Sinon and/or Phantomjs, we can't.
      var timeoutId = _globalWindow2['default'].setTimeout(fn, timeout);

      var disposeFn = function disposeFn() {
        this.clearTimeout(timeoutId);
      };

      disposeFn.guid = 'koment-timeout-' + timeoutId;

      this.on('dispose', disposeFn);

      return timeoutId;
    }

    /**
     * Clears a timeout and removes the associated dispose listener
     *
     * @param {Number} timeoutId The id of the timeout to clear
     * @return {Number} Returns the timeout ID
     * @method clearTimeout
     */
  }, {
    key: 'clearTimeout',
    value: function clearTimeout(timeoutId) {
      _globalWindow2['default'].clearTimeout(timeoutId);

      var disposeFn = function disposeFn() {};

      disposeFn.guid = 'koment-timeout-' + timeoutId;

      this.off('dispose', disposeFn);

      return timeoutId;
    }

    /**
     * Creates an interval and sets up disposal automatically.
     *
     * @param {Function} fn The function to run every N seconds.
     * @param {Number} interval Number of ms to delay before executing specified function.
     * @return {Number} Returns the interval ID
     * @method setInterval
     */
  }, {
    key: 'setInterval',
    value: function setInterval(fn, interval) {
      fn = Fn.bind(this, fn);

      var intervalId = _globalWindow2['default'].setInterval(fn, interval);

      var disposeFn = function disposeFn() {
        this.clearInterval(intervalId);
      };

      disposeFn.guid = 'koment-interval-' + intervalId;

      this.on('dispose', disposeFn);

      return intervalId;
    }

    /**
     * Clears an interval and removes the associated dispose listener
     *
     * @param {Number} intervalId The id of the interval to clear
     * @return {Number} Returns the interval ID
     * @method clearInterval
     */
  }, {
    key: 'clearInterval',
    value: function clearInterval(intervalId) {
      _globalWindow2['default'].clearInterval(intervalId);

      var disposeFn = function disposeFn() {};

      disposeFn.guid = 'koment-interval-' + intervalId;

      this.off('dispose', disposeFn);

      return intervalId;
    }

    /**
     * Registers a component
     *
     * @param {String} name Name of the component to register
     * @param {Object} comp The component to register
     * @static
     * @method registerComponent
     */
  }], [{
    key: 'registerComponent',
    value: function registerComponent(name, comp) {
      if (!Component.components_) {
        Component.components_ = {};
      }

      Component.components_[name] = comp;
      return comp;
    }

    /**
     * Gets a component by name
     *
     * @param {String} name Name of the component to get
     * @return {Component}
     * @static
     * @method getComponent
     */
  }, {
    key: 'getComponent',
    value: function getComponent(name) {
      if (Component.components_ && Component.components_[name]) {
        return Component.components_[name];
      }

      if (_globalWindow2['default'] && _globalWindow2['default'].koment && _globalWindow2['default'].koment[name]) {
        _utilsLogJs2['default'].warn('The ' + name + ' component was added to the koment object when it should be registered using koment.registerComponent(name, component)');
        return _globalWindow2['default'].koment[name];
      }
    }

    /**
     * Sets up the constructor using the supplied init method
     * or uses the init of the parent object
     *
     * @param {Object} props An object of properties
     * @static
     * @deprecated
     * @method extend
     */
  }, {
    key: 'extend',
    value: function extend(props) {
      props = props || {};

      _utilsLogJs2['default'].warn('Component.extend({}) has been deprecated, use koment.extend(Component, {}) instead');

      // Set up the constructor using the supplied init method
      // or using the init of the parent object
      // Make sure to check the unobfuscated version for external libs
      var init = props.init || props.init || this.prototype.init || this.prototype.init || function () {};
      // In Resig's simple class inheritance (previously used) the constructor
      //  is a function that calls `this.init.apply(arguments)`
      // However that would prevent us from using `ParentObject.call(this);`
      //  in a Child constructor because the `this` in `this.init`
      //  would still refer to the Child and cause an infinite loop.
      // We would instead have to do
      //    `ParentObject.prototype.init.apply(this, arguments);`
      //  Bleh. We're not creating a _super() function, so it's good to keep
      //  the parent constructor reference simple.
      var subObj = function subObj() {
        init.apply(this, arguments);
      };

      // Inherit from this object's prototype
      subObj.prototype = Object.create(this.prototype);
      // Reset the constructor property for subObj otherwise
      // instances of subObj would have the constructor of the parent Object
      subObj.prototype.constructor = subObj;

      // Make the class extendable
      subObj.extend = Component.extend;

      // Extend subObj's prototype with functions and other properties from props
      for (var _name in props) {
        if (props.hasOwnProperty(_name)) {
          subObj.prototype[_name] = props[_name];
        }
      }

      return subObj;
    }
  }]);

  return Component;
})();

Component.registerComponent('Component', Component);
exports['default'] = Component;
module.exports = exports['default'];