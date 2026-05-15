import { setTabNameCounter, escapeHtml, createNotify } from "../lib.js"
import { ELEMENTS_EMPTY_TEXT_COMPONENT } from "./components.js"

export function handleBugsTab({ root, rootParent, bugsObject }) {
    if (!root) return

    root.innerHTML = ""

    const bugs = Object.entries(bugsObject)
    setTabNameCounter(bugs.length)

    if (bugs.length === 0) {
        root.innerHTML = ELEMENTS_EMPTY_TEXT_COMPONENT
        return
    }

    for (const [id, rec] of bugs) {
        const {
            self,
            resolved,
            value,
            description,
            time,
            organization
        } = rec

        let organizationsHTML = ""
        let resolveBtnHTML = ""

        if (organization) {
            const splitted = organization.split(",").map(i => i.trim())

            if (splitted.length > 1) {
                organizationsHTML = `
                    <p class="column-element__title-element__organization clickable" data-full-org>
                        <span class="material-symbols-rounded">group</span>
                        <span data-org-target>${escapeHtml(splitted[0])} and ${splitted.length - 1} more</span>
                    </p>`
            }
            else {
                organizationsHTML = `
                    <p class="column-element__title-element__organization">
                        <span class="material-symbols-rounded">group</span>
                        ${escapeHtml(organization)}
                    </p>`
            }
        }

        if (!resolved) {
            resolveBtnHTML = `
                <button class="btn done-btn" data-done>
                    <span class="material-symbols-rounded">check</span>
                </button>`
        }

        root.insertAdjacentHTML("beforeend", `
            <div class="column-element ${self ? "own" : ""} ${resolved ? "done" : ""}" data-id="${id}">
                <div class="column-element__title">
                    <div class="column-element__title-element">
                        <p>${escapeHtml(value)}</p>
                        <p class="column-element__title-element__description">${escapeHtml(description)}</p>
                        ${organizationsHTML}
                    </div>
                </div>

                <div class="column-element__time">
                    <p>${/^\d{10}$/.test(String(time))
                        ? new Date(time * 1000).format("H:i")
                        : escapeHtml(String(time || "Unknown"))}</p>
                </div>

                <div class="column-element__buttons">
                    ${resolveBtnHTML}
                    <button class="btn danger-btn" data-remove>
                        <span class="material-symbols-rounded">remove</span>
                    </button>
                </div>
            </div>
        `)
    }

    if (!root.dataset.listenerAttached) {
        root.addEventListener("click", async (e) => {
            const orgEl = e.target.closest("[data-full-org]")

            if (orgEl) {
                const target = orgEl.querySelector("[data-org-target]")
                const id = orgEl.closest(".column-element")?.dataset.id
                const orgs = bugsObject[id]?.organization

                if (target && orgs) {
                    target.textContent = orgs
                }
            }

            const doneBtn = e.target.closest("[data-done]")
            const removeBtn = e.target.closest("[data-remove]")

            if (doneBtn) {
                const item = doneBtn.closest(".column-element")
                const id = item?.dataset.id
                const bug = bugsObject[id]

                if (!bug) return

                bug.resolved = 1

                const editBugRes = await window.electron.modifyLocalBugs({
                    type: "edit",
                    data: bug
                })

                if (editBugRes.success) {
                    item.classList.add("done")
                    doneBtn.remove()
                }
                else {
                    createNotify({
                        icon: "close",
                        title: "Bug resolving error",
                        content: editBugRes.error
                    })
                }
            }

            if (removeBtn) {
                const item = removeBtn.closest(".column-element")
                const id = item?.dataset.id

                if (!id) return

                const removeBugRes = await window.electron.modifyLocalBugs({
                    type: "remove",
                    data: { id }
                })

                if (removeBugRes.success) {
                    delete bugsObject[id]
                    item.remove()

                    const left = Object.keys(bugsObject).length
                    setTabNameCounter(left)

                    if (left === 0) {
                        root.innerHTML = ELEMENTS_EMPTY_TEXT_COMPONENT
                    }
                }
                else {
                    createNotify({
                        icon: "close",
                        title: "Bug removing error",
                        content: removeBugRes.error
                    })
                }
            }
        })

        root.dataset.listenerAttached = "true"
    }

    function showAllBugs() {
        rootParent.querySelectorAll(".column-element").forEach(e => {
            e.classList.remove("hidden")
        })
    }

    if (!rootParent.dataset.segmentListenersAttached) {
        document.querySelector("#bugs-all")?.addEventListener("click", () => {
            showAllBugs()
        })

        document.querySelector("#bugs-own")?.addEventListener("click", () => {
            showAllBugs()

            rootParent.querySelectorAll(".column-element").forEach(e => {
                if (!e.classList.contains("own")) {
                    e.classList.add("hidden")
                }
            })
        })

        document.querySelector("#bugs-done")?.addEventListener("click", () => {
            showAllBugs()

            rootParent.querySelectorAll(".column-element").forEach(e => {
                if (!e.classList.contains("done")) {
                    e.classList.add("hidden")
                }
            })
        })

        rootParent.dataset.segmentListenersAttached = "true"
    }
}