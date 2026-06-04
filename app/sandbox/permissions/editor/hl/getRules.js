const activeRules = new Set()

function addRule({ mainSender }, id, object = {}) {
    if (activeRules.has(id)) return

    if (!object || typeof object !== "object" || Array.isArray(object)) {
        return
    }

    const data = {}
    data["action"] = "add"
    data["id"] = id
    data["rule"] = object

    mainSender.send("on-editor-change-new-hl-rules", data)
}

function removeRule({ mainSender }, id) {
    if (activeRules.has(id)) return

    const data = {}
    data["action"] = "add"
    data["id"] = id

    mainSender.send("on-editor-change-new-hl-rules", data)
}

function callback(data) {
    return () => ({
        add: (...args) => addRule(
            { mainSender: data.mainSender },
            args[0],
            args[1]
        ),

        remove: (...args) => removeRule(
            { mainSender: data.mainSender },
            args[0]
        )
    });
}

module.exports = { callback, addRule, removeRule }