import { handleSettings, Setting } from "../js/settings.js"
import { Options } from "../js/lib.js"
import { optionsThemeButtonHandler } from "../js/handlers/themesHandler.js"
import { showBackdrop, hideBackdrop } from "../js/modalsHandler/engine.js"

const modalAppendingAfterEl = document.querySelector(".topbar")

export const modalVerifiedBadgeHTML = 
    `<span class="modal-badge modal-verified__badge">
        <span class="material-symbols-rounded">check</span>
    </span>`
export const modalOwnerBadgeHTML = 
    `<span class="modal-badge modal-owner__badge">
        <span class="material-symbols-rounded">crown</span>
    </span>`

function capitalizeFirst(str) {
    if (!str) return str;
    return str[0].toUpperCase() + str.slice(1);
}

document.querySelectorAll(".modal-wrapper").forEach(modal => {
    modal.querySelector(".modal-header__close").addEventListener("click", () => {
        modal.classList.add("hidden")
        hideBackdrop()
    })
    modal.addEventListener("click", (event) => {
        if (event.target !== modal) return

        modal.classList.add("hidden")
        hideBackdrop()
    })
})

export function initOpenOnModalAttr() {
    document.querySelectorAll("[modal]").forEach(modalBtn => {
        let modalID = modalBtn.getAttribute("modal")

        modalBtn.addEventListener("click", () => {
            showBackdrop()

            const thisModal = new ExistingModal(modalID)
            thisModal.show()
        })
    })
}

export class ExistingModal {
    constructor(id) {
        this.id = id
        
        if(document.querySelector(`.modal-wrapper#${this.id}`)) {
            this.modal = document.querySelector(`.modal-wrapper#${this.id}`)
        }
        else {
            throw new Error(`Modal id "${this.id}" does not exists`);
        }
    }

    #addAdditionalSignals() {
        if(this.modal.querySelector(".modal-body")) {
            this.modal.querySelector(".modal-body").querySelectorAll("[modal-close]").forEach(e => {
                e.addEventListener("click", () => {
                    this.hide()
                })
            })
        }
    }

    show() {
        this.modal.classList.remove("hidden")
        showBackdrop()
        this.#addAdditionalSignals()
    }
    hide() {
        this.modal.classList.add("hidden")
        hideBackdrop()
    }
    clear() {
        this.modal.querySelector(".modal-body").innerHTML = ""
    }
    render(HTML, method = "insert") {
        if(method == "insert") {
            this.modal.querySelector(".modal-body").innerHTML = HTML
        }
        else if(method == "add") {
            this.modal.querySelector(".modal-body").innerHTML += HTML
        }
        this.#addAdditionalSignals()
    }
    add(DOMObject) {
        this.modal.querySelector(".modal-body").appendChild(DOMObject)
        this.#addAdditionalSignals()
    }
}