import { Modal } from "../modalsHandler/engine.js"
import { addToBug, createNotify, escapeHtml } from "../lib.js"

export function getAddBugModal() {
    const addBugModal = Modal.create({
        id: "addBug",
        name: "addBug",
        modalClassList: ["window"],
        size: "sm",
        title: "Add bug",

        content: [
            {
                type: "row",
                gap: 15,
                classList: ['background'],
                items: [
                    {
                        type: "placeholder",
                        title: "Add bug information",
                        description: "Please fill in all fields before submitting a bug report"
                    },
                    {
                        type: "input",
                        placeholder: "Name",
                        id: "addBugName",
                    },
                    {
                        type: "input",
                        placeholder: "Description",
                        id: "addBugContent",
                    },
                    {
                        type: "switch",
                        id: "isLocal",
                        checked: true,
                        disabled: true,
                        title: "Add as local bug",
                        description: "If that's the case, no one but you will see this bug. It will be stored entirely locally."
                    },
                    {
                        type: "container",
                        id: "buttonsContainer"
                    },
                    {
                        type: "button",
                        id: "addBugConfirm",
                        title: "Confirm and add local bug",
                        container: "#buttonsContainer"
                    }
                ]
            },
        ]
    })
    
    const element = addBugModal.el
    const addBtn = element.querySelector("#addBugConfirm")

    element.querySelector("#isLocal").addEventListener("change", (event) => {
        const checked = event.target.checked

        addBtn.textContent = checked ? "Confirm and add local bug" : "Confirm and add global bug"
    })

    addBtn.addEventListener("click", async () => {
        const bugName = escapeHtml(element.querySelector("#addBugName").value)
        const bugContent = escapeHtml(element.querySelector("#addBugContent").value)

        if(bugContent.length > 0 && bugContent.length > 0) {
            const alreadyExistingBugs = addToBug(
                {
                    priority: 0,
                    value: bugName,
                    desc: bugContent,
                    isSelf: true,
                    org: false
                }
            )
            const bugAddingRes = await window.electron.modifyLocalBugs(
                {
                    type: "add",
                    data: {
                        id: Object.keys(alreadyExistingBugs).length,
                        priority: 0,
                        value: bugName,
                        description: bugContent,
                        self: true,
                        time: Math.floor(Date.now() / 1000),
                        resolved: 0
                    }
                }
            )

            
            if(bugAddingRes.success == true) {
                addBugModal.close()

                if (bugAddingRes.success) {
                    bugsObject[bugAddingRes.data.id] = bugAddingRes.data
                }

                if(document.querySelector(".sidebar-item#bugs")) {
                    document.querySelector(".sidebar-item#bugs").click()
                }
            }
            else {
                createNotify(
                    {
                        icon: "close",
                        title: "Error while bug adding",
                        content: bugAddingRes.error
                    }
                )  
            }
        }
        else {
            createNotify(
                {
                    icon: "close",
                    title: "Error while bug adding",
                    content: "All fields must be filled"
                }
            )
        }
    })

    return addBugModal
}