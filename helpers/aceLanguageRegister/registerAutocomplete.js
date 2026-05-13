import { proccessBuildAutoComplete } from "./proccessBuildAutoComplete.js"

export function registerAutocomplete({ id, config, registeredCompleters }) {
    if (!config?.autocomplete) return
    if (registeredCompleters.has(id)) return

    const langTools = ace.require("ace/ext/language_tools")

    const completer = {
        getCompletions(editor, session, pos, prefix, callback) {
            const mode = session.$mode?.$id

            if (mode !== `ace/mode/${id}`) {
                return callback(null, [])
            }

            proccessBuildAutoComplete(
                {
                    items: config.autocomplete.keywords || [],
                    callback: callback,
                    editor: editor,
                    session: session,
                    pos: pos
                }
            )
        }
    }

    langTools.addCompleter(completer)
    registeredCompleters.add(id)
}