import { Modal } from "../modalsHandler/engine.js"

export function getSettingsModal({ platform }) {
    const appearanceModal = Modal.create({
        id: "appearance",
        name: "MyModal",
        modalClassList: ["window"],
        title: "Appearance",

        pages: [
            {
                name: "General",
                icon: "settings",
                content: [
                    {
                        type: "category",
                        label: "Application",
                        items: []
                    },
                    {
                        type: "row",
                        classList: ["background"],
                        items: [
                            {
                                type: "range",
                                title: "UI Scale",
                                description: "Sets the UI scale factor",
                                id: "setting_uiScale",
                                min: 0.5,
                                max: 4,
                                value: 1,
                                step: 0.1,
                                prefix: "x"
                            },
                            {
                                type: "switch",
                                title: "Use system fonts",
                                description: "Uses system-ui for the interface and monospace for the editor as fonts",
                                id: "setting_useSystemFonts"
                            },
                            {
                                type: "switch",
                                title: "Splash window",
                                description: "Should the initial window be hidden at startup?",
                                id: "setting_splash"
                            },
                            {
                                type: "switch",
                                title: "Reduce motion",
                                description: "Reduces visual effects throughout the app: fewer animations, optimized animations",
                                id: "setting_reduceMotion"
                            },
                            {
                                type: "switch",
                                title: "Bold font",
                                description: "Increases font weight throughout the application",
                                id: "setting_boldFont"
                            },
                            {
                                type: "placeholder",
                                title: "Theme",
                                description: "Change of theme",
                                id: "setting_theme"
                            },
                            {
                                type: "switch",
                                title: "Developer mode",
                                description: "Enables developer mode",
                                note: "Toggling the switch will restart the app",
                                id: "setting_devMode"
                            },
                            {
                                type: "placeholder",
                                id: "settings_appIcon",
                                title: "App icons",
                                description: "Changes the app icon throughout the app",
                                note: "Toggling the switch will restart the app"
                            },
                        ]
                    }
                ]
            },
            {
                name: "Sidebar",
                icon: "dock_to_left",
                content: [
                    {
                        type: "category",
                        label: "Explorer",
                        items: []
                    },
                    {
                        type: "row",
                        classList: ["background"],
                        items: [
                            {
                                type: "switch",
                                title: "Show hidden files",
                                description: "Displays files and folders starting with a dot (e.g. .gitignore)",
                                id: "setting_explorerShowHidden",
                                disabled: true
                            },
                            {
                                type: "switch",
                                title: "Compact mode",
                                description: "Reduces padding in the file tree for a denser layout",
                                id: "setting_explorerCompact",
                                disabled: true
                            },
                        ]
                    }
                ]
            },
            {
                name: "Terminal",
                icon: "terminal",
                content: [
                    {
                        type: "category",
                        label: "Appearance",
                        items: []
                    },
                    {
                        type: "row",
                        classList: ["background"],
                        items: [
                            {
                                type: "range",
                                title: "Font size",
                                description: "Sets the terminal font size",
                                id: "setting_terminalFontSize",
                                min: 10,
                                max: 24,
                                value: 14,
                                step: 1,
                                prefix: "px",
                                disabled: true
                            },
                            {
                                type: "switch",
                                title: "Cursor blink",
                                description: "Enables cursor blinking animation in the terminal",
                                id: "setting_terminalCursorBlink",
                                disabled: true
                            },
                        ]
                    },
                    {
                        type: "category",
                        label: "Behaviour",
                        items: []
                    },
                    {
                        type: "row",
                        classList: ["background"],
                        items: [
                            {
                                type: "switch",
                                title: "Copy on selection",
                                description: "Copies selected text to the clipboard automatically",
                                id: "setting_terminalCopyOnSelect",
                                disabled: true
                            }
                        ]
                    }
                ]
            },
            {
                name: "File window",
                icon: "tab",
                content: [
                    {
                        type: "category",
                        label: "Tabs",
                        items: []
                    },
                    {
                        type: "row",
                        classList: ["background"],
                        items: [
                            {
                                type: "switch",
                                title: "Show tab close button",
                                description: "Displays the X close button on editor tabs",
                                id: "setting_tabShowClose",
                                disabled: true
                            },
                            {
                                type: "switch",
                                title: "Wrap tabs",
                                description: "Wrap tabs onto a second row instead of scrolling horizontally",
                                id: "setting_tabWrap",
                                disabled: true
                            },
                        ]
                    }
                ]
            },
            {
                name: "Editor",
                icon: "code",
                content: [
                    {
                        type: "category",
                        label: "Editor",
                        items: []
                    },
                    {
                        type: "row",
                        classList: ["background"],
                        items: [
                            {
                                type: "range",
                                title: "Text size",
                                description: "Allows you to enlarge text within the editor up to 200%",
                                id: "setting_editorTextSize",
                                min: 50,
                                max: 200,
                                value: 100,
                                step: 10,
                                prefix: "%"
                            },
                            {
                                type: "switch",
                                title: "Smooth scroll",
                                description: "Disable smooth scrolling in the editor?",
                                id: "setting_smoothScroll",
                                note: "For the changes to take effect, you need to restart the app"
                            },
                            {
                                type: "placeholder",
                                title: "Python runner",
                                description: "Select which Python version you would like to use",
                                id: "setting_pythonRunMethod",
                                disabled: platform != "win32",
                                note: platform == "win32" ? "For the changes to take effect, you need to restart the app" : `Your platform (${platform.toUpperCase()}) is not supported. The built-in Python is being used`
                            }
                        ]
                    }
                ]
            }
        ]
    })

    return appearanceModal
}