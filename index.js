var StreamRouter = require("stream-router")
    , StreamServerProxy = require("browser-stream-server")
    , Channel = require("multi-channel-mdm")
    , StreamStore = require("stream-store")
    , channelRegExp = /^([\w\W]*)\/channel$/
    , proxyRegExp = /^([\w\W]*)\/proxy/

module.exports = DistributedMapProxy

function DistributedMapProxy(options) {
    options = options || {}
    // create an empty stream memory store
    if (!options.streamStore) {
        options.streamStore = StreamStore()
    }
    // create a channel bound the to the stream store
    if (!options.channel) {
        options.channel = Channel(options.streamStore)
    }
    // Store an object of the streamServers to use for the named resources
    if (!options.streamServers) {
        options.streamServers = {}
    }

    return handleRoutes

    function handleRoutes(stream) {
        var uri = stream.meta
            , match = uri.match(channelRegExp)

        // If this is a channel request send the stream to the channel
        if (match) {
            var channelUri = match[1]
            return options.channel(stream)
        }

        match = uri.match(proxyRegExp)

        // If this is a proxy request send the stream to the proxy
        if (match) {
            var streamServerUri = match[1]
                , streamServerProxy = options.streamServers[streamServerUri]

            if (!streamServerProxy) {
                streamServerProxy = options.streamServers[streamServerUri] =
                    StreamServerProxy(streamServerUri + "/proxy")
            }

            return streamServerProxy(stream)
        }

        if (options.log) {
            console.log("[DISTRIBUTED-MAP] 404", uri)
        }
    }
}