var EventEmitter = require("events").EventEmitter
    , StreamServer = require("browser-stream-server")
    , StreamClient = StreamServer
    , globalContext = new Function('return this')()
    , PauseStream = require("pause-stream")
    , uuid = require("node-uuid")
    , forEach = require("iterators").forEachSync

module.exports = DistributedMap

function DistributedMap(mdm, uri) {
    var distributedMap = new EventEmitter()
        , store = {}
        , bufferRead = PauseStream()
        , bufferWrite = PauseStream()
        , readyFlag = false

    uri = uri || "/distributed-map"
    var channel = mdm.createStream(uri + "/channel")

    distributedMap._channel = channel
    distributedMap._sync = sync
    distributedMap._syncStream = sync()

    // buffer the channel until we have the initial data
    channel.pipe(bufferRead)
    bufferWrite.pipe(channel)

    // mutate set when channel emits change event
    bufferRead.on("data", handleStateChange)

    distributedMap.ready = ready

    // expose set methods
    distributedMap.set = set
    distributedMap.get = get
    distributedMap.has = has
    distributedMap.delete = $delete
    distributedMap.keys = keys
    distributedMap.values = values
    distributedMap.toArray = toArray
    distributedMap.iterate = iterate

    return distributedMap

    function sync() {
        var id = uuid()
        bufferRead.pause()
        bufferWrite.pause()

        // request a sync
        channel.write({
            event: "sync"
            , id: id
        })

        // open a stream connection to the sync server
        var syncStream = StreamClient(mdm, {
            prefix: uri + "/proxy"
        }).connect(id)
        // when we get data from the server it's the initial state
        syncStream.once("data", syncState)
        syncStream.once("end", resumeBuffer)
        // TODO: handle unable to get initial state

        function syncState(data) {
            forEach(data, setOnStore)
            syncStream.end()
        }
    }

    function setOnStore(value, key) {
        store[key] = value
        distributedMap.emit("set", value, key, store)
    }

    function resumeBuffer() {
        readyFlag = true
        bufferRead.resume()
        bufferWrite.resume()
        distributedMap.emit("ready", store)
    }

    function handleStateChange(data) {
        var key, value, id
            , event = data.event

        if (event === "set") {
            key = data.key
            value = data.value
            store[key] = value
            distributedMap.emit("set", value, key, store)
        } else if (event === "delete") {
            key = data.key
            value = store[key]
            ;delete store[key]
            distributedMap.emit("delete", value, key, store)
        } else if (event === "sync" && readyFlag) {
            id = data.id
            var server = StreamServer(mdm, {
                prefix: uri + "/proxy"
            }, function (stream) {
                stream.write(store)
                stream.end()
                server.end()
            }).listen(id)
        }
    }

    function ready(callback) {
        if (readyFlag) {
            callback(store)
        } else {
            distributedMap.on("ready", callback)
        }
    }

    function set(key, value) {
        store[key] = value
        bufferWrite.write({
            event: "set"
            , key: key
            , value: value
        })
    }

    function get(key) {
        return store[key]
    }

    function has(key) {
        return key in store
    }

    function $delete(key) {
        delete store[key]
        bufferWrite.write({
            event: "delete"
            , key: key
        })
    }

    function keys() {
        return Object.keys(store)
    }

    function values() {
        return Object.keys(store).map(toValue, store)
    }

    function toArray() {
        return Object.keys(store).map(toKeyValue, store)
    }

    function iterate(callback, context) {
        var keys = Object.keys(store)
            , length = keys.length

        context = context || globalContext

        for (var i = 0; i < length; i++) {
            var key = keys[i]
                , value = store[key]

            callback.call(context, value, key, store)
        }
    }
}

function toValue(key) {
    return this[key]
}

function toKeyValue(key) {
    return {
        key: key
        , value: this[key]
    }
}