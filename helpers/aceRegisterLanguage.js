import { bus, sendEvent } from "../assets/js/bus.js"
import { createHighlightRules } from "./aceLanguageRegister/createHighlightRules.js"
import { registerAutocomplete } from "./aceLanguageRegister/registerAutocomplete.js"
import { enableAutoBrackets } from "./aceLanguageRegister/enableAutoBrackets.js"

const registeredCompleters = new Set()
const registeredModes = new Set()

function resolveBaseHighlightRulesClass(useMode) {
    const TextHighlightRules = ace.require("ace/mode/text_highlight_rules").TextHighlightRules

    if (!useMode) return TextHighlightRules

    const baseModuleId = `ace/mode/${useMode}_highlight_rules`
    const baseExports = ace.require(baseModuleId)

    if (!baseExports) {
        console.warn(`[registerAceLanguage] useMode: "${useMode}" — модуль ${baseModuleId} не найден. Fallback на TextHighlightRules.`)
        return TextHighlightRules
    }

    const exportKey = Object.keys(baseExports).find(k => k.endsWith("HighlightRules"))

    if (!exportKey) {
        console.warn(`[registerAceLanguage] useMode: "${useMode}" — в ${baseModuleId} нет экспорта *HighlightRules.`)
        return TextHighlightRules
    }

    return baseExports[exportKey]
}

export function registerAceLanguage(id, config = {}) {
    if (registeredModes.has(id)) return
    registeredModes.add(id)

    const highlightModuleId = `ace/mode/${id}_highlight_rules`
    const modeModuleId = `ace/mode/${id}`

    const rules = createHighlightRules(config.syntax)

    registerAutocomplete({ 
        id: id,
        config: config,
        registeredCompleters: registeredCompleters
    })

    bus.addEventListener("ace-mode-changed", (data) => {
        const properties = data.detail
        
        if (config?.autocomplete?.auto) {
            enableAutoBrackets(id, properties.editor)
        }
    })

    const registerMode = () => {
        ace.define(highlightModuleId, [
            "require", "exports", "module",
            "ace/lib/oop",
            "ace/mode/text_highlight_rules",
            null
        ].filter(Boolean), function(require, exports, module) {

            const oop = require("ace/lib/oop")

            const BaseHighlightRules = resolveBaseHighlightRulesClass(config.useMode)

            const CustomHighlightRules = function() {
                const originalNormalizeRules = BaseHighlightRules.prototype.normalizeRules
                BaseHighlightRules.prototype.normalizeRules = function() {}

                BaseHighlightRules.call(this)

                BaseHighlightRules.prototype.normalizeRules = originalNormalizeRules

                if (!this.$rules) this.$rules = {}

                Object.keys(rules || {}).forEach((stateName) => {
                    const stateRules = rules[stateName]
                    if (!stateRules || !stateRules.length) return

                    const isStartState = stateName === "start"
                    const hasBaseRules = this.$rules[stateName] && this.$rules[stateName].length

                    if (isStartState && hasBaseRules) {
                        const lastRule = stateRules[stateRules.length - 1]
                        const isGenericClassifier = typeof lastRule?.token === "function"
                            && lastRule.regex === "\\b[a-zA-Z_$][a-zA-Z0-9_$]*\\b"

                        const specificRules = isGenericClassifier
                            ? stateRules.slice(0, -1)
                            : stateRules

                        this.$rules[stateName].unshift(...specificRules)

                        if (isGenericClassifier) {
                            const baseGenericRule = this.$rules[stateName].find(
                                r => typeof r.token === "function" && r !== lastRule
                            )

                            if (baseGenericRule) {
                                const originalToken = baseGenericRule.token
                                const slimToken = lastRule.token

                                baseGenericRule.token = function(value) {
                                    const slimResult = slimToken(value)
                                    return slimResult !== "text"
                                        ? slimResult
                                        : originalToken.call(this, value)
                                }
                            } else {
                                this.$rules[stateName].push(lastRule)
                            }
                        }
                    } else {
                        this.$rules[stateName] = stateRules
                    }
                })

                if (typeof this.normalizeRules === "function") {
                    this.normalizeRules()
                }
            }

            oop.inherits(CustomHighlightRules, BaseHighlightRules)

            exports.HighlightRules = CustomHighlightRules
        })

        ace.define(modeModuleId, [
            "require", "exports", "module",
            "ace/lib/oop",
            "ace/mode/text",
            highlightModuleId
        ], function(require, exports, module) {

            const oop = require("ace/lib/oop")

            const BaseMode = require("ace/mode/text").Mode

            const HighlightRules = require(highlightModuleId).HighlightRules

            const Mode = function() {
                BaseMode.call(this)

                this.HighlightRules = HighlightRules
                this.$id = modeModuleId
            }

            oop.inherits(Mode, BaseMode)

            exports.Mode = Mode
        })
    }

    if (config.useMode) {
        ace.config.loadModule(["mode", config.useMode], () => {
            registerMode()
        })
    } else {
        registerMode()
    }
}