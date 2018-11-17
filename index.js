import { formatJson, } from './utils'
import _ from 'lodash'
import { Subject } from 'rxjs'

class Ws {
  constructor({ url, debug = true, buffer, bufferCount, beforeSend, afterSend, bufferWhen }) {
    this._config = {
      debug,
      url,
      buffer,
      bufferCount,
      bufferWhen,
      beforeSend,
      afterSend,
    }
    this._subscribeRecords = []
    this._promises = []
    this._ws$ = new Subject()
    this._ws = this._createWebsocket()
    this._interceptor = {}
  }

  _clearAll = () => {
    this._subscribeRecords = []
    this._promises = []
  }

  _createWebsocket = () => {
    const { url } = this._config
    const ws = new WebSocket(url)
    ws.onopen = () => {
      this._debug(`${url}连接开启.....`)
      if (this._subscribeRecords.length) {
        this._subscribeRecords.forEach(item => this._sendJson(undefined, item))
      }
      if (this._promises.length) {
        this._promises.forEach(item => this._sendJson(undefined, item))
        this._promises = []
      }
    }
    ws.onmessage = (e) => {
      if (!this._ws$.closed) {
        let result = [e, formatJson(e.data)]
        if (_.isFunction(this._interceptor.after)) result = this._interceptor.after(result)
        this._ws$.next(result)
      }
    }
    ws.onclose = (e) => {
      this._debug(`${url}连接关闭...`, e)
      this._repeatConnect(e)
    }
    ws.onerror = (e) => {
      this._debug(`${url}连接错误`, e)
      // 连接错误自动会促发连接关闭，这里不需要再次连接
    }
    return ws
  }

  _hasConnected = () => {
    return this._ws.readyState === 1
  }

  _sendJson = (message, obj) => {
    const { afterSend } = this._config
    this._ws.send(JSON.stringify(obj))
    if (_.isFunction(afterSend)) {
      afterSend(message, obj)
    }
  }

  _bufferWhen = (message, obj) => {
    const { bufferWhen, buffer } = this._config
    if (buffer === true || buffer === false) {
      return buffer
    }
    if (_.isFunction(bufferWhen)) {
      return bufferWhen(message, obj)
    }
    return obj._buffer === true
  }

  send = (message = {}) => {
    try {
      let obj = _.cloneDeep(message)
      const { bufferCount, beforeSend } = this._config
      if (_.isFunction(this._interceptor.before)) obj = this._interceptor.before(obj)
      if (!_.isObject(obj)) throw('send的参数或经interceptor处理后的结果必须是对象格式')
      const [clone_message, clone_obj] = [_.cloneDeep(message), _.cloneDeep(obj)]
      if (this._bufferWhen(clone_message, clone_obj)) {
        this._subscribeRecords.push(obj)
      }
      if (this._subscribeRecords.length && bufferCount && _.isInteger(bufferCount)) {
        this._subscribeRecords = this._subscribeRecords.slice(-bufferCount)
      }
      if (_.isFunction(beforeSend)) {
        beforeSend(clone_message, clone_obj)
      }
      if (!this._hasConnected()) {
        this._promises.push(obj)
      } else {
        this._sendJson(clone_message, clone_obj)
      }
    } catch ( error ) {
      console.error(error)
    }
    return this._ws$
  }

  interceptor = (before, after) => {
    this._interceptor.before = before
    this._interceptor.after = after
  }

  unsubscribe = () => {
    this._clearAll()
    this._ws$.unsubscribe()
  }

  close = () => {
    this._ws.close(4000, 'selfClose')
  }

  _repeatConnect = (e) => {
    if (e.type === 'close' || e.type === 'error') {
      if (_.get(e, 'reason') === 'selfClose') return this._debug('主动断开', e)
      this._ws = this._createWebsocket()
    }
  }

  _debug = (...params) => {
    const { debug } = this._config
    debug && console.log(...params)
  }
}

export default Ws
