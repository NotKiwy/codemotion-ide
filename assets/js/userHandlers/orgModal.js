import { Modal } from "../modalsHandler/engine.js"
import { createNotify, getInitials, truncateString } from "../lib.js"
import { sendEvent } from "../bus.js"

export async function createUserOrgsModalStructure({ gls, userOrgs, userJSON, roleVisible }) {
    roleVisible = roleVisible == undefined ? true : roleVisible

    const organizationsModalData = await Promise.all(
        userOrgs.map(async (organization) => {
            const organizationReq =
                await window.electron.getOrgDataFromAPI(organization.id)

            if (!organizationReq.success) {
                throw new Error(
                    `Error getting organization data: ${organization.id}`
                )
            }

            const organizationData = organizationReq.result.data

            const organizationRole =
                organization.role?.length > 0
                    ? organization.role
                    : "No role"

            const isOwner =
                userJSON.id == organizationData.ownerID

            const preparedData = {
                type: "organization",

                name: organizationData.name,

                description:
                    organizationData.description,

                website:
                    organizationData.website,

                columns: [
                    {
                        name: gls.get(
                            "modals.organizations.membersLabel"
                        ),

                        value:
                            organizationData.members_count
                    },

                    {
                        name: gls.get(
                            "modals.organizations.roleLabel"
                        ),

                        value: isOwner
                            ? gls.get(
                                "modals.organizations.ownerRoleLabel"
                            )
                            : organizationRole
                    }
                ],

                badgeOwner: isOwner,

                badgeVerified:
                    organizationData.verified == 1
            }

            if(!roleVisible) {
                delete preparedData["columns"][1]
            }

            if (isOwner) {
                preparedData.note = `
                    ${gls.get("modals.organizations.ownerLabel")}
                    ${
                        organization.role?.length > 0
                            ? gls.get(
                                "modals.organizations.ownerLabel",
                                {
                                    role: organization.role
                                }
                            )
                            : ""
                    }
                `
                    .trim()
            }

            return preparedData
        })
    )

    return organizationsModalData
}

export async function createUserOrgModal({ gls, userOrgs, userJSON }) {
    function lgls(string, variables = {}) {
        return gls.get(`modals.organizations.${string}`, variables)
    }

    const exploreOrganizationsRes = await window.electron.requestExploreOrganizations()

    const errorPlaceholder = {
        type: "placeholder",
        title: gls.get("errorPlaceholder.title"),
        description: gls.get("errorPlaceholder.description")
    }

    const orgModal = Modal.create({
        id: "organizations",
        name: "Organizations",
        modalClassList: ["window"],
        title: lgls("title"),

        pages: [
            {
                name: lgls("explore.title"),
                icon: "explore",
                label: exploreOrganizationsRes.success ? Object.keys(exploreOrganizationsRes).length : 0,

                content: [
                    {
                        type: "row",
                        gap: 10,
                        items: exploreOrganizationsRes.success ?
                            await createUserOrgsModalStructure({ gls: gls, userOrgs: exploreOrganizationsRes.msg, userJSON: userJSON, roleVisible: false })
                            :
                            [errorPlaceholder]
                    }
                ]
            },
            {
                name: lgls("membership.title"),
                icon: "group",
                label: Object.keys(userOrgs).length,

                content: [
                    {
                        type: "row",
                        gap: 10,
                        items: await createUserOrgsModalStructure({ gls: gls, userOrgs: userOrgs, userJSON: userJSON })
                    }
                ]
            },
            {
                name: lgls("createNew.title"),
                icon: "add",

                content: [
                    {
                        type: "row-clear",
                        gap: 10,
                        items: [
                            {
                                type: "placeholder",
                                title: lgls("createNew.header.title"),
                                description: lgls("createNew.header.description")
                            },
                            {
                                type: "input",
                                placeholder: lgls("createNew.inputs.name"),
                                id: "orgName"
                            },
                            {
                                type: "input",
                                placeholder: lgls("createNew.inputs.about"),
                                id: "orgDesc"
                            },
                            {
                                type: "input",
                                placeholder: lgls("createNew.inputs.website"),
                                id: "orgWebsite"
                            },
                            {
                                type: "placeholder",
                                title: lgls("createNew.preview.title"),
                                description: lgls("createNew.preview.description")
                            },
                            {   
                                id: "orgPreview",
                                type: "organization",
                                name: lgls("createNew.preview.emptyName"),
                                description: lgls("createNew.preview.emptyDescription"),
                                columns: [
                                    {
                                        name: lgls("membersLabel"),
                                        value: 1
                                    },
                                    {
                                        name: lgls("roleLabel"),
                                        value: lgls("ownerRoleLabel")
                                    }
                                ],
                                website: "https://example.com/",
                                badgeOwner: true
                            },
                            {
                                type: "container",
                                id: "buttonsContainer"
                            },
                            {
                                type: "button",
                                id: "orgConfirm",
                                title: lgls("buttons.create"),
                                container: "#buttonsContainer"
                            }
                        ]
                    }
                ]
            }
        ]
    })

    const element = orgModal.el
    const createOrgNameField = element.querySelector("#orgName")
    const createOrgDescField = element.querySelector("#orgDesc")
    const createOrgWebsiteField = element.querySelector("#orgWebsite")
    const createOrgSubmitBtn = element.querySelector("#orgConfirm")
    const modalPreview = element.querySelector(".modal-org#orgPreview")

    createOrgNameField.addEventListener("input", (e) => {
        modalPreview.querySelector(".modal-org__title p").textContent = e.target.value
        modalPreview.querySelector(".generated-avatar").textContent = getInitials(e.target.value)

        if(e.target.value.length == 0) {
            modalPreview.querySelector(".modal-org__title p").textContent = lgls("createNew.preview.emptyName")
            modalPreview.querySelector(".generated-avatar").textContent = getInitials("U")
        }
    })
    createOrgDescField.addEventListener("input", (e) => {
        modalPreview.querySelector(".modal-org-description").textContent = truncateString(e.target.value, 100)

        if(e.target.value.length == 0) {
            modalPreview.querySelector(".modal-org-description").textContent = lgls("createNew.preview.emptyDescription")
        }
    })
    createOrgWebsiteField.addEventListener("input", (e) => {
        modalPreview.querySelector(".modal-org-icontext a").textContent = e.target.value

        if(e.target.value.length == 0) {
            modalPreview.querySelector(".modal-org-icontext a").textContent = "example.com"
        }
    })

    createOrgSubmitBtn.addEventListener("click", async () => {
        const name = createOrgNameField.value
        const desc = createOrgDescField.value
        const website = createOrgWebsiteField.value

        const createOrgRes = await window.electron.createOrganization(
            {
                name: name,
                description: desc,
                website: website
            }
        )

        if(!createOrgRes.success) {
            createNotify(
                {
                    type: "danger",
                    icon: "close",
                    title: lgls("notifications.creatingError.title"),
                    content: createOrgRes.msg.message == undefined ? createOrgRes.msg : createOrgRes.msg.message
                }
            )
        }
        else {
            orgModal.close()

            element.addEventListener("transitionend", () => {
                sendEvent("org-created", {})
            })

            createNotify(
                {
                    type: "success",
                    icon: "check",
                    title: lgls("notifications.creatingSuccess.title"),
                    content: lgls("notifications.creatingSuccess.description", { name: createOrgRes.msg.name })
                }
            ) 
        }
    })

    return orgModal
}