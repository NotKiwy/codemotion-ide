import { createNotify } from "../../../lib.js"

export function onNotificationCallback({ data, name }) {
    if ("content" in data) {
        data["content"] = `(${name}) ${data.content}`
    }
    if ("time" in data) {
        if (data.time > 15000) data.time = 4000
    }

    createNotify(data)
}