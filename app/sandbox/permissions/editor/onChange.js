const { app, ipcMain } = require("electron")
const { addRule, removeRule } = require("./hl/getRules")

function callback(data) {
    const activeRules = new Set()
    const cb = data.selfArgs[0]
    const mainSender = data.mainSender

    if (typeof cb == "function") {
        ipcMain.on("ace-changed-event", (_, data) => {
            cb(
                {
                    value: data.editorValue,
                    mode: data.editorMode,
                    language: {
                        name: data.editorLanguage,
                        extension: data.editorLanguageExtension
                    },
                    errors: data.errors || 0,
                    cursor: data.cursor || {
                        line: 1,
                        column: 1
                    },
                    hl: {
                        addRule: (...args) => addRule({ mainSender: mainSender }, ...args),
                        removeRule: (...args) => removeRule({ mainSender: mainSender }, ...args)
                    }
                }
            )
        })
    }
}

module.exports = { callback }