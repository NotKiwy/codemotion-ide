export let autoBracketPatched = false

export function enableAutoBrackets(languageId) {
    if (autoBracketPatched) return
    autoBracketPatched = true

    const Editor = ace.require("ace/editor").Editor

    const pairs = {
        "(": ")",
        "{": "}",
        "[": "]",
        "\"": "\"",
        "'": "'"
    }

    const blockPairs = {
        "{": true,
        "(": true
    }

    const originalInsert = Editor.prototype.insert
    Editor.prototype.insert = function(text) {
        const mode = this.session.$mode?.$id

        if (mode === `ace/mode/${languageId}`) {
            if (pairs[text]) {
                const closing = pairs[text]

                originalInsert.call(this, text + closing)

                this.navigateLeft(1)
                return
            }
        }

        return originalInsert.call(this, text)
    }

    const originalExec = Editor.prototype.execCommand
    Editor.prototype.execCommand = function(command, args) {
        const mode = this.session.$mode?.$id

        if (mode === `ace/mode/${languageId}` && command === "newline") {
            const cursor = this.getCursorPosition()
            const line = this.session.getLine(cursor.row)

            const charBefore = line[cursor.column - 1]
            const charAfter = line[cursor.column]

            if (blockPairs[charBefore] && pairs[charBefore] === charAfter) {
                const indent = this.session.getTabString()
                const currentIndent = line.match(/^\s*/)[0]

                this.session.doc.insert(
                    { row: cursor.row, column: cursor.column },
                    "\n" + currentIndent + indent + "\n" + currentIndent
                )

                this.navigateUp(1)
                this.navigateLineEnd()
                return
            }
        }

        return originalExec.call(this, command, args)
    }

    const originalRemove = Editor.prototype.remove
    Editor.prototype.remove = function(direction) {
        const mode = this.session.$mode?.$id

        if (mode === `ace/mode/${languageId}` && direction === "left") {
            const cursor = this.getCursorPosition()
            const line = this.session.getLine(cursor.row)

            const charBefore = line[cursor.column - 1]
            const charAfter = line[cursor.column]

            if (pairs[charBefore] && pairs[charBefore] === charAfter) {
                this.session.doc.remove({
                    start: { row: cursor.row, column: cursor.column - 1 },
                    end: { row: cursor.row, column: cursor.column + 1 }
                })
                return
            }
        }

        return originalRemove.call(this, direction)
    }
}