export class _Languages {
    static contexts = {}

    static languages = {
        default: {
            name: "Text",
            icon: "default",
            iconExt: "svg",
            mode: "text"
        },
        js: {
            name: "JavaScript",
            icon: "js",
            iconExt: "svg",
            mode: "javascript"
        },
        ts: {
            name: "TypeScript",
            icon: "ts",
            iconExt: "svg",
            mode: "typescript"
        },
        css: {
            name: "CSS",
            icon: "css",
            iconExt: "svg",
            mode: "css"
        },
        php: {
            name: "PHP",
            icon: "php",
            iconExt: "svg",
            mode: "php"
        },
        html: {
            name: "HTML",
            icon: "html",
            iconExt: "svg",
            mode: "html"
        },
        md: {
            name: "Markdown document",
            icon: "md",
            iconExt: "svg",
            mode: "markdown"
        },
        py: {
            name: `Python`,
            icon: "py",
            iconExt: "svg",
            mode: "python"
        },
        todo: {
            name: `To-Do List`,
            icon: "todo",
            iconExt: "svg",
            mode: "markdown"
        },
        gitignore: {
            name: `GIT File`,
            icon: "gitignore",
            iconExt: "svg",
            mode: "text"
        },
        c: {
            name: `C`,
            icon: "c",
            iconExt: "svg",
            mode: "c_cpp"
        },
        cs: {
            name: `C#`,
            icon: "csharp",
            iconExt: "svg",
            mode: "csharp"
        },
        cpp: {
            name: `C++`,
            icon: "cpp",
            iconExt: "svg",
            mode: "c_cpp"
        },
        json: {
            name: `JSON`,
            icon: "json",
            iconExt: "svg",
            mode: "json"
        },
        txt: {
            name: "Text",
            icon: "txt",
            iconExt: "svg",
            mode: "text"
        },
        rs: {
            name: "Rust",
            icon: "rust",
            iconExt: "svg",
            mode: "rust"
        }
    }

    static addContext(name, value) {
        this.contexts[name] = value
    }
    static getContext(name) {
        if (name in this.contexts) {
            return this.contexts[name].value
        }
        else {
            return null
        }
    }

    static list() {
        return this.languages
    }

    static update(languageObjectName, object) {
        if (languageObjectName in this.languages) {
            this.languages[languageObjectName] = object
        }
    }

    static add({ id, name, icon, iconExt, mode, customIcon, customLanguage }) {
        customLanguage = customLanguage == undefined ? false : customLanguage

        let languageStructure = {
            name: name,
            icon: icon,
            iconExt: iconExt,
            mode: mode,
            customLanguage: customLanguage
        }

        if (customIcon) {
            languageStructure.customIcon = customIcon
            delete languageStructure.iconExt
        }

        this.languages[id] = languageStructure
    }

    static get(name) {
        if (name in this.languages) {
            return this.languages[name]
        }
        else {
            console.warn(`[Language] The language "${name}" was not found in the list of languages. Using default`)
            return this.languages.default
        }
    }

    static async getIcon(name) {
        let info = this.get(name)
        let allLanguageIcons = await window.electron.getAllIcons()

        allLanguageIcons = allLanguageIcons.map(item => { if (item.type != "folder") return item.name })
        allLanguageIcons = allLanguageIcons.filter(item => item != undefined)

        if (name in this.languages) {
            let fileName = `${this.languages[name].icon}.${this.languages[name].iconExt}`

            if (info.customIcon) {
                fileName = this.languages[name].icon
            }

            if (allLanguageIcons.includes(fileName)) {
                return fileName
            }
            else {
                console.warn(`[Language] The language icon "${fileName}" was not found in the list of icons: ${allLanguageIcons.join(", ")}`)
                return fileName
            }
        }
        else {
            console.warn(`[Language] The language "${name}" was not found in the list of languages. Using default`)
            return `${this.languages.default.icon}.${this.languages.default.iconExt}`
        }
    }

    static async getIconPath(name) {
        let info = this.get(name)
        let icon = await this.getIcon(name)

        if (info.customIcon) {
            return icon
        }
        else {
            return `../assets/media/icons/${icon}`
        }
    }
}