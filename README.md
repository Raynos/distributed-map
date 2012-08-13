# distributed-map

A distributed key value store in the browser

Persisting state without any central state on the server. Uses a central relay server for emulated peer to peer connections

# Example Client (any browser)

``` js
// Get the map and boot
var DistributedMap = require("../../../browser")
    , boot = require("boot")

// Open a WS connection to the relay server
var mdm = boot()
    , map = DistributedMap(mdm)

// When a peer changes the map you are given a change event
map.on("set", function (value, key, store) {
    console.log("key:", key, "changed to value:", value
        , "and current store is:", store)
})

// broadcast the data change to all the peers in the network
map.set("key", "value")
```

# Example proxy server

``` js
// Use browserify to server our index.js in a bundled fashion and also server
// static HTML
var browserifyServer = require("browserify-server")
    // Use boot to install a WS server with automatic reconnect logic
    , boot = require("boot")
    // Get our distributed map proxy handler to install the relay server
    , DistributedMapProxy = require("../..")

// Create a HTTP server on port 8080 service __dirname/static
var server = browserifyServer.listen(__dirname, 8080)
// Install the WS server on our HTTP server and have it serve the relay server
boot.install(server, DistributedMapProxy())
console.log("sock hooked on", "/boot")
```

# [Further Examples][2]

# Motivation

> There is data, it exists

You don't care where the data is. You don't need a central database. You don't need a central server. 

Temporarily you need a central proxy server to enable emulate peer to peer connection until browsers are ready.

# Documentation

## `DistributedMap(MuxDemuxConnection, mapUri)`

To create a distributed map you need to pass in a MuxDemuxConnection (from [boot][2] or [mux-demux][3] directly) and you pass in a mapUri which is the URI for the map your opening.

The URI determines what peers in the network your connected to. Your basically only connected to the peers that open the map with the same uri (this will be referred to as the map network, the network of peers connected to a map identified by this mapUri).

A `DistributedMap` instance implements all the [`Map`][5] to locally manipulate the map. The `.set` and `.delete` methods will additionally send change deltas to all the other peers connected to the map network

### `map.on("ready", handler<map>)`

A map emits a ready event once it has finished synchronizing the initial state with a peer in the map network. It passes the state of the map as an object to the handler.

### `map.on("set", handler<value, key, map>)`

A map emits a set when a peer in the map network told you a key / value pair has been set. It's given the new value, the key and the map as an object

### `map.on("delete", handler<value, key, map>)`

A map emits a delete when a peer in the map network told you a key has been deleted. For convenience it gives you the value that has been removed along with the key and the entire map as an object

### `map.set(key, value)`

Set's the key value pair locally and also broadcasts a message to all peers in the map network telling them that the key value pair has been set.

### `map.delete(key)`

Delete's the key value pair locally and also broadcasts a message to all peers in the map network telling them that the key value pair has been deleted.

### `map.ready(callback<map>)`

Wait until the synchronization completes. passes the current state of the map as an object. Will fire immediately if synchronization is already complete

## `DistributedMapProxy(options)`

The distributed map proxy is used on the server to relay traffic between peers in the network. This is required for the DistributedMap to work

``` js
// Create a HTTP server on port 8080 service __dirname/static
var server = browserifyServer.listen(__dirname, 8080)
// Install the WS server on our HTTP server and have it serve the relay server
boot.install(server, DistributedMapProxy({
    log: true
}))
```

# How it works

The way the DistributedMap works is that when you open a map, you effectively connect to the network for that map name. When you connect to the network you ask a peer in the network to spin up a [browser-stream-server][1] on demand.

You then connect to them and they send you the current state of the distributed map and that becomes your initial state for the map.

From then on you just listen to deltas on the map coming in from any peer in the network and update yourself. When you want change the map your broadcast a delta to every peer in the network.

This is a pre-runner to enable prototypes whilst I re-implement a DHT algorithm in JavaScript

# Installation

`npm install distributed-map`

# Contributors

 - Raynos

# MIT Licenced

  [1]: https://github.com/Colingo/browser-stream-server
  [2]: https://github.com/Raynos/distributed-map/tree/master/example
  [3]: https://github.com/Raynos/boot
  [4]: https://github.com/dominictarr/mux-demux
  [5]: http://wiki.ecmascript.org/doku.php?id=harmony:simple_maps_and_sets