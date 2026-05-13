const { app, ipcMain } = require('electron');
const fs = require('fs/promises');
const path = require("path")

const APP_PATH = app.getAppPath()

ipcMain.handle("read-file", async (event, filePath) => {
    try {
        const data = await fs.readFile(path.join(APP_PATH, filePath), 'utf-8');
        return {
            success: true,
            result: data
        };
    } catch (error) {
        return {
            success: false,
            result: error
        }
    }
});