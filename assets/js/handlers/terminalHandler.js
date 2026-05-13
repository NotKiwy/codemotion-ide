export class Console {
    constructor(windowClass, startPath = null) {
        this.console = windowClass
        this.body = windowClass.winContent

        const fitAddon = new FitAddon.FitAddon()

        this.term = new Terminal(
            { 
                cursorBlink: true,
                fontFamily: "Consolas, monospace",
                fontSize: 14
            }
        )

        this.term.loadAddon(fitAddon)
        this.term.open(this.body)

        requestAnimationFrame(() => {
            fitAddon.fit()
        })
        
        this.buffer = ""
        this.history = []
        this.historyIndex = -1
        this.cwd = startPath || ""
        this.isWaitingForOutput = false

        this.customCommandDescriptions = {
            fs: "Fullscreen mode",
            "-fs": "Disable fullscreen",
            "?": "All custom CodeMotion Terminal commands",
            "cmexit": "Alias for exit command"
        }
        this.customCommands = {
            "fs": () => { 
                this.console.fullscreen(); 
                this.console.show(); 
                this.term.writeln("CodeMotion: \x1b[1;30mFullscreen on\x1b[0m")
            },
            "-fs": () => { 
                this.console.fullscreen(false); 
                this.console.show(); 
                this.term.writeln("CodeMotion: \x1b[1;30mFullscreen off\x1b[0m")
            },
            "?": () => {
                Object.keys(this.customCommands).forEach(c => {
                    this.term.writeln(`${c} \x1b[1;30m${this.customCommandDescriptions[c]}\x1b[0m`)
                })
            },
            "cmexit": () => {
                if(this.isWaitingForOutput) {
                    this.isWaitingForOutput = false
                    window.electron?.killProcess?.()
                    this.term.writeln("\x1b[1;30mProcess terminated\x1b[0m")
                    this.prompt()
                } else {
                    this.term.writeln("\x1b[1;30mNo active process to exit\x1b[0m")
                }
            }
        }

        this.prompt()
        this.registerEvents()
        this.setupIPC()
    }

    prompt() {
        this.term.write(`\r\n${this.cwd} $ `)
    }

    registerEvents() {
        this.term.onData(data => this.handleInput(data))
    }

    handleInput(data) {
        const code = data.charCodeAt(0)

        if(code === 3) { 
            if(this.isWaitingForOutput) {
                console.log('[Console] Ctrl+C pressed')
                this.term.write("^C\r\n")
                window.electron?.killProcess?.()
                this.isWaitingForOutput = false
                this.prompt()
            }
            return
        }

        if(code === 13) {
            this.term.write("\r\n")

            if(this.isWaitingForOutput) {
                const input = this.buffer + "\n"
                console.log(`[Console] Sending input: "${input}"`)
                window.electron?.sendInput?.(input)
                this.buffer = ""
                return
            }
            
            const trimmedBuffer = this.buffer.trim()
            
            if(!trimmedBuffer) {
                this.prompt()
                return
            }

            const firstWord = trimmedBuffer.split(/\s+/)[0]
            
            if(this.customCommands[firstWord]) {
                this.customCommands[firstWord]()
                this.prompt()
            } else {
                console.log(`[Console] Executing: ${trimmedBuffer}`)
                this.isWaitingForOutput = true
                window.electron?.sendCommand?.({ cmd: trimmedBuffer, cwd: this.cwd })
            }
            this.history.push(trimmedBuffer)
            this.historyIndex = this.history.length
            this.buffer = ""
            return
        }

        if (code === 127) {
            if (this.buffer.length > 0) {
                this.buffer = this.buffer.slice(0, -1)
                this.term.write("\b \b")
            }
            return
        }

        if (!this.isWaitingForOutput) {
            if (data === '\x1B[A') {
                if(this.historyIndex > 0) this.replaceBuffer(this.history[--this.historyIndex])
                return
            }
            if (data === '\x1B[B') {
                if(this.historyIndex < this.history.length - 1) this.replaceBuffer(this.history[++this.historyIndex])
                else { this.historyIndex = this.history.length; this.replaceBuffer("") }
                return
            }
        }

        if (data === '\t' && !this.isWaitingForOutput) {
            this.autocomplete()
            return
        }

        this.buffer += data
        this.term.write(data)

        if(this.isWaitingForOutput) {
            window.electron?.sendInput?.(data)
        }
    }

    replaceBuffer(str) {
        while(this.buffer.length) {
            this.term.write('\b \b')
            this.buffer = this.buffer.slice(0, -1)
        }
        this.buffer = str
        this.term.write(str)
    }

    autocomplete() {
        const commands = Object.keys(this.customCommands)
        const matches = commands.filter(cmd => cmd.startsWith(this.buffer))
        if (matches.length === 1) {
            this.replaceBuffer(matches[0])
        } else if(matches.length > 1) {
            this.term.writeln("\r\n" + matches.join(" "))
            this.prompt()
            this.term.write(this.buffer)
        }
    }

    parseCommand(cmd) {
        const regex = /(?:[^\s"]+|"[^"]*")+/g
        const args = []
        let match
        while((match = regex.exec(cmd)) !== null) {
            let arg = match[0]
            if(arg.startsWith('"') && arg.endsWith('"')) arg = arg.slice(1,-1)
            args.push(arg)
        }
        return args
    }

    executeCommand(cmd) {
        if (!cmd) return

        const args = this.parseCommand(cmd)
        const command = args.shift()

        if (this.customCommands[command]) {
            this.customCommands[command](...args)
            return
        }

        if(window.electron?.sendCommand) {
            window.electron.sendCommand({ cmd, cwd: this.cwd })
        } else {
            this.term.writeln(`Command not found: ${command}`)
        }
    }

    setupIPC() {
        if(window.electron && window.electron.onCommandResult) {
            window.electron.onCommandResult((result) => {
                console.log('[Console] Received result:', result)
                this.handleTerminalResult(result)
            })
        } else {
            console.warn('[Console] onCommandResult not available')
        }
    }

    handleTerminalResult(result) {
        let output = ""
        let type = "output"

        if (!result) {
            console.warn('[Console] Empty result')
            return
        }

        if (result && typeof result === 'object') {
            type = result.type || "output"
            output = result.data || result.output || result.message || ""
        } else if (typeof result === 'string') {
            output = result
        } else {
            output = JSON.stringify(result)
        }

        console.log(`[Console] Type: "${type}", Output length: ${output.length}`)

        if (!output) return

        switch(type) {
            case "error":
                this.term.write("\x1b[31m" + output + "\x1b[0m")
                break
            case "warning":
                this.term.write("\x1b[38;5;208m" + output + "\x1b[0m")
                break
            case "exit":
                this.term.write(output)
                this.isWaitingForOutput = false
                this.prompt()
                return
            default:
                this.term.write(output)
        }

        if(type === "exit") {
            this.isWaitingForOutput = false
            this.prompt()
        }
    }
}