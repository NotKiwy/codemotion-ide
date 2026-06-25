function getEl(id) {
    const wrapper = document.querySelector(`.extension-elements__wrapper`)

    return wrapper.querySelector(`[id="${id}"]`)
}

export function onElementMod(data) {
    const id = data.id
    const type = data.type
    const context = data.extName
    const value = data.value

    if(type == "setSrc" && getEl(id) instanceof HTMLImageElement) {
        getEl(id).src = value
    }
}