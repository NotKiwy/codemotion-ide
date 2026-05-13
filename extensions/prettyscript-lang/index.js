APP.registerLanguage("language/config")
APP.registerLanguageIcons("language/language-icons")

const commands = 
`
    var url;
    set:url str{ https://go.yurba.one/api/status/ };
    fetch $url
`
commands.split(";").forEach(i => {
    APP.execCommand(i.trim())
})

const activeUseRules = new Map()

APP.onEditorChange((editor) => {
    if(editor.language.name == "prettyscript") {
        const value = editor.value
        const matches = [...value.matchAll(/\buse\s+([a-zA-Z_][a-zA-Z0-9_]*)\b/g)]

        const foundWords = new Set(
            matches
                .map(match => {
                    const word = match[1]

                    if (word === "async") return null
                    if (word === "react") return "React"

                    return word
                })
                .filter(Boolean)
        )

        for (let word of foundWords) {
            if (!activeUseRules.has(word)) {
                const ruleId = `useRule_${word}`

                editor.hl.addRule(ruleId, {
                    token: "support.class",
                    regex: `(?<!\\buse\\s)\\b${word}\\b`
                })

                activeUseRules.set(word, ruleId)
            }
        }

        for (const [word, ruleId] of activeUseRules) {
            if (!foundWords.has(word)) {
                editor.hl.removeRule(ruleId)
                activeUseRules.delete(word)
            }
        }
    }
})