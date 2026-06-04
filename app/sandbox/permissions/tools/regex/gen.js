function callback(data) {
    const properties = data.selfArgs[0]
    let result

    if("exact" in properties) {
        result = `\\b${properties.exact}\\b`
    }

    return () => {
        return result
    }
}

module.exports = { callback }