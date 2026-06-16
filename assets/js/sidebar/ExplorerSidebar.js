const explorerSidebar = document.querySelector(".explorer")
const sidebarHideBottomBtn = document.querySelector("#sidebar-hide")

const localStorageKey = "codemotion.explorerSidebarVisible"

export class ExplorerSidebar {
    static init() {
        if(this.getState()) {
            explorerSidebar.classList.remove("zero-width")
        }
        else {
            explorerSidebar.classList.add("zero-width")
        }
    }
    static getState() {
        return localStorage.getItem(localStorageKey) == null ? false : JSON.parse(localStorage.getItem(localStorageKey))
    }
    static setZeroWidth() {
        localStorage.setItem(localStorageKey, false)

        explorerSidebar.classList.add("zero-width")
        sidebarHideBottomBtn.classList.remove("active")
    }
    static setDefaultWidth() {
        localStorage.setItem(localStorageKey, true)

        explorerSidebar.classList.remove("zero-width")
        sidebarHideBottomBtn.classList.add("active")
    }
    static isToggled() {
        return explorerSidebar.classList.contains("zero-width")
    }
    static toggleWidth() {
        if(this.isToggled()) {
            this.setDefaultWidth()
        }
        else {
            this.setZeroWidth()
        }
    }

    static bindEvent(name) {
        setTimeout(() => {
            if(name == "showInSidebarItemClick") {
                const sidebarItems = document.querySelectorAll(".sidebar-item")

                sidebarItems.forEach(i => {
                    i.addEventListener("click", () => {
                        this.setDefaultWidth()
                    })
                })
            }
        }, 500)
    }
}