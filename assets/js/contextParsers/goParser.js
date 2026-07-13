import { renderSeparator } from "./globals.js";

export class GoParser {
    getContextChain(ast, row) {
        const chain = [];
        this.traverse(ast, row, chain);
        return chain;
    }

    traverse(node, row, chain) {
        if (!node || typeof node !== "object") return;

        if (node.loc && row >= node.loc.start.line && row <= node.loc.end.line) {
            switch (node.type) {
                case "FunctionDeclaration": {
                    const name   = node.id?.name || "anonymous";
                    const params = this.formatParams(node.params);
                    const ret    = node.returnType ? ` → ${node.returnType}` : "";
                    chain.push({
                        icon:  "function",
                        label: `${name}(${params})${ret}`,
                        class: "function",
                    });
                    break;
                }

                case "MethodDeclaration": {
                    const name     = node.id?.name || "anonymous";
                    const params   = this.formatParams(node.params);
                    const ret      = node.returnType ? ` → ${node.returnType}` : "";
                    const receiver = node.receiver ? `${node.receiver} ` : "";
                    chain.push({
                        icon:  "function",
                        label: `${receiver}${name}(${params})${ret}`,
                        class: "method",
                    });
                    break;
                }

                case "StructDeclaration":
                    chain.push({
                        icon:  "category",
                        label: node.id?.name || "struct",
                        class: "class",
                    });
                    break;

                case "InterfaceDeclaration":
                    chain.push({
                        icon:  "contract",
                        label: node.id?.name || "interface",
                        class: "class",
                    });
                    break;

                case "TypeAlias":
                    chain.push({
                        icon:  "data_object",
                        label: node.id?.name || "type",
                        class: "variable",
                    });
                    break;

                case "VariableDeclaration": {
                    const names = node.names ||
                        (node.declarations || []).flatMap(d => d.names || []);
                    if (names.length > 0) {
                        chain.push({
                            icon:  "data_object",
                            label: names.join(", "),
                            class: "variable",
                        });
                    }
                    break;
                }

                case "ConstDeclaration": {
                    const names = (node.declarations || []).flatMap(d => d.names || []);
                    if (names.length > 0) {
                        chain.push({
                            icon:  "pin",
                            label: names.join(", "),
                            class: "variable",
                        });
                    }
                    break;
                }

                case "CallExpression":
                    if (node.calleeName) {
                        chain.push({
                            icon:  "deployed_code",
                            label: node.calleeName,
                            class: "object",
                        });
                    }
                    break;

                case "TypeGroup":
                    break;
            }
        }

        // рекурсия в дочерние узлы
        for (const key of ["body", "declarations", "methods", "fields"]) {
            const val = node[key];
            if (Array.isArray(val)) {
                val.forEach(v => this.traverse(v, row, chain));
            } else if (val && typeof val === "object" && val.type) {
                this.traverse(val, row, chain);
            }
        }
    }

    formatParams(params) {
        if (!params || params.length === 0) return "";
        return params.map(p => {
            const names = (p.names || []).join(", ");
            return names ? `${names} ${p.paramType}` : p.paramType;
        }).join(", ");
    }

    renderContext(chain) {
        const container = document.querySelector(".code-structure");
        container.innerHTML = "";

        if (chain.length === 0) {
            container.textContent = "No context";
            return;
        }

        chain.forEach((item, i) => {
            const el = document.createElement("div");
            el.className = "context-item";
            el.innerHTML = `
                <span class="material-symbols-rounded ${item.class}" style="font-size:16px;">${item.icon}</span>
                <span>${item.label}</span>
            `;
            container.appendChild(el);
            if (i < chain.length - 1) {
                const sep = renderSeparator();
                container.appendChild(sep);
            }
        });
    }
}