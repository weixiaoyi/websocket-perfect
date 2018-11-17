# websocket-perfect

[![npm version](https://img.shields.io/npm/v/websocket-perfect.svg?style=flat-square)](https://www.npmjs.com/package/websocket-perfect)

  websocket封装，支持业务的重新订阅，断开重连,支持Rxjs6

  ## websocket-perfect 如何使用
  npm安装后使用方式如下：
  ```javascript
  import Ws from 'websocket-perfect'

  const ws = new Ws({
    url: 'ws://api.weixiaoyi/ws',
    buffer: true,
    debug: true
  })

  ws.send({
    subscribe: 'apple',
  })
  .subscribe(([e, data]) => {
    console.log(data)
  })
  ```
  ## websocket-perfect API
  ```javascript
  const ws = new Ws(options)
  ```
  ## Options
  ```javascript
  const ws = new Ws({
    url: 'ws://api.weixiaoyi/ws',
    buffer: true, //所有已订阅的业务是否被缓存起来以当socket断开重连后重新订阅
    bufferSize: 2, // 最大缓存数量
    debug: true, //开启输出log模式
    beforeSend:message=>console.log('开始订阅'),
    afterSend:message=>console.log('订阅完毕')
  })
  ```
  #### `buffer`
  - 决定`ws.send(message)`的参数`message`是否缓存起来,此配置全局有效，权重最高
  - Accepts `true` or `false`
  - Default value: `undefiend`
  #### `bufferWhen`
  - 由用户决定`ws.send(message)`的参数`message`是否缓存起来，返回`true`缓存，返回`false`不缓存,该函数第二个参数，是被拦截器处理过的`message`,如果没有拦截器，`data`完全相等于`message`
  - Accepts `(message,data)=>boolean`
  - Default value: `undefiend`
  #### `bufferSize`
  - 由用户决定`ws.send(message)`的参数`message`最大缓存数量
  - Accepts `Number`
  - Default value: `undefiend`
  #### `beforeSend`
  - `ws.send(message)`之前的钩子函数，该函数第二个参数，是被拦截器处理过的`message`,如果没有拦截器，`data`完全相等于`message`
  - Accepts `(message,data)=>void`
  - Default value: `undefiend`
  #### `afterSend`
  - `ws.send(message)`之后的钩子函数，该函数第二个参数，是被拦截器处理过的`message`,如果没有拦截器，`data`完全相等于`message`
  - Accepts `(message,data)=>void`
  - Default value: `undefiend`
  
  ## Methods
  #### `ws.send(message)`
  - 订阅业务，该方法返回结果是一个`observable`对象,可直接使用`Rxjs`所有的操作符，调用`subscrible`方法可立即订阅结果
  - message 订阅参数
  #### `ws.close()`
  - 客户端主动关闭websoket连接
  #### `ws.interceptor(message => message, ([e, data]) => [e,data])`
  - websocket配置拦截器，分别处理`message`发送前的数据和收到响应的数据
  - params[0] 拦截器预处理发送参数
  - params[1] 拦截器预处理响应的数据，参数`e`是完整的数据，`data`是`e`的`data`属性
  
  ##  缓存设置
  1. 开启订阅参数的缓存，必须把`buffer`设置为`true`
  2. `bufferSize` 决定了最大缓存量
  3. `bufferWhen` 交由用户决定是否缓存该订阅参数
  4. 可以将`ws.send(message)`方法的参数`message`添加一个`_flush`的属性，或者在`ws.interceptor`拦截器给message添加，带有此属性的`message`将被自动缓存，该规则权重最低  
