"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _index = require("../utils/index");

var _lodash = _interopRequireDefault(require("lodash"));

var _rxjs = require("rxjs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Ws = function Ws(_ref) {
  var _this = this;

  var _url = _ref.url,
      _ref$debug = _ref.debug,
      _debug = _ref$debug === void 0 ? true : _ref$debug,
      _buffer = _ref.buffer,
      _bufferSize = _ref.bufferSize,
      _beforeSend = _ref.beforeSend,
      _afterSend = _ref.afterSend,
      _bufferWhen = _ref.bufferWhen;

  _classCallCheck(this, Ws);

  _defineProperty(this, "_clearAll", function () {
    _this._subscribeRecords = [];
    _this._promises = [];
  });

  _defineProperty(this, "_createWebsocket", function () {
    var url = _this._config.url;
    var ws = new WebSocket(url);

    ws.onopen = function () {
      _this._debug("".concat(url, "\u8FDE\u63A5\u5F00\u542F....."));

      if (_this._subscribeRecords.length) {
        _this._subscribeRecords.forEach(function (item) {
          return _this._sendJson(undefined, item);
        });
      }

      if (_this._promises.length) {
        _this._promises.forEach(function (item) {
          return _this._sendJson(undefined, item);
        });

        _this._promises = [];
      }
    };

    ws.onmessage = function (e) {
      if (!_this._ws$.closed) {
        var result = [e, (0, _index.formatJson)(e.data)];
        if (_lodash.default.isFunction(_this._interceptor.after)) result = _this._interceptor.after(result);

        _this._ws$.next(result);
      }
    };

    ws.onclose = function (e) {
      _this._debug("".concat(url, "\u8FDE\u63A5\u5173\u95ED..."), e);

      _this._repeatConnect(e);
    };

    ws.onerror = function (e) {
      _this._debug("".concat(url, "\u8FDE\u63A5\u9519\u8BEF"), e); // 连接错误自动会促发连接关闭，这里不需要再次连接

    };

    return ws;
  });

  _defineProperty(this, "_hasConnected", function () {
    return _this._ws.readyState === 1;
  });

  _defineProperty(this, "_sendJson", function (message, obj) {
    var afterSend = _this._config.afterSend;

    _this._ws.send(JSON.stringify(obj));

    if (_lodash.default.isFunction(afterSend)) {
      afterSend(message, obj);
    }
  });

  _defineProperty(this, "_bufferWhen", function (message, obj) {
    var _this$_config = _this._config,
        bufferWhen = _this$_config.bufferWhen,
        buffer = _this$_config.buffer;

    if (buffer === true || buffer === false) {
      return buffer;
    }

    if (_lodash.default.isFunction(bufferWhen)) {
      return bufferWhen(message, obj);
    }

    return obj._buffer === true;
  });

  _defineProperty(this, "send", function () {
    var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    try {
      var obj = _lodash.default.cloneDeep(message);

      var _this$_config2 = _this._config,
          bufferSize = _this$_config2.bufferSize,
          beforeSend = _this$_config2.beforeSend;
      if (_lodash.default.isFunction(_this._interceptor.before)) obj = _this._interceptor.before(obj);
      if (!_lodash.default.isObject(obj)) throw 'send的参数或经interceptor处理后的结果必须是对象格式';
      var _ref2 = [_lodash.default.cloneDeep(message), _lodash.default.cloneDeep(obj)],
          clone_message = _ref2[0],
          clone_obj = _ref2[1];

      if (_this._bufferWhen(clone_message, clone_obj)) {
        _this._subscribeRecords.push(obj);
      }

      if (_this._subscribeRecords.length && bufferSize && _lodash.default.isInteger(bufferSize)) {
        _this._subscribeRecords = _this._subscribeRecords.slice(-bufferSize);
      }

      if (_lodash.default.isFunction(beforeSend)) {
        beforeSend(clone_message, clone_obj);
      }

      if (!_this._hasConnected()) {
        _this._promises.push(obj);
      } else {
        _this._sendJson(clone_message, clone_obj);
      }
    } catch (error) {
      console.error(error);
    }

    return _this._ws$;
  });

  _defineProperty(this, "interceptor", function (before, after) {
    _this._interceptor.before = before;
    _this._interceptor.after = after;
  });

  _defineProperty(this, "unsubscribe", function () {
    _this._clearAll();

    _this._ws$.unsubscribe();
  });

  _defineProperty(this, "close", function () {
    _this._ws.close(4000, 'selfClose');
  });

  _defineProperty(this, "_repeatConnect", function (e) {
    if (e.type === 'close' || e.type === 'error') {
      if (_lodash.default.get(e, 'reason') === 'selfClose') return _this._debug('主动断开', e);
      _this._ws = _this._createWebsocket();
    }
  });

  _defineProperty(this, "_debug", function () {
    var _console;

    var debug = _this._config.debug;
    debug && (_console = console).log.apply(_console, arguments);
  });

  this._config = {
    debug: _debug,
    url: _url,
    buffer: _buffer,
    bufferSize: _bufferSize,
    bufferWhen: _bufferWhen,
    beforeSend: _beforeSend,
    afterSend: _afterSend
  };
  this._subscribeRecords = [];
  this._promises = [];
  this._ws$ = new _rxjs.Subject();
  this._ws = this._createWebsocket();
  this._interceptor = {};
};

var _default = Ws;
exports.default = _default;