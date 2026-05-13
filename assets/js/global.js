export async function getDirname() {
    let __dirname = await window.electron.getDirname()
    __dirname = __dirname.replaceAll(/\\/g, "/")

    return __dirname
}
export async function readSettings() {
    return await window.electron.readSettings()
}
export async function enableDevMode() {
    await window.electron.setSettings({ app: { devMode: true }})
}
export async function disableDevMode() {
    await window.electron.setSettings({ app: { devMode: false }})
}