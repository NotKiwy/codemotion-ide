import { Modal } from "../modalsHandler/engine.js"
import { createNotify, getInitials, truncateString } from "../lib.js"
import { sendEvent } from "../bus.js"

export async function createUserOrgsModalStructure({ gls, userOrgs, userJSON }) {
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
    const orgModal = Modal.create({
        id: "organizations",
        name: "Organizations",
        modalClassList: ["window"],
        title: gls.get("modals.organizations.title"),

        pages: [
            {
                name: "Membership",
                icon: "group",

                content: [
                    {
                        type: "row",
                        gap: 10,
                        items: await createUserOrgsModalStructure({ gls: gls, userOrgs: userOrgs, userJSON: userJSON })
                    }
                ]
            },
            {
                name: "Create new",
                icon: "add",

                content: [
                    {
                        type: "row-clear",
                        gap: 10,
                        items: [
                            {
                                type: "placeholder",
                                title: "Create new organization",
                                description: "With your organization, you can invite users to join so you can work on projects together. For example, you can create collaborative issues."
                            },
                            {
                                type: "input",
                                placeholder: "Organization name",
                                id: "orgName"
                            },
                            {
                                type: "input",
                                placeholder: "About your organization",
                                id: "orgDesc"
                            },
                            {
                                type: "input",
                                placeholder: "Organization website (optional)",
                                id: "orgWebsite"
                            },
                            {
                                type: "placeholder",
                                title: "Preview",
                                description: "A preview of how the organization will appear in the list"
                            },
                            {   
                                id: "orgPreview",
                                type: "organization",
                                name: "Unnamed",
                                description: "No description provided",
                                columns: [
                                    {
                                        name: "Members",
                                        value: 1
                                    },
                                    {
                                        name: "Role",
                                        value: "Fouder"
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
                                title: "Create organization",
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
            modalPreview.querySelector(".modal-org__title p").textContent = "Unnamed"
            modalPreview.querySelector(".generated-avatar").textContent = getInitials("U")
        }
    })
    createOrgDescField.addEventListener("input", (e) => {
        modalPreview.querySelector(".modal-org-description").textContent = truncateString(e.target.value, 100)

        if(e.target.value.length == 0) {
            modalPreview.querySelector(".modal-org-description").textContent = "No description provided"
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
                    icon: "close",
                    title: "Organization creating error",
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
                    icon: "check",
                    title: "Organization created!",
                    content: `Your organization "${createOrgRes.msg.name}" created`
                }
            ) 
        }
    })

    return orgModal
}