import { idify } from "../lib.js"

export class ContextMenu {
    constructor(id, elements = {}) {
        const context = document.createElement("div")
        context.classList.add("context-menu", "hidden")
        context.id = idify(id)
        this.context = context

        document.body.appendChild(context)

        console.log(document.body)

        if(Object.keys(elements).length == 0) {
            Object.keys(elements).forEach(el => {
                this.add(el)
            })
        }
    }

    on(eventName, callback) {
        const events = {
            open: "contextmenu"
        }

        if(eventName in events) {
            this.scope.addEventListener(events[eventName], () => { 
                callback(
                    {
                        element: this.context
                    }
                ) 
            })
        }
    }

    removeItem(id) {
        if(document.querySelector(`.context-menu__item[id="${id}"]`)) {
            document.querySelector(`.context-menu__item[id="${id}"]`).remove()
        }
    }

    add({ id, content, icon, shortcut, func, type }) {
        if(document.querySelector(`.context-menu__item[id="${id}"]`)) {
            return
        }

        let iconHTML = icon == undefined ? "" : `<span class="material-symbols-rounded">${icon}</span>`
        type = type == undefined ? "default" : type

        const item = document.createElement("div")
        item.classList.add("context-menu__item")
        item.id = id
        item.innerHTML = `
            <div class="context-menu__item-block ${icon != undefined ? `` : `no-icon`}">
                ${iconHTML}
                <div class="content">${content}</div>
            </div>
            <div class="context-menu__item-block">
                ${shortcut != undefined ? `<div class="shortcut">${shortcut}</div>` : ""}
            </div>
        `

        if(type == "divider") {
            item.innerHTML = ""
            item.className = "context-menu__item-divider"
            item.innerHTML = `<div></div>`
            item.removeAttribute("id")
        }

        this.context.appendChild(item)

        item.addEventListener("click", () => {
            func()
        })
    }

    bindOn(scope) {
        if(scope) {
            this.scope = scope
            scope.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                
                this.context.style.left = e.clientX + "px";
                this.context.style.top = e.clientY + "px";

                setTimeout(() => {
                    this.context.classList.remove("hidden")
                }, 100)
            });

            document.addEventListener("click", () => {
                this.context.classList.add("hidden")
            });
        }
    }
}