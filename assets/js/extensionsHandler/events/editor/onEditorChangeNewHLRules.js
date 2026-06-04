export function onEditorChangeNewHLRulesCallback({ data, dynamicRules, refreshEditorHighlight }) {
    const { action, id, rule } = data

    if (action === "add") {
        dynamicRules.set(id, rule)
    }

    if (action === "remove") {
        dynamicRules.delete(id)
    }

    refreshEditorHighlight()
}