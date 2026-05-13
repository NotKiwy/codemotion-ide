const { ipcMain, app } = require("electron")
const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")

ipcMain.handle("run-python-code", async (
    event,
    {
        code = null,
        filePath = null,
        useEmbed = true
    }
) => {
    return new Promise((resolve) => {
        let runPath
        let isTempFile = false
        let resolved = false

        const tempDir = path.join(app.getAppPath(), "temp")

        const embeddedPy = app.isPackaged
            ? path.join(process.resourcesPath, "runtime", "python", "python.exe")
            : path.join(__dirname, "..", "runtime", "python", "python.exe")

        const cleanup = () => {
            if (isTempFile && runPath && fs.existsSync(runPath)) {
                try {
                    fs.unlinkSync(runPath)
                } catch {}
            }
        }

        const finish = (data) => {
            if (resolved) return
            resolved = true
            cleanup()
            resolve(data)
        }

        const trySpawn = (command, args, options = {}) => {
            try {
                return spawn(command, args, options)
            } catch {
                return null
            }
        }

        try {
            if (filePath) {
                if (!fs.existsSync(filePath)) {
                    return finish({
                        type: "file_not_found",
                        result: `File not found: ${filePath}`
                    })
                }

                runPath = filePath
            } else if (code) {
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true })
                }

                runPath = path.join(tempDir, `temp-${Date.now()}.py`)
                fs.writeFileSync(runPath, code, "utf8")
                isTempFile = true
            } else {
                return finish({
                    type: "no_input",
                    result: "No code or filePath provided"
                })
            }

            let pyCommand
            let pyArgs = [runPath]

            if (useEmbed) {
                if (!fs.existsSync(embeddedPy)) {
                    return finish({
                        type: "python_not_found",
                        result: "Embedded Python not found"
                    })
                }

                pyCommand = embeddedPy
            } else {
                pyCommand = "python"
            }

            let py = trySpawn(pyCommand, pyArgs, {
                cwd: path.dirname(runPath)
            })

            if (!py && !useEmbed) {
                pyCommand = "py"
                py = trySpawn(pyCommand, pyArgs, {
                    cwd: path.dirname(runPath)
                })
            }

            if (!py) {
                return finish({
                    type: "python_not_found",
                    result: useEmbed
                        ? "Embedded Python not found"
                        : "System Python not found"
                })
            }

            let stdout = ""
            let stderr = ""

            const timeout = setTimeout(() => {
                py.kill()

                finish({
                    type: "timeout",
                    result: "Execution timed out"
                })
            }, 10000)

            py.stdout.on("data", (data) => {
                stdout += data.toString()
            })

            py.stderr.on("data", (data) => {
                stderr += data.toString()
            })

            py.on("error", () => {
                clearTimeout(timeout)

                if (!useEmbed && pyCommand === "python") {
                    py = spawn("py", pyArgs, {
                        cwd: path.dirname(runPath)
                    })
                    return
                }

                finish({
                    type: "spawn_error",
                    result: "Failed to start Python process"
                })
            })

            py.on("close", (exitCode) => {
                clearTimeout(timeout)

                finish({
                    type: exitCode === 0 ? "success" : "error",
                    stdout,
                    stderr,
                    exitCode,
                    file: runPath,
                    interpreter: pyCommand
                })
            })

        } catch (err) {
            finish({
                type: "internal_error",
                result: err.message
            })
        }
    })
})