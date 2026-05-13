const { ipcMain } = require("electron")

function callback(data) {
    const eventName = data.selfArgs[0]
    const cb = data.selfArgs[1]

    if (eventName == "load") {
        callback()
    }
    if (eventName == "file-opened") {
        ipcMain.on("file-opened-event", (_, data) => {
            cb(data)
        })
    }
}

module.exports = { callback }