export function initActions() {
    document.querySelectorAll("[action]").forEach(e => {
        const ID = e.getAttribute("action")

        e.addEventListener("click", async () => {
            console.log(ID)
            if(ID == "logout") {
                await window.electron.logout()
                await window.electron.reload()
            }
            if(ID == "appclose") {
                window.electron.close()
            }
            if(ID == "appminimize") {
                window.electron.minimize()
            }
            if(ID == "appmaximize") {
                window.electron.maximize()
            }
            if(ID == "appreload") {
                window.electron.reload()
            }
        })
    })
}