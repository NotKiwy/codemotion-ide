const { app } = require("electron")
const { checkFields, saveReadFile, isFileExists } = require("../../../tools.js")
const path = require("path")

function callback(data) {
    const configPath = data.selfArgs[0]
    const extPath = data.extensionPath
    const extName = data.extensionName

    if (configPath) {
        let configContent = saveReadFile(path.join(extPath, configPath + ".json"), true)
        configContent = JSON.parse(configContent)

        checkFields(`${data.permissionName}:config`, configContent, {
            name: "string",
            displayName: "string",
            extensions: "array",
            rules: "string"
        })

        let rulesConfig = saveReadFile(path.join(extPath, configContent.rules + ".json"), true)
        rulesConfig = JSON.parse(rulesConfig)

        checkFields(`${data.permissionName}:config:rules`, rulesConfig, {
            syntax: "object",
            autocomplete: "object"
        })

        let iconPath = false
        const defaultIcon = path.join(app.getAppPath(), "assets", "media", "icons", "default.svg")

        if ("icon" in configContent) {
            checkFields(`${data.permissionName}:config`, configContent, {
                icon: "SVGFile|PNGFile"
            })

            iconPath = path.join(extPath, configContent.icon)
            isFileExists(iconPath, true)
        }
        else {
            iconPath = defaultIcon

            for (const e of configContent.extensions) {
                let extIconPath = path.join(app.getAppPath(), "assets", "media", "icons", `${e}.svg`)

                if (isFileExists(extIconPath)) {
                    iconPath = extIconPath
                    break
                }
            }
        }

        const dataToSend = {
            languageName: configContent.name,
            languageDisplayName: configContent.displayName,
            languageExtensions: configContent.extensions,
            languageRules: rulesConfig,
            languageIconPath: iconPath
        }

        if ("documentation" in configContent) {
            let documentationConfig = saveReadFile(path.join(extPath, configContent.documentation + ".json"), true)
            documentationConfig = JSON.parse(documentationConfig)

            dataToSend["languageDocumentation"] = documentationConfig
        }

        data.mainSender.send("new-language-register", dataToSend)

        data.debuggerSender.send("debug-event", {
            data: {
                type: "msg",
                content: `Added new language: ${configContent.name}`,
                from: extName
            },
            time: Date.now()
        })
    }
    else {
        throw new Error(`[${data.permissionName}] You must specify the configuration for language registration`)
    }
}

module.exports = { callback }