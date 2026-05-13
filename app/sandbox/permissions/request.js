async function callback(data) {
    const url = data.selfArgs[0]
    const method = data.selfArgs[1] || "GET";
    const headers = data.selfArgs[2] || {};
    const body = data.selfArgs[3]

    try {
        const options = {
            method,
            headers
        };

        if (body && method !== "GET") {
            options.body = typeof body === "string"
                ? body
                : JSON.stringify(body);

            if (!headers["Content-Type"]) {
                options.headers["Content-Type"] = "application/json";
            }
        }

        const res = await fetch(url, options);

        const text = await res.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }

        return {
            status: res.status,
            ok: res.ok,
            headers: Object.fromEntries(res.headers.entries()),
            data
        };

    } catch (err) {
        return {
            ok: false,
            error: err.message
        };
    }
}

module.exports = { callback }