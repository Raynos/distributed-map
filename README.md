# distributed-map

A distributed key value store in the browser

## Example Client (any browser)

``` js
// Get the map and boot
var DistributedMap = require("../../../browser")
    , boot = require("boot")

// Open a WS connection to the relay server
var mdm = boot()
    , map = DistributedMap(mdm)

// When a node changes the map you are given a change event
map.on("set", function (value, key, store) {
    console.log("key:", key, "changed to value:", value
        , "and current store is:", store)
})

// broadcast the data change to all the nodes in the network
map.set("key", "value")
```

## [Further Examples][2]

## Motivation

> There is data, it exists

You don't care where the data is. You don't need a central database. You don't need a central server. 

Temporarily you need a central proxy server to enable emulate peer to peer connection until browsers are ready.

The way the DistributedMap works is that when you open a map, you effectively connect to the network for that map name. When you connect to the network you ask a node in the network to spin up a [browser-stream-server][1] on demand. You then connect to them and they send you the current state of the distributed map and that becomes your initial state for the map.

From then on you just listen to deltas on the map coming in from any node in the network.

## Installation

`npm install distributed-map`

## Contributors

 - Raynos

## MIT Licenced

  [1]: https://github.com/Colingo/browser-stream-server
  [2]: https://github.com/Raynos/distributed-map/tree/master/examples