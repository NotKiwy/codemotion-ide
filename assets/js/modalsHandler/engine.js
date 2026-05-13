// modal engine just for this ide
// just for note: i recreated this thing 3 times

import { renderModalBase } from "./components/base.js"

const backdrop = document.createElement("div")
backdrop.classList.add("backdrop", "hidden")

document.body.prepend(backdrop)

// function for object validation inside Modal class
export function valid(obj) {
    if (obj === undefined || obj === null || obj === false) return undefined

    if (Array.isArray(obj) && obj.length === 0) return undefined

    if (
        typeof obj === "object" &&
        !Array.isArray(obj) &&
        Object.keys(obj).length === 0
    ) return undefined

    return obj
}
// for arrays
export function validArray(obj) {
    if(valid(obj) == undefined) return undefined
    if(typeof obj == "object" && !Array.isArray(obj)) return Object.keys(obj)
    if(typeof obj != "object") return undefined

    return obj
}
// for urls
export function validHTTPS(url) {
    if(!url) return undefined
    if(!url.startsWith("https://")) return undefined

    return url
}
// for booleans
export function validBool(boolean) {
    if(typeof boolean == "boolean") return boolean
    else return undefined
}

export function err(text) {
    throw new Error(`[CodeMotion.Modals] ${text}`)
}
export function showBackdrop() {
    backdrop.classList.remove("hidden")
}
export function hideBackdrop() {
    backdrop.classList.add("hidden")
}

export class Modal {
    static list = {}

    static create(config = {}) {
        if(!config) err("Modal config can't be empty")

        const id = valid(config.id) ?? crypto.randomUUID().replaceAll("-", "")
        const name = valid(config.name) ?? "Untitled"
        const isHiddenOnSpawn = valid(config.show) ?? true
        const modalClassList = validArray(config.modalClassList) ?? []
        const title = valid(config.title) ?? false
        const pages = valid(config.pages) ?? {}
        const content = valid(config.content) ?? {}

        const modalBase = renderModalBase(
            {
                id: id,
                isHiddenOnSpawn: isHiddenOnSpawn,
                modalClassList: modalClassList,
                title: title,
                pages: pages,
                content: content
            }
        )

        document.body.prepend(modalBase.wrapper)

        return {
            el: modalBase.wrapper,
            bind: (el) => {
                function bindClick(el) {
                    el.addEventListener("click", () => {
                        modalBase.wrapper.classList.remove("hidden")
                        showBackdrop()
                    })
                }

                if(el instanceof NodeList) {
                    el.forEach(e => {
                        bindClick(e)
                    })
                }
                else if(el instanceof HTMLElement) {
                    bindClick(el)
                }
            }
        }
    }
}