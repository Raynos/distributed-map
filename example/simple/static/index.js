var DistributedMap = require("../../../browser")
    , boot = require("boot")

// Open a WS connection to the relay server
var mdm = boot()
    , map = DistributedMap(mdm)

// When someone changes the map everyone is given a set event
map.on("set", function (value, key, store) {
    console.log("key:", key, "changed to value:", value
        , "and current store is:", store)
})

// Expose the change method. Call it in the terminal to set data
window.change = change

function change(key, value) {
    map.set(key, value)
}