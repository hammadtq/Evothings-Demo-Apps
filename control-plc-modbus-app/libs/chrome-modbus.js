(function () {

    Function.prototype.method = function (name, func) {
    
        this.prototype[name] = func;
        return this;
    
    };
    
    Function.method('inherits', function (superCtor) {
    
        this.super_ = superCtor;
        this.prototype = Object.create(superCtor.prototype, {
            constructor: {
                value: this,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
    
        return this;
    });
    
    
    
    var Events = function () {
    
        if (!(this instanceof Events))
            return new Events();
    
        var cbList = { };
    
        this.fire = function (name, args) {
        
            if (!cbList[name]) {
    
                return;
    
            }
    
            for (var i in cbList[name]) {
                
                cbList[name][i].apply(this, args);
            
            }
    
            return this;
        
        };
    
        
        this.fireLater = function (name, args) {
    
            if (args === undefined) {
    
                args = [];
    
            }
    
            return function () {
    
                var aA  = Array.protoype.slice.call(arguments, 0),
                    a   = args.concat(aA);
    
                this.fire(name, a.length > 0 ? a : undefined);
    
            }.bind(this);
    
        };
    
        this.on = function (name, func) {
    
            if (!cbList.hasOwnProperty(name)) {
    
                cbList[name] = [];
            
            }
    
            cbList[name].push(func);
    
            return { 
                name    : name, 
                index   : cbList[name].length - 1 
            };
    
        };
    
        this.off = function (id) {
    
            cbList[id.name].splice(id.index);
    
            return this;
    
        };
    
    };
    
    
    
    
    var StateMachine = function (initState) {
    
        if (!(this instanceof StateMachine)) {
            return new StateMachine(initState);
        }
    
        Events.call(this);
    
        var state = initState;
    
        this.inState = function (newState) {
    
            return state === newState;
    
        };
    
        this.getState = function () {
    
            return state;
    
        };
    
        this.setState = function (newState) {
    
            var oldState = state;
    
            state = newState;
    
            this.fire('state_changed', [oldState, newState]);
            
            return this;
    
        };
    
    };
    
    StateMachine.inherits(Events);
    
    
    
    
    // constants
    
    var MBAP_TID                = 0,
        MBAP_PID                = 2,
        MBAP_LEN                = 4,
        MBAP_UID                = 6,
        BODY_FC                 = 0,
        BODY_START              = 1,
        BODY_COUNT              = 3,
        READ_COILS              = 1,
        READ_HOLDING_REGISTERS  = 3,
        READ_INPUT_REGISTERS    = 4,
        WRITE_SINGLE_COIL       = 5,
        WRITE_SINGLE_REGISTER   = 6,
        WRITE_MULTIPLE_REGISTERS = 16;
    
    var ModbusRequest = function (id, length) {
    
        if (!(this instanceof ModbusRequest)) {
            return new ModbusRequest(id, length);
        }
    
        var deferred   = $.Deferred(),
            packet     = new ArrayBuffer(length),
            header     = new DataView(packet, 0, 7),
            timeout    = null;
    
        var init = function () {
     
            header.setUint16(MBAP_TID, id);
            header.setUint16(MBAP_PID, 0);
            header.setUint16(MBAP_LEN, length - 6);
            header.setUint8(MBAP_UID, 255);
        
        }.bind(this);
    
    
        this.getId = function () {
        
            return id;
    
        };
    
        this.getPacket = function () {
        
            return packet;
    
        };
    
        this.getPromise = function () {
    
            return deferred.promise();
    
        };
    
        this.reject = function () {
    
            deferred.reject.apply(null, arguments);
    
            return this;
    
        };
    
        this.resolve = function () {
    
            deferred.resolve.apply(null, arguments);
    
            return this;
    
        };
    
        this.getTimeout = function () {
        
            return timeout;
    
        };
        
        this.setTimeout = function (to) {
    
            timeout = to;
    
            return this;
    
        };
    
        init();
    
    };
    
    var ReadCoilsRequest = function (id, start, count) {
    
        if (!(this instanceof ReadCoilsRequest)) {
            return new ReadCoilsRequest(id, start, count);
        }
    
        ModbusRequest.call(this, id, 12);
    
        var body;
    
        var init = function () {
     
            body = new DataView(this.getPacket(), 7, 5);
    
            body.setUint8(BODY_FC, READ_COILS); 
            body.setUint16(BODY_START, start);
            body.setUint16(BODY_COUNT, count);
        
        }.bind(this);
    
        this.getStart = function () {
        
            return start;
        
        };
    
        this.getCount = function () {
        
            return count;
        
        };
    
        this.handleResponse = function (data, offset) {
     
            var mbap        = new DataView(data, offset, 7),
                pdu         = new DataView(data, offset + 7, 2),
                fc          = pdu.getUint8(0),
                byte_count  = pdu.getUint8(1);
    
            if (fc > 0x80) {
          
                this.reject({ errCode: 'serverError' });
    
                return 2;
    
            }
    
            var dv          = new DataView(data, offset + 9, byte_count),
                fc_data     = [], i, t, j, mask,
                c           = count;
            
            for (i = 0; i < count; i += 1) {
            
                t = dv.getUint8(i);
    
                for (j = 0; j < 7; j += 1) {
                
                    mask = 1 << j;
    
                    fc_data.push(t & mask !== 0);
    
                    c -= 1;
    
                    if (c === 0) {
                        break;
                    }
    
                }
    
            }
    
            this.resolve(fc_data, this);
    
            return byte_count + 2;
    
        };
    
        init();
    
    };
    
    ReadCoilsRequest.inherits(ModbusRequest);
    
    var ReadHoldingRegistersRequest = function (id, start, count) {
    
        if (!(this instanceof ReadHoldingRegistersRequest)) {
            return new ReadHoldingRegistersRequest(id, start, count);
        }
    
        ModbusRequest.call(this, id, 12);
    
        var body;
       
        var init = function () {
        
            body = new DataView(this.getPacket(), 7, 5);
    
            body.setUint8(BODY_FC, READ_HOLDING_REGISTERS);
            body.setUint16(BODY_START, start);
            body.setUint16(BODY_COUNT, count);
    
        }.bind(this);
    
        this.getStart = function () {
        
            return start;
        
        };
    
        this.getCount = function () {
        
            return count;
        
        };
    
        this.handleResponse = function (data, offset) {
         
            var mbap        = new DataView(data, offset, 7),
                pdu         = new DataView(data, offset + 7, 2),
                fc          = pdu.getUint8(0),
                byte_count  = pdu.getUint8(1);
    
            if (fc > 0x80) {
          
                this.reject({ errCode: 'serverError' });
    
                return 2;
    
            }
    
            var dv      = new DataView(data, offset + 7 + 2, byte_count),
                fc_data = [];
    
            for (var i = 0; i < byte_count / 2; i += 1) {
            
                fc_data.push(dv.getUint16(i * 2));
            
            }
    
            this.resolve(fc_data, this);
    
            return byte_count + 2;
    
        };
       
        init();
    
    };
    
    ReadHoldingRegistersRequest.inherits(ModbusRequest);
    
    var ReadInputRegistersRequest = function (id, start, count) {
    
        if (!(this instanceof ReadInputRegistersRequest)) {
            return new ReadInputRegistersRequest(id, start, count);
        }
    
        ModbusRequest.call(this, id, 12);
    
        var body;
       
        var init = function () {
        
            body = new DataView(this.getPacket(), 7, 5);
    
            body.setUint8(BODY_FC, READ_INPUT_REGISTERS); 
            body.setUint16(BODY_START, start);
            body.setUint16(BODY_COUNT, count);
    
        }.bind(this);
    
        this.getStart = function () {
        
            return start;
        
        };
    
        this.getCount = function () {
        
            return count;
        
        };
    
    
    
        this.handleResponse = function (data, offset) {
         
            var mbap        = new DataView(data, offset, 7),
                pdu         = new DataView(data, offset + 7, 2),
                fc          = pdu.getUint8(0),
                byte_count  = pdu.getUint8(1);
    
            if (fc > 0x80) {
          
                this.reject({ errCode: 'serverError' });
    
                return 2;
    
            }
    
            var dv      = new DataView(data, offset + 7 + 2, byte_count),
                fc_data = [];
    
            for (var i = 0; i < byte_count / 2; i += 1) {
            
                fc_data.push(dv.getUint16(i * 2));
            
            }
    
            this.resolve(fc_data, this);
    
            return byte_count + 2;
    
        };
    
        init();
    
    };
    
    ReadInputRegistersRequest.inherits(ModbusRequest);
    
    var WriteSingleCoilRequest = function (id, address, value) {
    
        if (!(this instanceof WriteSingleCoilRequest)) {
            return new WriteSingleCoildRequest(id, address, value);
        }
    
        ModbusRequest.call(this, id, 12);
    
        var body;
       
        var init = function () {
           
            body = new DataView(this.getPacket(), 7, 5);
     
            body.setUint8(BODY_FC, WRITE_SINGLE_COIL);
            body.setUint16(BODY_START, address);
            body.setUint16(BODY_COUNT, value?65280:0);
    
        }.bind(this);
    
        this.getAddress = function () {
        
            return address;
        
        };
    
        this.getValue = function () {
        
            return value;
        
        };
    
    
    
        this.handleResponse = function (data, offset) {
    
            var mbap        = new DataView(data, offset, 7),
                pdu         = new DataView(data, offset + 7, 5),
                fc          = pdu.getUint8(0),
                start       = pdu.getUint8(1),
                value       = pdu.getUint16(3);
    
            if (fc > 0x80) {
          
                this.reject({ errCode: 'serverError' });
    
                return 2;
    
            }
    
            this.resolve(this);
    
            return 5;
    
        };
     
        init();
    
    };
    
    
    WriteSingleCoilRequest.inherits(ModbusRequest);
    
    var WriteSingleRegisterRequest = function (id, address, value) {
    
        if (!(this instanceof WriteSingleRegisterRequest)) {
            return new WriteSingleRegisterRequest(id, address, value);
        }
    
        ModbusRequest.call(this, id, 12);
    
        var body;
       
        var init = function () {
           
            body = new DataView(this.getPacket(), 7, 5);
    
            body.setUint8(BODY_FC, WRITE_SINGLE_REGISTER);
            body.setUint16(BODY_START, address);
            body.setUint16(BODY_COUNT, value);
    
        }.bind(this);
    
        this.getAddress = function () {
        
            return address;
        
        };
    
        this.getValue = function () {
        
            return value;
        
        };
    
    
        this.handleResponse = function (data, offset) {
    
            var mbap        = new DataView(data, offset, 7),
                pdu         = new DataView(data, offset + 7, 5),
                fc          = pdu.getUint8(0),
                start       = pdu.getUint16(1),
                value       = pdu.getUint16(3);
    
            if (fc > 0x80) {
          
                this.reject({ errCode: 'serverError' });
    
                return 2;
    
            }
    
            this.resolve(this);
    
            return 5;
    
        };
    
        init();
    
    };
    
    WriteSingleRegisterRequest.inherits(ModbusRequest);
    
    var WriteMultipleRegistersRequest = function (id, address, values) {
    
        if (!(this instanceof WriteMultipleRegistersRequest)) {
            return new WriteMultipleRegistersRequest(id, address, values);
        }
    
        ModbusRequest.call(this, id, 7 + 6 + (values.length * 2));
    
        var body;
       
        var init = function () {
           
            body = new DataView(this.getPacket(), 7, 6 + (values.length * 2));
    
            body.setUint8(BODY_FC, WRITE_MULTIPLE_REGISTERS);
            body.setUint16(1, address);
            body.setUint16(3, values.length);
            body.setUint8(5, 2 * values.length);
            values.forEach(function (v, i) {
                body.setUint16(6 + (i * 2), v);
            });
    
        }.bind(this);
    
        this.getAddress = function () {
        
            return address;
        
        };
    
        this.getValues = function () {
        
            return values;
        
        };
    
    
        this.handleResponse = function (data, offset) {
    
            var mbap        = new DataView(data, offset, 7),
                pdu         = new DataView(data, offset + 7, 5),
                fc          = pdu.getUint8(0),
                start       = pdu.getUint16(1),
                quant       = pdu.getUint16(3);
    
            if (fc > 0x80) {
          
                this.reject({ errCode: 'serverError' });
    
                return 2;
    
            }
    
            this.resolve(this);
    
            return 5;
    
        };
    
        init();
    
    };
    
    WriteMultipleRegistersRequest.inherits(ModbusRequest);
    
    
    var ModbusRequestManager = function () {
    
        if (!(this instanceof ModbusRequestManager))
            return new ModbusRequestManager();
    
        StateMachine.call(this, 'ready');
    
        var queue           = [],
            currentRequest  = null,
            socketId        = null,
            receiveBuffer   = [ ];
    
        var init = function () {
        
            chrome.sockets.tcp.onReceive.addListener(receiveListener);
    
            this.on('state_changed', function onStateChanged (oldState, newState) {
           
                if (newState === 'ready')
                    send();
            
            }.bind(this));
    
        }.bind(this);
    
        var receiveListener = function (info) {
    
            if (info.socketId !== socketId) {
    
                return;
    
            }
    
    
            if (this.inState('waiting')) {
    
                receiveBuffer.push(info);
    
                handleResponse();
    
            } else {
            console.log("Received Packet while waiting")
                throw new Error('ModbusRequestManager - Received Packet while in state "waiting".');
            
            }
    
        }.bind(this);
    
    
        var handleResponse = function handleResponse () {
    console.log("Trying to handle response")
            console.log('ModbusRequestManager', 'Trying to handle response.');
    
            if (receiveBuffer.length === null) {
                return;
            }
    
            var response    = receiveBuffer.shift(),
                data        = response.data;
    
            if (data.byteLength < 7) {
    console.log("Wrong packet size")
                console.log('ModbusRequestManager', 'Wrong packet size.', (data.byteLength));
                return;
    
            }
    
            // read the header
            var mbap            = new DataView(data, 0, 7),
                tid             = mbap.getUint16(0);
    
            if (!currentRequest) {
     console.log("No current request, strange!!")
                console.error('ModbusRequestManager', 'No current request, strange!!', currentRequest);
    
                return;
               
            }
    
            if (currentRequest.getId() !== tid) {
            console.log("CurrentRequest tid !== received tid")
                console.error('ModbusRequestManager', 'CurrentRequest tid !== received tid', currentRequest.getId(), tid);
    
                return;
            
            }
    console.log("Request handled fine")
            console.log('ModbusRequestManager', 'Request handled fine.');
    
            // cleartimeout
            clearTimeout(currentRequest.getTimeout()); 
    
            // handle fc response       
            currentRequest.handleResponse(data, 0); 
    
            this.setState('ready');
           
        }.bind(this);
    
    
        var send = function () {
    console.log("Nothing in Queue.")
            if (queue.length === 0) {
                console.log('ModbusRequestManager', 'Nothing in Queue.');
                return;
            }
    
            this.setState('sending');
    console.log("Trying to send packet.")
            console.log('ModbusRequestManager', 'Trying to send packet.');
    
            currentRequest = queue.shift();
    
            // Before sending set the timeout for this request
    
            var timeout_no = setTimeout(function () {
     console.log("Timeout occured.")
                console.log('ModbusRequestManager', 'Timeout occured.');
    
                currentRequest.reject({ errCode: 'timeout' });
          
                this.fire('error', [{ errCode: 'timeout' }]);
    
            }.bind(this), 5000);
    
            currentRequest.setTimeout(timeout_no);
    console.log("Sending packet...")
            console.log('ModbusRequestManager', 'Sending packet...');
    
            chrome.sockets.tcp.send(socketId, currentRequest.getPacket(), function (sendInfo) {
      
                if (sendInfo.resultCode < 0) {
                 console.log("A error occured while sending packet.")
                    console.log('ModbusRequestManager', 'A error occured while sending packet.', sendInfo.resultCode);
    
                    currentRequest.reject({ errCode: 'sendError' });
    
                    this.setState('ready');
    
                    return;
    
                }
    console.log("Packet send! Waiting for response.")
                console.log('ModbusRequestManager', 'Packet send! Waiting for response.');
           
                this.setState('waiting');
    
            }.bind(this));
        
        }.bind(this);
    
        this.setSocketId = function (id) {
        
            socketId = id;
    
            return this;
        
        };
    
        this.sendPacket = function (packet) {
     console.log("Queing a new packet.")
            console.log('ModbusRequestManager', 'Queing a new packet.');
    
            queue.push(packet);
       
            if (socketId === null) {
                throw new Error('ModbusRequestManager - No socketId provided.');
            }
    
            if (!this.inState('ready')) {
                return;
            }
    
            send();  
    
            return this;
    
        };
    
        this.clear = function () {
        
            while (queue.length > 0) {
                queue.pop().reject({ 'errCode' : 'clientOffline' });
            }
    
            this.setState('ready');
        
        };
    
        this.flush = function () {
       
            console.log('ModbusRequestManager', 'Flush');
    
            if (socketId === null) {
                return;
            }
    
            send();
    
            return this;
        
        };
    
        init();
    
    };
    
    ModbusRequestManager.inherits(StateMachine);
    
    
    ModbusClient = function (userhost, userport, timeout, autoreconnect) { 
       
        if (!(this instanceof ModbusClient))
            return new ModbusClient(timeout, autoreconnect);
    
        // needed for the inheritance
        StateMachine.call(this, 'init');
    
        var host            = userhost,
            port            = userport,
            id              = 0,
            requestManager  = new ModbusRequestManager(),
            isWaiting       = false,
            isReconnecting  = false,
            socketId;
    
        var init = function init () {
     
            if (!timeout) 
                timeout = 5000;
       
            requestManager.on('error', function (err) {
           
                if (this.inState('offline')) {
                    return;
                }
    
                this.fire('error', [err]);
                
                if (autoreconnect) {
                    this.reconnect();
                } else {
                    this.disconnect();
                }
            
            }.bind(this)); 
    
            // flush everything when going from error to online again
            this.on('state_changed', function (oldState, newState) {
    
                console.log('state changed', oldState, newState);
    
                this.fire(newState);
    
                if (oldState === 'error' && newState === 'online') {
    
                    requestManager.flush();
    
                }
            
            }.bind(this));
    
            this.on('offline', function () {
    
                requestManager.clear();        
            
            }.bind(this));
    
            this.on('online', function () {
            
                isReconnecting = false;
            
            }.bind(this));
    
            this.on('error', function () {
            
                isReconnecting = false;
            
            }.bind(this));
    
            createSocket();
    
        }.bind(this);
    
        var onReceiveError = function onReceiveError (info) {
     
            console.log('ModbusClient', 'Receive Error occured.', info, socketId);
    
            if (info.socketId !== socketId) 
                return;
    
    
            this.setState('offline');
            this.fire('error', [{ errCode: 'ServerError', args: arguments }]);
    
            if (autoreconnect) {
    
                console.log('ModbusClient', 'AutoReconnect enabled, reconnecting.');
    
                this.reconnect();
    
                return;
    
            }
    
            console.log('ModbusClient', 'Disconnecting client.');
    
            this.close(); 
        
        }.bind(this);
    
        var createSocket = function createSocket () {
        
               
            console.log('ModbusClient', 'Creating socket.');
    
            chrome.sockets.tcp.onReceiveError.addListener(onReceiveError);
    
            chrome.sockets.tcp.create({}, function (createInfo) {
    
                console.log('ModbusClient', 'Socket created.', createInfo);
    
                socketId = createInfo.socketId;    
   
                requestManager.setSocketId(socketId);
    
                this.setState('offline');
                this.fire('ready');
    
            }.bind(this));
        
        }.bind(this);
    
        var createNewId = function () {
    
            id = (id + 1) % 10000;
            
      
            return id;
    
        }.bind(this);
    
        var sendPacket = function (req) {
           
            // invalid states for sending packages
            if (!this.inState('online')) {
    
                return;
    
            }
    
            requestManager.sendPacket(req);
    
        }.bind(this);
    
        this.isOnline = function () {
        
            return this.inState('online');
    
        }.bind(this);
     
    
        this.readCoils = function (start, count) {
    
            var request = new ReadCoilsRequest(createNewId(), start, count);
    
            if (!this.inState('online')) {
    
                request.reject({ errCode: 'offline' });
                return request.getPromise();
    
            }
    
            sendPacket(request);
    
            return request.getPromise();
    
        };
    
        this.readHoldingRegisters = function (start, count) {
    
            var request = new ReadHoldingRegistersRequest(createNewId(), start, count);
    
            if (!this.inState('online')) {
    
                request.reject({ errCode: 'offline' });
                return request.getPromise();
    
            }
    
            sendPacket(request);
    
            return request.getPromise();
    
        };
    
    
        this.readInputRegisters = function (start, count) {
    
            var request = new ReadInputRegistersRequest(createNewId(), start, count);
    
            if (!this.inState('online')) {
    
                request.reject({ errCode: 'offline' });
                return request.getPromise();
    
            }
    
            sendPacket(request);
    
            return request.getPromise();
    
        };
    
        this.writeSingleCoil = function (address, value) {
    
            var request = new WriteSingleCoilRequest(createNewId(), address, value);
    
            if (!this.inState('online')) {
    
                request.reject({ errCode: 'offline' });
                return request.getPromise();
    
            }
    
            sendPacket(request);
    
            return request.getPromise();
    
        };
    
        this.writeSingleRegister = function (address, value) {
    
            var request = new WriteSingleRegisterRequest(createNewId(), address, value);
    
            if (!this.inState('online')) {
    
                request.reject({ errCode: 'offline' });
                return request.getPromise();
    
            }
    
            sendPacket(request);
    
            return request.getPromise();
    
        };
    
        this.writeMultipleRegisters = function (address, values) {
        
            var request = new WriteMultipleRegistersRequest(createNewId(), address, values);
    
            if (!this.inState('online')) {
            
                request.reject({ errCode: 'offline' });
                return request.getPromise();
    
            }
    
            sendPacket(request);
    
            return request.getPromise();
        
        };
    
        var connect = function () {
    console.log("connect function")
            if (this.inState('connecting') || this.inState('online')) {
                return;
            }
    
            this.setState('connecting');
            this.fire('busy');
    
            console.log('ModbusClient', 'Establishing connection.', socketId, host, port);
    
            chrome.sockets.tcp.connect(socketId, host, port, function (result) {
    
                console.log('ModbusClient', 'Connect returned', arguments);
    
                if (result !== 0) {
    
                    console.log('ModbusClient', 'Connection failed.', result);
    
                    this.fire('error', [{
                        errCode: 'connectionError',
                        result: result
                    }]);
    
    
                    if (autoreconnect) {
                    
                        console.log('ModbusClient', 'Auto Reconnect enabled, trying to reconnect.');
    
                        this.reconnect(5000);
                    
                    }
    
                    return;
                
                }
     			
                console.log('ModbusClient', 'Connection successfull.');
    
                this.setState('online');
    
            
            }.bind(this));
    
            return this;
         
        }.bind(this);
    
        this.setHost = function (h) {
        
            host = h;
    
            return this;
        
        };
    
        this.setPort = function (p) {
        
            port = p;
    
            return this;
        
        };
    
        this.getHost = function () {
            return host;
        };
    
        this.getPort = function () {
            return port;
        };
    
        this.connect = function () {
        
            connect();
       
            return this; 
    
        };
    
        this.disconnect = function (cb) {
    
            if (this.inState('disconnecting')) {
                return;
            }
    
            this.setState('disconnecting');
            this.fire('busy');
    
            console.log('ModbusClient', 'Disconnecting client.');
    
            chrome.sockets.tcp.disconnect(socketId, function () {
    
                console.log('ModbusClient', 'Client disconnected.');
    
    
                this.setState('offline');
    
                if (!cb) 
                    return;
    
                cb();
           
            }.bind(this));
    
            return this;
    
        };
    
        this.close = function (cb) {
    
            this.disconnect(function () {
    
                console.log('ModbusClient', 'Close socket.');
    
                chrome.sockets.tcp.close(socketId, function () {
            
                    console.log('ModbusClient', 'Client closed.');
    
                    this.setState('init');
    
                    socketId = null;
    
                    if (!cb)
                        return;
            
                }.bind(this));
    
            }.bind(this));
    
        };
    
        var reconnect = function () {
       
            if (this.inState('offline')) {
            
                console.log('ModbusClient', 'Client already disconnected.');
    
                connect();
    
                return;
    
            }
    
            chrome.sockets.tcp.disconnect(socketId, function () {
    
                console.log('ModbusClient', 'Client disconnected.', arguments);
    
                this.setState('offline');
    
                connect();
    
            }.bind(this));    
            
        }.bind(this);
    
        this.reconnect = function (wait) {
    
            if (isReconnecting)
                return;
    
            isReconnecting = true;
    
            this.fire('reconnecting');
    
            setTimeout(function () {
            
                reconnect();
            
            }.bind(this), wait?wait:0);
    
    
        };
    
        init();    
    
    };
    
    
    ModbusClient.inherits(StateMachine);
    
    
    
    var RangeList = function (max) {
    
        if (!(this instanceof RangeList)) {
            return new RangeList(max);
        }
    
        /*
         * Entries look like { start: x, end: y, items: [] }
         */
    
        var list = [];
    
        var shrink = function () {
     
            if (list.length === 1 ) {
                optimize();
                return this;
            }
    
            var next, j = 0;
    
            while (j < list.length - 1) {
    
                cur = list[j];
                next = list[j + 1];
    
                if (cur.end >= next.start - 1 ) {
                
                    cur.end = Math.max(cur.end, next.end);
    
                    list.splice(j + 1, 1);
               
                    continue;
    
                }
    
                j += 1;
    
            }
    
            optimize();
    
        }.bind(this);
    
        this.merge = function (start, end) {
    
            if (end <= start) {
                return this;
            }
    
            if (list.length === 0) {
    
                list.push({ start: start, end: end });
                return this;
    
            }
    
            for (var i in list) {
            
                cur = list[i];
    
                // neuer start ist größer als element ende
                // => füge am ender der liste ein
                
                if (cur.start > end) {
                
                    list.splice(i, 0, { start: start, end: end });
    
                    shrink();
    
                    return this;
    
                }
    
                if (cur.start >= start && cur.end > start) {
                    
                    if (cur.end < end) {
    
                        cur.start   = start;
                        cur.end     = start + end;
    
                        shrink();
    
                        return this;
    
                    }
    
                    if (cur.end >= end) {
                
                        cur.start   = start;
                        cur.end     = cur.end;
    
                        shrink();
    
                        return this;
                    
                    }
    
                }
    
                if (cur.start < start && cur.end > start) {
                
                    if (cur.end >= end) {
    
                        shrink();
    
                        return this;      
                    
                    }
    
                    if (cur.end < end) {
                    
                        cur.end     = end;
    
                        shrink();
    
                        return this;
    
                    }
    
                }
         
            }
    
            list.push({ start: start, end: end });
    
            shrink();
           
            return this;
    
        };
    
        var optimize = function () {
    
            if (!max) {
                return;
            }
    
            var l = [], start, end;
        
            for (var i = 0; i < list.length; i += 1) {
            
                if (list[i].end - list[i].start > max) {
    
                    list.splice(i + 1, 0, { start: list[i].start + max, end: list[i].end });
    
                    list[i].end = list[i].start + max;
    
    
                }
                    
            }
    
        }.bind(this);
    
        this.getList = function () {
    
            return list;
    
        };
    
    };
    
    if (typeof exports !== 'undefined') {
        exports.RangeList = RangeList;
    }
    
    
    ModbusLoop = function (client, duration) {
    
        if (!(this instanceof ModbusLoop)) {
            return new ModbusLoop(client, duration);
        }
    
        StateMachine.call(this, 'stop');
    
        var readInputRegistersList    = new RangeList(125),
            readHoldingRegistersList  = new RangeList(125),
            readCoilList              = new RangeList(125),
            inputRegisters            = [],
            holdingRegisters          = [],
            coils                     = [],
            startTime, 
            endTime, 
            lastTime = 0, 
            midTime;
    
        var init = function onInit () {
     
            this.on('state_changed', function (oldState, newState) {
       
                if (newState === 'start') 
                    this.fire(newState);
           
                if (newState === 'stop')
                    this.fire(newState);
    
            }.bind(this));
    
            client.on('disconnected', function () {
            
                this.setState('stop');
    
            }.bind(this));
    
            client.on('error', function () {
            
                this.setState('stop');
            
            }.bind(this));
       
        
        }.bind(this);
    
        var updateInputRegisters = function (start, data) {
        
            for (var i = 0; i < data.length; i += 1) {
    
                inputRegisters[start + i] = data[i] ;           
                        
            }
    
        }.bind(this);
    
        var updateHoldingRegisters = function (start, data) {
        
            for (var i = 0; i < data.length; i += 1) {
    
                holdingRegisters[start + i] = data[i] ;           
                        
            }
    
        }.bind(this);
    
        var executeInputRegistersLoop = function () {
     
            var promisses = [], 
                cur, 
                promise, 
                inputsList, 
                retPromise, 
                lists;
    
            inputsList = readInputRegistersList.getList();
     
            for (var i = 0; i < inputsList.length; i += 1) {
       
                cur = inputsList[i];
    
                promise = client.readInputRegisters(cur.start, cur.end - cur.start);
    
                promisses.push(promise);
    
            }
    
            retPromise = $.when.apply(this, promisses).then(function () {
         
                var args;
    
                if (promisses.length === 1) {
                    args = [arguments];
                } else {
                    args = arguments;
                }
    
                for (var i = 0; i < args.length; i += 1) {
               
                    if (!args[i]) {
                        continue;
                    }
    
                    updateInputRegisters(args[i][1].getStart(), args[i][0]);
                
                }
            
            }.bind(this));
    
            return retPromise;
        
        }.bind(this);
       
        var executeHoldingRegistersLoop = function () { 
     
            var promisses = [], 
                cur, 
                promise, 
                inputsList, 
                retPromise;
    
            inputsList = readHoldingRegistersList.getList();
     
            for (var i = 0; i < inputsList.length; i += 1) {
       
                cur = inputsList[i];
    
                promise = client.readHoldingRegisters(cur.start, cur.end - cur.start);
    
                promisses.push(promise);
    
            }
    
            retPromise = $.when.apply(this, promisses).then(function () {
         
                var args;
    
                if (promisses.length === 1) {
                    args = [arguments];
                } else {
                    args = arguments;
                }
    
    
                for (var i=0; i < args.length; i += 1) {
    
                    updateHoldingRegisters(args[i][1].getStart(), args[i][0]);
                
                }
    
            }.bind(this));
        
            return retPromise;
        
        }.bind(this);
     
        var executeLoop = function () {
    
            if (!this.inState('running')) {
                return;
            }
    
            startTime = new Date().getTime();
    
            var len_1   = readInputRegistersList.getList().length,
                len_2   = readHoldingRegistersList.getList().length,
                len     = len_1 + len_2;
    
            if (len === 0) {
            
                setTimeout(executeLoop.bind(this), 1000);
                return;
    
            }
    
            var loop_1 = executeInputRegistersLoop(),
                loop_2 = executeHoldingRegistersLoop();
    
            $.when.apply(this, [ loop_1, loop_2 ]).then(function () {

                    endTime = new Date().getTime(); 
    
                    midTime = (lastTime + (endTime - startTime)) / 2;
                    lastTime = midTime;
    
                    this.fire('update', [ 
                        inputRegisters, 
                        holdingRegisters, 
                        { startTime: startTime, endTime: endTime, midTime: midTime, requestCount: readHoldingRegistersList.getList().length + readInputRegistersList.getList().length, holdingRequests: readHoldingRegistersList.getList(), inputRequests: readInputRegistersList.getList() } ]);
     
    
                    executeLoop();
              
                }.bind(this)).fail(function () {
    
                    console.error('ModbusLoop', 'Error occured, stopping loop.', arguments);
    
                    executeLoop();
    
                    //this.setState('stop');
    
                }.bind(this));
    
        }.bind(this);
    
        this.readInputRegisters = function (start, count) {
    
            // put the start and end into the list
            readInputRegistersList.merge(start, start + count);
    
            return this;
    
        };
    
        this.readHoldingRegisters = function (start, count) {
    
            readHoldingRegistersList.merge(start, start + count);
    
            return this;
    
        };
    
        this.start = function () {
    
            if (!this.inState('stop') && !this.inState('init')) {
                return;
            }
    
            console.log('ModbusLoop', 'Starting loop.');
    
            this.setState('running');
    
            executeLoop();
    
        };
    
        this.stop = function () {
    
            console.log('ModbusLoop', 'Stopping loop.');
    
            this.setState('stop');
    
        };
    
        init();
    
    };
    
    ModbusLoop.inherits(StateMachine);
    
    
    
    
    var register_debug_id = 0;
    
    Register = function (client, loop, start) {
    
        if (!(this instanceof Register)) {
            return new Register(client, loop, start);
        }
    
        /*
         * States:
         *  init -> ready -> executing -> ready
         */
    
        StateMachine.call(this, 'init');
    
        var rd_id = register_debug_id++;
    
        console.log('Register',rd_id, 'Creating new instance.');
    
        var status = {
                stateflag_1     : false,
                stateflag_2     : false,
                stateflag_3     : false,
                stateflag_4     : false,
                state           : 0,
                cmd_count       : 0,
                cmd_ex          : false,
                cmd_err         : false,
                arg             : 0
            },
            loopListenerId,
            queue = [],
            cmdId = 0;
    
        loop.readHoldingRegisters(start, 4);
    
        var updateStatus = function (inputRegisters, holdingRegisters) {
    
            var status_reg = holdingRegisters[start],
                status_arg = holdingRegisters[start + 1];
    
            var s_1     = 0x0001,
                s_2     = 0x0002,
                s_3     = 0x0004,
                s_4     = 0x0008,
                s_state = 0x07F0,
                s_cid   = 0x3800,
                s_cide  = 0x4000,
                s_cidf  = 0x8000;
    
    
            status.stateflag_1 = (status_reg & s_1) >> 0;
            status.stateflag_2 = (status_reg & s_2) >> 1;
            status.stateflag_3 = (status_reg & s_3) >> 2;
            status.stateflag_4 = (status_reg & s_4) >> 3;
            status.state       = (status_reg & s_state) >> 4;
            status.cmd_count   = (status_reg & s_cid) >> 11;
            status.cmd_ex      = (status_reg & s_cide) >> 14;
            status.cmd_err     = (status_reg & s_cidf) >> 15;
            status.arg         = status_arg;
    
            if (this.inState('init')) {
    
                console.log('Register', rd_id, 'Initial command counter is', status.cmd_count);
                cmdId = status.cmd_count;
    
                this.setState('ready');
    
            }
    
            this.fire('update_status', [ status ]);
    
        }.bind(this);
    
        var flush = function () {
        
            console.log('Register',rd_id, 'Flushing latest command.');
    
            if (queue.length === 0) {
    
                console.log('Register',rd_id, 'Nothing to flush.');
                return;
            
            }
    
            if (!this.inState('ready')) {
    
                console.log('Register',rd_id, 'Waiting, currently not in the ready state.', this.getState());
                return;
    
            }
    
            this.setState('execution');
    
            var first       = queue.shift(),
                command     = first.command,
                defer       = first.deferred;
        
            cmdId = (cmdId + 1) % 8;
    
            var cmd         = command << 3,
                ex_flag     = 1 << 15,
                cmdReg      = cmdId + cmd + ex_flag;
    
            console.log('Register',rd_id, 'Writing to modbus server.', cmdReg);
    
            var promisses = [];
    
            if (first.param !== undefined) {
            
                console.log('Register',rd_id, 'Execution sets parameter.', first.param);
    
                promisses.push(client.writeSingleRegister(start + 3, first.param));
            
            } 
    
            promisses.push(client.writeSingleRegister(start + 2, cmdReg));
    
    
            $.when.apply(this, promisses).fail(function (err) {
       
                    console.error('Register',rd_id, 'Sending command to PLC failed.', err);
    
                    defer.reject({ 
                        errCode: 'modbusError' 
                    });
    
                    this.setState('ready');
        
                }.bind(this)).then(function () {
                
                    console.log('Register',rd_id, 'Sending command to PLC was successfull.');
    
                    var handler_id, timeout_id, update_count = 0;
    
                    timeout_id = setTimeout(function () {
    
                        console.error('Register',rd_id, 'PLC did not executed the command inside the timeframe.', update_count, status);
    
                        defer.reject({ 
                            errCode         : 'timeout', 
                            update_count    : update_count 
                        });
    
                        this.setState('ready');
    
                    }.bind(this), 5000);
    
                    handler_id = this.on('update_status', function (status) {
    
                        update_count += 1;
    
                        if (status.cmd_count === cmdId && status.cmd_ex) { 
    
                            console.log('Register',rd_id, 'Command executed.', status);
     
                            this.off(handler_id);
                            clearTimeout(timeout_id);
    
                            if (!status.cmd_err) {
    
                                console.log('Register',rd_id, 'PLC executed command successfully.');
    
                                defer.resolve(status.arg);
    
                            } else {
         
                                console.error('Register',rd_id, 'PLC responded with execution error.');              
    
                                defer.reject({ errCode: 'plcError' });
    
                            }
    
                            this.setState('ready');
    
                        }
    
                    }.bind(this));
    
                }.bind(this));
    
        }.bind(this);
    
    
        loopListenerId = loop.on('update', updateStatus);
    
        this.execute = function (command, param) {
    
            console.log('Register',rd_id, 'Queing a new command.', command, param);
    
            var defer = $.Deferred();
    
            queue.push({
                'deferred'  : defer,
                'command'   : command,
                'param'     : param
            });
    
            flush();
    
            return defer.promise();
    
        };
    
        this.on('state_changed', function (oldState, newState) {
       
            console.log('Register',rd_id, 'State changed from', oldState, 'to', newState);
    
            if (newState === 'ready') {
    
                flush();
            
            }
        
        });
     
        this.getStatus = function () {
    
            return status;
    
        };
    
        this.getAddress = function () {
        
            return start;
        
        };
    
        this.close = function () {
    
            loop.off(loopListenerId);
    
            return this;
    
        };
               
    
    };
    
    Register.inherits(StateMachine);
    
    
    

})();
