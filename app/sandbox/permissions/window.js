const { createNativeImageFromUrl } = require("../tools.js")
const { BrowserWindow } = require("electron")

function callback(data) {
    return class {
        constructor(id) {
            if (id == undefined) {
                id = Math.floor(Math.random() * 9999) + 1
            }

            this.id = id

            const win = new BrowserWindow(
                {
                    width: 800,
                    height: 600,
                    show: false
                }
            )
            win.setMenu(null)

            this.win = win
        }

        setTitle(title) {
            this.win.setTitle(title)
        }
        async setUrl(url) {
            const nativeImg = await createNativeImageFromUrl(`http://www.google.com/s2/favicons?domain=${url}`)
            this.win.setIcon(nativeImg)
            this.win.loadURL(`https://${url}`)
        }

        show() {
            this.win.show()
        }
    }
}

module.exports = { callback }