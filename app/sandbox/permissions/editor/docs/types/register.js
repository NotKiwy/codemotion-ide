const { checkFields, saveReadFile } = require("../../../../tools.js")
const path = require("path")

function callback(data) {
    const configPath = data.selfArgs[0]
    const extPath = data.extensionPath

    if (configPath) {
        let configContent = saveReadFile(path.join(extPath, configPath + ".json"), true)
        configContent = JSON.parse(configContent)

        if (configContent.length > 0) {
            Object.keys(configContent).forEach((item, index) => {
                checkFields(`${data.permissionName}:config:${index}`, configContent[item], {
                    type: "string",
                    displayName: "string",
                    color: "HEX|RGB"
                })
            })

            data.mainSender.send("new-documentation-types-register", configContent)
        }
    }
}

module.exports = { callback }