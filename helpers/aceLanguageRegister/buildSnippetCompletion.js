export function buildSnippetCompletion(snippetConfig, editor, session, pos) {
    if (!snippetConfig.prefix || !snippetConfig.body) return null

    const currentLine = session.getLine(pos.row)
    const currentIndent = currentLine.match(/^\s*/)[0]

    let snippetText = Array.isArray(snippetConfig.body)
        ? snippetConfig.body.join("\n")
        : snippetConfig.body

    snippetText = snippetText.replace(/\\t/g, "\t")

    const lines = snippetText.split("\n")
    
    if (lines.length > 1) {
        const normalizedLines = [
            lines[0],
            ...lines.slice(1).map(line => {
                const innerIndent = line.match(/^\t*/)[0]
                const content = line.slice(innerIndent.length)
                return currentIndent + innerIndent + content
            })
        ]
        snippetText = normalizedLines.join("\n")
    }

    return {
        caption: snippetConfig.prefix,
        snippet: snippetText,
        meta: snippetConfig.description || "snippet",
        score: 1000
    }
}