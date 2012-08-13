var DistributedMap = require("../../../browser")
    , boot = require("boot")

// Open a WS connection to the relay server
var mdm = boot()
    , map = DistributedMap(mdm)
    , addButton = document.getElementById("add")
    , output = document.getElementById("output")

// When someone changes the distributed data render the change
map.on("set", renderIncomingData)

// listen on user input and set data
hookUpAdd(addButton)

function hookUpAdd(button) {
    var keyInput = document.getElementById("key")
        , valueInput = document.getElementById("value")

    button.addEventListener("click", function () {
        var key = keyInput.value
            , value = valueInput.value

        map.set(key, value)
    })
}

function renderIncomingData(value, key) {
    var alreadyRendered = output.dataset[key]
        , term, definition

    if (alreadyRendered) {
        term = document.getElementById("key-" + key)
        definition = term.nextSibling

        definition.textContent = value
    } else {
        term = document.createElement("dt")
        term.id = "key-" + key
        term.textContent = key
        definition = document.createElement("dd")
        definition.textContent = value

        output.appendChild(term)
        output.appendChild(definition)

        output.dataset[key] = true
    }
}