const { app } = require("electron");
const path = require("node:path");

function callback(data) {
    const elType = data.selfArgs[0]
    const mainSender = data.mainSender
    const extName = data.extensionName
    const extPath = data.extensionPath

    const elements = {
        image: () => {
            const id = crypto.randomUUID()

            mainSender.send("extension-create-element", {
                type: "image",
                id: id,
                extName: extName
            })

            return {
                src: (srcPath) => {
                    mainSender.send("extension-mod-element", {
                        id: id,
                        type: "setSrc",
                        value: path.join(extPath, srcPath),
                        extName: extName
                    })
                }
            }
        }
    }

    if(elType in elements) {
        const res = elements[elType]()
        
        return () => {
            return res
        }
    }
}

module.exports = { callback }