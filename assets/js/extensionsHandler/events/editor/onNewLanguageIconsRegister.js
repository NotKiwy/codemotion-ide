import { Languages } from "../../../lib.js"

export function onNewLanguageIconsRegisterCallback({ data }) {
    Object.keys(data).forEach(k => {
        if (k in Languages.list()) {
            let originalData = Languages.list()[k]
            originalData["icon"] = data[k]
            originalData["customIcon"] = true

            Languages.update(k, originalData)
        }
        else {
            let newLanguageIconData = {
                id: k,
                name: k,
                icon: data[k],
                customIcon: true
            }

            Languages.add(newLanguageIconData)
        }
    })
}