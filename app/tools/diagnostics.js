const { ipcMain } = require("electron");
const { Worker } = require("worker_threads");
const path = require("path");

function createWorker(filename) {
    const worker = new Worker(path.join(__dirname, filename));
    worker.on("error", (err) => console.error(`Worker error (${filename}):`, err));
    worker.on("exit", (code) => {
        if (code !== 0) console.error(`Worker (${filename}) exited with code ${code}`);
    });
    return worker;
}

const workers = {
    js: createWorker("javascript/diagnosticsJsWorker.js"),
    ts: createWorker("typescript/diagnosticsTsWorker.js"),
};

const pending = {
    js: null,
    ts: null,
};

workers.js.on("message", (diagnostics) => {
    if (pending.js) { pending.js(diagnostics); pending.js = null; }
});

workers.ts.on("message", (diagnostics) => {
    if (pending.ts) { pending.ts(diagnostics); pending.ts = null; }
});

ipcMain.handle("javascript-diagnostic", (_, code) => {
    return new Promise((resolve) => {
        pending.js = resolve;
        workers.js.postMessage(code);
    });
});

ipcMain.handle("typescript-diagnostic", (_, code) => {
    return new Promise((resolve) => {
        pending.ts = resolve;
        workers.ts.postMessage(code);
    });
});