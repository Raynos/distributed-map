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
        , channel = mdm.createStream(uri + "/channel")
        , store = {}
        , bufferRead = PauseStream().pause()
        , bufferWrite = PauseStream().pause()
        , id = uuid()

    distributedMap._channel = channel

    // request a sync
    channel.write(JSON.stringify({
        event: "sync"
        , id: id
    }))

    // open a stream connection to the sync server
    var syncStream = StreamClient(mdm, {
        prefix: uri + "/proxy"
    }).connect(id)
    // when we get data from the server it's the initial state
    syncStream.once("data", syncState)
    syncStream.once("end", emitReady)

    // buffer the channel until we have the initial data
    channel.pipe(bufferRead)
    bufferWrite.pipe(channel)

    // mutate set when channel emits change event
    bufferRead.on("data", handleStateChange)

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

    function syncState(data) {
        data = JSON.parse(data)
        forEach(data, setOnStore)
        syncStream.end()
    }

    function emitReady(data) {
        distributedMap.emit("ready")
        bufferRead.resume()
        bufferWrite.resume()
    }

    function setOnStore(value, key) {
        store[key] = value
        distributedMap.emit("set", value, key, store)
    }

    function handleStateChange(data) {
        var key, value, id, event
        data = JSON.parse(data)
        event = data.event
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
        } else if (event === "sync") {
            id = data.id
            var server = StreamServer(mdm, {
                prefix: uri + "/proxy"
            }, function (stream) {
                stream.write(JSON.stringify(store))
                stream.end()
                server.end()
            }).listen(id)
        }
    }

    function set(key, value) {
        store[key] = value
        bufferWrite.write(JSON.stringify({
            event: "set"
            , key: key
            , value: value
        }))
    }

    function get(key) {
        return store[key]
    }

    function has(key) {
        return key in store
    }

    function $delete(key) {
        delete store[key]
        bufferWrite.write(JSON.stringify({
            event: "delete"
            , key: key
        }))
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