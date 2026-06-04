export class DocumentationTypes {
    static types = [
        {
            name: "function",
            displayName: "Function",
            className: "function"
        },
        {
            name: "operator",
            displayName: "Operator",
            className: "operator"
        }
    ]

    static list() {
        return this.types
    }

    static add(object) {
        this.types.push(object)
    }
}