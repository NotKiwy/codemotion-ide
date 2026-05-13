export class _ContextMenuLoader {
    static el = document.querySelector("#incontext-loading")

    static show() {
        this.el.classList.remove("hidden")
    }
    static hide() {
        this.el.classList.add("hidden")
    }
    static text(text) {
        this.el.querySelector("#incontext-loading-text").textContent = text
    }
}