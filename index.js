var StreamRouter = require("stream-router")
    , StreamServerProxy = require("browser-stream-server")
    , Channel = require("multi-channel-mdm")
    , StreamStore = require("stream-store")

module.exports = DistributedMapProxy

function DistributedMapProxy(uri, multi) {
    var router = StreamRouter()
        , streamStore = StreamStore()
        , channel = Channel(streamStore)
        , streamServer

    router.streamStore = streamStore
    router.channel = channel

    if (multi) {
        streamServer = StreamServerProxy(uri + "/:streamName/proxy")
        router.addRoute(uri + "/:streamName/channel", Channel(streamStore))
        router.addRoute(uri + "/:streamName/proxy/*", streamServer)
    } else {
        streamServer = StreamServerProxy(uri + "/proxy")
        router.addRoute(uri + "/channel", Channel(streamStore))
        router.addRoute(uri + "/proxy/*", streamServer)
    }

    router.streamServer = streamServer

    return router
}