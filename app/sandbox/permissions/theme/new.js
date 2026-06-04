const { checkFields } = require("../../tools.js")

function callback(data) {
    const themeName = data.selfArgs[0]
    const themeData = data.selfArgs[1]
    const extName = data.extensionName

    let allCSSVariables = data.allCSSVariables

    checkFields("APP.registerTheme", themeData, {
        id: "string",
        variables: "object",
        editorTheme: "string"
    })

    let variables = []

    Object.keys(themeData.variables).forEach(v => {
        variables.push(`${v}: ${themeData.variables[v]}`);

        allCSSVariables = allCSSVariables.map(item => {
            const name = item.split(":")[0].trim();
            const value = themeData.variables[name];

            if (value) {
                return `${name}: <important>${value}</important>`;
            } else {
                return `${name}: <span class="transparent">default</span>`;
            }
        });
    });

    themeData.variables = variables.join(";")

    data.mainSender.send("new-theme-register", themeName, themeData)

    data.debuggerSender.send("debug-event", {
        data: {
            type: "newCommand",
            command: {
                name: "CSSVariables",
                response: `A list of current CSS variables will be displayed below. The format is "name:value":\n${allCSSVariables.join(", \n")}`
            },
            from: extName
        },
        time: Date.now()
    })
}

module.exports = { callback }