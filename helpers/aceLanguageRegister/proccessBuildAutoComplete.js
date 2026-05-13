import { buildSnippetCompletion } from "./buildSnippetCompletion.js"

export function proccessBuildAutoComplete({ items, callback, editor, session, pos }) {
    const completions = []

    const prefixGroups = {}
    items.forEach((item, index) => {
        if (typeof item === "object" && item.prefix) {
            if (!prefixGroups[item.prefix]) {
                prefixGroups[item.prefix] = []
            }
            prefixGroups[item.prefix].push({ item, index })
        }
    })

    items.forEach((item, originalIndex) => {
        if (typeof item === "string") {
            completions.push({
                caption: item,
                value: item,
                meta: "keyword"
            })
        } else if (typeof item === "object" && item.prefix) {
            const completion = buildSnippetCompletion(item, editor, session, pos)

            if (completion) {
                const groupedItems = prefixGroups[item.prefix]
                if (groupedItems.length > 1) {
                    const itemIndex = groupedItems.findIndex(g => g.index === originalIndex)
                    completion.caption = `${item.prefix} (${itemIndex + 1}/${groupedItems.length})`
                }

                completions.push(completion)
            }
        }
    })

    callback(null, completions)
}