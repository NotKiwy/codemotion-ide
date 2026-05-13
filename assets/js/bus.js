export const bus = new EventTarget()

export function sendEvent(name, data) {
    bus.dispatchEvent(new CustomEvent(name, {
        detail: data
    }))
}