import { idify } from "../lib.js"

export class _TopBarElement {
    static instances = new Map()

    constructor(id) {
        const normalizedId = idify(id)

        if (_TopBarElement.instances.has(normalizedId)) {
            return _TopBarElement.instances.get(normalizedId)
        }

        this.parent = document.querySelector("#topbarCenter .status-indicator")

        let item = document.querySelector(`#${normalizedId}`)

        if (!item) {
            item = document.createElement("div")
            item.className = "topbar-center hidden"
            item.id = normalizedId

            this.parent.before(item)
        }

        this.item = item

        _TopBarElement.instances.set(normalizedId, this)
    }

    content({ text, icon, type }) {
        this.item.innerHTML = ""

        const container = document.createElement("div")
        container.className = "topbar-center__row"

        if (icon) {
            const iconEl = document.createElement("span")
            iconEl.className = "material-symbols-rounded"
            iconEl.id = "icon"
            iconEl.textContent = icon

            container.appendChild(iconEl)
        }

        if (text) {
            const textEl = document.createElement("div")
            textEl.className = "topbar-center__text"
            textEl.textContent = text

            container.appendChild(textEl)
        }

        if (type) {
            const types = ["default", "notification", "danger"]

            this.item.classList.remove(...types)

            if (types.includes(type)) {
                this.item.classList.add(type)
            }
        }

        this.item.appendChild(container)
    }

    show() {
        const el = this.item

        el.classList.remove("hidden")

        el.style.maxWidth = "0px"
        el.style.minWidth = "0px"

        const width = el.scrollWidth

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.style.maxWidth = width + "px"
                el.style.minWidth = width + "px"

                const icon = el.querySelector("#icon")
                const text = el.querySelector(".topbar-center__text")

                if (icon) icon.style.marginLeft = "0px"
                if (text) text.classList.remove("hidden")
            })
        })
    }

    hide({ iconVisible = false } = {}) {
        const el = this.item

        el.style.maxWidth = el.scrollWidth + "px"

        requestAnimationFrame(() => {
            const icon = el.querySelector("#icon")
            const text = el.querySelector(".topbar-center__text")

            if (!iconVisible) {
                el.style.maxWidth = "0px"
                el.style.minWidth = "0px"
            } else {
                el.style.maxWidth = "20px"
                el.style.minWidth = "20px"

                if (icon) icon.style.marginLeft = "-5px"
                if (text) text.classList.add("hidden")
            }
        })
    }

    on(event, callback) {
        const events = {
            hover: "mouseenter",
            unhover: "mouseleave",
            click: "click"
        }

        if (event in events) {
            this.item.addEventListener(events[event], () => {
                callback(this)
            })
        }
    }

    destroy() {
        this.item.remove()
        _TopBarElement.instances.delete(this.item.id)
    }
}