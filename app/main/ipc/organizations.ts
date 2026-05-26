import { ipcMain, IpcMainInvokeEvent } from "electron"
import { requestCreateOrganization, requestExploreOrganizations, requestGetYourOrgColleagues } from "../helpers/requests"

ipcMain.handle("create-organization", async (_: IpcMainInvokeEvent, params = {}) => {
    return await requestCreateOrganization(params)
})
ipcMain.handle("request-get-your-org-colleagues", async (_: IpcMainInvokeEvent, params: object) => {
    return await requestGetYourOrgColleagues()
})
ipcMain.handle("get-explore-organizations", async () => {
    return await requestExploreOrganizations()
})