import { Setting } from "../settings.js"

export function optionsThemeButtonHandler(themeSelect) {
    themeSelect.on("click", (item) => {
        let id = item.id

        const tempStyle = document.createElement("style")
        tempStyle.innerHTML = `* { transition: .2s!important; }`
        document.head.appendChild(tempStyle)

        setTimeout(() => { tempStyle.remove() }, 400)

        Setting.themeSelect(id)
    })
}