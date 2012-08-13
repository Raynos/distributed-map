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
boot.install(server, DistributedMapProxy({
    log: true
}))
console.log("sock hooked on", "/boot")